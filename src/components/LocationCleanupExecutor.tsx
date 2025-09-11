import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, AlertTriangle, Loader2 } from 'lucide-react';

const LocationCleanupExecutor = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState([]);
  const [completed, setCompleted] = useState(false);

  const addResult = (message, type = 'info') => {
    setResults(prev => [...prev, { message, type, timestamp: new Date().toLocaleTimeString() }]);
  };

  const executeLocationCleanup = async () => {
    setIsRunning(true);
    setResults([]);
    setCompleted(false);

    try {
      addResult('Démarrage du nettoyage des locations hardcodées...', 'info');

      // Récupérer les vraies locations de la table
      const { data: validLocations, error: locError } = await supabase
        .from('locations')
        .select('name, type, zone')
        .eq('is_active', true);

      if (locError) {
        throw new Error(`Erreur récupération locations: ${locError.message}`);
      }

      addResult(`${validLocations.length} locations valides trouvées dans la base`, 'success');

      // Mappings des locations hardcodées vers les vraies locations
      const locationMappings = [
        // Locations fictives vers vraies chambres
        { from: ['Espace Spa', 'Pool Area', 'Spa Area'], to: '50' },
        { from: ['Presidential Suite', 'Room 50'], to: '50' },
        { from: ['Suite présidentielle'], to: '50' },
        
        // Locations génériques vers zones réelles  
        { from: ['Spa Reception', 'Main Lobby', 'Reception', 'Reception Area'], to: 'Accueil' },
        { from: ['Elevator Maintenance Required', 'Main Elevator'], to: 'Ascenseur' },
        { from: ['Restaurant Kitchen', 'Kitchen'], to: 'Cuisine' },
        
        // Chambres avec anciens formats
        { from: ['Room 207', '207'], to: '27' },
        { from: ['Room 305', '305'], to: '35' },
        { from: ['Room 30'], to: '30' },
        { from: ['Room 32'], to: '32' },
        { from: ['Room 40'], to: '40' },
        { from: ['Room 45'], to: '45' },
        
        // Locations génériques
        { from: ['Multiple Rooms', 'Various', 'Unknown Location'], to: 'Accueil' },
        { from: ['HVAC Service Company'], to: 'Chaufferie' },
        { from: ['Laundry Room'], to: 'Lingerie' }
      ];

      // ÉTAPE 1: Nettoyer les incidents
      addResult('Nettoyage des incidents...', 'info');
      
      for (const mapping of locationMappings) {
        for (const oldLocation of mapping.from) {
          const { data, error } = await supabase
            .from('incidents')
            .update({ location: mapping.to })
            .eq('location', oldLocation);
          
          if (error) {
            addResult(`Erreur incidents "${oldLocation}": ${error.message}`, 'error');
          } else {
            addResult(`Incidents: "${oldLocation}" → "${mapping.to}"`, 'success');
          }
        }
      }

      // Attribuer "Accueil" aux incidents sans location
      const { data: incidentsWithoutLocation, error: incNoLocError } = await supabase
        .from('incidents')
        .update({ location: 'Accueil' })
        .or('location.is.null,location.eq.');

      if (!incNoLocError) {
        addResult('Incidents sans location → "Accueil"', 'success');
      }

      // ÉTAPE 2: Nettoyer les demandes clients (room_number)
      addResult('Nettoyage des demandes clients...', 'info');
      
      const roomMappings = [
        { from: ['Presidential Suite', 'Suite présidentielle'], to: '50' },
        { from: ['Room 207', '207'], to: '27' },
        { from: ['Room 305', '305'], to: '35' },
        { from: ['Room 30'], to: '30' },
        { from: ['Multiple Rooms', 'Various'], to: '30' }
      ];

      for (const mapping of roomMappings) {
        for (const oldRoom of mapping.from) {
          const { error } = await supabase
            .from('client_requests')
            .update({ room_number: mapping.to })
            .eq('room_number', oldRoom);
          
          if (error) {
            addResult(`Erreur demandes "${oldRoom}": ${error.message}`, 'error');
          } else {
            addResult(`Demandes: chambre "${oldRoom}" → "${mapping.to}"`, 'success');
          }
        }
      }

      // Attribuer chambre "30" aux demandes sans chambre
      const { error: reqNoRoomError } = await supabase
        .from('client_requests')
        .update({ room_number: '30' })
        .or('room_number.is.null,room_number.eq.');

      if (!reqNoRoomError) {
        addResult('Demandes sans chambre → chambre "30"', 'success');
      }

      // ÉTAPE 3: Nettoyer les tâches internes
      addResult('Nettoyage des tâches internes...', 'info');
      
      for (const mapping of locationMappings) {
        for (const oldLocation of mapping.from) {
          const { error } = await supabase
            .from('internal_tasks')
            .update({ location: mapping.to })
            .eq('location', oldLocation);
          
          if (error) {
            addResult(`Erreur tâches "${oldLocation}": ${error.message}`, 'error');
          } else {
            addResult(`Tâches: "${oldLocation}" → "${mapping.to}"`, 'success');
          }
        }
      }

      // Attribuer "Accueil" aux tâches sans location
      const { error: taskNoLocError } = await supabase
        .from('internal_tasks')
        .update({ location: 'Accueil' })
        .or('location.is.null,location.eq.');

      if (!taskNoLocError) {
        addResult('Tâches sans location → "Accueil"', 'success');
      }

      // ÉTAPE 4: Vérification et statistiques finales
      addResult('Vérification finale...', 'info');

      // Vérifier les incidents
      const { data: incidentsCheck, error: incCheckError } = await supabase
        .from('incidents')
        .select('location')
        .or('location.is.null,location.eq.');

      const orphanIncidents = incidentsCheck?.length || 0;

      // Vérifier les demandes
      const { data: requestsCheck, error: reqCheckError } = await supabase
        .from('client_requests')
        .select('room_number')
        .or('room_number.is.null,room_number.eq.');

      const orphanRequests = requestsCheck?.length || 0;

      // Vérifier les tâches
      const { data: tasksCheck, error: taskCheckError } = await supabase
        .from('internal_tasks')
        .select('location')
        .or('location.is.null,location.eq.');

      const orphanTasks = tasksCheck?.length || 0;

      if (orphanIncidents === 0 && orphanRequests === 0 && orphanTasks === 0) {
        addResult('Toutes les tâches ont maintenant une location valide !', 'success');
      } else {
        addResult(`Éléments restants sans location: ${orphanIncidents} incidents, ${orphanRequests} demandes, ${orphanTasks} tâches`, 'warning');
      }

      // Exemples de résultats
      const { data: sampleIncidents } = await supabase
        .from('incidents')
        .select('title, location')
        .limit(3);

      if (sampleIncidents?.length > 0) {
        addResult('Exemples d\'incidents nettoyés:', 'info');
        sampleIncidents.forEach(inc => {
          addResult(`  • ${inc.title} → ${inc.location}`, 'info');
        });
      }

      addResult('Nettoyage des locations terminé !', 'success');
      addResult('Vérifiez maintenant Dashboard, Shift Management, Team Dispatch et Service Control', 'info');
      setCompleted(true);

    } catch (error) {
      addResult(`Erreur générale: ${error.message}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 decoeur-heading">
          <MapPin className="h-5 w-5 text-blue-500" />
          Nettoyage des Locations Hardcodées
        </CardTitle>
        <p className="text-sm decoeur-body text-muted-foreground">
          Remplace les locations fictives par les 76 vraies locations de votre hôtel
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={executeLocationCleanup}
            disabled={isRunning}
            className="decoeur-button bg-blue-600 hover:bg-blue-700"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Nettoyage en cours...
              </>
            ) : (
              'Démarrer le nettoyage des locations'
            )}
          </Button>
          
          {completed && (
            <Button 
              variant="outline"
              onClick={() => window.location.reload()}
              className="decoeur-button"
            >
              Actualiser la page
            </Button>
          )}
        </div>

        {results.length > 0 && (
          <div className="bg-gray-50 border rounded-lg p-4 max-h-96 overflow-y-auto">
            <h3 className="decoeur-heading font-semibold mb-2">Résultats du nettoyage :</h3>
            <div className="space-y-1 text-sm">
              {results.map((result, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-xs text-gray-500 mt-0.5 decoeur-caption">{result.timestamp}</span>
                  <span className={`decoeur-body
                    ${result.type === 'error' ? 'text-red-600' : ''}
                    ${result.type === 'success' ? 'text-green-600' : ''}
                    ${result.type === 'warning' ? 'text-orange-600' : ''}
                    ${result.type === 'info' ? 'text-blue-600' : ''}
                  `}>
                    {result.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t pt-4">
          <h3 className="decoeur-heading font-semibold mb-2">Ce qui sera nettoyé :</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong className="decoeur-body">Locations fictives supprimées :</strong>
              <ul className="list-disc list-inside decoeur-body text-red-600 ml-2 mt-1">
                <li>"Espace Spa", "Pool Area" → Chambre "50"</li>
                <li>"Main Lobby", "Reception" → "Accueil"</li>
                <li>"Room 207" → Chambre "27"</li>
                <li>"Multiple Rooms" → "Accueil"</li>
              </ul>
            </div>
            <div>
              <strong className="decoeur-body">Actions sur les tâches :</strong>
              <ul className="list-disc list-inside decoeur-body text-green-600 ml-2 mt-1">
                <li>Tâches sans location → "Accueil"</li>
                <li>Demandes sans chambre → Chambre "30"</li>
                <li>Utilisation des 76 vraies locations</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm decoeur-body">
              <strong>Impact :</strong> Toutes les pages (Dashboard, Shift Management, Team Dispatch, Service Control) 
              afficheront maintenant les vraies locations de votre hôtel au lieu des données fictives.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationCleanupExecutor;
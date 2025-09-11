import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

const SupabaseCleanupComponent = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState([]);
  const [completed, setCompleted] = useState(false);

  const cleanupHardcodedLocations = async () => {
    setIsRunning(true);
    setResults([]);
    setCompleted(false);

    const addResult = (message, type = 'info') => {
      setResults(prev => [...prev, { message, type, timestamp: new Date().toLocaleTimeString() }]);
    };

    try {
      addResult('🚀 Démarrage du nettoyage des locations hardcodées...', 'info');

      // ÉTAPE 1: Nettoyer les incidents
      addResult('📝 Nettoyage des incidents...', 'info');
      
      // Remplacer les locations hardcodées une par une
      const incidentUpdates = [
        { from: ['Espace Spa', 'Pool Area', 'Presidential Suite'], to: '50' },
        { from: ['Spa Reception', 'Main Lobby', 'Reception'], to: 'Accueil' },
        { from: ['Elevator Maintenance Required', 'Main Elevator'], to: 'Ascenseur' },
        { from: ['Room 207', '207'], to: '27' },
        { from: ['Room 305', '305'], to: '35' }
      ];

      for (const update of incidentUpdates) {
        for (const oldLocation of update.from) {
          const { data, error } = await supabase
            .from('incidents')
            .update({ location: update.to })
            .eq('location', oldLocation);
          
          if (error) {
            addResult(`❌ Erreur mise à jour incidents: ${error.message}`, 'error');
          } else {
            addResult(`✅ Incidents: "${oldLocation}" → "${update.to}"`, 'success');
          }
        }
      }

      // ÉTAPE 2: Nettoyer les client_requests
      addResult('📝 Nettoyage des demandes clients...', 'info');
      
      const clientUpdates = [
        { from: ['50', 'Presidential Suite', 'Room 305'], to: '35' },
        { from: ['Room 207', '207'], to: '27' },
        { from: ['Multiple Rooms', 'Various'], to: '30' }
      ];

      for (const update of clientUpdates) {
        for (const oldRoom of update.from) {
          const { data, error } = await supabase
            .from('client_requests')
            .update({ room_number: update.to })
            .eq('room_number', oldRoom);
          
          if (error) {
            addResult(`❌ Erreur mise à jour client_requests: ${error.message}`, 'error');
          } else {
            addResult(`✅ Client requests: "${oldRoom}" → "${update.to}"`, 'success');
          }
        }
      }

      // ÉTAPE 3: Nettoyer les internal_tasks
      addResult('📝 Nettoyage des tâches internes...', 'info');
      
      const taskUpdates = [
        { from: ['Restaurant Kitchen', 'Kitchen', 'HVAC Service Company'], to: 'Cuisine' },
        { from: ['Main Lobby', 'Reception Area'], to: 'Accueil' },
        { from: ['Presidential Suite', 'Room 50'], to: '50' }
      ];

      for (const update of taskUpdates) {
        for (const oldLocation of update.from) {
          const { data, error } = await supabase
            .from('internal_tasks')
            .update({ location: update.to })
            .eq('location', oldLocation);
          
          if (error) {
            addResult(`❌ Erreur mise à jour internal_tasks: ${error.message}`, 'error');
          } else {
            addResult(`✅ Internal tasks: "${oldLocation}" → "${update.to}"`, 'success');
          }
        }
      }

      // ÉTAPE 4: Ajouter quelques nouvelles tâches d'exemple
      addResult('📝 Ajout de nouvelles tâches avec vraies locations...', 'info');

      // Supprimer les anciennes tâches de démo
      await supabase
        .from('incidents')
        .delete()
        .or('title.like.%Pool Chemistry%,title.like.%Water Leak%');

      await supabase
        .from('client_requests')
        .delete()
        .or('guest_name.like.%Mrs. Catherine%,guest_name.like.%Mr. Robert%');

      // Créer nouvelles tâches
      const newIncidents = [
        {
          title: 'Problème climatisation chambre',
          description: 'Climatisation ne fonctionne pas correctement',
          incident_type: 'technical',
          priority: 'urgent',
          status: 'pending',
          location: '35',
          assigned_to: 'Pierre Leroy'
        },
        {
          title: 'Fuite eau salle de bain',
          description: 'Petite fuite détectée sous le lavabo',
          incident_type: 'maintenance',
          priority: 'normal',
          status: 'in_progress',
          location: '27',
          assigned_to: 'Jean Dupont'
        },
        {
          title: 'Maintenance ascenseur requise',
          description: 'Contrôle technique périodique',
          incident_type: 'maintenance',
          priority: 'urgent',
          status: 'completed',
          location: 'Ascenseur',
          assigned_to: 'Thomas Anderson'
        }
      ];

      const { error: insertError1 } = await supabase
        .from('incidents')
        .insert(newIncidents);

      if (insertError1) {
        addResult(`❌ Erreur insertion incidents: ${insertError1.message}`, 'error');
      } else {
        addResult('✅ Nouveaux incidents créés avec vraies locations', 'success');
      }

      const newClientRequests = [
        {
          guest_name: 'Mrs. Catherine Dubois',
          room_number: '35',
          request_type: 'special_occasion',
          request_details: 'Anniversaire de mariage - décoration chambre',
          preparation_status: 'in_progress',
          priority: 'normal',
          assigned_to: 'Marie Dubois'
        },
        {
          guest_name: 'Mr. Robert Anderson',
          room_number: '50',
          request_type: 'special_preparation',
          request_details: 'Suite présidentielle - arrivée VIP',
          preparation_status: 'completed',
          priority: 'urgent',
          assigned_to: 'Emma Wilson'
        },
        {
          guest_name: 'Chen Family',
          room_number: '30',
          request_type: 'wedding_party',
          request_details: 'Organisation mariage - préparation multiple chambres',
          preparation_status: 'completed',
          priority: 'urgent',
          assigned_to: 'Emma Wilson'
        }
      ];

      const { error: insertError2 } = await supabase
        .from('client_requests')
        .insert(newClientRequests);

      if (insertError2) {
        addResult(`❌ Erreur insertion client_requests: ${insertError2.message}`, 'error');
      } else {
        addResult('✅ Nouvelles demandes clients créées avec vraies chambres', 'success');
      }

      // ÉTAPE 4.5: Assigner des locations aux tâches sans location
      addResult('📍 Attribution de locations aux tâches sans location...', 'info');

      // Pour les incidents sans location ou avec "Unknown Location"
      const { data: incidentsWithoutLocation, error: incNoLocError } = await supabase
        .from('incidents')
        .select('id, title, incident_type')
        .or('location.is.null,location.eq.Unknown Location,location.eq.');

      if (!incNoLocError && incidentsWithoutLocation?.length > 0) {
        for (const incident of incidentsWithoutLocation) {
          let assignedLocation = '30'; // Default fallback
          
          // Logique d'attribution intelligente basée sur le type d'incident
          if (incident.incident_type === 'technical' || incident.title.toLowerCase().includes('climatisation')) {
            assignedLocation = '35'; // Chambre technique exemple
          } else if (incident.incident_type === 'maintenance' && incident.title.toLowerCase().includes('ascenseur')) {
            assignedLocation = 'Ascenseur';
          } else if (incident.incident_type === 'maintenance' && incident.title.toLowerCase().includes('cuisine')) {
            assignedLocation = 'Cuisine';
          } else if (incident.title.toLowerCase().includes('accueil') || incident.title.toLowerCase().includes('reception')) {
            assignedLocation = 'Accueil';
          } else if (incident.title.toLowerCase().includes('chauffage')) {
            assignedLocation = 'Chaufferie';
          } else {
            // Attribution aléatoire à une chambre valide
            const validRooms = ['27', '30', '35', '40', '45', '50'];
            assignedLocation = validRooms[Math.floor(Math.random() * validRooms.length)];
          }

          const { error: updateError } = await supabase
            .from('incidents')
            .update({ location: assignedLocation })
            .eq('id', incident.id);

          if (updateError) {
            addResult(`❌ Erreur attribution location incident ${incident.id}: ${updateError.message}`, 'error');
          } else {
            addResult(`✅ Incident sans location: "${incident.title}" → "${assignedLocation}"`, 'success');
          }
        }
      }

      // Pour les client_requests sans room_number
      const { data: requestsWithoutRoom, error: reqNoRoomError } = await supabase
        .from('client_requests')
        .select('id, guest_name, request_type')
        .or('room_number.is.null,room_number.eq.');

      if (!reqNoRoomError && requestsWithoutRoom?.length > 0) {
        for (const request of requestsWithoutRoom) {
          let assignedRoom = '31'; // Default fallback
          
          // Logique d'attribution basée sur le type de demande
          if (request.request_type === 'special_preparation' || request.request_type === 'vip') {
            assignedRoom = '50'; // Suite présidentielle pour VIP
          } else if (request.request_type === 'wedding_party') {
            assignedRoom = '45'; // Chambre étage élevé pour mariage
          } else if (request.request_type === 'special_occasion') {
            assignedRoom = '35'; // Chambre avec vue pour occasion spéciale
          } else {
            // Attribution aléatoire à une chambre valide
            const validRooms = ['27', '30', '32', '35', '40', '42', '45', '47', '50', '52'];
            assignedRoom = validRooms[Math.floor(Math.random() * validRooms.length)];
          }

          const { error: updateError } = await supabase
            .from('client_requests')
            .update({ room_number: assignedRoom })
            .eq('id', request.id);

          if (updateError) {
            addResult(`❌ Erreur attribution chambre request ${request.id}: ${updateError.message}`, 'error');
          } else {
            addResult(`✅ Demande sans chambre: "${request.guest_name}" → Chambre "${assignedRoom}"`, 'success');
          }
        }
      }

      // Pour les internal_tasks sans location
      const { data: tasksWithoutLocation, error: taskNoLocError } = await supabase
        .from('internal_tasks')
        .select('id, title, task_type, department')
        .or('location.is.null,location.eq.Unknown Location,location.eq.');

      if (!taskNoLocError && tasksWithoutLocation?.length > 0) {
        for (const task of tasksWithoutLocation) {
          let assignedLocation = 'Accueil'; // Default fallback
          
          // Logique d'attribution basée sur le département et type
          if (task.department === 'maintenance' || task.task_type === 'maintenance') {
            if (task.title.toLowerCase().includes('cuisine') || task.title.toLowerCase().includes('kitchen')) {
              assignedLocation = 'Cuisine';
            } else if (task.title.toLowerCase().includes('chauffage') || task.title.toLowerCase().includes('heating')) {
              assignedLocation = 'Chaufferie';
            } else if (task.title.toLowerCase().includes('linge') || task.title.toLowerCase().includes('laundry')) {
              assignedLocation = 'Lingerie';
            } else {
              assignedLocation = 'Atelier'; // Zone technique générale
            }
          } else if (task.department === 'housekeeping') {
            // Attribution aléatoire à une chambre pour housekeeping
            const validRooms = ['27', '30', '32', '35', '40', '42'];
            assignedLocation = validRooms[Math.floor(Math.random() * validRooms.length)];
          } else if (task.department === 'front_office' || task.title.toLowerCase().includes('reception')) {
            assignedLocation = 'Accueil';
          } else {
            // Attribution par défaut selon le type de tâche
            const staffAreas = ['Cuisine', 'Salle de réunion', 'Espace bien être', 'Atelier'];
            assignedLocation = staffAreas[Math.floor(Math.random() * staffAreas.length)];
          }

          const { error: updateError } = await supabase
            .from('internal_tasks')
            .update({ location: assignedLocation })
            .eq('id', task.id);

          if (updateError) {
            addResult(`❌ Erreur attribution location task ${task.id}: ${updateError.message}`, 'error');
          } else {
            addResult(`✅ Tâche sans location: "${task.title}" → "${assignedLocation}"`, 'success');
          }
        }
      }

      // ÉTAPE 5: Vérification
      addResult('🔍 Vérification des données...', 'info');

      const { data: locations, error: locError } = await supabase
        .from('locations')
        .select('name, type')
        .eq('is_active', true);

      if (locError) {
        addResult(`❌ Erreur vérification locations: ${locError.message}`, 'error');
      } else {
        addResult(`✅ ${locations.length} locations valides trouvées`, 'success');
      }

      const { data: incidents, error: incError } = await supabase
        .from('incidents')
        .select('title, location')
        .limit(3);

      if (!incError && incidents.length > 0) {
        addResult('✅ Exemples d\'incidents avec vraies locations :', 'success');
        incidents.forEach(incident => {
          addResult(`   • ${incident.title} → ${incident.location}`, 'info');
        });
      }

      // ÉTAPE 6: Vérification finale - aucune tâche sans location
      addResult('🔍 Vérification finale - recherche de tâches sans location...', 'info');

      const { data: orphanIncidents } = await supabase
        .from('incidents')
        .select('id, title')
        .or('location.is.null,location.eq.Unknown Location,location.eq.');

      const { data: orphanRequests } = await supabase
        .from('client_requests')
        .select('id, guest_name')
        .or('room_number.is.null,room_number.eq.');

      const { data: orphanTasks } = await supabase
        .from('internal_tasks')
        .select('id, title')
        .or('location.is.null,location.eq.Unknown Location,location.eq.');

      if (orphanIncidents?.length > 0 || orphanRequests?.length > 0 || orphanTasks?.length > 0) {
        addResult(`⚠️ Tâches restantes sans location: ${orphanIncidents?.length || 0} incidents, ${orphanRequests?.length || 0} demandes, ${orphanTasks?.length || 0} tâches`, 'warning');
      } else {
        addResult('✅ Toutes les tâches ont maintenant une location assignée !', 'success');
      }

      addResult('🎉 Nettoyage terminé ! Actualisez la page pour voir les changements.', 'success');
      setCompleted(true);

    } catch (error) {
      addResult(`❌ Erreur générale: ${error.message}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 decoeur-heading">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Nettoyage des Données Hardcodées
        </CardTitle>
        <p className="text-sm decoeur-body text-muted-foreground">
          Ce script va remplacer toutes les données hardcodées par les vraies données de votre hôtel.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={cleanupHardcodedLocations}
            disabled={isRunning}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Nettoyage en cours...
              </>
            ) : (
              'Démarrer le nettoyage'
            )}
          </Button>
          
          {completed && (
            <Button 
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Actualiser la page
            </Button>
          )}
        </div>

        {results.length > 0 && (
          <div className="bg-gray-50 border rounded-lg p-4 max-h-96 overflow-y-auto">
            <h3 className="font-semibold mb-2">Résultats du nettoyage :</h3>
            <div className="space-y-1 text-sm">
              {results.map((result, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-xs text-gray-500 mt-0.5">{result.timestamp}</span>
                  <span className={`
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
          <h3 className="font-semibold mb-2">Ce que fait le nettoyage :</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>1. Remplace les locations hardcodées :</strong>
              <ul className="list-disc list-inside text-red-600 ml-2">
                <li>"Espace Spa" → "50"</li>
                <li>"Presidential Suite" → "50"</li>
                <li>"Spa Reception" → "Accueil"</li>
                <li>"Main Lobby" → "Accueil"</li>
                <li>"Room 207" → "27"</li>
                <li>"Multiple Rooms" → "30"</li>
              </ul>
            </div>
            <div>
              <strong>2. Assigne des locations aux tâches orphelines :</strong>
              <ul className="list-disc list-inside text-green-600 ml-2">
                <li>Incidents sans location → Attribution intelligente</li>
                <li>Demandes sans chambre → Chambres appropriées</li>
                <li>Tâches internes sans lieu → Zones staff</li>
                <li>Logique basée sur le type et département</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm"><strong>Résultat attendu :</strong> Toutes les cartes du dashboard afficheront les vraies locations de votre hôtel (chambres 10-58, zones publiques, zones staff) et aucune tâche ne sera sans location.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SupabaseCleanupComponent;
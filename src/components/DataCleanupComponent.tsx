import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, Loader2, Database, Users, MapPin, Clock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const DataCleanupComponent = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState([]);
  const [completed, setCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState('locations');

  const addResult = (message, type = 'info') => {
    setResults(prev => [...prev, { message, type, timestamp: new Date().toLocaleTimeString() }]);
  };

  // Nettoyage des locations (existant)
  const cleanupLocations = async () => {
    addResult('📍 Démarrage du nettoyage des locations...', 'info');
    
    // Code existant du nettoyage des locations...
    const incidentUpdates = [
      { from: ['Espace Spa', 'Pool Area', 'Presidential Suite'], to: '50' },
      { from: ['Spa Reception', 'Main Lobby', 'Reception'], to: 'Accueil' },
      { from: ['Elevator Maintenance Required', 'Main Elevator'], to: 'Ascenseur' },
      { from: ['Room 207', '207'], to: '27' },
      { from: ['Room 305', '305'], to: '35' }
    ];

    for (const update of incidentUpdates) {
      for (const oldLocation of update.from) {
        const { error } = await supabase
          .from('incidents')
          .update({ location: update.to })
          .eq('location', oldLocation);
        
        if (error) {
          addResult(`❌ Erreur incidents: ${error.message}`, 'error');
        } else {
          addResult(`✅ Incidents: "${oldLocation}" → "${update.to}"`, 'success');
        }
      }
    }

    addResult('✅ Nettoyage des locations terminé', 'success');
  };

  // Nouveau: Nettoyage des utilisateurs hardcodés
  const cleanupUsers = async () => {
    addResult('👥 Démarrage du nettoyage des utilisateurs...', 'info');

    // Remplacer les noms génériques par des noms réalistes d'équipe hôtelière
    const userUpdates = [
      { from: 'John Doe', to: 'Alexandre Martin' },
      { from: 'Jane Smith', to: 'Camille Rousseau' },
      { from: 'Admin User', to: 'Direction Générale' },
      { from: 'Test User', to: 'Formation Équipe' },
      { from: 'Demo User', to: 'Service Client' },
      { from: 'Sample User', to: 'Réception Principale' }
    ];

    // Mise à jour des assignations dans les incidents
    for (const update of userUpdates) {
      const { error } = await supabase
        .from('incidents')
        .update({ assigned_to: update.to })
        .eq('assigned_to', update.from);
      
      if (error) {
        addResult(`❌ Erreur utilisateurs incidents: ${error.message}`, 'error');
      } else {
        addResult(`✅ Utilisateur incidents: "${update.from}" → "${update.to}"`, 'success');
      }
    }

    // Mise à jour des assignations dans les demandes clients
    for (const update of userUpdates) {
      const { error } = await supabase
        .from('client_requests')
        .update({ assigned_to: update.to })
        .eq('assigned_to', update.from);
      
      if (error) {
        addResult(`❌ Erreur utilisateurs demandes: ${error.message}`, 'error');
      } else {
        addResult(`✅ Utilisateur demandes: "${update.from}" → "${update.to}"`, 'success');
      }
    }

    addResult('✅ Nettoyage des utilisateurs terminé', 'success');
  };

  // Nouveau: Nettoyage des heures et dates
  const cleanupDates = async () => {
    addResult('⏰ Démarrage du nettoyage des dates...', 'info');

    // Mettre à jour les dates anciennes avec des dates récentes
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Incidents récents (dernière semaine)
    const { error: incidentDateError } = await supabase
      .from('incidents')
      .update({ 
        created_at: oneWeekAgo.toISOString(),
        updated_at: yesterday.toISOString()
      })
      .lt('created_at', '2024-01-01');

    if (incidentDateError) {
      addResult(`❌ Erreur dates incidents: ${incidentDateError.message}`, 'error');
    } else {
      addResult('✅ Dates des incidents mises à jour', 'success');
    }

    // Demandes clients récentes
    const { error: requestDateError } = await supabase
      .from('client_requests')
      .update({ 
        created_at: yesterday.toISOString(),
        updated_at: new Date().toISOString()
      })
      .lt('created_at', '2024-01-01');

    if (requestDateError) {
      addResult(`❌ Erreur dates demandes: ${requestDateError.message}`, 'error');
    } else {
      addResult('✅ Dates des demandes mises à jour', 'success');
    }

    addResult('✅ Nettoyage des dates terminé', 'success');
  };

  // Nouveau: Nettoyage des statuts
  const cleanupStatuses = async () => {
    addResult('📊 Démarrage du nettoyage des statuts...', 'info');

    // Normaliser les statuts des incidents
    const statusUpdates = [
      { from: 'new', to: 'pending' },
      { from: 'open', to: 'in_progress' },
      { from: 'done', to: 'completed' },
      { from: 'closed', to: 'completed' },
      { from: 'resolved', to: 'completed' }
    ];

    for (const update of statusUpdates) {
      const { error } = await supabase
        .from('incidents')
        .update({ status: update.to })
        .eq('status', update.from);
      
      if (error) {
        addResult(`❌ Erreur statuts: ${error.message}`, 'error');
      } else {
        addResult(`✅ Statut: "${update.from}" → "${update.to}"`, 'success');
      }
    }

    // Normaliser les statuts des demandes clients
    const requestStatusUpdates = [
      { from: 'new', to: 'pending' },
      { from: 'processing', to: 'in_progress' },
      { from: 'done', to: 'completed' },
      { from: 'finished', to: 'completed' }
    ];

    for (const update of requestStatusUpdates) {
      const { error } = await supabase
        .from('client_requests')
        .update({ preparation_status: update.to })
        .eq('preparation_status', update.from);
      
      if (error) {
        addResult(`❌ Erreur statuts demandes: ${error.message}`, 'error');
      } else {
        addResult(`✅ Statut demande: "${update.from}" → "${update.to}"`, 'success');
      }
    }

    addResult('✅ Nettoyage des statuts terminé', 'success');
  };

  // Fonction principale de nettoyage complet
  const runCompleteCleanup = async () => {
    setIsRunning(true);
    setResults([]);
    setCompleted(false);

    try {
      addResult('🚀 Démarrage du nettoyage complet des données...', 'info');
      
      await cleanupLocations();
      await cleanupUsers();
      await cleanupDates();
      await cleanupStatuses();

      addResult('🎉 Nettoyage complet terminé ! Votre application utilise maintenant des données réalistes.', 'success');
      setCompleted(true);

    } catch (error) {
      addResult(`❌ Erreur générale: ${error.message}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <MapPin className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <div className="decoeur-heading text-lg">Locations</div>
            <div className="decoeur-body text-sm text-muted-foreground">Hardcodées → Réelles</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <div className="decoeur-heading text-lg">Utilisateurs</div>
            <div className="decoeur-body text-sm text-muted-foreground">Génériques → Équipe</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-orange-500" />
            <div className="decoeur-heading text-lg">Dates</div>
            <div className="decoeur-body text-sm text-muted-foreground">Anciennes → Récentes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Database className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <div className="decoeur-heading text-lg">Statuts</div>
            <div className="decoeur-body text-sm text-muted-foreground">Variables → Standards</div>
          </CardContent>
        </Card>
      </div>

      {/* Contrôles principaux */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 decoeur-heading">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Nettoyage Global des Données
          </CardTitle>
          <p className="text-sm decoeur-body text-muted-foreground">
            Transformation complète des données de démonstration en données réalistes d'hôtel.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={runCompleteCleanup}
              disabled={isRunning}
              className="decoeur-button bg-orange-600 hover:bg-orange-700"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Nettoyage en cours...
                </>
              ) : (
                'Démarrer le nettoyage complet'
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
        </CardContent>
      </Card>

      {/* Détails des opérations */}
      <Card>
        <CardHeader>
          <CardTitle className="decoeur-heading">Détails des opérations de nettoyage</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="decoeur-button">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="locations" className="decoeur-button">Locations</TabsTrigger>
              <TabsTrigger value="users" className="decoeur-button">Utilisateurs</TabsTrigger>
              <TabsTrigger value="data" className="decoeur-button">Données</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-4">
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="decoeur-heading font-semibold mb-2">Objectif du nettoyage</h4>
                  <p className="decoeur-body text-sm">
                    Transformer votre application de démonstration en une vraie application d'hôtel avec des données réalistes et cohérentes.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="decoeur-heading font-semibold text-red-600 mb-2">Données supprimées :</h5>
                    <ul className="list-disc list-inside decoeur-body text-sm space-y-1">
                      <li>Locations fictives (Spa Area, Pool Area)</li>
                      <li>Utilisateurs génériques (John Doe, Test User)</li>
                      <li>Dates anciennes et incohérentes</li>
                      <li>Statuts non-standardisés</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="decoeur-heading font-semibold text-green-600 mb-2">Données ajoutées :</h5>
                    <ul className="list-disc list-inside decoeur-body text-sm space-y-1">
                      <li>Vraies chambres d'hôtel (27, 30, 35, 50...)</li>
                      <li>Équipe hôtelière réaliste</li>
                      <li>Dates récentes et logiques</li>
                      <li>Statuts standardisés (pending, in_progress, completed)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="locations" className="mt-4">
              <div className="space-y-4">
                <h4 className="decoeur-heading font-semibold">Transformation des locations</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong className="decoeur-heading">Avant (hardcodé) :</strong>
                    <ul className="list-disc list-inside decoeur-body text-red-600 ml-2 mt-1">
                      <li>"Espace Spa" → "50"</li>
                      <li>"Presidential Suite" → "50"</li>
                      <li>"Spa Reception" → "Accueil"</li>
                      <li>"Main Lobby" → "Accueil"</li>
                      <li>"Room 207" → "27"</li>
                      <li>"Multiple Rooms" → "30"</li>
                    </ul>
                  </div>
                  <div>
                    <strong className="decoeur-heading">Après (réaliste) :</strong>
                    <ul className="list-disc list-inside decoeur-body text-green-600 ml-2 mt-1">
                      <li>Chambres numérotées (27, 30, 35, 40, 45, 50)</li>
                      <li>Zones publiques (Accueil, Ascenseur)</li>
                      <li>Zones staff (Cuisine, Lingerie, Atelier)</li>
                      <li>Attribution intelligente par type de tâche</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="users" className="mt-4">
              <div className="space-y-4">
                <h4 className="decoeur-heading font-semibold">Équipe hôtelière réaliste</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h5 className="decoeur-heading font-semibold mb-2">Réception</h5>
                    <ul className="decoeur-body text-sm space-y-1">
                      <li>• Alexandre Martin</li>
                      <li>• Camille Rousseau</li>
                      <li>• Réception Principale</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="decoeur-heading font-semibold mb-2">Services</h5>
                    <ul className="decoeur-body text-sm space-y-1">
                      <li>• Service Client</li>
                      <li>• Formation Équipe</li>
                      <li>• Direction Générale</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="decoeur-heading font-semibold mb-2">Existants conservés</h5>
                    <ul className="decoeur-body text-sm space-y-1">
                      <li>• Pierre Leroy</li>
                      <li>• Jean Dupont</li>
                      <li>• Emma Wilson</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="data" className="mt-4">
              <div className="space-y-4">
                <h4 className="decoeur-heading font-semibold">Normalisation des données</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="decoeur-heading font-semibold mb-2">Statuts standardisés :</h5>
                    <ul className="decoeur-body text-sm space-y-1">
                      <li><strong>pending</strong> - Nouvelles tâches</li>
                      <li><strong>in_progress</strong> - En cours de traitement</li>
                      <li><strong>completed</strong> - Terminées</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="decoeur-heading font-semibold mb-2">Dates cohérentes :</h5>
                    <ul className="decoeur-body text-sm space-y-1">
                      <li>• Incidents récents (dernière semaine)</li>
                      <li>• Demandes d'hier et aujourd'hui</li>
                      <li>• Timestamps logiques</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataCleanupComponent;
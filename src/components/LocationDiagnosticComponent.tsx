import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, MapPin, AlertCircle, CheckCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const LocationDiagnosticComponent = () => {
  const [diagnosticData, setDiagnosticData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runLocationDiagnostic = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const diagnostic = {
        locations: {
          total: 0,
          active: 0,
          list: []
        },
        incidents: {
          total: 0,
          withLocation: 0,
          withoutLocation: 0,
          uniqueLocations: [],
          examples: []
        },
        clientRequests: {
          total: 0,
          withRoom: 0,
          withoutRoom: 0,
          uniqueRooms: [],
          examples: []
        },
        internalTasks: {
          total: 0,
          withLocation: 0,
          withoutLocation: 0,
          uniqueLocations: [],
          examples: []
        }
      };

      // 1. Analyser la table locations
      console.log('Analyse de la table locations...');
      const { data: locationsData, error: locationsError } = await supabase
        .from('locations')
        .select('*');

      if (locationsError) {
        throw new Error(`Erreur locations: ${locationsError.message}`);
      }

      diagnostic.locations.total = locationsData?.length || 0;
      diagnostic.locations.active = locationsData?.filter(loc => loc.is_active)?.length || 0;
      diagnostic.locations.list = locationsData || [];

      // 2. Analyser les incidents
      console.log('Analyse des incidents...');
      const { data: incidentsData, error: incidentsError } = await supabase
        .from('incidents')
        .select('id, title, location, status, priority');

      if (incidentsError) {
        throw new Error(`Erreur incidents: ${incidentsError.message}`);
      }

      diagnostic.incidents.total = incidentsData?.length || 0;
      diagnostic.incidents.withLocation = incidentsData?.filter(inc => inc.location && inc.location.trim() !== '')?.length || 0;
      diagnostic.incidents.withoutLocation = diagnostic.incidents.total - diagnostic.incidents.withLocation;
      diagnostic.incidents.uniqueLocations = [...new Set(incidentsData?.map(inc => inc.location).filter(loc => loc && loc.trim() !== ''))];
      diagnostic.incidents.examples = incidentsData?.slice(0, 5) || [];

      // 3. Analyser les demandes clients
      console.log('Analyse des demandes clients...');
      const { data: requestsData, error: requestsError } = await supabase
        .from('client_requests')
        .select('id, guest_name, room_number, request_type, preparation_status');

      if (requestsError) {
        throw new Error(`Erreur client_requests: ${requestsError.message}`);
      }

      diagnostic.clientRequests.total = requestsData?.length || 0;
      diagnostic.clientRequests.withRoom = requestsData?.filter(req => req.room_number && req.room_number.trim() !== '')?.length || 0;
      diagnostic.clientRequests.withoutRoom = diagnostic.clientRequests.total - diagnostic.clientRequests.withRoom;
      diagnostic.clientRequests.uniqueRooms = [...new Set(requestsData?.map(req => req.room_number).filter(room => room && room.trim() !== ''))];
      diagnostic.clientRequests.examples = requestsData?.slice(0, 5) || [];

      // 4. Analyser les tâches internes
      console.log('Analyse des tâches internes...');
      const { data: tasksData, error: tasksError } = await supabase
        .from('internal_tasks')
        .select('id, title, location, department, task_type');

      if (tasksError) {
        throw new Error(`Erreur internal_tasks: ${tasksError.message}`);
      }

      diagnostic.internalTasks.total = tasksData?.length || 0;
      diagnostic.internalTasks.withLocation = tasksData?.filter(task => task.location && task.location.trim() !== '')?.length || 0;
      diagnostic.internalTasks.withoutLocation = diagnostic.internalTasks.total - diagnostic.internalTasks.withLocation;
      diagnostic.internalTasks.uniqueLocations = [...new Set(tasksData?.map(task => task.location).filter(loc => loc && loc.trim() !== ''))];
      diagnostic.internalTasks.examples = tasksData?.slice(0, 5) || [];

      setDiagnosticData(diagnostic);
      console.log('Diagnostic terminé:', diagnostic);

    } catch (err) {
      setError(err.message);
      console.error('Erreur diagnostic:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Lancer le diagnostic automatiquement au chargement
    runLocationDiagnostic();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Database className="h-8 w-8 mx-auto mb-4 animate-pulse" />
          <div className="decoeur-heading">Analyse des données en cours...</div>
          <div className="decoeur-body text-sm text-muted-foreground mt-2">
            Connexion à Supabase et analyse des tables
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
          <div className="decoeur-heading text-red-600">Erreur de connexion</div>
          <div className="decoeur-body text-sm text-muted-foreground mt-2">{error}</div>
          <Button onClick={runLocationDiagnostic} className="mt-4">
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!diagnosticData) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Button onClick={runLocationDiagnostic}>
            Lancer le diagnostic
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Vue d'ensemble */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <MapPin className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <div className="decoeur-heading text-2xl">{diagnosticData.locations.total}</div>
            <div className="decoeur-body text-sm text-muted-foreground">Locations définies</div>
            <div className="decoeur-caption text-xs text-green-600">
              {diagnosticData.locations.active} actives
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-orange-500" />
            <div className="decoeur-heading text-2xl">{diagnosticData.incidents.total}</div>
            <div className="decoeur-body text-sm text-muted-foreground">Incidents</div>
            <div className="decoeur-caption text-xs">
              <span className="text-green-600">{diagnosticData.incidents.withLocation} avec location</span>
              {diagnosticData.incidents.withoutLocation > 0 && (
                <span className="text-red-600 ml-2">{diagnosticData.incidents.withoutLocation} sans location</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <div className="decoeur-heading text-2xl">{diagnosticData.clientRequests.total}</div>
            <div className="decoeur-body text-sm text-muted-foreground">Demandes clients</div>
            <div className="decoeur-caption text-xs">
              <span className="text-green-600">{diagnosticData.clientRequests.withRoom} avec chambre</span>
              {diagnosticData.clientRequests.withoutRoom > 0 && (
                <span className="text-red-600 ml-2">{diagnosticData.clientRequests.withoutRoom} sans chambre</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Database className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <div className="decoeur-heading text-2xl">{diagnosticData.internalTasks.total}</div>
            <div className="decoeur-body text-sm text-muted-foreground">Tâches internes</div>
            <div className="decoeur-caption text-xs">
              <span className="text-green-600">{diagnosticData.internalTasks.withLocation} avec location</span>
              {diagnosticData.internalTasks.withoutLocation > 0 && (
                <span className="text-red-600 ml-2">{diagnosticData.internalTasks.withoutLocation} sans location</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Détails par onglets */}
      <Card>
        <CardHeader>
          <CardTitle className="decoeur-heading">Diagnostic détaillé des locations</CardTitle>
          <Button onClick={runLocationDiagnostic} variant="outline" size="sm">
            Actualiser les données
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="locations">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="locations" className="decoeur-button">Locations (Table)</TabsTrigger>
              <TabsTrigger value="incidents" className="decoeur-button">Incidents</TabsTrigger>
              <TabsTrigger value="requests" className="decoeur-button">Demandes</TabsTrigger>
              <TabsTrigger value="tasks" className="decoeur-button">Tâches</TabsTrigger>
            </TabsList>

            <TabsContent value="locations" className="mt-4">
              <div className="space-y-4">
                <h4 className="decoeur-heading font-semibold">Locations définies dans la table 'locations'</h4>
                {diagnosticData.locations.list.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {diagnosticData.locations.list.map((location, index) => (
                      <div key={index} className={`p-2 rounded border text-sm decoeur-body ${location.is_active ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="font-semibold">{location.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Type: {location.type} | Zone: {location.zone} | {location.is_active ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground decoeur-body">
                    Aucune location trouvée dans la table
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="incidents" className="mt-4">
              <div className="space-y-4">
                <h4 className="decoeur-heading font-semibold">Locations utilisées dans les incidents</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="decoeur-body font-semibold mb-2">Locations uniques ({diagnosticData.incidents.uniqueLocations.length}) :</h5>
                    <div className="space-y-1">
                      {diagnosticData.incidents.uniqueLocations.map((location, index) => (
                        <div key={index} className="p-2 bg-blue-50 rounded text-sm decoeur-body">
                          "{location}"
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h5 className="decoeur-body font-semibold mb-2">Exemples d'incidents :</h5>
                    <div className="space-y-2">
                      {diagnosticData.incidents.examples.map((incident, index) => (
                        <div key={index} className="p-2 border rounded text-sm">
                          <div className="decoeur-body font-semibold">{incident.title}</div>
                          <div className="decoeur-caption text-muted-foreground">
                            Location: {incident.location || 'Non définie'} | Statut: {incident.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="requests" className="mt-4">
              <div className="space-y-4">
                <h4 className="decoeur-heading font-semibold">Chambres utilisées dans les demandes clients</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="decoeur-body font-semibold mb-2">Chambres uniques ({diagnosticData.clientRequests.uniqueRooms.length}) :</h5>
                    <div className="space-y-1">
                      {diagnosticData.clientRequests.uniqueRooms.map((room, index) => (
                        <div key={index} className="p-2 bg-green-50 rounded text-sm decoeur-body">
                          Chambre "{room}"
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h5 className="decoeur-body font-semibold mb-2">Exemples de demandes :</h5>
                    <div className="space-y-2">
                      {diagnosticData.clientRequests.examples.map((request, index) => (
                        <div key={index} className="p-2 border rounded text-sm">
                          <div className="decoeur-body font-semibold">{request.guest_name}</div>
                          <div className="decoeur-caption text-muted-foreground">
                            Chambre: {request.room_number || 'Non définie'} | Type: {request.request_type}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="mt-4">
              <div className="space-y-4">
                <h4 className="decoeur-heading font-semibold">Locations utilisées dans les tâches internes</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="decoeur-body font-semibold mb-2">Locations uniques ({diagnosticData.internalTasks.uniqueLocations.length}) :</h5>
                    <div className="space-y-1">
                      {diagnosticData.internalTasks.uniqueLocations.map((location, index) => (
                        <div key={index} className="p-2 bg-purple-50 rounded text-sm decoeur-body">
                          "{location}"
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h5 className="decoeur-body font-semibold mb-2">Exemples de tâches :</h5>
                    <div className="space-y-2">
                      {diagnosticData.internalTasks.examples.map((task, index) => (
                        <div key={index} className="p-2 border rounded text-sm">
                          <div className="decoeur-body font-semibold">{task.title}</div>
                          <div className="decoeur-caption text-muted-foreground">
                            Location: {task.location || 'Non définie'} | Dept: {task.department}
                          </div>
                        </div>
                      ))}
                    </div>
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

export default LocationDiagnosticComponent;
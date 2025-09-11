// =======================================================================
// UTILITAIRE DE NETTOYAGE DES LOCATIONS HARDCODÉES - HOSPITALITYOS (SIMPLIFIÉ)
// =======================================================================

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Database, 
  Trash2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const LocationCleanupUtility = () => {
  const [isWorking, setIsWorking] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  // Mapping des locations hardcodées vers les vraies locations
  const locationMappings = [
    // Incidents
    { from: 'Espace Spa', to: 'Espace bien être', table: 'incidents', field: 'location' },
    { from: 'Spa Reception', to: 'Accueil', table: 'incidents', field: 'location' },
    { from: 'Main Lobby', to: 'Accueil', table: 'incidents', field: 'location' },
    { from: 'Pool Area', to: 'Espace bien être', table: 'incidents', field: 'location' },
    { from: 'Presidential Suite', to: '50', table: 'incidents', field: 'location' },
    { from: 'Room 207', to: '27', table: 'incidents', field: 'location' },
    { from: 'Room 305', to: '35', table: 'incidents', field: 'location' },
    
    // Client Requests
    { from: 'Multiple Rooms', to: '30', table: 'client_requests', field: 'room_number' },
    { from: 'Room 207', to: '27', table: 'client_requests', field: 'room_number' },
    { from: 'Room 305', to: '35', table: 'client_requests', field: 'room_number' },
    { from: 'Presidential Suite', to: '50', table: 'client_requests', field: 'room_number' },
    
    // Internal Tasks
    { from: 'Restaurant Kitchen', to: 'Cuisine', table: 'internal_tasks', field: 'location' },
    { from: 'HVAC Service Company', to: 'Chaufferie', table: 'internal_tasks', field: 'location' },
    { from: 'Presidential Suite', to: '50', table: 'internal_tasks', field: 'location' },
    { from: 'Pool Area', to: 'Espace bien être', table: 'internal_tasks', field: 'location' },
    { from: 'Main Lobby', to: 'Accueil', table: 'internal_tasks', field: 'location' }
  ];

  const analyzeAndCleanup = async () => {
    setIsWorking(true);
    
    try {
      toast({
        title: "🔍 Analyse et nettoyage en cours...",
        description: "Correction des locations hardcodées"
      });

      let totalFixed = 0;
      const fixedByTable = { incidents: 0, client_requests: 0, internal_tasks: 0 };

      // Appliquer chaque mapping
      for (const mapping of locationMappings) {
        const { data, error } = await supabase
          .from(mapping.table)
          .update({ [mapping.field]: mapping.to })
          .eq(mapping.field, mapping.from)
          .select();
        
        if (error) {
          console.error(`Erreur ${mapping.table}:`, error);
        } else if (data) {
          const fixed = data.length;
          totalFixed += fixed;
          fixedByTable[mapping.table as keyof typeof fixedByTable] += fixed;
          
          if (fixed > 0) {
            console.log(`✅ ${mapping.table}: "${mapping.from}" → "${mapping.to}" (${fixed} éléments)`);
          }
        }
      }

      // Récupérer les locations valides pour le nettoyage final
      const { data: validLocations } = await supabase
        .from('locations')
        .select('name')
        .eq('is_active', true);
      
      const validLocationNames = validLocations?.map(loc => loc.name) || [];

      // Nettoyage final des données invalides restantes
      await supabase
        .from('incidents')
        .update({ location: 'Accueil' })
        .not('location', 'in', `(${validLocationNames.map(name => `"${name}"`).join(',')})`);
      
      await supabase
        .from('client_requests')
        .update({ room_number: '30' })
        .not('room_number', 'in', `(${validLocationNames.map(name => `"${name}"`).join(',')})`);
      
      await supabase
        .from('internal_tasks')
        .update({ location: 'Accueil' })
        .not('location', 'in', `(${validLocationNames.map(name => `"${name}"`).join(',')})`);

      setResults({
        totalFixed,
        fixedByTable,
        validLocations: validLocationNames.length
      });

      toast({
        title: "🎉 Nettoyage terminé !",
        description: `${totalFixed} éléments corrigés avec succès`
      });

    } catch (error: any) {
      console.error('Erreur:', error);
      toast({
        title: "❌ Erreur",
        description: `Erreur: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Utilitaire de nettoyage des locations
          </CardTitle>
          <CardDescription>
            Corriger les locations hardcodées pour utiliser la vraie table locations de Supabase
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Action principale */}
          <div className="flex gap-3">
            <Button 
              onClick={analyzeAndCleanup}
              disabled={isWorking}
              className="flex items-center gap-2"
              size="lg"
            >
              {isWorking ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {isWorking ? 'Correction en cours...' : 'Analyser et Corriger'}
            </Button>
          </div>

          {/* Résultats */}
          {results && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-semibold text-green-700">✅ Nettoyage terminé avec succès !</div>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <Badge variant="outline" className="bg-green-50">
                        {results.totalFixed} Total corrigé
                      </Badge>
                    </div>
                    <div className="text-center">
                      <Badge variant="outline" className="bg-green-50">
                        {results.fixedByTable.incidents} Incidents
                      </Badge>
                    </div>
                    <div className="text-center">
                      <Badge variant="outline" className="bg-green-50">
                        {results.fixedByTable.client_requests} Requests
                      </Badge>
                    </div>
                    <div className="text-center">
                      <Badge variant="outline" className="bg-green-50">
                        {results.fixedByTable.internal_tasks} Tasks
                      </Badge>
                    </div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Informations */}
          <div className="text-sm text-muted-foreground space-y-2">
            <div className="font-medium">Cet utilitaire corrige automatiquement :</div>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>"Espace Spa" → "Espace bien être"</li>
              <li>"Spa Reception" → "Accueil"</li>
              <li>"Main Lobby" → "Accueil"</li>
              <li>"Room 207" → "27"</li>
              <li>"Room 305" → "35"</li>
              <li>"Presidential Suite" → "50"</li>
              <li>"Multiple Rooms" → "30"</li>
              <li>Et toutes les autres locations invalides</li>
            </ul>
          </div>

          {/* Warning */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important :</strong> Cette opération modifie directement les données en base. 
              Assurez-vous d'avoir une sauvegarde avant de procéder.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};
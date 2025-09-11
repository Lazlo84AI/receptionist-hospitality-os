import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Database, CheckCircle, AlertTriangle } from 'lucide-react';
import { runTeamDispatchMigration } from '@/lib/migrations/teamDispatchMigration';

export const MigrationRunner = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRunMigration = async () => {
    setIsRunning(true);
    setError(null);
    
    try {
      await runTeamDispatchMigration();
      setSuccess(true);
      setHasRun(true);
      
      // Auto-refresh après 3 secondes
      setTimeout(() => {
        window.location.reload();
      }, 3000);
      
    } catch (err) {
      console.error('Erreur migration:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Migration Team Dispatch
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasRun ? (
          <>
            <p className="text-sm text-muted-foreground">
              Cette migration va corriger les données pour Team Dispatch :
            </p>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Noms manquants dans les profils</li>
              <li>• Locations manquantes dans les tâches</li>
              <li>• Assignment des tâches aux membres</li>
            </ul>
            
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                À exécuter une seule fois ! Cela va modifier la base de données.
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={handleRunMigration} 
              disabled={isRunning}
              className="w-full"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Migration en cours...
                </>
              ) : (
                'Lancer la migration'
              )}
            </Button>
          </>
        ) : success ? (
          <div className="text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
            <div>
              <h3 className="font-semibold text-green-600">Migration terminée !</h3>
              <p className="text-sm text-muted-foreground">
                Les données ont été corrigées dans Supabase.
              </p>
              <Badge className="mt-2">Rechargement automatique...</Badge>
            </div>
          </div>
        ) : null}
        
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Erreur : {error}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
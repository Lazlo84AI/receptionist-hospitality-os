import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import getUserProfiles from '@/lib/actions/getUserProfiles';
import getTaskComments from '@/lib/actions/getTaskComments';
import getActivityLogs from '@/lib/actions/getActivityLogs';
import getReminders from '@/lib/actions/getReminders';

export default function TestActions() {
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<string | null>(null);

  const testAction = async (actionName: string, actionFn: () => Promise<any>) => {
    setLoading(actionName);
    try {
      const result = await actionFn();
      setResults(prev => ({
        ...prev,
        [actionName]: {
          success: true,
          data: result,
          count: result?.length || 0,
          timestamp: new Date().toLocaleTimeString()
        }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [actionName]: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toLocaleTimeString()
        }
      }));
    }
    setLoading(null);
  };

  const testAll = async () => {
    await testAction('getUserProfiles', () => getUserProfiles({ limit: 5 }));
    await testAction('getTaskComments', () => getTaskComments({ limit: 5 }));
    await testAction('getActivityLogs', () => getActivityLogs({ limit: 5 }));
    await testAction('getReminders', () => getReminders({ limit: 5 }));
  };

  return (
    <div className="p-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Test des Actions Supabase</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={testAll} disabled={loading !== null}>
              Tester toutes les actions
            </Button>
            <Button 
              variant="outline" 
              onClick={() => testAction('getUserProfiles', () => getUserProfiles({ limit: 5 }))}
              disabled={loading !== null}
            >
              {loading === 'getUserProfiles' ? 'Test...' : 'Test Profiles'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => testAction('getTaskComments', () => getTaskComments({ limit: 5 }))}
              disabled={loading !== null}
            >
              {loading === 'getTaskComments' ? 'Test...' : 'Test Comments'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => testAction('getActivityLogs', () => getActivityLogs({ limit: 5 }))}
              disabled={loading !== null}
            >
              {loading === 'getActivityLogs' ? 'Test...' : 'Test Logs'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => testAction('getReminders', () => getReminders({ limit: 5 }))}
              disabled={loading !== null}
            >
              {loading === 'getReminders' ? 'Test...' : 'Test Reminders'}
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(results).map(([actionName, result]) => (
              <Card key={actionName} className="border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{actionName}</CardTitle>
                    <Badge variant={result.success ? "default" : "destructive"}>
                      {result.success ? "Succès" : "Erreur"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-xs text-muted-foreground">
                    {result.timestamp}
                  </div>
                  {result.success ? (
                    <div className="text-sm">
                      <div className="font-medium text-green-600">
                        ✅ {result.count} enregistrements récupérés
                      </div>
                      {result.count > 0 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs">Voir les données</summary>
                          <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-32">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-red-600">
                      ❌ {result.error}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
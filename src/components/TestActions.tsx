import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

  const runAll = async () => {
    setLoading('all');
    try {
      const [profiles, comments, logs, reminders] = await Promise.all([
        getUserProfiles({ limit: 10 }),
        getTaskComments({ limit: 10 }),
        getActivityLogs({ limit: 10 }),
        getReminders({ limit: 10 })
      ]);

      const timestamp = new Date().toLocaleTimeString();
      setResults({
        getUserProfiles: { success: true, data: profiles, count: profiles?.length || 0, timestamp },
        getTaskComments: { success: true, data: comments, count: comments?.length || 0, timestamp },
        getActivityLogs: { success: true, data: logs, count: logs?.length || 0, timestamp },
        getReminders: { success: true, data: reminders, count: reminders?.length || 0, timestamp }
      });
    } catch (error) {
      console.error('Error running all tests:', error);
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
            <Button onClick={runAll} disabled={loading !== null}>
              {loading === 'all' ? 'Chargement...' : 'Run All'}
            </Button>
            <Button variant="outline" onClick={testAll} disabled={loading !== null}>
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

          <div className="space-y-6">
            {/* User Profiles Table */}
            {results.getUserProfiles && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">User Profiles</CardTitle>
                    <div className="flex gap-2 items-center">
                      <Badge variant={results.getUserProfiles.success ? "default" : "destructive"}>
                        {results.getUserProfiles.success ? "Succès" : "Erreur"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{results.getUserProfiles.timestamp}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {results.getUserProfiles.success && results.getUserProfiles.data?.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Full Name</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Created At</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.getUserProfiles.data.map((profile: any) => (
                          <TableRow key={profile.id}>
                            <TableCell className="font-medium">{profile.email}</TableCell>
                            <TableCell>{profile.full_name || '-'}</TableCell>
                            <TableCell>{profile.role || '-'}</TableCell>
                            <TableCell>{new Date(profile.created_at).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {results.getUserProfiles.success ? 'Aucune donnée' : `❌ ${results.getUserProfiles.error}`}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Task Comments Table */}
            {results.getTaskComments && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Task Comments</CardTitle>
                    <div className="flex gap-2 items-center">
                      <Badge variant={results.getTaskComments.success ? "default" : "destructive"}>
                        {results.getTaskComments.success ? "Succès" : "Erreur"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{results.getTaskComments.timestamp}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {results.getTaskComments.success && results.getTaskComments.data?.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Task ID</TableHead>
                          <TableHead>User ID</TableHead>
                          <TableHead>Content</TableHead>
                          <TableHead>Created At</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.getTaskComments.data.map((comment: any) => (
                          <TableRow key={comment.id}>
                            <TableCell className="font-medium">{comment.task_id}</TableCell>
                            <TableCell>{comment.user_id}</TableCell>
                            <TableCell className="max-w-xs truncate">{comment.content || '-'}</TableCell>
                            <TableCell>{new Date(comment.created_at).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {results.getTaskComments.success ? 'Aucune donnée' : `❌ ${results.getTaskComments.error}`}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Activity Logs Table */}
            {results.getActivityLogs && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Activity Logs</CardTitle>
                    <div className="flex gap-2 items-center">
                      <Badge variant={results.getActivityLogs.success ? "default" : "destructive"}>
                        {results.getActivityLogs.success ? "Succès" : "Erreur"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{results.getActivityLogs.timestamp}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {results.getActivityLogs.success && results.getActivityLogs.data?.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Entity Type</TableHead>
                          <TableHead>Entity ID</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Created At</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.getActivityLogs.data.map((log: any) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-medium">{log.entity_type || '-'}</TableCell>
                            <TableCell>{log.entity_id || '-'}</TableCell>
                            <TableCell>{log.action || '-'}</TableCell>
                            <TableCell>{new Date(log.created_at).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {results.getActivityLogs.success ? 'Aucune donnée' : `❌ ${results.getActivityLogs.error}`}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Reminders Table */}
            {results.getReminders && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Reminders</CardTitle>
                    <div className="flex gap-2 items-center">
                      <Badge variant={results.getReminders.success ? "default" : "destructive"}>
                        {results.getReminders.success ? "Succès" : "Erreur"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{results.getReminders.timestamp}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {results.getReminders.success && results.getReminders.data?.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Task Type</TableHead>
                          <TableHead>Remind At</TableHead>
                          <TableHead>Frequency</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.getReminders.data.map((reminder: any) => (
                          <TableRow key={reminder.id}>
                            <TableCell className="font-medium">{reminder.title || '-'}</TableCell>
                            <TableCell>{reminder.task_type || '-'}</TableCell>
                            <TableCell>{reminder.remind_at ? new Date(reminder.remind_at).toLocaleDateString() : '-'}</TableCell>
                            <TableCell>{reminder.frequency || '-'}</TableCell>
                            <TableCell>{reminder.priority || '-'}</TableCell>
                            <TableCell>{reminder.status || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {results.getReminders.success ? 'Aucune donnée' : `❌ ${results.getReminders.error}`}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
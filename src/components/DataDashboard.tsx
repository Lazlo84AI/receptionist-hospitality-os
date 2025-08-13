import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useUserProfiles, useTaskComments, useActivityLogs, useRemindersData } from '@/hooks/useDataActions';

export default function DataDashboard() {
  const { profiles, loading: profilesLoading, refetch: refetchProfiles } = useUserProfiles(50);
  const { comments, loading: commentsLoading, refetch: refetchComments } = useTaskComments(50);
  const { logs, loading: logsLoading, refetch: refetchLogs } = useActivityLogs(50);
  const { reminders, loading: remindersLoading, refetch: refetchReminders } = useRemindersData(50);

  const [refreshing, setRefreshing] = useState(false);

  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchProfiles(),
        refetchComments(),
        refetchLogs(),
        refetchReminders()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const isLoading = profilesLoading || commentsLoading || logsLoading || remindersLoading;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Data Dashboard</h2>
        <Button onClick={handleRefreshAll} disabled={isLoading || refreshing}>
          {refreshing ? 'Refreshing...' : 'Refresh All'}
        </Button>
      </div>

      {/* Section Utilisateurs */}
      <Card>
        <CardHeader>
          <CardTitle>Utilisateurs ({profiles?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {profilesLoading ? (
            <div className="text-center py-4">Chargement des utilisateurs...</div>
          ) : profiles?.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Is Active</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile: any) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">{profile.email}</TableCell>
                    <TableCell>{profile.full_name || '-'}</TableCell>
                    <TableCell>{profile.role || '-'}</TableCell>
                    <TableCell>{profile.is_active ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{new Date(profile.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-4 text-muted-foreground">Aucun utilisateur trouvé</div>
          )}
        </CardContent>
      </Card>

      {/* Section Commentaires */}
      <Card>
        <CardHeader>
          <CardTitle>Commentaires ({comments?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {commentsLoading ? (
            <div className="text-center py-4">Chargement des commentaires...</div>
          ) : comments?.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task ID</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Mentioned Users</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comments.map((comment: any) => (
                  <TableRow key={comment.id}>
                    <TableCell className="font-medium">{comment.task_id}</TableCell>
                    <TableCell>{comment.user_id}</TableCell>
                    <TableCell className="max-w-xs truncate">{comment.content || '-'}</TableCell>
                    <TableCell>
                      {comment.mentioned_users && Array.isArray(comment.mentioned_users) 
                        ? comment.mentioned_users.join(', ') 
                        : '-'}
                    </TableCell>
                    <TableCell>{new Date(comment.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-4 text-muted-foreground">Aucun commentaire trouvé</div>
          )}
        </CardContent>
      </Card>

      {/* Section Journaux d'activité */}
      <Card>
        <CardHeader>
          <CardTitle>Journaux d'activité ({logs?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="text-center py-4">Chargement des journaux...</div>
          ) : logs?.length > 0 ? (
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
                {logs.map((log: any) => (
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
            <div className="text-center py-4 text-muted-foreground">Aucun journal trouvé</div>
          )}
        </CardContent>
      </Card>

      {/* Section Rappels */}
      <Card>
        <CardHeader>
          <CardTitle>Rappels ({reminders?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {remindersLoading ? (
            <div className="text-center py-4">Chargement des rappels...</div>
          ) : reminders?.length > 0 ? (
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
                {reminders.map((reminder: any) => (
                  <TableRow key={reminder.id}>
                    <TableCell className="font-medium">{reminder.title || '-'}</TableCell>
                    <TableCell>{reminder.task_type || '-'}</TableCell>
                    <TableCell>
                      {reminder.remind_at ? new Date(reminder.remind_at).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>{reminder.frequency || '-'}</TableCell>
                    <TableCell>{reminder.priority || '-'}</TableCell>
                    <TableCell>{reminder.status || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-4 text-muted-foreground">Aucun rappel trouvé</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Types pour les données détaillées des tâches
export interface TaskComment {
  id: string;
  user_id: string;
  content: string;
  comment_type: 'comment' | 'system' | 'escalation';
  created_at: string;
  user_profile?: {
    first_name: string | null;
    last_name: string | null;
  };
}

export interface TaskReminder {
  id: string;
  title: string;
  message: string | null;
  reminder_time: string;
  frequency: 'once' | 'daily' | 'weekly' | 'monthly';
  is_active: boolean;
  created_by: string;
  created_at: string;
  creator_profile?: {
    first_name: string | null;
    last_name: string | null;
  };
}

export interface TaskActivity {
  id: string;
  user_id: string | null;
  action: string;
  description: string;
  created_at: string;
  user_profile?: {
    first_name: string | null;
    last_name: string | null;
  };
}

// Hook pour récupérer les commentaires d'une tâche
export const useTaskComments = (taskId: string | undefined, taskType: string | undefined) => {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = async () => {
    if (!taskId || !taskType) {
      setComments([]);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          user_id,
          content,
          comment_type,
          created_at,
          profiles!comments_user_id_fkey (
            first_name,
            last_name
          )
        `)
        .eq('task_id', taskId)
        .eq('task_type', taskType)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedComments: TaskComment[] = (data || []).map(comment => ({
        id: comment.id,
        user_id: comment.user_id,
        content: comment.content,
        comment_type: comment.comment_type as 'comment' | 'system' | 'escalation',
        created_at: comment.created_at,
        user_profile: comment.profiles as any
      }));

      setComments(transformedComments);
      setError(null);
    } catch (err) {
      console.error('Error fetching task comments:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [taskId, taskType]);

  return { comments, loading, error, refetch: fetchComments };
};

// Hook pour récupérer les reminders d'une tâche
export const useTaskReminders = (taskId: string | undefined, taskType: string | undefined) => {
  const [reminders, setReminders] = useState<TaskReminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReminders = async () => {
    if (!taskId || !taskType) {
      setReminders([]);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reminders')
        .select(`
          id,
          title,
          message,
          reminder_time,
          frequency,
          is_active,
          created_by,
          created_at,
          profiles!reminders_created_by_fkey (
            first_name,
            last_name
          )
        `)
        .eq('task_id', taskId)
        .eq('task_type', taskType)
        .eq('is_active', true)
        .order('reminder_time', { ascending: true });

      if (error) throw error;

      const transformedReminders: TaskReminder[] = (data || []).map(reminder => ({
        id: reminder.id,
        title: reminder.title,
        message: reminder.message,
        reminder_time: reminder.reminder_time,
        frequency: reminder.frequency as 'once' | 'daily' | 'weekly' | 'monthly',
        is_active: reminder.is_active,
        created_by: reminder.created_by,
        created_at: reminder.created_at,
        creator_profile: reminder.profiles as any
      }));

      setReminders(transformedReminders);
      setError(null);
    } catch (err) {
      console.error('Error fetching task reminders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch reminders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, [taskId, taskType]);

  return { reminders, loading, error, refetch: fetchReminders };
};

// Hook pour récupérer l'activité log d'une tâche
export const useTaskActivity = (taskId: string | undefined, taskType: string | undefined) => {
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivity = async () => {
    if (!taskId || !taskType) {
      setActivities([]);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('activity_log')
        .select(`
          id,
          user_id,
          action,
          description,
          created_at,
          profiles!activity_log_user_id_fkey (
            first_name,
            last_name
          )
        `)
        .eq('task_id', taskId)
        .eq('task_type', taskType)
        .order('created_at', { ascending: false })
        .limit(10); // Limiter aux 10 activités les plus récentes

      if (error) throw error;

      const transformedActivities: TaskActivity[] = (data || []).map(activity => ({
        id: activity.id,
        user_id: activity.user_id,
        action: activity.action,
        description: activity.description,
        created_at: activity.created_at,
        user_profile: activity.profiles as any
      }));

      setActivities(transformedActivities);
      setError(null);
    } catch (err) {
      console.error('Error fetching task activity:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch activity');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, [taskId, taskType]);

  return { activities, loading, error, refetch: fetchActivity };
};

// Hook combiné pour récupérer toutes les données détaillées d'une tâche
export const useTaskDetails = (taskId: string | undefined, taskType: string | undefined) => {
  const comments = useTaskComments(taskId, taskType);
  const reminders = useTaskReminders(taskId, taskType);
  const activities = useTaskActivity(taskId, taskType);

  const loading = comments.loading || reminders.loading || activities.loading;
  const error = comments.error || reminders.error || activities.error;

  const refetch = () => {
    comments.refetch();
    reminders.refetch();
    activities.refetch();
  };

  return {
    comments: comments.comments,
    reminders: reminders.reminders,
    activities: activities.activities,
    loading,
    error,
    refetch
  };
};

// Fonction utilitaire pour formater le nom d'un utilisateur
export const formatUserName = (profile: { first_name: string | null; last_name: string | null } | undefined): string => {
  if (!profile) return 'Utilisateur inconnu';
  const firstName = profile.first_name || '';
  const lastName = profile.last_name || '';
  return `${firstName} ${lastName}`.trim() || 'Utilisateur inconnu';
};

// Fonction utilitaire pour formater les dates relatives
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'il y a moins d\'1h';
  if (diffHours < 24) return `il y a ${diffHours}h`;
  if (diffDays < 7) return `il y a ${diffDays}j`;
  
  return date.toLocaleDateString('fr-FR');
};

// Fonction utilitaire pour les couleurs d'activité selon le type d'action
export const getActivityColor = (action: string): string => {
  switch (action) {
    case 'created': return 'bg-gray-500';
    case 'updated': return 'bg-blue-500';
    case 'assigned': return 'bg-blue-500';
    case 'commented': return 'bg-blue-500';
    case 'completed': return 'bg-green-500';
    case 'escalated': return 'bg-red-500';
    case 'checklist_added': return 'bg-gray-500';
    case 'checklist_completed': return 'bg-green-500';
    case 'reminder_added': return 'bg-purple-500';
    case 'attachment_added': return 'bg-orange-500';
    default: return 'bg-gray-400';
  }
};
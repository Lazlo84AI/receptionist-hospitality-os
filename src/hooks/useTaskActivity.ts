import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ActivityLog {
  id: string;
  user_id: string;
  task_id: string;
  task_type: string;
  action: string;
  description: string;
  metadata: any;
  created_at: string;
  // Joined data from profiles
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    full_name: string | null;
  };
}

interface FormattedActivity {
  id: string;
  user: string;
  initials: string;
  action: string;
  description: string;
  timestamp: string;
  timeAgo: string;
  color: string;
}

export const useTaskActivity = (taskId: string | undefined, limit = 10) => {
  const [activities, setActivities] = useState<FormattedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getActionColor = (action: string): string => {
    switch (action) {
      case 'created': return 'bg-green-500';
      case 'commented': return 'bg-blue-500';
      case 'escalated': return 'bg-red-500';
      case 'reminder_added': return 'bg-purple-500';
      case 'checklist_added': return 'bg-green-500';
      case 'attachment_added': return 'bg-orange-500';
      case 'member_assigned': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'status_changed': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const created = new Date(timestamp);
    const diffInMs = now.getTime() - created.getTime();
    
    const minutes = Math.floor(diffInMs / (1000 * 60));
    const hours = Math.floor(diffInMs / (1000 * 60 * 60));
    const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) {
      return minutes <= 1 ? '1 min ago' : `${minutes} min ago`;
    } else if (hours < 24) {
      return hours === 1 ? '1h ago' : `${hours}h ago`;
    } else {
      return days === 1 ? '1d ago' : `${days}d ago`;
    }
  };

  const getUserInitials = (profile: any): string => {
    if (profile?.full_name) {
      return profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
    }
    if (profile?.first_name || profile?.last_name) {
      return `${profile?.first_name?.[0] || ''}${profile?.last_name?.[0] || ''}`.toUpperCase();
    }
    return 'UN';
  };

  const getUserName = (profile: any): string => {
    if (profile?.full_name) return profile.full_name;
    if (profile?.first_name || profile?.last_name) {
      return `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim();
    }
    return 'Unknown User';
  };

  const fetchActivities = async () => {
    if (!taskId) {
      setActivities([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('activity_log')
        .select(`
          id,
          user_id,
          task_id,
          task_type,
          action,
          description,
          metadata,
          created_at,
          profiles:user_id (
            first_name,
            last_name,
            full_name
          )
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const formattedActivities: FormattedActivity[] = (data || []).map((activity: ActivityLog) => ({
        id: activity.id,
        user: getUserName(activity.profiles),
        initials: getUserInitials(activity.profiles),
        action: activity.action,
        description: activity.description,
        timestamp: activity.created_at,
        timeAgo: getTimeAgo(activity.created_at),
        color: getActionColor(activity.action)
      }));

      setActivities(formattedActivities);
      setError(null);
    } catch (err) {
      console.error('Error fetching task activities:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch activities');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [taskId, limit]);

  // Set up real-time subscription for activity updates
  useEffect(() => {
    if (!taskId) return;

    const subscription = supabase
      .channel(`activity-logs-${taskId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'activity_log',
        filter: `task_id=eq.${taskId}`
      }, fetchActivities)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [taskId]);

  return { 
    activities, 
    loading, 
    error, 
    refetch: fetchActivities 
  };
};

import { useState, useEffect } from 'react';
import getUserProfiles from '@/lib/actions/getUserProfiles';
import getTaskComments from '@/lib/actions/getTaskComments';
import getActivityLogs from '@/lib/actions/getActivityLogs';
import getReminders from '@/lib/actions/getReminders';

// Hook for fetching user profiles using action
export const useUserProfiles = (limit = 50) => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const data = await getUserProfiles({ limit });
      setProfiles(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching user profiles:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [limit]);

  return { profiles, loading, error, refetch: fetchProfiles };
};

// Hook for fetching task comments using action
export const useTaskComments = (limit = 50) => {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const data = await getTaskComments({ limit });
      setComments(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching task comments:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch task comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [limit]);

  return { comments, loading, error, refetch: fetchComments };
};

// Hook for fetching activity logs using action
export const useActivityLogs = (limit = 50) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await getActivityLogs({ limit });
      setLogs(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching activity logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [limit]);

  return { logs, loading, error, refetch: fetchLogs };
};

// Hook for fetching reminders using action
export const useRemindersData = (limit = 50) => {
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const data = await getReminders({ limit });
      setReminders(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching reminders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch reminders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, [limit]);

  return { reminders, loading, error, refetch: fetchReminders };
};
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  TaskItem, 
  Incident, 
  ClientRequest, 
  FollowUp, 
  InternalTask,
  Profile,
  Location,
  Shift
} from '@/types/database';

// Hook for fetching all tasks
// Helper function to map database priorities to UI priorities
const mapPriority = (dbPriority: string): 'normal' | 'urgent' => {
  return dbPriority === 'urgent' || dbPriority === 'high' ? 'urgent' : 'normal';
};

export const useTasks = () => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setTasks([]);
        setLoading(false);
        return;
      }
      
      // Read directly from internal_tasks - simplified approach
      const { data: internalTasksResult, error: internalTasksError } = await supabase
        .from('internal_tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (internalTasksError) {
        throw internalTasksError;
      }

      // Transform internal tasks to TaskItem format
      const allTasks: TaskItem[] = (internalTasksResult || []).map((task: any) => ({
        id: task.id,
        title: task.title,
        type: task.task_type as const,
        priority: mapPriority(task.priority),
        status: task.status,
        description: task.description || undefined,
        assignedTo: task.assigned_to || undefined,
        location: task.location || undefined,
        guestName: undefined, // Not available in unified table
        roomNumber: undefined, // Not available in unified table
        recipient: undefined, // Not available in unified table
        dueDate: task.due_date || undefined,
        created_at: new Date(task.created_at),
        updated_at: new Date(task.updated_at)
      })).sort((a, b) => {
        // Sort by status first, then by updated_at for position within column
        if (a.status !== b.status) {
          const statusOrder = { 'pending': 0, 'in_progress': 1, 'completed': 2 };
          return (statusOrder[a.status as keyof typeof statusOrder] || 999) - (statusOrder[b.status as keyof typeof statusOrder] || 999);
        }
        return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
      });

      setTasks(allTasks);
      setError(null);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();

    // Set up real-time subscription to internal_tasks only
    const subscription = supabase
      .channel('internal-tasks-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'internal_tasks' }, fetchTasks)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return { tasks, loading, error, refetch: fetchTasks };
};

// Hook for fetching follow-ups specifically
export const useFollowUps = () => {
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFollowUps = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('follow_ups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFollowUps(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching follow-ups:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch follow-ups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();

    // Set up real-time subscription
    const subscription = supabase
      .channel('follow-ups-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'follow_ups' }, fetchFollowUps)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return { followUps, loading, error, refetch: fetchFollowUps };
};

// Hook for fetching profiles - Now using getUserProfiles action
export const useProfiles = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setLoading(true);
        // Import and use the action
        const { default: getUserProfiles } = await import('@/lib/actions/getUserProfiles');
        const data = await getUserProfiles({ limit: 100 });
        setProfiles(data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching profiles:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch profiles');
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  return { profiles, loading, error };
};

// Hook for fetching locations
export const useLocations = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      // Transform data to match our Location type
      const transformedData = (data || []).map(location => ({
        ...location,
        type: location.type as 'room' | 'common_area' | 'staff_area' | 'corridor' | 'office',
        amenities: Array.isArray(location.amenities) ? location.amenities as string[] : [],
        floor: location.floor,
        building: location.building || null,
        capacity: location.capacity || null
      }));
      setLocations(transformedData);
      setError(null);
    } catch (err) {
      console.error('Error fetching locations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch locations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  return { locations, loading, error, refetch: fetchLocations };
};

// Hook for fetching shifts
export const useShifts = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShifts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('shifts')
          .select('*')
          .order('start_time', { ascending: false })
          .limit(10);

        if (error) throw error;
        setShifts(data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching shifts:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch shifts');
      } finally {
        setLoading(false);
      }
    };

    fetchShifts();
  }, []);

  return { shifts, loading, error };
};
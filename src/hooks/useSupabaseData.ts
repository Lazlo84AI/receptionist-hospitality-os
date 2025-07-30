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
      
      // Fetch all task types in parallel
      const [incidentsResult, clientRequestsResult, followUpsResult, internalTasksResult] = await Promise.all([
        supabase.from('incidents').select('*'),
        supabase.from('client_requests').select('*'),
        supabase.from('follow_ups').select('*'),
        supabase.from('internal_tasks').select('*')
      ]);

      // Check for errors
      if (incidentsResult.error) throw incidentsResult.error;
      if (clientRequestsResult.error) throw clientRequestsResult.error;
      if (followUpsResult.error) throw followUpsResult.error;
      if (internalTasksResult.error) throw internalTasksResult.error;

      // Transform incidents
      const incidents: TaskItem[] = (incidentsResult.data || []).map((incident: Incident) => ({
        id: incident.id,
        title: incident.title,
        type: 'incident' as const,
        priority: incident.priority,
        status: incident.status,
        description: incident.description || undefined,
        assignedTo: incident.assigned_to || undefined,
        location: incident.location || undefined,
        created_at: incident.created_at,
        updated_at: incident.updated_at
      }));

      // Transform client requests
      const clientRequests: TaskItem[] = (clientRequestsResult.data || []).map((request: ClientRequest) => ({
        id: request.id,
        title: `${request.request_type} - ${request.guest_name}`,
        type: 'client_request' as const,
        priority: request.priority,
        status: request.preparation_status,
        description: request.request_details || undefined,
        assignedTo: request.assigned_to || undefined,
        guestName: request.guest_name,
        roomNumber: request.room_number,
        dueDate: request.arrival_date || undefined,
        created_at: request.created_at,
        updated_at: request.updated_at
      }));

      // Transform follow-ups
      const followUps: TaskItem[] = (followUpsResult.data || []).map((followUp: FollowUp) => ({
        id: followUp.id,
        title: followUp.title,
        type: 'follow_up' as const,
        priority: followUp.priority,
        status: followUp.status,
        description: followUp.notes || undefined,
        assignedTo: followUp.assigned_to || undefined,
        recipient: followUp.recipient,
        dueDate: followUp.due_date || undefined,
        created_at: followUp.created_at,
        updated_at: followUp.updated_at
      }));

      // Transform internal tasks
      const internalTasks: TaskItem[] = (internalTasksResult.data || []).map((task: InternalTask) => ({
        id: task.id,
        title: task.title,
        type: 'internal_task' as const,
        priority: task.priority,
        status: task.status,
        description: task.description || undefined,
        assignedTo: task.assigned_to || undefined,
        location: task.location || undefined,
        dueDate: task.due_date || undefined,
        created_at: task.created_at,
        updated_at: task.updated_at
      }));

      // Combine all tasks
      const allTasks = [...incidents, ...clientRequests, ...followUps, ...internalTasks];
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

    // Set up real-time subscriptions
    const incidentsSubscription = supabase
      .channel('incidents-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, fetchTasks)
      .subscribe();

    const clientRequestsSubscription = supabase
      .channel('client-requests-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'client_requests' }, fetchTasks)
      .subscribe();

    const followUpsSubscription = supabase
      .channel('follow-ups-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'follow_ups' }, fetchTasks)
      .subscribe();

    const internalTasksSubscription = supabase
      .channel('internal-tasks-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'internal_tasks' }, fetchTasks)
      .subscribe();

    return () => {
      supabase.removeChannel(incidentsSubscription);
      supabase.removeChannel(clientRequestsSubscription);
      supabase.removeChannel(followUpsSubscription);
      supabase.removeChannel(internalTasksSubscription);
    };
  }, []);

  const updateTaskStatus = async (taskId: string, taskType: string, newStatus: string) => {
    try {
      const statusValue = newStatus as 'pending' | 'in_progress' | 'completed' | 'cancelled';
      let result;
      
      switch (taskType) {
        case 'incident':
          result = await supabase
            .from('incidents')
            .update({ status: statusValue, updated_at: new Date().toISOString() })
            .eq('id', taskId);
          break;
        case 'client_request':
          result = await supabase
            .from('client_requests')
            .update({ preparation_status: statusValue, updated_at: new Date().toISOString() })
            .eq('id', taskId);
          break;
        case 'follow_up':
          result = await supabase
            .from('follow_ups')
            .update({ status: statusValue, updated_at: new Date().toISOString() })
            .eq('id', taskId);
          break;
        case 'internal_task':
          result = await supabase
            .from('internal_tasks')
            .update({ status: statusValue, updated_at: new Date().toISOString() })
            .eq('id', taskId);
          break;
        default:
          throw new Error(`Unknown task type: ${taskType}`);
      }

      if (result.error) throw result.error;
      
      return true;
    } catch (err) {
      console.error('Error updating task status:', err);
      throw err;
    }
  };

  return { tasks, loading, error, refetch: fetchTasks, updateTaskStatus };
};

// Hook for fetching follow-ups specifically
export const useFollowUps = () => {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
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

// Hook for fetching profiles
export const useProfiles = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('is_active', true)
          .order('first_name', { ascending: true });

        if (error) throw error;
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

  useEffect(() => {
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
          type: location.type as 'room' | 'common_area' | 'corridor' | 'office',
          amenities: Array.isArray(location.amenities) ? location.amenities as string[] : [],
          floor: location.floor || null,
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

    fetchLocations();
  }, []);

  return { locations, loading, error };
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
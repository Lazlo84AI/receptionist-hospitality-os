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
      
      // Try to use unified_tasks view first, fallback to individual tables
      try {
        const { data, error } = await supabase
          .from('unified_tasks')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('unified_tasks view not available, falling back to individual tables:', error);
          throw error;
        }

        // Transform unified tasks to TaskItem format with proper date handling
        const unifiedTasks: TaskItem[] = (data || []).map((task: any) => ({
          id: task.id,
          title: task.title,
          type: task.task_category, // Use task_category from the view
          priority: mapPriority(task.priority),
          status: task.status,
          description: task.description || undefined,
          assignedTo: task.assigned_to || undefined,
          location: task.location || undefined,
          guestName: task.guest_name || undefined,
          roomNumber: task.room_number || undefined,
          recipient: task.recipient || undefined,
          dueDate: task.due_date || task.arrival_date || undefined,
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

        setTasks(unifiedTasks);
        setError(null);
        return;
      } catch (viewError) {
        console.log('Falling back to individual table queries...');
      }
      
      // Fallback: Fetch all task types in parallel from individual tables
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
      const incidents: TaskItem[] = (incidentsResult.data || []).map((incident: any) => ({
        id: incident.id,
        title: incident.title,
        type: 'incident' as const,
        priority: mapPriority(incident.priority),
        status: incident.status,
        description: incident.description || undefined,
        assignedTo: incident.assigned_to || undefined,
        location: incident.location || undefined,
        created_at: new Date(incident.created_at),
        updated_at: new Date(incident.updated_at)
      }));

      // Transform client requests
      const clientRequests: TaskItem[] = (clientRequestsResult.data || []).map((request: any) => ({
        id: request.id,
        title: `${request.request_type} - ${request.guest_name}`,
        type: 'client_request' as const,
        priority: mapPriority(request.priority),
        status: request.preparation_status,
        description: request.request_details || undefined,
        assignedTo: request.assigned_to || undefined,
        guestName: request.guest_name,
        roomNumber: request.room_number,
        dueDate: request.arrival_date || undefined,
        created_at: new Date(request.created_at),
        updated_at: new Date(request.updated_at)
      }));

      // Transform follow-ups
      const followUps: TaskItem[] = (followUpsResult.data || []).map((followUp: any) => ({
        id: followUp.id,
        title: followUp.title,
        type: 'follow_up' as const,
        priority: mapPriority(followUp.priority),
        status: followUp.status,
        description: followUp.notes || undefined,
        assignedTo: followUp.assigned_to || undefined,
        recipient: followUp.recipient,
        dueDate: followUp.due_date || undefined,
        created_at: new Date(followUp.created_at),
        updated_at: new Date(followUp.updated_at)
      }));

      // Transform internal tasks
      const internalTasks: TaskItem[] = (internalTasksResult.data || []).map((task: any) => ({
        id: task.id,
        title: task.title,
        type: 'internal_task' as const,
        priority: mapPriority(task.priority),
        status: task.status,
        description: task.description || undefined,
        assignedTo: task.assigned_to || undefined,
        location: task.location || undefined,
        dueDate: task.due_date || undefined,
        created_at: new Date(task.created_at),
        updated_at: new Date(task.updated_at)
      }));

      // Combine all tasks and sort them properly
      const allTasks = [...incidents, ...clientRequests, ...followUps, ...internalTasks]
        .sort((a, b) => {
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

    // Set up real-time subscriptions to individual tables (more reliable)
    const subscription = supabase
      .channel('all-tasks-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, fetchTasks)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'client_requests' }, fetchTasks)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'follow_ups' }, fetchTasks)
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
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
      
      // Read tasks, staff_directory AND profiles separately, then join on client side
      const [tasksResponse, staffResponse, profilesResponse] = await Promise.all([
        supabase
          .from('task')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('staff_directory')
          .select('id, first_name, last_name, full_name, email'),
        supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
      ]);

      if (tasksResponse.error) {
        throw tasksResponse.error;
      }
      
      // Create lookup maps for both staff and profiles
      const staffMap = new Map();
      (staffResponse.data || []).forEach(staff => {
        staffMap.set(staff.id, staff);
      });
      
      const profilesMap = new Map();
      (profilesResponse.data || []).forEach(profile => {
        profilesMap.set(profile.id, profile);
      });

      console.log('📊 Staff directory chargé:', staffResponse.data?.length, 'membres');
      console.log('👤 Profiles chargés:', profilesResponse.data?.length, 'utilisateurs');

      // Helper functions to get display name from different table structures
      const getDisplayNameFromStaff = (staffData: any) => {
        if (staffData.full_name) return staffData.full_name;
        if (staffData.first_name || staffData.last_name) {
          return `${staffData.first_name || ''} ${staffData.last_name || ''}`.trim();
        }
        if (staffData.email) return staffData.email;
        return null;
      };

      const getDisplayNameFromProfiles = (profileData: any) => {
        // Table profiles n'a pas de full_name, seulement first_name + last_name
        if (profileData.first_name || profileData.last_name) {
          return `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim();
        }
        if (profileData.email) return profileData.email;
        return null;
      };

      // Transform internal tasks to TaskItem format with dual name lookup
      const allTasks: TaskItem[] = (tasksResponse.data || []).map((task: any) => {
        // 1. CRÉATEUR (created_by) - chercher dans profiles
        let creatorDisplay = 'Inconnu';
        if (task.created_by) {
          const creatorProfile = profilesMap.get(task.created_by);
          if (creatorProfile) {
            creatorDisplay = getDisplayNameFromProfiles(creatorProfile) || task.created_by;
            console.log('✅ Créateur mappé:', task.created_by, '→', creatorDisplay);
          } else {
            console.warn('❌ Créateur non trouvé dans profiles:', task.created_by);
            creatorDisplay = task.created_by;
          }
        }

        // 2. ASSIGNÉ (assigned_to) - chercher dans staff_directory
        let assignedDisplay = 'Non assigné';
        let assignedCount = 0;
        
        if (task.assigned_to && Array.isArray(task.assigned_to) && task.assigned_to.length > 0) {
          assignedCount = task.assigned_to.length;
          const firstAssignedId = task.assigned_to[0];
          const assignedStaff = staffMap.get(firstAssignedId);
          
          if (assignedStaff) {
            assignedDisplay = getDisplayNameFromStaff(assignedStaff) || firstAssignedId;
            console.log('✅ Assigné mappé:', firstAssignedId, '→', assignedDisplay);
          } else {
            console.warn('❌ Assigné non trouvé dans staff_directory:', firstAssignedId);
            assignedDisplay = firstAssignedId;
          }
          
          // Ajouter indication s'il y a plusieurs assignés
          if (assignedCount > 1) {
            assignedDisplay += ` +${assignedCount - 1}`;
          }
        }

        // 3. AFFICHAGE COMBINÉ: "Créateur → Assigné"
        const combinedDisplay = `${creatorDisplay} → ${assignedDisplay}`;
        console.log('🎯 Affichage final:', combinedDisplay);

        return {
          id: task.id,
          title: task.title,
          type: task.category as const, // Using category field to match dashboard filters
          priority: mapPriority(task.priority),
          status: task.status,
          description: task.description || undefined,
          assignedTo: combinedDisplay,
          location: task.location || undefined,
          guestName: undefined, // Not available in unified table
          roomNumber: undefined, // Not available in unified table
          recipient: undefined, // Not available in unified table
          dueDate: task.due_date || undefined,
          checklistItems: task.checklist_items || undefined, // AJOUT: Mapper les checklists
          created_at: new Date(task.created_at),
          updated_at: new Date(task.updated_at)
        };
      }).sort((a, b) => {
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

    // Set up real-time subscription to unified task table
    const subscription = supabase
      .channel('task-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task' }, fetchTasks)
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

// Hook for fetching profiles - Now using staff_directory
export const useProfiles = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('staff_directory')
          .select('*')
          .order('first_name', { ascending: true });

        if (error) throw error;
        setProfiles(data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching staff directory:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch staff directory');
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
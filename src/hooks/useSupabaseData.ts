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
      
      // Create lookup maps by EMAIL for cross-table matching
      const staffMapByEmail = new Map();
      (staffResponse.data || []).forEach(staff => {
        if (staff.email) {
          staffMapByEmail.set(staff.email, staff);
        }
        staffMap.set(staff.id, staff); // Keep UUID map for direct matches
      });
      
      const profilesMapByEmail = new Map();
      (profilesResponse.data || []).forEach(profile => {
        if (profile.email) {
          profilesMapByEmail.set(profile.email, profile);
        }
        profilesMap.set(profile.id, profile); // Keep UUID map for direct matches
      });

      // Helper function to find user across tables (UUID first, then email fallback)
      const findUserAcrossTables = (userId: string) => {
        // 1. Try direct UUID match in staff_directory
        let staffUser = staffMap.get(userId);
        if (staffUser) {
          return { user: staffUser, source: 'staff_uuid', name: getDisplayNameFromStaff(staffUser) };
        }
        
        // 2. Try direct UUID match in profiles  
        let profileUser = profilesMap.get(userId);
        if (profileUser && profileUser.email) {
          // 3. If found in profiles, try to find corresponding staff by email
          const correspondingStaff = staffMapByEmail.get(profileUser.email);
          if (correspondingStaff) {
            return { user: correspondingStaff, source: 'staff_email', name: getDisplayNameFromStaff(correspondingStaff) };
          }
          // Fallback to profile data
          return { user: profileUser, source: 'profile', name: getDisplayNameFromProfiles(profileUser) };
        }
        
        return null;
      };

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
        // Table profiles : first_name + last_name
        if (profileData.first_name || profileData.last_name) {
          return `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim();
        }
        if (profileData.email) return profileData.email;
        return null;
      };

      // Transform internal tasks to TaskItem format with dual name lookup
      const allTasks: TaskItem[] = (tasksResponse.data || []).map((task: any) => {
        // 1. CRÉATEUR (created_by) - recherche cross-table avec fallback email
        let creatorDisplay = 'Inconnu';
        if (task.created_by) {
          const foundCreator = findUserAcrossTables(task.created_by);
          if (foundCreator) {
            creatorDisplay = foundCreator.name || task.created_by;
            console.log('✅ Créateur mappé (' + foundCreator.source + '):', task.created_by, '→', creatorDisplay);
          } else {
            console.warn('❌ Créateur non trouvé:', task.created_by);
            creatorDisplay = task.created_by;
          }
        }

        // 2. ASSIGNÉ (assigned_to) - afficher TOUS les noms
        let assignedDisplay = 'Non assigné';
        
        if (task.assigned_to && Array.isArray(task.assigned_to) && task.assigned_to.length > 0) {
          const assignedNames = [];
          
          // Mapper TOUS les UUIDs assignés vers les noms avec recherche cross-table
          for (const assignedId of task.assigned_to) {
            const foundAssigned = findUserAcrossTables(assignedId);
            if (foundAssigned) {
              assignedNames.push(foundAssigned.name);
              console.log('✅ Assigné mappé (' + foundAssigned.source + '):', assignedId, '→', foundAssigned.name);
            } else {
              console.warn('❌ Assigné non trouvé:', assignedId);
              assignedNames.push(assignedId); // UUID en dernier recours
            }
          }
          
          // Joindre tous les noms avec des virgules
          assignedDisplay = assignedNames.join(', ');
        }

        // 3. AFFICHAGE COMBINÉ: "Créateur → Tous les assignés"
        const combinedDisplay = `${creatorDisplay} → ${assignedDisplay}`;
        console.log('🎯 Affichage final:', task.id, '→', combinedDisplay);

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
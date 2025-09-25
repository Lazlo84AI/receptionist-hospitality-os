import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TaskItem } from '@/types/database';
import { formatTimeElapsed } from '@/utils/timeUtils';

// Helper function to map database priorities to UI priorities
const mapPriority = (dbPriority: string): 'normal' | 'urgent' => {
  return dbPriority === 'urgent' || dbPriority === 'high' ? 'urgent' : 'normal';
};

export const useTrainingTasks = () => {
  const [trainingTasks, setTrainingTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrainingTasks = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setTrainingTasks([]);
        setLoading(false);
        return;
      }
      
      // Fetch tasks with category = 'training'
      const [tasksResponse, staffResponse, profilesResponse] = await Promise.all([
        supabase
          .from('task')
          .select('*')
          .eq('category', 'training')  // Only training tasks
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

      console.log('📚 Training tasks loaded:', tasksResponse.data?.length, 'tasks');
      console.log('👥 Staff directory:', staffResponse.data?.length, 'members');
      console.log('👤 Profiles:', profilesResponse.data?.length, 'users');

      // Helper functions to get display name
      const getDisplayNameFromStaff = (staffData: any) => {
        if (staffData.full_name) return staffData.full_name;
        if (staffData.first_name || staffData.last_name) {
          return `${staffData.first_name || ''} ${staffData.last_name || ''}`.trim();
        }
        if (staffData.email) return staffData.email;
        return null;
      };

      const getDisplayNameFromProfiles = (profileData: any) => {
        if (profileData.first_name || profileData.last_name) {
          return `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim();
        }
        if (profileData.email) return profileData.email;
        return null;
      };

      // Transform training tasks to TaskItem format
      const transformedTasks: TaskItem[] = (tasksResponse.data || []).map((task: any) => {
        // Creator mapping
        let creatorDisplay = 'Unknown';
        if (task.created_by) {
          const creatorStaff = staffMap.get(task.created_by);
          if (creatorStaff) {
            creatorDisplay = getDisplayNameFromStaff(creatorStaff) || task.created_by;
          } else {
            const creatorProfile = profilesMap.get(task.created_by);
            if (creatorProfile) {
              creatorDisplay = getDisplayNameFromProfiles(creatorProfile) || task.created_by;
            } else {
              creatorDisplay = task.created_by;
            }
          }
        }

        // Assigned users mapping
        let assignedDisplay = 'Self-paced';
        
        if (task.assigned_to && Array.isArray(task.assigned_to) && task.assigned_to.length > 0) {
          const assignedNames = [];
          
          for (const assignedId of task.assigned_to) {
            const assignedStaff = staffMap.get(assignedId);
            
            if (assignedStaff) {
              const staffName = getDisplayNameFromStaff(assignedStaff) || assignedId;
              assignedNames.push(staffName);
            } else {
              const assignedProfile = profilesMap.get(assignedId);
              if (assignedProfile) {
                const profileName = getDisplayNameFromProfiles(assignedProfile) || assignedId;
                assignedNames.push(profileName);
              } else {
                assignedNames.push(assignedId);
              }
            }
          }
          
          assignedDisplay = assignedNames.join(', ');
        }

        // Combined display: "Creator → Assigned"
        const combinedDisplay = `${creatorDisplay} → ${assignedDisplay}`;

        return {
          id: task.id,
          title: task.title,
          type: 'training' as const,
          priority: mapPriority(task.priority),
          status: task.status,
          description: task.description || undefined,
          assignedTo: combinedDisplay,
          location: task.location || 'Online Training',
          guestName: undefined, // N/A for training tasks
          roomNumber: undefined, // N/A for training tasks
          recipient: undefined, // N/A for training tasks
          dueDate: task.due_date || undefined,
          checklistItems: task.checklist_items || undefined,
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

      setTrainingTasks(transformedTasks);
      setError(null);
      
      console.log('✅ Training tasks processed:', transformedTasks.length, 'tasks');
      
    } catch (err) {
      console.error('Error fetching training tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch training tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainingTasks();

    // Set up real-time subscription to unified task table
    const subscription = supabase
      .channel('training-task-channel')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'task',
        filter: 'category=eq.training' // Only listen to training tasks
      }, fetchTrainingTasks)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return { trainingTasks, loading, error, refetch: fetchTrainingTasks };
};
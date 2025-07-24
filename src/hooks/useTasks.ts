import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  task_type: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  location?: string;
  department?: string;
  created_by: string;
  completed_at?: string;
  due_date?: string;
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTasks() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setTasks(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchTasks();
  }, []);

  return { tasks, loading, error, refetch: () => setLoading(true) };
}

export function useTasksByType(taskType: string) {
  const { tasks, loading, error, refetch } = useTasks();
  
  const filteredTasks = tasks.filter(task => task.task_type === taskType);
  
  return { tasks: filteredTasks, loading, error, refetch };
}
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface User {
  id: string;
  full_name?: string;
  email: string;
  role?: string;
  department?: string;
  shift_type?: string;
  is_active?: boolean;
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('is_active', true)
          .order('full_name', { ascending: true });

        if (error) {
          throw error;
        }

        setUsers(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  return { users, loading, error, refetch: () => setLoading(true) };
}

export function useUsersByRole(role: string) {
  const { users, loading, error, refetch } = useUsers();
  
  const filteredUsers = users.filter(user => user.role === role);
  
  return { users: filteredUsers, loading, error, refetch };
}

export function getCurrentShiftReceptionist() {
  const [receptionist, setReceptionist] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCurrentReceptionist() {
      try {
        const now = new Date();
        const hour = now.getHours();
        
        let shiftType = 'morning';
        if (hour >= 14 && hour < 22) {
          shiftType = 'afternoon';
        } else if (hour >= 22 || hour < 6) {
          shiftType = 'night';
        }

        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('role', 'receptionist')
          .eq('shift_type', shiftType)
          .eq('is_active', true)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        setReceptionist(data || null);
      } catch (err) {
        console.error('Error fetching current receptionist:', err);
        setReceptionist(null);
      } finally {
        setLoading(false);
      }
    }

    fetchCurrentReceptionist();
  }, []);

  return { receptionist, loading };
}
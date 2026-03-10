import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * useStaffService
 * Lightweight hook — fetches the `service` field for the current authenticated user
 * from v_user_task_stats. Used to gate admin access (service === 'direction').
 */
export const useStaffService = () => {
  const [service, setService] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchService = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data, error } = await supabase
          .from('v_user_task_stats')
          .select('service')
          .eq('auth_user_id', user.id)
          .maybeSingle();

        if (!error && data) {
          setService(data.service);
        }
      } catch (err) {
        console.error('useStaffService error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, []);

  const isDirection = service === 'direction';

  return { service, isDirection, loading };
};

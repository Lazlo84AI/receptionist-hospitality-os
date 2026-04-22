import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * useStaffService
 * Lightweight hook — fetches the `service` and `hierarchy` fields for the current
 * authenticated user from v_user_task_stats.
 *
 * Used to gate admin access:
 *   - canAccessAdmin = service === 'direction' OR hierarchy === 'Manager'
 *   - This allows service-level managers (ex: Drichelle - Réception Manager)
 *     to access the admin area, not only the Direction service.
 */
export const useStaffService = () => {
  const [service, setService] = useState<string | null>(null);
  const [hierarchy, setHierarchy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchService = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data, error } = await supabase
          .from('v_user_task_stats')
          .select('service, hierarchy')
          .eq('auth_user_id', user.id)
          .maybeSingle();

        if (!error && data) {
          setService(data.service);
          setHierarchy((data as any).hierarchy ?? null);
        }
      } catch (err) {
        console.error('useStaffService error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, []);

  const isDirection      = service === 'direction';
  const isManager        = hierarchy === 'Manager';
  const isDirector       = hierarchy === 'Director';
  const canAccessAdmin   = isDirection || isManager;

  return { service, hierarchy, isDirection, isManager, isDirector, canAccessAdmin, loading };
};

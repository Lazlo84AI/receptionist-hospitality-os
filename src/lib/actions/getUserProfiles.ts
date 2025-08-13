import { supabase } from '@/integrations/supabase/client';

export default async function getUserProfiles({ limit = 50 } = {}) {
  const { data, error } = await (supabase as any)
    .from('user_profiles')
    .select('id,email,full_name,role,is_active,created_at,updated_at,permissions')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}
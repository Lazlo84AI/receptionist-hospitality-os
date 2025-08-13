import { supabase } from '@/integrations/supabase/client';

export default async function getUserProfiles({ limit = 50 } = {}) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id,email,first_name,last_name,role,is_active,created_at,updated_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}
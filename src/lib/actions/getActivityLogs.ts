import { supabase } from '@/integrations/supabase/client';

export default async function getActivityLogs({ limit = 50 } = {}) {
  const { data, error } = await (supabase as any)
    .from('activity_logs')
    .select('id,user_id,entity_type,entity_id,action,new_values,metadata,created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}
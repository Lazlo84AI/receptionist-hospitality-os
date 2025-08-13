import { supabase } from '@/integrations/supabase/client';

export default async function getActivityLogs({ limit = 50 } = {}) {
  const { data, error } = await supabase
    .from('activity_log')
    .select('id,user_id,task_type,task_id,action,description,metadata,created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}
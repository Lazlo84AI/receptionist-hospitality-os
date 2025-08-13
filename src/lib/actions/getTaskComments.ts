import { supabase } from '@/integrations/supabase/client';

export default async function getTaskComments({ limit = 50 } = {}) {
  const { data, error } = await supabase
    .from('comments')
    .select('id,task_id,user_id,content,created_at,updated_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}
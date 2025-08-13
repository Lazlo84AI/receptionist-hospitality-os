import { supabase } from '@/integrations/supabase/client';

export default async function getTaskComments({ limit = 50 } = {}) {
  const { data, error } = await (supabase as any)
    .from('task_comments')
    .select('id,task_id,user_id,content,mentioned_users,created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}
import { supabase } from '@/integrations/supabase/client';

export default async function getReminders({ limit = 50 } = {}) {
  const { data, error } = await supabase
    .from('reminders')
    .select('id,task_id,task_type,title,message,remind_at,frequency,priority,status')
    .order('remind_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}
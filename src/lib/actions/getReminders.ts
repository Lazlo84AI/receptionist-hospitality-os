import { supabase } from '@/integrations/supabase/client';

export default async function getReminders({ limit = 50 } = {}) {
  const { data, error } = await supabase
    .from('reminders')
    .select(`
      id,
      task_id,
      title,
      message,
      remind_at,
      reminder_time,
      frequency,
      priority,
      status,
      schedule_type,
      recurrence_interval,
      recurrence_unit,
      is_active,
      created_by,
      created_at,
      updated_at
    `)
    .eq('is_active', true)
    .order('remind_at', { ascending: true })
    .limit(limit);
    
  if (error) throw error;
  return data as any;
}
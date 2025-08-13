import { supabase } from '@/integrations/supabase/client';

export default async function updateReminder(params: {
  id: string;
  remindAt?: string;
  frequency?: string;
  priority?: number;
  status?: string;
  title?: string;
  message?: string;
  is_active?: boolean;
}) {
  const { id, remindAt, ...otherParams } = params;
  
  const updateData: any = { ...otherParams };
  
  // Si on reçoit remindAt, on met à jour les deux champs pour compatibilité temporaire
  if (remindAt) {
    updateData.remind_at = remindAt;
    updateData.reminder_time = remindAt;
  }

  const { data, error } = await supabase
    .from('reminders')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
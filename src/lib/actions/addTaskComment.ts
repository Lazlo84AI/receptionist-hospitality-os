import { supabase } from '@/integrations/supabase/client';

export default async function addTaskComment({ 
  taskId, 
  userId, 
  content 
}: { 
  taskId: string; 
  userId: string; 
  content: string; 
}) {
  // Insert into task_comments table (using any to bypass type constraints)
  const { data, error } = await (supabase as any)
    .from('task_comments')
    .insert({
      task_id: taskId,
      user_id: userId,
      content: content
    })
    .select('id, task_id, user_id, content, created_at')
    .single();

  if (error) {
    throw error;
  }

  // Fire-and-forget webhook call
  try {
    // Import webhook service dynamically to avoid blocking the main operation
    const { sendTaskUpdatedEvent } = await import('@/lib/webhookService');
    
    // Trigger webhook in fire-and-forget mode (don't await)
    sendTaskUpdatedEvent(
      taskId,
      'task', // task_type
      {
        comments: [{
          id: data.id,
          content: content,
          comment_type: 'user'
        }]
      },
      [], // profiles
      []  // locations
    ).catch(error => {
      // Silent fail for webhook - log but don't throw
      console.warn('Webhook notification failed for comment add:', error);
    });
  } catch (webhookError) {
    // Silent fail for webhook import/call - log but don't throw
    console.warn('Failed to send webhook for comment add:', webhookError);
  }

  return data;
}
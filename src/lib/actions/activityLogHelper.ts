import { supabase } from '@/integrations/supabase/client';

interface CreateActivityLogParams {
  taskId: string;
  taskType?: string;
  action: string;
  description: string;
  metadata?: any;
}

/**
 * Fonction helper pour créer une entrée dans activity_log
 * Gère automatiquement la récupération du user, du nom d'utilisateur et la détection du type de tâche
 */
export const createActivityLog = async ({
  taskId,
  taskType,
  action,
  description,
  metadata = {}
}: CreateActivityLogParams): Promise<boolean> => {
  try {
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('No user found for activity log creation');
      return false;
    }

    // Récupérer les informations du profil utilisateur
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("first_name, last_name, full_name")
      .eq("id", user.id)
      .single();

    const userName = userProfile?.full_name || 
                    `${userProfile?.first_name || ''} ${userProfile?.last_name || ''}`.trim() || 
                    'Unknown User';

    // Si le type de tâche n'est pas fourni, le détecter automatiquement
    let finalTaskType = taskType || 'unknown';
    if (finalTaskType === 'unknown') {
      // Chercher dans les différentes tables
      const { data: incident } = await supabase.from("incidents").select("id").eq("id", taskId).single();
      if (incident) {
        finalTaskType = 'incident';
      } else {
        const { data: clientRequest } = await supabase.from("client_requests").select("id").eq("id", taskId).single();
        if (clientRequest) {
          finalTaskType = 'client_request';
        } else {
          const { data: followUp } = await supabase.from("follow_ups").select("id").eq("id", taskId).single();
          if (followUp) {
            finalTaskType = 'follow_up';
          } else {
            const { data: internalTask } = await supabase.from("internal_tasks").select("id").eq("id", taskId).single();
            if (internalTask) {
              finalTaskType = 'internal_task';
            }
          }
        }
      }
    }

    // Créer l'entrée d'activité
    const { error } = await supabase
      .from("activity_log")
      .insert([{
        user_id: user.id,
        task_id: taskId,
        task_type: finalTaskType,
        action: action,
        description: description,
        metadata: {
          ...metadata,
          user_name: userName // Ajouter le nom d'utilisateur dans les métadonnées
        }
      }]);

    if (error) {
      console.error('Error creating activity log:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in createActivityLog helper:', error);
    return false;
  }
};

/**
 * Fonctions spécialisées pour chaque type d'action
 */

export const createCommentActivity = async (taskId: string, taskType?: string, commentPreview?: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  const { data: userProfile } = await supabase.from("profiles").select("first_name, last_name, full_name").eq("id", user?.id).single();
  const userName = userProfile?.full_name || `${userProfile?.first_name || ''} ${userProfile?.last_name || ''}`.trim() || 'Unknown User';
  
  return createActivityLog({
    taskId,
    taskType,
    action: 'commented',
    description: `${userName} left a comment`,
    metadata: { comment_preview: commentPreview }
  });
};

export const createReminderActivity = async (taskId: string, taskType?: string, reminderTitle?: string, reminderDate?: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  const { data: userProfile } = await supabase.from("profiles").select("first_name, last_name, full_name").eq("id", user?.id).single();
  const userName = userProfile?.full_name || `${userProfile?.first_name || ''} ${userProfile?.last_name || ''}`.trim() || 'Unknown User';
  
  return createActivityLog({
    taskId,
    taskType,
    action: 'reminder_added',
    description: `${userName} scheduled a reminder`,
    metadata: { reminder_title: reminderTitle, remind_at: reminderDate }
  });
};

export const createChecklistActivity = async (taskId: string, taskType?: string, checklistTitle?: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  const { data: userProfile } = await supabase.from("profiles").select("first_name, last_name, full_name").eq("id", user?.id).single();
  const userName = userProfile?.full_name || `${userProfile?.first_name || ''} ${userProfile?.last_name || ''}`.trim() || 'Unknown User';
  
  return createActivityLog({
    taskId,
    taskType,
    action: 'checklist_added',
    description: `${userName} added a checklist`,
    metadata: { checklist_title: checklistTitle }
  });
};

export const createMemberActivity = async (taskId: string, taskType?: string, memberName?: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  const { data: userProfile } = await supabase.from("profiles").select("first_name, last_name, full_name").eq("id", user?.id).single();
  const userName = userProfile?.full_name || `${userProfile?.first_name || ''} ${userProfile?.last_name || ''}`.trim() || 'Unknown User';
  
  return createActivityLog({
    taskId,
    taskType,
    action: 'member_assigned',
    description: `${userName} assigned ${memberName}`,
    metadata: { assigned_member_name: memberName }
  });
};

export const createEscalationActivity = async (taskId: string, taskType?: string, method?: string, escalatedToName?: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  const { data: userProfile } = await supabase.from("profiles").select("first_name, last_name, full_name").eq("id", user?.id).single();
  const userName = userProfile?.full_name || `${userProfile?.first_name || ''} ${userProfile?.last_name || ''}`.trim() || 'Unknown User';
  
  return createActivityLog({
    taskId,
    taskType,
    action: 'escalated',
    description: `${userName} escalated via ${method}`,
    metadata: { escalation_method: method, escalated_to_name: escalatedToName }
  });
};

export const createAttachmentActivity = async (taskId: string, taskType?: string, attachmentName?: string, attachmentType?: 'file' | 'link') => {
  const { data: { user } } = await supabase.auth.getUser();
  const { data: userProfile } = await supabase.from("profiles").select("first_name, last_name, full_name").eq("id", user?.id).single();
  const userName = userProfile?.full_name || `${userProfile?.first_name || ''} ${userProfile?.last_name || ''}`.trim() || 'Unknown User';
  
  return createActivityLog({
    taskId,
    taskType,
    action: 'attachment_added',
    description: `${userName} added ${attachmentType === 'link' ? 'a link' : 'an attachment'}`,
    metadata: { attachment_name: attachmentName, attachment_type: attachmentType }
  });
};

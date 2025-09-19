import { supabase } from "@/integrations/supabase/client";

type Payload = {
  task_id: string;
  content: string;
};

export async function addTaskComment({ task_id, content }: Payload) {
  const client = supabase as any;

  // exiger un utilisateur connecté
  const { data: auth } = await client.auth.getUser();
  if (!auth?.user) throw new Error("Not signed in");

  const userId = auth.user.id;

  try {
    // ✅ écrire dans la table comments (pas task_comments)
    const { data: commentData, error: commentError } = await client
      .from("comments")
      .insert([{ task_id, user_id: userId, content }])
      .select("id, task_id, user_id, content, created_at")
      .single();

    if (commentError) throw commentError;

    // ✅ Récupérer les informations utilisateur pour l'activité
    const { data: userProfile } = await client
      .from("profiles")
      .select("first_name, last_name, full_name")
      .eq("id", userId)
      .single();

    const userName = userProfile?.full_name || 
                    `${userProfile?.first_name || ''} ${userProfile?.last_name || ''}`.trim() || 
                    'Unknown User';

    // ✅ Déterminer le type de tâche en cherchant dans les différentes tables
    let taskType = 'unknown';
    
    // Chercher dans les incidents
    const { data: incident } = await client
      .from("incidents")
      .select("id")
      .eq("id", task_id)
      .single();
    
    if (incident) {
      taskType = 'incident';
    } else {
      // Chercher dans client_requests
      const { data: clientRequest } = await client
        .from("client_requests")
        .select("id")
        .eq("id", task_id)
        .single();
      
      if (clientRequest) {
        taskType = 'client_request';
      } else {
        // Chercher dans follow_ups
        const { data: followUp } = await client
          .from("follow_ups")
          .select("id")
          .eq("id", task_id)
          .single();
        
        if (followUp) {
          taskType = 'follow_up';
        } else {
          // Chercher dans internal_tasks
          const { data: internalTask } = await client
            .from("internal_tasks")
            .select("id")
            .eq("id", task_id)
            .single();
          
          if (internalTask) {
            taskType = 'internal_task';
          }
        }
      }
    }

    // ✅ Ajouter automatiquement l'activité dans activity_log
    const { error: activityError } = await client
      .from("activity_log")
      .insert([{
        user_id: userId,
        task_id: task_id,
        task_type: taskType,
        action: 'commented',
        description: `${userName} left a comment`,
        metadata: {
          comment_id: commentData.id,
          comment_preview: content.length > 50 ? content.substring(0, 47) + '...' : content
        }
      }]);

    if (activityError) {
      console.error('Error creating activity log:', activityError);
      // Ne pas faire échouer toute l'opération si l'activité ne se créé pas
    }

    return commentData;

  } catch (error) {
    console.error('Error in addTaskComment:', error);
    throw error;
  }
}

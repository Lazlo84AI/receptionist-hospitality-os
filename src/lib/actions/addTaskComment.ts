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

  // écrire dans la table du modèle B
  const { data, error } = await client
    .from("task_comments") // IMPORTANT: modèle B
    .insert([{ task_id, user_id: auth.user.id, content }])
    .select("id, task_id, user_id, content, created_at")
    .single();

  if (error) throw error;
  return data;
}

import { supabase } from "@/integrations/supabase/client";

type Payload = {
  task_id: string;            // UUID of the task/card
  content: string;            // comment text
  mentioned_users?: string[]; // optional: array of user UUIDs
};

export async function addTaskComment({ task_id, content, mentioned_users = [] }: Payload) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) throw new Error("Not signed in");

  const { data, error } = await (supabase as any)
    .from("comments")
    .insert([{
      task_id,
      user_id: auth.user.id,   // keep this if no DEFAULT auth.uid() in DB
      content,
      mentioned_users
    }])
    .select("id, task_id, user_id, content, mentioned_users, created_at")
    .single();

  if (error) throw error;
  return data;
}
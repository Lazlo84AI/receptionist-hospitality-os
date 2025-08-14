import { supabase } from "@/integrations/supabase/client";

type Payload = {
  task_id: string;
  content: string;
};

export async function addTaskComment({ task_id, content }: Payload) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) throw new Error("Not signed in");

  const { data, error } = await supabase
    .from("comments")
    .insert([{
      task_id,
      task_type: 'general',
      user_id: auth.user.id,
      content
    }])
    .select("id, task_id, user_id, content, created_at")
    .single();

  if (error) throw error;
  return data;
}
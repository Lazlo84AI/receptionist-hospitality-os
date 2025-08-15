import { supabase } from "@/integrations/supabase/client";

export type TaskComment = {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
};

export async function getTaskComments(taskId: string): Promise<TaskComment[]> {
  const client = supabase as any;

  const { data, error } = await client
    .from("task_comments") // ✅ même table que l'écriture
    .select("id, task_id, user_id, content, created_at")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as TaskComment[];
}
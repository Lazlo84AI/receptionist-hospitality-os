import { supabase } from "@/integrations/supabase/client";

export type TaskComment = {
  id: string;
  task_id: string;
  content: string;
  created_at: string;
  user_id: string;
};

export async function getTaskComments(taskId: string): Promise<TaskComment[]> {
  const { data, error } = await supabase
    .from("comments")
    .select(`
      id,
      task_id,
      content,
      created_at,
      user_id
    `)
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as TaskComment[];
}
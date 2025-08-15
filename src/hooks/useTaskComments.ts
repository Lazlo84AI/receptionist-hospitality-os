import { useCallback, useEffect, useState } from "react";
import { getTaskComments, TaskComment } from "@/lib/actions/getTaskComments";

export function useTaskComments(taskId?: string) {
  const [items, setItems] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const refetch = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    setError(null);
    try {
      const rows = await getTaskComments(taskId);
      setItems(rows);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => { refetch(); }, [refetch]);
  return { items, loading, error, refetch, setItems };
}
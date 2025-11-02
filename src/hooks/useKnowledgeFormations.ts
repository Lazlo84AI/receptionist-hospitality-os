import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface KnowledgeFormation {
  id: string;
  document_title: string;
  document_name: string;
  document_url: string;
  topic: string;
  summary: string | null;
  qdrant_collection: string | null;
  topic_keywords: string[] | null;
  average_score: number | null;
  status: string;
  formation_steps: string;
  kanban_status: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export const useKnowledgeFormations = () => {
  return useQuery({
    queryKey: ['knowledge_formations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_queries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching knowledge formations:', error);
        throw error;
      }

      return data as KnowledgeFormation[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });
};
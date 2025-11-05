import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface KnowledgeQuery {
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
  related_item_ids: string[] | null;
  last_score: number | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export const useKnowledgeQueries = () => {
  return useQuery({
    queryKey: ['knowledge_queries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_queries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching knowledge queries:', error);
        throw error;
      }

      return data as KnowledgeQuery[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });
};

// Hook spécifique pour les formations (avec realtime)
export const useTrainingFormations = () => {
  const query = useQuery({
    queryKey: ['training_formations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_queries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching training formations:', error);
        throw error;
      }

      return data as KnowledgeQuery[];
    },
    staleTime: 1000 * 30, // 30 secondes pour plus de réactivité
    refetchOnWindowFocus: true,
  });

  // Écouter les changements Realtime
  React.useEffect(() => {
    const channel = supabase
      .channel('knowledge_queries_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'knowledge_queries'
        },
        (payload) => {
          console.log('Realtime change in knowledge_queries:', payload);
          query.refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [query]);

  return query;
};
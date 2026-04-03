import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { KnowledgeFormation } from './useKnowledgeFormations';
import { KnowledgeQuery } from './useKnowledgeQueries';

// ─── Hook pour /connaissances — retourne KnowledgeFormation[] ────────────────
export const useMyAssignedFormations = () => {
  return useQuery({
    queryKey: ['my_assigned_formations'],
    queryFn: async (): Promise<KnowledgeFormation[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // 1. Vérifier si l'utilisateur est admin (hierarchy = 'direction')
      const { data: staffData } = await supabase
        .from('staff_directory')
        .select('hierarchy')
        .eq('id', user.id)
        .single();

      const isAdmin = staffData?.hierarchy === 'direction';

      if (isAdmin) {
        // Admin → tout afficher
        const { data, error } = await supabase
          .from('knowledge_queries')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return (data || []) as KnowledgeFormation[];
      }

      // 2. Récupérer les assignments de cet utilisateur
      const { data: assignments, error: assignErr } = await (supabase as any)
        .from('training_assignments')
        .select('knowledge_item_ids')
        .eq('assigned_to', user.id);

      if (assignErr) throw assignErr;
      if (!assignments || assignments.length === 0) return [];

      // 3. Aplatir tous les IDs
      const allIds: string[] = assignments.flatMap((a: any) => a.knowledge_item_ids || []);
      const uniqueIds = [...new Set(allIds)];
      if (uniqueIds.length === 0) return [];

      // 4. Fetch uniquement ces formations
      const { data, error } = await supabase
        .from('knowledge_queries')
        .select('*')
        .in('id', uniqueIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as KnowledgeFormation[];
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
  });
};

// ─── Hook pour /training — retourne KnowledgeQuery[] ────────────────────────
export const useMyAssignedQueries = () => {
  return useQuery({
    queryKey: ['my_assigned_queries'],
    queryFn: async (): Promise<KnowledgeQuery[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: staffData } = await supabase
        .from('staff_directory')
        .select('hierarchy')
        .eq('id', user.id)
        .single();

      const isAdmin = staffData?.hierarchy === 'direction';

      if (isAdmin) {
        const { data, error } = await supabase
          .from('knowledge_queries')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return (data || []) as KnowledgeQuery[];
      }

      const { data: assignments, error: assignErr } = await (supabase as any)
        .from('training_assignments')
        .select('knowledge_item_ids')
        .eq('assigned_to', user.id);

      if (assignErr) throw assignErr;
      if (!assignments || assignments.length === 0) return [];

      const allIds: string[] = assignments.flatMap((a: any) => a.knowledge_item_ids || []);
      const uniqueIds = [...new Set(allIds)];
      if (uniqueIds.length === 0) return [];

      const { data, error } = await supabase
        .from('knowledge_queries')
        .select('*')
        .in('id', uniqueIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as KnowledgeQuery[];
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
  });
};

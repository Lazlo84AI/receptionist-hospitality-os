import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TrainingQuestionFromDB {
  id: string;
  thematic: string;
  document: string;
  context: string | null;
  question: string;
  answers: string[]; // ["A. ...", "B. ...", "C. ...", "D. ..."]
  correct_answer: string; // A, B, C, D
  explanation: string | null;
  cognitive_principle: string | null;
  created_at: string;
}

// Interface compatible avec le format existant de trainingQuestions.ts
export interface TrainingQuestionCompatible {
  id: string;
  context: string;
  question: string;
  answers: string[];
  correct_answer: string;
  explanation: string;
  cognitive_principle?: string;
}

/**
 * Hook pour récupérer les questions de formation depuis Supabase
 * @param questionIds - Liste des IDs des questions à récupérer
 * @param enabled - Activer/désactiver la requête
 */
export const useQuizQuestions = (
  questionIds: string[] | null,
  enabled: boolean = true
) => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['quiz-questions', questionIds],
    queryFn: async (): Promise<TrainingQuestionCompatible[]> => {
      if (!questionIds || questionIds.length === 0) {
        throw new Error('Question IDs are required');
      }

      console.log(`🔍 Fetching ${questionIds.length} questions by IDs`);

      const { data, error } = await supabase
        .from('training_questions')
        .select('*')
        .in('id', questionIds)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Error fetching training questions:', error);
        toast({
          title: "Erreur de chargement",
          description: "Impossible de récupérer les questions de formation",
          variant: "destructive",
        });
        throw error;
      }

      if (!data || data.length === 0) {
        console.warn('⚠️ No training questions found for provided IDs');
        return [];
      }

      console.log(`✅ Found ${data.length} questions`);

      // Transformer au format compatible avec QuizzModal
      const transformedQuestions: TrainingQuestionCompatible[] = data.map((dbQuestion: TrainingQuestionFromDB) => ({
        id: dbQuestion.id,
        context: dbQuestion.context || '',
        question: dbQuestion.question,
        answers: dbQuestion.answers,
        correct_answer: dbQuestion.correct_answer,
        explanation: dbQuestion.explanation || '',
        cognitive_principle: dbQuestion.cognitive_principle || undefined
      }));

      return transformedQuestions;
    },
    enabled: enabled && !!questionIds && questionIds.length > 0,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    retry: 2,
    onError: (error) => {
      console.error('❌ useQuizQuestions error:', error);
    },
    onSuccess: (data) => {
      console.log(`✅ Successfully loaded ${data.length} training questions`);
    }
  });
};

/**
 * Hook pour récupérer les thématiques disponibles
 */
export const useAvailableThematics = () => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['available-thematics'],
    queryFn: async (): Promise<string[]> => {
      console.log('🔍 Fetching available thematics...');

      const { data, error } = await supabase
        .from('training_questions')
        .select('thematic')
        .order('thematic');

      if (error) {
        console.error('❌ Error fetching thematics:', error);
        toast({
          title: "Erreur",
          description: "Impossible de récupérer les thématiques",
          variant: "destructive",
        });
        throw error;
      }

      // Extraire les thématiques uniques
      const uniqueThematics = [...new Set(data?.map(item => item.thematic) || [])];
      
      console.log(`✅ Found thematics:`, uniqueThematics);
      return uniqueThematics;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: 2
  });
};

/**
 * Hook pour récupérer les documents disponibles pour une thématique
 */
export const useAvailableDocuments = (thematic: string | null) => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['available-documents', thematic],
    queryFn: async (): Promise<string[]> => {
      if (!thematic) return [];

      console.log(`🔍 Fetching available documents for thematic: ${thematic}`);

      const { data, error } = await supabase
        .from('training_questions')
        .select('document')
        .eq('thematic', thematic)
        .order('document');

      if (error) {
        console.error('❌ Error fetching documents:', error);
        toast({
          title: "Erreur",
          description: "Impossible de récupérer les documents",
          variant: "destructive",
        });
        throw error;
      }

      // Extraire les documents uniques
      const uniqueDocuments = [...new Set(data?.map(item => item.document) || [])];
      
      console.log(`✅ Found documents for ${thematic}:`, uniqueDocuments);
      return uniqueDocuments;
    },
    enabled: !!thematic,
    staleTime: 10 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
    retry: 2
  });
};

// Export du type pour usage externe
export type { TrainingQuestionFromDB, TrainingQuestionCompatible };

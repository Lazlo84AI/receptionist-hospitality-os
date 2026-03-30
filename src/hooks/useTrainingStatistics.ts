import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TrainingResult {
  id: string;
  user_id: string;
  document_name: string;
  thematic: string;
  total_questions: number;
  correct_answers: number;
  score_percent: number;
  created_at: string;
}

export interface TrainingRankEntry {
  user_id: string;
  display_name: string;
  service: string | null;
  avg_score: number;
  best_score: number;
  quiz_count: number;
}

export interface TrainingStatisticsData {
  myResults: TrainingResult[];         // QCMs passés, tri DESC (plus récent en premier)
  myAvgScore: number;                  // Moyenne perso arrondie
  myBestScore: number;                 // Meilleur score perso
  hotelRanking: TrainingRankEntry[];   // Classement global hôtel (trié par avg_score DESC)
  serviceRanking: TrainingRankEntry[]; // Classement du service de l'utilisateur
  myService: string | null;
  myUserId: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const computeRankings = (
  allResults: TrainingResult[],
  staffMap: Record<string, { display_name: string; service: string | null }>,
): TrainingRankEntry[] => {
  const byUser: Record<string, { scores: number[]; display_name: string; service: string | null }> = {};

  allResults.forEach(r => {
    if (!byUser[r.user_id]) {
      byUser[r.user_id] = {
        scores: [],
        display_name: staffMap[r.user_id]?.display_name || 'Inconnu',
        service: staffMap[r.user_id]?.service || null,
      };
    }
    byUser[r.user_id].scores.push(r.score_percent);
  });

  return Object.entries(byUser)
    .map(([user_id, d]) => ({
      user_id,
      display_name: d.display_name,
      service: d.service,
      avg_score: Math.round(d.scores.reduce((s, v) => s + v, 0) / d.scores.length),
      best_score: Math.round(Math.max(...d.scores)),
      quiz_count: d.scores.length,
    }))
    .sort((a, b) => b.avg_score - a.avg_score);
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useTrainingStatistics = () => {
  const [data, setData] = useState<TrainingStatisticsData>({
    myResults: [],
    myAvgScore: 0,
    myBestScore: 0,
    hotelRanking: [],
    serviceRanking: [],
    myService: null,
    myUserId: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrainingStatistics = async () => {
    try {
      setLoading(true);

      // 1. Utilisateur connecté
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // 2. Tous les résultats training (nécessaire pour les classements)
      const { data: allResultsRaw, error: resultsError } = await (supabase as any)
        .from('training_results')
        .select('*')
        .order('created_at', { ascending: false });

      if (resultsError) throw resultsError;

      const allResults: TrainingResult[] = (allResultsRaw || []).map((r: any) => ({
        id: r.id ?? '',
        user_id: r.user_id,
        document_name: r.document_name || '',
        thematic: r.thematic || '',
        total_questions: Number(r.total_questions) || 0,
        correct_answers: Number(r.correct_answers) || 0,
        score_percent: Number(r.score_percent) || 0,
        created_at: r.created_at,
      }));

      // 3. Résultats perso
      const myResults = allResults.filter(r => r.user_id === user.id);
      const myAvgScore = myResults.length
        ? Math.round(myResults.reduce((s, r) => s + r.score_percent, 0) / myResults.length)
        : 0;
      const myBestScore = myResults.length
        ? Math.round(Math.max(...myResults.map(r => r.score_percent)))
        : 0;

      // 4. Annuaire du staff pour les noms + services
      const { data: staffRaw, error: staffError } = await (supabase as any)
        .from('staff_directory')
        .select('id, first_name, last_name, service');

      if (staffError) throw staffError;

      const staffMap: Record<string, { display_name: string; service: string | null }> = {};
      (staffRaw || []).forEach((s: any) => {
        staffMap[s.id] = {
          display_name: `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Inconnu',
          service: s.service || null,
        };
      });

      const myService = staffMap[user.id]?.service || null;

      // 5. Classements
      const hotelRanking = computeRankings(allResults, staffMap);
      const serviceRanking = hotelRanking.filter(e => e.service === myService);

      setData({
        myResults,
        myAvgScore,
        myBestScore,
        hotelRanking,
        serviceRanking,
        myService,
        myUserId: user.id,
      });
      setError(null);
    } catch (err) {
      console.error('❌ useTrainingStatistics error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch training statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainingStatistics();
  }, []);

  return { ...data, loading, error, refetch: fetchTrainingStatistics };
};

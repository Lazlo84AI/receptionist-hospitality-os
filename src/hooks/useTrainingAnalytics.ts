import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MemberTrainingStats {
  user_id: string;
  display_name: string;
  service: string | null;
  hierarchy: string | null;          // NOUVEAU — pour discriminer Collaborator/Manager dans la modal
  quiz_count: number;
  avg_score: number;
  best_score: number;
  last_document: string;
  last_completed_at: string | null;
}

export interface FormationStats {
  document_name: string;
  participant_count: number;
  avg_score: number;
  success_rate: number; // % scores >= 70
}

export interface ServiceRadarData {
  service: string;
  data: { subject: string; score: number }[];
}

// NOUVEAU — competency_key ajouté pour pouvoir splitter les axes Collaborator/Manager
export type MemberCompetencies = Record<string, { competency_key: string; subject: string; score: number }[]>;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useTrainingAnalytics = () => {
  const [memberStats,       setMemberStats]       = useState<MemberTrainingStats[]>([]);
  const [formationStats,    setFormationStats]    = useState<FormationStats[]>([]);
  const [serviceRadars,     setServiceRadars]     = useState<ServiceRadarData[]>([]);
  const [memberCompetencies, setMemberCompetencies] = useState<MemberCompetencies>({});
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetchAll = async () => {
    try {
      setLoading(true);

      // ── Fetch A : résultats + annuaire ────────────────────────────────
      const { data: resultsRaw, error: rErr } = await (supabase as any)
        .from('training_results')
        .select('*')
        .order('created_at', { ascending: false });
      if (rErr) throw rErr;

      const { data: staffRaw, error: sErr } = await (supabase as any)
        .from('staff_directory')
        .select('id, first_name, last_name, service, hierarchy')   // NOUVEAU : hierarchy
        .eq('is_active', true);
      if (sErr) throw sErr;

      // Map staff id → { display_name, service, hierarchy }
      const staffById: Record<string, { display_name: string; service: string | null; hierarchy: string | null }> = {};
      (staffRaw || []).forEach((s: any) => {
        staffById[s.id] = {
          display_name: `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Inconnu',
          service: s.service || null,
          hierarchy: s.hierarchy || null,    // NOUVEAU
        };
      });

      // ── Vue 1 : par membre ────────────────────────────────────────────
      const byUser: Record<string, { scores: number[]; docs: string[]; dates: string[] }> = {};
      (resultsRaw || []).forEach((r: any) => {
        if (!byUser[r.user_id]) byUser[r.user_id] = { scores: [], docs: [], dates: [] };
        byUser[r.user_id].scores.push(Number(r.score_percent) || 0);
        byUser[r.user_id].docs.push(r.document_name || '');
        byUser[r.user_id].dates.push(r.created_at || '');
      });

      const members: MemberTrainingStats[] = Object.entries(byUser)
        .map(([uid, d]) => ({
          user_id:           uid,
          display_name:      staffById[uid]?.display_name || 'Inconnu',
          service:           staffById[uid]?.service || null,
          hierarchy:         staffById[uid]?.hierarchy || null,    // NOUVEAU
          quiz_count:        d.scores.length,
          avg_score:         Math.round(d.scores.reduce((s, v) => s + v, 0) / d.scores.length),
          best_score:        Math.round(Math.max(...d.scores)),
          last_document:     d.docs[0]  || '—',
          last_completed_at: d.dates[0] || null,
        }))
        .sort((a, b) => b.avg_score - a.avg_score);

      setMemberStats(members);

      // ── Vue 2 : par formation ─────────────────────────────────────────
      const byDoc: Record<string, { uids: Set<string>; scores: number[] }> = {};
      (resultsRaw || []).forEach((r: any) => {
        const doc = r.document_name || 'Sans titre';
        if (!byDoc[doc]) byDoc[doc] = { uids: new Set(), scores: [] };
        byDoc[doc].uids.add(r.user_id);
        byDoc[doc].scores.push(Number(r.score_percent) || 0);
      });

      const formations: FormationStats[] = Object.entries(byDoc)
        .map(([name, d]) => ({
          document_name:     name,
          participant_count: d.uids.size,
          avg_score:         Math.round(d.scores.reduce((s, v) => s + v, 0) / d.scores.length),
          success_rate:      Math.round((d.scores.filter(s => s >= 70).length / d.scores.length) * 100),
        }))
        .sort((a, b) => b.participant_count - a.participant_count);

      setFormationStats(formations);

      // ── Fetch B : compétences ─────────────────────────────────────────
      const { data: compScores, error: compErr } = await (supabase as any)
        .from('competency_scores')
        .select('employee_id, competency_key, current_score');
      if (compErr) throw compErr;
      const { data: compProfiles } = await (supabase as any)
        .from('service_competency_profiles')
        .select('service, competency_key, label');

      if (compScores && compProfiles) {
        // Map competency_key → label
        const labelMap: Record<string, string> = {};
        (compProfiles || []).forEach((p: any) => { labelMap[p.competency_key] = p.label; });

        // Agréger par service + competency_key (pour radars service)
        const bySvcComp: Record<string, Record<string, number[]>> = {};
        // Agréger par user + competency_key (pour radar individuel)
        const byUserComp: Record<string, Record<string, number>> = {};

        (compScores || []).forEach((cs: any) => {
          const svc = staffById[cs.employee_id]?.service;

          // service aggregation
          if (svc) {
            if (!bySvcComp[svc]) bySvcComp[svc] = {};
            if (!bySvcComp[svc][cs.competency_key]) bySvcComp[svc][cs.competency_key] = [];
            bySvcComp[svc][cs.competency_key].push(Number(cs.current_score) || 0);
          }

          // individual aggregation (last score per key — table has one row per user+key)
          if (!byUserComp[cs.employee_id]) byUserComp[cs.employee_id] = {};
          byUserComp[cs.employee_id][cs.competency_key] = Number(cs.current_score) || 0;
        });

        // Radars par service
        const radars: ServiceRadarData[] = Object.entries(bySvcComp).map(([svc, compMap]) => ({
          service: svc,
          data: Object.entries(compMap).map(([key, scores]) => ({
            subject: labelMap[key] || key,
            score:   Math.round(scores.reduce((s, v) => s + v, 0) / scores.length),
          })),
        }));
        setServiceRadars(radars);

        // Radars individuels
        const indiv: MemberCompetencies = {};
        Object.entries(byUserComp).forEach(([uid, compMap]) => {
          indiv[uid] = Object.entries(compMap).map(([key, score]) => ({
            competency_key: key,                  // NOUVEAU — pour permettre le split Collaborator/Manager
            subject: labelMap[key] || key,
            score,
          }));
        });
        setMemberCompetencies(indiv);
      }

      setError(null);
    } catch (err) {
      console.error('❌ useTrainingAnalytics error:', err);
      setError(err instanceof Error ? err.message : 'Fetch error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  return { memberStats, formationStats, serviceRadars, memberCompetencies, loading, error, refetch: fetchAll };
};

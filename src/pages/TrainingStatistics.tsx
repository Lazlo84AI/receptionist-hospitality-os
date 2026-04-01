import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { useTrainingStatistics } from '@/hooks/useTrainingStatistics';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import {
  Loader2, TrendingUp, AlertCircle, BookOpen, Zap,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// ─── Brand colours ──────────────────────────────────────────────────────────
const GOLD   = '#BBA57A';
const NAVY   = '#1E1A37';
const YELLOW = '#DEAE35';

// ─── Radar fallback (axes à 0 avant premier QCM) ────────────────────────────
const EMPTY_RADAR_DATA = [
  { category: 'Housekeeping',          score: 0, fullMark: 100 },
  { category: 'Hygiene',               score: 0, fullMark: 100 },
  { category: 'Customer Service',      score: 0, fullMark: 100 },
  { category: 'Service Attitude',      score: 0, fullMark: 100 },
  { category: 'Operations Management', score: 0, fullMark: 100 },
  { category: 'Safety',                score: 0, fullMark: 100 },
  { category: 'Organization',          score: 0, fullMark: 100 },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

const KpiCard = ({
  icon, label, value, sub, accent = GOLD,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
  accent?: string;
}) => (
  <div className="rounded-2xl border border-[#BBA57A]/20 bg-white shadow-sm p-5 flex flex-col gap-2">
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
      <span style={{ color: accent }}>{icon}</span>
      {label}
    </div>
    <div className="text-4xl font-bold" style={{ color: NAVY }}>{value}</div>
    {sub && <div className="text-xs text-gray-400">{sub}</div>}
  </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-xs font-bold uppercase tracking-widest text-[#BBA57A] mb-4">{children}</h2>
);

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-[#BBA57A]/15 bg-white shadow-sm p-5 ${className}`}>
    {children}
  </div>
);

// ─── Page ────────────────────────────────────────────────────────────────────

const TrainingStatistics = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // ── Competency radar ──
  const [radarData, setRadarData]               = useState(EMPTY_RADAR_DATA);
  const [isCompetencyEmpty, setIsCompetencyEmpty] = useState(false);
  const [userName, setUserName]                 = useState('');

  useEffect(() => {
    const fetchCompetencyData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Nom d'affichage
        const { data: staffData } = await supabase
          .from('staff_directory')
          .select('first_name, last_name, service')
          .eq('id', user.id)
          .single();

        if (staffData) {
          setUserName(`${staffData.first_name ?? ''} ${staffData.last_name ?? ''}`.trim());

          const userService = staffData.service;
          if (userService) {
            // Tous les axes du service
            const { data: profileAxes, error: axesError } = await (supabase as any)
              .from('service_competency_profiles')
              .select('competency_key, label')
              .eq('service', userService);

            // Scores réels
            const { data: compScores } = await (supabase as any)
              .from('competency_scores')
              .select('competency_key, current_score')
              .eq('employee_id', user.id);

            if (!axesError && profileAxes && profileAxes.length > 0) {
              const scoreMap: Record<string, number> = {};
              (compScores || []).forEach((row: any) => {
                scoreMap[row.competency_key] = Number(row.current_score) || 0;
              });

              const mapped = profileAxes.map((axis: any) => ({
                category:  axis.label,
                score:     scoreMap[axis.competency_key] ?? 0,
                fullMark:  100,
              }));

              setRadarData(mapped);
              setIsCompetencyEmpty(mapped.every((a: any) => a.score === 0));
            } else {
              setIsCompetencyEmpty(true);
            }
          } else {
            setIsCompetencyEmpty(true);
          }
        }
      } catch (err) {
        console.error('Error fetching competency data:', err);
      }
    };

    fetchCompetencyData();
  }, []);

  // ── Training statistics ──
  const {
    myResults, myAvgScore, myBestScore,
    hotelRanking, serviceRanking,
    myService, myUserId,
    loading, error,
  } = useTrainingStatistics();

  const tooltipStyle = {
    contentStyle: { background: '#fff', border: `1px solid ${GOLD}40`, borderRadius: 10, fontSize: 12 },
    labelStyle:   { color: NAVY, fontWeight: 600 },
  };

  if (loading) return (
    <div className="min-h-screen bg-[#faf8f4] flex items-center justify-center">
      <Loader2 className="animate-spin w-10 h-10" style={{ color: GOLD }} />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#faf8f4] flex items-center justify-center">
      <div className="text-red-500 flex gap-2 items-center">
        <AlertCircle className="w-5 h-5" /> {error}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf8f4]">
      <Header onMenuToggle={() => setIsSidebarOpen(prev => !prev)} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-10">

        {/* ── Page header ── */}
        <div>
          <h1 className="text-3xl font-bold font-playfair" style={{ color: NAVY }}>
            Training Statistics
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Progression formations · Classements service &amp; hôtel
          </p>
        </div>

        {/* ══════════════════════════════════════════
            COMPETENCY PROFILE
        ══════════════════════════════════════════ */}
        <section>
          <SectionTitle>Competency Profile</SectionTitle>

          <div className="rounded-2xl overflow-hidden" style={{ background: NAVY }}>
            <div className="p-6">
              {/* Header carte */}
              {userName && (
                <div className="mb-4">
                  <p className="text-white text-lg font-semibold">{userName}</p>
                  <p className="text-[#BBA57A] text-xs font-bold uppercase tracking-widest">Standout Stats</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Radar */}
                <div className="rounded-xl p-4" style={{ background: '#2A2448' }}>
                  {isCompetencyEmpty && (
                    <p className="text-center text-[#DEAE35] text-xs font-bold uppercase tracking-widest mb-3">
                      ⚡ Dépêchez-vous de vous former !
                    </p>
                  )}
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke={GOLD} opacity={0.3} />
                      <PolarAngleAxis
                        dataKey="category"
                        tick={{ fill: GOLD, fontSize: 11 }}
                      />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: GOLD }} />
                      <Radar
                        name="Score"
                        dataKey="score"
                        stroke={GOLD}
                        fill={GOLD}
                        fillOpacity={0.6}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Barres de compétences */}
                <div className="space-y-4 flex flex-col justify-center">
                  {radarData.map((stat) => (
                    <div key={stat.category} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium text-xs uppercase tracking-wide">
                          {stat.category}
                        </span>
                        <span className="text-[#BBA57A] font-bold text-xl">{stat.score}</span>
                      </div>
                      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: '#2A2448' }}>
                        <div
                          className="h-full transition-all duration-500"
                          style={{
                            width: `${stat.score}%`,
                            background: `linear-gradient(to right, ${GOLD}, ${YELLOW})`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            MY TRAINING
        ══════════════════════════════════════════ */}
        <section>
          <SectionTitle>My Training</SectionTitle>

          {myResults.length === 0 ? (
            <Card className="text-center py-12 space-y-3">
              <p className="text-3xl">📚</p>
              <p className="font-semibold" style={{ color: NAVY }}>Aucun QCM complété pour l'instant</p>
              <p className="text-sm text-gray-400">Rendez-vous dans la Knowledge Base pour commencer vos formations !</p>
            </Card>
          ) : (
            <>
              {/* KPI row */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <KpiCard
                  icon={<BookOpen className="w-4 h-4" />}
                  label="QCMs passés"
                  value={myResults.length}
                  sub="all time"
                />
                <KpiCard
                  icon={<TrendingUp className="w-4 h-4" />}
                  label="Score moyen"
                  value={`${myAvgScore}%`}
                  accent={myAvgScore >= 80 ? '#22c55e' : myAvgScore >= 60 ? YELLOW : '#ef4444'}
                  sub="sur l'ensemble des QCMs"
                />
                <KpiCard
                  icon={<Zap className="w-4 h-4" />}
                  label="Meilleur score"
                  value={`${myBestScore}%`}
                  accent={YELLOW}
                  sub="record personnel"
                />
              </div>

              {/* Courbe + Tableau historique */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

                <Card>
                  <p className="text-sm font-semibold mb-1" style={{ color: NAVY }}>Progression des scores</p>
                  <p className="text-xs text-gray-400 mb-4">Évolution chronologique de tes résultats</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart
                      data={[...myResults].reverse().map(r => ({
                        date: new Date(r.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
                        score: Math.round(r.score_percent),
                      }))}
                      margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0ece4" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v: number) => `${v}%`} />
                      <Tooltip {...tooltipStyle} formatter={(v: any) => [`${v}%`, 'Score']} />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke={GOLD}
                        strokeWidth={2}
                        dot={{ r: 4, fill: GOLD }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>

                <Card className="overflow-hidden p-0">
                  <div className="p-5 pb-3">
                    <p className="text-sm font-semibold" style={{ color: NAVY }}>Historique des QCMs</p>
                    <p className="text-xs text-gray-400 mt-0.5">Derniers résultats</p>
                  </div>
                  <div className="overflow-y-auto max-h-52">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#BBA57A]/15 text-gray-400 text-xs uppercase tracking-wider bg-[#faf8f4]">
                          <th className="text-left px-5 py-2">Formation</th>
                          <th className="text-center px-3 py-2">Score</th>
                          <th className="text-right px-5 py-2">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myResults.map((r, i) => {
                          const scoreColor = r.score_percent >= 80 ? '#22c55e' : r.score_percent >= 60 ? YELLOW : '#ef4444';
                          return (
                            <tr key={i} className="border-b border-gray-50 hover:bg-[#faf8f4] transition-colors">
                              <td className="px-5 py-2.5 font-medium text-xs" style={{ color: NAVY }}>
                                {r.document_name.length > 30 ? r.document_name.slice(0, 30) + '…' : r.document_name}
                              </td>
                              <td className="px-3 py-2.5 text-center font-bold text-sm" style={{ color: scoreColor }}>
                                {Math.round(r.score_percent)}%
                              </td>
                              <td className="px-5 py-2.5 text-right text-xs text-gray-400">
                                {new Date(r.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>

              {/* Classements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#BBA57A] mb-3">
                    Classement service — {myService ?? 'Non assigné'}
                  </p>
                  <div className="rounded-2xl border border-[#BBA57A]/15 bg-white shadow-sm overflow-hidden">
                    {serviceRanking.length === 0 ? (
                      <div className="p-6 text-center text-gray-400 text-sm">Aucune donnée de service</div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#BBA57A]/15 text-gray-400 text-xs uppercase tracking-wider">
                            <th className="text-left px-4 py-2.5">#</th>
                            <th className="text-left px-4 py-2.5">Nom</th>
                            <th className="text-center px-4 py-2.5">Moy.</th>
                            <th className="text-center px-4 py-2.5">QCMs</th>
                          </tr>
                        </thead>
                        <tbody>
                          {serviceRanking.map((entry, idx) => {
                            const isMe = entry.user_id === myUserId;
                            const scoreColor = entry.avg_score >= 80 ? '#22c55e' : entry.avg_score >= 60 ? YELLOW : '#ef4444';
                            return (
                              <tr key={entry.user_id} className={`border-b border-gray-50 transition-colors ${isMe ? 'bg-[#BBA57A]/5' : 'hover:bg-[#faf8f4]'}`}>
                                <td className="px-4 py-2.5 font-mono text-gray-400 text-xs">
                                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                                </td>
                                <td className="px-4 py-2.5 font-semibold text-xs" style={{ color: isMe ? GOLD : NAVY }}>
                                  {entry.display_name}
                                  {isMe && <span className="ml-1 text-[10px] text-[#BBA57A]">(vous)</span>}
                                </td>
                                <td className="px-4 py-2.5 text-center font-bold text-sm" style={{ color: scoreColor }}>{entry.avg_score}%</td>
                                <td className="px-4 py-2.5 text-center text-xs text-gray-400">{entry.quiz_count}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#BBA57A] mb-3">
                    Classement hôtel — Tout le staff
                  </p>
                  <div className="rounded-2xl border border-[#BBA57A]/15 bg-white shadow-sm overflow-hidden">
                    {hotelRanking.length === 0 ? (
                      <div className="p-6 text-center text-gray-400 text-sm">Aucune donnée disponible</div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#BBA57A]/15 text-gray-400 text-xs uppercase tracking-wider">
                            <th className="text-left px-4 py-2.5">#</th>
                            <th className="text-left px-4 py-2.5">Nom</th>
                            <th className="text-left px-4 py-2.5">Service</th>
                            <th className="text-center px-4 py-2.5">Moy.</th>
                            <th className="text-center px-4 py-2.5">QCMs</th>
                          </tr>
                        </thead>
                        <tbody>
                          {hotelRanking.map((entry, idx) => {
                            const isMe = entry.user_id === myUserId;
                            const scoreColor = entry.avg_score >= 80 ? '#22c55e' : entry.avg_score >= 60 ? YELLOW : '#ef4444';
                            return (
                              <tr key={entry.user_id} className={`border-b border-gray-50 transition-colors ${isMe ? 'bg-[#BBA57A]/5' : 'hover:bg-[#faf8f4]'}`}>
                                <td className="px-4 py-2.5 font-mono text-gray-400 text-xs">
                                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                                </td>
                                <td className="px-4 py-2.5 font-semibold text-xs" style={{ color: isMe ? GOLD : NAVY }}>
                                  {entry.display_name}
                                  {isMe && <span className="ml-1 text-[10px] text-[#BBA57A]">(vous)</span>}
                                </td>
                                <td className="px-4 py-2.5 text-xs text-gray-500 capitalize">{entry.service ?? '—'}</td>
                                <td className="px-4 py-2.5 text-center font-bold text-sm" style={{ color: scoreColor }}>{entry.avg_score}%</td>
                                <td className="px-4 py-2.5 text-center text-xs text-gray-400">{entry.quiz_count}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

              </div>
            </>
          )}
        </section>

      </main>
    </div>
  );
};

export default TrainingStatistics;

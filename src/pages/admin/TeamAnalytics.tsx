import { useState, useMemo, useEffect } from 'react';
import { AdminLayout } from './AdminLayout';
import {
  BarChart3, Users, CheckCircle2, TrendingUp,
  Activity, Award, Zap, Target,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, ScatterChart, Scatter, ZAxis,
} from 'recharts';
import { useMyStatistics, UserTaskStats, TimeseriesEntry } from '@/hooks/useMyStatistics';
import { useTrainingAnalytics } from '@/hooks/useTrainingAnalytics';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

// ─── Palette ──────────────────────────────────────────────────────────────────
const GOLD        = '#BBA57A';
const YELLOW      = '#DEAE35';
const CARD_BG     = 'rgba(30,26,55,0.85)';
const CARD_BORDER = 'rgba(187,165,122,0.18)';
const SERVICE_COLORS: Record<string, string> = {
  reception:   '#BBA57A',
  housekeeping:'#DEAE35',
  maintenance: '#6B8CBA',
  direction:   '#A78BFA',
};

// ─── Types ────────────────────────────────────────────────────────────────────
type AnalyticsTab = 'services' | 'individual' | 'trainingIndividual' | 'trainingServices';
type IndivTrainTab = 'byIndividual' | 'byFormation' | 'byCompetence';
type SvcTrainTab   = 'byService'   | 'byFormation' | 'byCompetence';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const serviceLabel = (s: string | null) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : 'N/A';

const resolutionRate = (created: number, completed: number) =>
  created > 0 ? Math.round((completed / created) * 100) : 0;

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-4 py-3 shadow-2xl border text-xs"
      style={{ background: '#13102B', borderColor: CARD_BORDER, minWidth: 150 }}>
      <p className="font-semibold mb-2" style={{ color: GOLD }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex justify-between gap-4">
          <span style={{ color: 'rgba(255,255,255,0.6)' }}>{p.name}</span>
          <span style={{ color: p.color || YELLOW }} className="font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Row helper ──────────────────────────────────────────────────────────────
const Row = ({ label, val }: { label: string; val: number }) => (
  <div className="flex justify-between">
    <span style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</span>
    <span style={{ color: YELLOW }} className="font-bold">{val}</span>
  </div>
);

// ─── Member Row (task management) ────────────────────────────────────────────
const MemberRow = ({ member, rank }: { member: UserTaskStats; rank: number }) => {
  const [hovered, setHovered] = useState(false);
  const rate     = resolutionRate(member.tasks_created_total, member.tasks_completed);
  const svcColor = SERVICE_COLORS[member.service || ''] || GOLD;
  return (
    <div className="relative flex items-center gap-4 rounded-xl px-4 py-3 transition-all duration-200 cursor-default"
      style={{ background: hovered ? 'rgba(187,165,122,0.08)' : 'transparent', border: `1px solid ${hovered ? CARD_BORDER : 'transparent'}` }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <span className="text-sm font-bold w-6 text-center flex-shrink-0" style={{ color: rank <= 3 ? YELLOW : 'rgba(255,255,255,0.3)' }}>
        {rank <= 3 ? ['🥇','🥈','🥉'][rank-1] : `#${rank}`}
      </span>
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
        style={{ background: `${svcColor}22`, color: svcColor, border: `1px solid ${svcColor}44` }}>
        {(member.first_name?.[0] || '') + (member.last_name?.[0] || '') || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{member.display_name}</p>
        <p className="text-xs" style={{ color: svcColor + '99' }}>{serviceLabel(member.service)}</p>
      </div>
      <div className="hidden md:flex items-center gap-6 text-xs">
        <div className="text-center"><p className="font-bold" style={{ color: YELLOW }}>{member.tasks_created_total}</p><p style={{ color: 'rgba(255,255,255,0.35)' }}>créées</p></div>
        <div className="text-center"><p className="font-bold text-green-400">{member.tasks_completed}</p><p style={{ color: 'rgba(255,255,255,0.35)' }}>closes</p></div>
        <div className="text-center"><p className="font-bold" style={{ color: GOLD }}>{member.shifts_completed}</p><p style={{ color: 'rgba(255,255,255,0.35)' }}>shifts</p></div>
      </div>
      <div className="w-24 flex-shrink-0">
        <div className="flex justify-between text-xs mb-1">
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>résolution</span>
          <span style={{ color: rate > 70 ? '#4ade80' : rate > 40 ? YELLOW : '#f87171' }} className="font-bold">{rate}%</span>
        </div>
        <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${rate}%`, background: rate > 70 ? '#4ade80' : rate > 40 ? YELLOW : '#f87171' }} />
        </div>
      </div>
      {hovered && (
        <div className="absolute right-0 top-full mt-1 z-50 rounded-xl shadow-2xl border p-3 text-xs w-52"
          style={{ background: '#13102B', borderColor: CARD_BORDER }}>
          <p className="font-semibold mb-2" style={{ color: GOLD }}>{member.display_name}</p>
          <div className="space-y-1">
            <Row label="Tâches today"   val={member.tasks_created_today} />
            <Row label="Tâches semaine" val={member.tasks_created_this_week} />
            <Row label="En cours"       val={member.tasks_in_progress} />
            <Row label="Incidents"      val={member.incidents_count} />
            <Row label="Demandes client" val={member.client_requests_count} />
            <Row label="Shifts actifs"  val={member.shifts_active} />
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Bubble Chart ─────────────────────────────────────────────────────────────
const BUBBLE_AXES = [
  { key: 'tasks_created_total', label: 'Tâches créées' },
  { key: 'tasks_completed',     label: 'Tâches closes' },
  { key: 'shifts_completed',    label: 'Shifts' },
  { key: 'tasks_in_progress',   label: 'En cours' },
  { key: 'incidents_count',     label: 'Incidents' },
] as const;
type BubbleAxisKey = typeof BUBBLE_AXES[number]['key'];

const BubbleTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const svcColor = SERVICE_COLORS[d.service || ''] || GOLD;
  return (
    <div className="rounded-xl px-4 py-3 shadow-2xl border text-xs" style={{ background: '#0F0C24', borderColor: svcColor + '55', minWidth: 180 }}>
      <p className="font-bold text-sm mb-2" style={{ color: svcColor }}>{d.display_name}</p>
      <p className="mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>{serviceLabel(d.service)}</p>
      <div className="space-y-1">
        <Row label="Tâches créées" val={d.tasks_created_total} />
        <Row label="Tâches closes" val={d.tasks_completed} />
        <Row label="Shifts"        val={d.shifts_completed} />
        <Row label="En cours"      val={d.tasks_in_progress} />
        <Row label="Incidents"     val={d.incidents_count} />
        <Row label="Résolution"    val={resolutionRate(d.tasks_created_total, d.tasks_completed)} />
      </div>
    </div>
  );
};

const CustomBubble = (props: any) => {
  const { cx, cy, payload } = props;
  const svcColor = SERVICE_COLORS[payload.service || ''] || GOLD;
  const initials = (payload.first_name?.[0] || '') + (payload.last_name?.[0] || '') || '?';
  const r = Math.max(22, Math.min(48, 22 + payload.z * 1.4));
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={svcColor + '22'} stroke={svcColor} strokeWidth={1.5} />
      <circle cx={cx} cy={cy} r={r * 0.55} fill={svcColor + '33'} />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize={10} fontWeight="600" fill={svcColor}>{initials}</text>
    </g>
  );
};

function IndividualBubbleChart({ teamStats, loading }: { teamStats: UserTaskStats[]; loading: boolean }) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(teamStats.map(m => m.staff_id)));
  const [xAxis, setXAxis] = useState<BubbleAxisKey>('tasks_created_total');
  const [yAxis, setYAxis] = useState<BubbleAxisKey>('tasks_completed');
  const [zAxis, setZAxis] = useState<BubbleAxisKey>('shifts_completed');

  useMemo(() => {
    if (teamStats.length > 0 && selected.size === 0) setSelected(new Set(teamStats.map(m => m.staff_id)));
  }, [teamStats.length]);

  const toggle    = (id: string) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected(prev => prev.size === teamStats.length ? new Set() : new Set(teamStats.map(m => m.staff_id)));

  const bubbleData = useMemo(() =>
    teamStats.filter(m => selected.has(m.staff_id)).map(m => ({
      ...m,
      x: (m as any)[xAxis] as number,
      y: (m as any)[yAxis] as number,
      z: Math.max(1, (m as any)[zAxis] as number),
    })),
    [teamStats, selected, xAxis, yAxis, zAxis]
  );

  const AxisSelect = ({ value, onChange }: { value: BubbleAxisKey; onChange: (v: BubbleAxisKey) => void }) => (
    <div className="flex gap-1 flex-wrap">
      {BUBBLE_AXES.map(a => (
        <button key={a.key} onClick={() => onChange(a.key)} className="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
          style={{ background: value === a.key ? GOLD : 'rgba(255,255,255,0.06)', color: value === a.key ? '#0F0C24' : 'rgba(255,255,255,0.5)' }}>
          {a.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="mt-4 rounded-xl border" style={{ background: 'rgba(30,26,55,0.85)', borderColor: 'rgba(187,165,122,0.18)' }}>
      <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'rgba(187,165,122,0.18)' }}>
        <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="none" stroke={GOLD} strokeWidth={1.8}>
          <circle cx="7" cy="14" r="3"/><circle cx="17" cy="10" r="4"/><circle cx="12" cy="18" r="2"/>
          <circle cx="5" cy="7" r="2"/><circle cx="19" cy="17" r="2.5"/>
        </svg>
        <p className="text-sm font-semibold text-white">Vue individuelle — Nuage de membres</p>
        <span className="ml-auto text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{selected.size} / {teamStats.length} membres affichés</span>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
          <div><p className="text-xs mb-2" style={{ color: 'rgba(187,165,122,0.6)' }}>Axe X</p><AxisSelect value={xAxis} onChange={setXAxis} /></div>
          <div><p className="text-xs mb-2" style={{ color: 'rgba(187,165,122,0.6)' }}>Axe Y</p><AxisSelect value={yAxis} onChange={setYAxis} /></div>
          <div><p className="text-xs mb-2" style={{ color: 'rgba(187,165,122,0.6)' }}>Taille bulle</p><AxisSelect value={zAxis} onChange={setZAxis} /></div>
        </div>
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Sélection membres</p>
            <button onClick={toggleAll} className="px-2.5 py-0.5 rounded-md text-xs font-medium"
              style={{ background: 'rgba(187,165,122,0.15)', color: GOLD, border: `1px solid ${GOLD}44` }}>
              {selected.size === teamStats.length ? 'Tout désélectionner' : 'Tout sélectionner'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {teamStats.map(m => {
              const svcColor = SERVICE_COLORS[m.service || ''] || GOLD;
              const isOn = selected.has(m.staff_id);
              return (
                <button key={m.staff_id} onClick={() => toggle(m.staff_id)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all"
                  style={{ background: isOn ? svcColor + '20' : 'rgba(255,255,255,0.03)', border: `1px solid ${isOn ? svcColor + '66' : 'rgba(255,255,255,0.08)'}`, color: isOn ? svcColor : 'rgba(255,255,255,0.3)', transform: isOn ? 'scale(1)' : 'scale(0.96)' }}>
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: isOn ? svcColor + '33' : 'rgba(255,255,255,0.06)', color: isOn ? svcColor : 'rgba(255,255,255,0.2)' }}>
                    {(m.first_name?.[0] || '') + (m.last_name?.[0] || '') || '?'}
                  </span>
                  {m.display_name}
                </button>
              );
            })}
          </div>
        </div>
        {loading ? (
          <div className="h-80 flex items-center justify-center" style={{ color: 'rgba(255,255,255,0.2)' }}>Chargement…</div>
        ) : bubbleData.length === 0 ? (
          <div className="h-80 flex items-center justify-center text-sm" style={{ color: 'rgba(255,255,255,0.2)' }}>Sélectionnez au moins un membre</div>
        ) : (
          <ResponsiveContainer width="100%" height={420}>
            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis type="number" dataKey="x" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false}
                label={{ value: BUBBLE_AXES.find(a => a.key === xAxis)?.label, position: 'insideBottom', offset: -10, fill: GOLD + '88', fontSize: 11 }} />
              <YAxis type="number" dataKey="y" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false}
                label={{ value: BUBBLE_AXES.find(a => a.key === yAxis)?.label, angle: -90, position: 'insideLeft', fill: GOLD + '88', fontSize: 11 }} />
              <ZAxis type="number" dataKey="z" range={[800, 4000]} />
              <Tooltip content={<BubbleTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(187,165,122,0.2)' }} />
              <Scatter data={bubbleData} shape={<CustomBubble />} />
            </ScatterChart>
          </ResponsiveContainer>
        )}
        <div className="flex flex-wrap gap-3 mt-3 justify-center">
          {Object.entries(SERVICE_COLORS).map(([svc, color]) => (
            <div key={svc} className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />{serviceLabel(svc)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Shared sub-tab bar ───────────────────────────────────────────────────────
function SubTabBar({ tabs, active, onChange }: {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-1 p-1 rounded-xl mb-5 w-fit" style={{ background: 'rgba(20,17,45,0.9)', border: '1px solid rgba(187,165,122,0.12)' }}>
      {tabs.map(({ id, label }) => (
        <button key={id} onClick={() => onChange(id)}
          className="px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-200"
          style={active === id ? { backgroundColor: 'rgba(187,165,122,0.15)', color: '#BBA57A' } : { color: 'rgba(187,165,122,0.4)' }}>
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── Formation cards (réutilisé dans les 2 sections training) ─────────────────
function FormationCards({ formationStats, trainingLoading }: { formationStats: any[]; trainingLoading: boolean }) {
  return (
    <div className="rounded-xl border" style={{ background: CARD_BG, borderColor: CARD_BORDER }}>
      <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: CARD_BORDER }}>
        <Award size={15} style={{ color: GOLD }} />
        <p className="text-sm font-semibold text-white">Résultats par formation</p>
        <span className="ml-auto text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{formationStats.length} formations</span>
      </div>
      {trainingLoading ? (
        <div className="p-8 text-center text-sm" style={{ color: 'rgba(255,255,255,0.25)' }}>Chargement…</div>
      ) : formationStats.length === 0 ? (
        <div className="p-10 text-center text-sm" style={{ color: 'rgba(255,255,255,0.2)' }}>Aucune formation</div>
      ) : (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {formationStats.map((f: any) => (
            <div key={f.document_name} className="rounded-xl p-4 border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(187,165,122,0.12)' }}>
              <p className="text-sm font-medium text-white mb-3 leading-snug">{f.document_name}</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold" style={{ color: YELLOW }}>{f.participant_count}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>passants</p>
                </div>
                <div>
                  <p className="text-lg font-bold" style={{ color: f.avg_score >= 70 ? '#4ade80' : f.avg_score >= 50 ? YELLOW : '#f87171' }}>{f.avg_score}%</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>score moyen</p>
                </div>
                <div>
                  <p className="text-lg font-bold" style={{ color: f.success_rate >= 70 ? '#4ade80' : f.success_rate >= 50 ? GOLD : '#f87171' }}>{f.success_rate}%</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>réussite</p>
                </div>
              </div>
              <div className="mt-3 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-1 rounded-full" style={{ width: `${f.success_rate}%`, background: f.success_rate >= 70 ? '#4ade80' : f.success_rate >= 50 ? GOLD : '#f87171' }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Competence radars (réutilisé dans les 2 sections training) ───────────────
function CompetenceRadars({ serviceRadars, trainingLoading }: { serviceRadars: any[]; trainingLoading: boolean }) {
  return trainingLoading ? (
    <div className="p-8 text-center text-sm" style={{ color: 'rgba(255,255,255,0.25)' }}>Chargement…</div>
  ) : serviceRadars.length === 0 ? (
    <div className="rounded-xl border p-10 text-center text-sm" style={{ background: CARD_BG, borderColor: CARD_BORDER, color: 'rgba(255,255,255,0.2)' }}>
      Aucune donnée de compétence disponible
    </div>
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {serviceRadars.map((sr: any) => {
        const svcColor = SERVICE_COLORS[sr.service] || GOLD;
        return (
          <div key={sr.service} className="rounded-xl border p-5" style={{ background: CARD_BG, borderColor: CARD_BORDER }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: svcColor }} />
              <p className="text-sm font-semibold text-white">{serviceLabel(sr.service)}</p>
              <span className="ml-auto text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>score / 100</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={sr.data}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 8 }} />
                <Tooltip content={<CustomTooltip />} />
                <Radar name="Score moyen" dataKey="score" stroke={svcColor} fill={svcColor} fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TeamAnalytics() {
  const { teamStats, benchmarks, loading } = useMyStatistics();
  const [periodFilter, setPeriodFilter] = useState<'day'|'week'|'month'>('month');

  const [allTimeseries, setAllTimeseries] = useState<TimeseriesEntry[]>([]);
  useEffect(() => {
    supabase
      .from('v_tasks_timeseries')
      .select('period_type, period, period_label, tasks_created, tasks_completed')
      .order('period', { ascending: true })
      .then(({ data }) => {
        if (!data) return;
        const map = new Map<string, { period_label: string; tasks_created: number; tasks_completed: number }>();
        data.forEach((r: any) => {
          const key = `${r.period_type}__${r.period}`;
          const prev = map.get(key);
          if (prev) {
            prev.tasks_created   += Number(r.tasks_created)  || 0;
            prev.tasks_completed += Number(r.tasks_completed) || 0;
          } else {
            map.set(key, { period_label: r.period_label, tasks_created: Number(r.tasks_created) || 0, tasks_completed: Number(r.tasks_completed) || 0 });
          }
        });
        const result: TimeseriesEntry[] = [];
        map.forEach((val, key) => {
          const [pt] = key.split('__');
          result.push({ ...val, period_type: pt as any, period: key.split('__')[1], auth_user_id: '', staff_id: '', display_name: '', service: null });
        });
        setAllTimeseries(result);
      });
  }, []);

  const activeMembers     = teamStats.filter(m => !m.is_inactive).length;
  const totalShiftsActive = teamStats.reduce((s, m) => s + m.shifts_active, 0);
  const totalTasksToday   = teamStats.reduce((s, m) => s + m.tasks_created_today, 0);
  const totalCreated      = teamStats.reduce((s, m) => s + m.tasks_created_total, 0);
  const totalCompleted    = teamStats.reduce((s, m) => s + m.tasks_completed, 0);
  const globalRate        = resolutionRate(totalCreated, totalCompleted);

  const serviceBarData = benchmarks.map(b => ({
    name: serviceLabel(b.service),
    'Tâches créées': Math.round(b.avg_tasks_created),
    'Tâches closes': Math.round(b.avg_tasks_completed),
    'Shifts': Math.round(b.avg_shifts_completed),
  }));

  const maxTasks  = Math.max(...benchmarks.map(b => b.avg_tasks_created), 1);
  const maxShifts = Math.max(...benchmarks.map(b => b.avg_shifts_completed), 1);
  const radarData = benchmarks.map(b => ({
    subject: serviceLabel(b.service),
    tasks:      Math.round((b.avg_tasks_created / maxTasks) * 100),
    résolution: resolutionRate(b.avg_tasks_created, b.avg_tasks_completed),
    shifts:     Math.round((b.avg_shifts_completed / maxShifts) * 100),
  }));

  const chartTimeseries = allTimeseries
    .filter(t => t.period_type === periodFilter)
    .map(t => ({ label: t.period_label, Créées: t.tasks_created, Closes: t.tasks_completed }));

  const categories = [
    { name: 'Incidents',       value: teamStats.reduce((s,m) => s + m.incidents_count, 0),       color: '#f87171' },
    { name: 'Demandes client', value: teamStats.reduce((s,m) => s + m.client_requests_count, 0), color: GOLD },
    { name: 'Follow-ups',      value: teamStats.reduce((s,m) => s + m.follow_ups_count, 0),      color: YELLOW },
    { name: 'Tâches internes', value: teamStats.reduce((s,m) => s + m.internal_tasks_count, 0), color: '#6B8CBA' },
  ].filter(c => c.value > 0);

  // ── State ──────────────────────────────────────────────────────────────────
  const [activeTab,          setActiveTab]          = useState<AnalyticsTab>('services');
  const [indivTrainTab,      setIndivTrainTab]      = useState<IndivTrainTab>('byIndividual');
  const [svcTrainTab,        setSvcTrainTab]        = useState<SvcTrainTab>('byService');
  const [selectedMemberId,   setSelectedMemberId]   = useState<string | null>(null);

  const { memberStats, formationStats, serviceRadars, memberCompetencies, loading: trainingLoading } = useTrainingAnalytics();

  const kpis = [
    { label: 'Shifts actifs',   value: totalShiftsActive, icon: <Activity size={16}/>, color: '#4ade80' },
    { label: 'Tâches du jour',  value: totalTasksToday,   icon: <Zap size={16}/>,      color: YELLOW },
    { label: 'Taux résolution', value: `${globalRate}%`,  icon: <Target size={16}/>,   color: globalRate > 70 ? '#4ade80' : globalRate > 40 ? YELLOW : '#f87171' },
    { label: 'Membres actifs',  value: activeMembers,     icon: <Users size={16}/>,    color: GOLD },
  ];

  // Par Service aggregation (computed)
  const byServiceAgg = useMemo(() => {
    const acc: any = {};
    memberStats.forEach(m => {
      const svc = m.service || 'Inconnu';
      if (!acc[svc]) acc[svc] = { members: 0, quizzes: 0, scores: [] };
      acc[svc].members += 1;
      acc[svc].quizzes += m.quiz_count;
      acc[svc].scores.push(m.avg_score);
    });
    return Object.entries(acc).map(([svc, d]: [string, any]) => ({
      service:      svc,
      members:      d.members,
      quizzes:      d.quizzes,
      avg_score:    Math.round(d.scores.reduce((s: number, v: number) => s + v, 0) / d.scores.length),
      success_rate: Math.round((d.scores.filter((s: number) => s >= 70).length / d.scores.length) * 100),
    }));
  }, [memberStats]);

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <BarChart3 size={22} style={{ color: GOLD }} />
              <h1 className="text-2xl font-semibold text-white tracking-tight">Team Analytics</h1>
            </div>
            <p className="text-sm" style={{ color: 'rgba(187,165,122,0.55)' }}>
              Performance globale de l'équipe Decœur Hotels — vue Direction
            </p>
          </div>
          <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: CARD_BORDER }}>
            {(['day','week','month'] as const).map(p => (
              <button key={p} onClick={() => setPeriodFilter(p)} className="px-3 py-1.5 text-xs font-medium transition-colors"
                style={{ background: periodFilter === p ? GOLD : 'transparent', color: periodFilter === p ? '#13102B' : 'rgba(255,255,255,0.5)' }}>
                {p === 'day' ? 'Jour' : p === 'week' ? 'Semaine' : 'Mois'}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {kpis.map(kpi => (
            <div key={kpi.label} className="rounded-xl p-5 border flex items-start gap-3" style={{ background: CARD_BG, borderColor: CARD_BORDER }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${kpi.color}18`, color: kpi.color }}>{kpi.icon}</div>
              <div>
                <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{kpi.label}</p>
                <p className="text-2xl font-bold" style={{ color: loading ? 'rgba(255,255,255,0.2)' : kpi.color }}>{loading ? '—' : kpi.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Tab Navigation : 4 onglets ────────────────────────────────── */}
        <div className="flex items-center gap-1 p-1 rounded-xl mb-6 w-fit"
          style={{ backgroundColor: 'rgba(30,26,55,0.9)', border: '1px solid rgba(187,165,122,0.15)' }}>
          {([
            { id: 'services',          label: 'Services Task Management',   icon: BarChart3 },
            { id: 'individual',        label: 'Individual Task Management', icon: Users },
            { id: 'trainingIndividual',label: 'Individual Training Results', icon: Award },
            { id: 'trainingServices',  label: 'Services Training Results',  icon: Target },
          ] as { id: AnalyticsTab; label: string; icon: any }[]).map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
              style={activeTab === id ? { backgroundColor: 'rgba(187,165,122,0.18)', color: '#BBA57A' } : { color: 'rgba(187,165,122,0.45)' }}>
              <Icon size={14} />{label}
            </button>
          ))}
        </div>

        {/* ══════════ SERVICES TASK MANAGEMENT ══════════ */}
        {activeTab === 'services' && (<>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div className="rounded-xl border p-5" style={{ background: CARD_BG, borderColor: CARD_BORDER }}>
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={14} style={{ color: GOLD }} />
                <p className="text-sm font-semibold text-white">Performance par service</p>
                <span className="text-xs ml-1" style={{ color: 'rgba(255,255,255,0.35)' }}>moyennes</span>
              </div>
              {loading || serviceBarData.length === 0 ? (
                <div className="h-52 flex items-center justify-center" style={{ color: 'rgba(255,255,255,0.2)' }}>Chargement…</div>
              ) : (
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={serviceBarData} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(187,165,122,0.05)' }} />
                    <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }} />
                    <Bar dataKey="Tâches créées" fill={YELLOW} radius={[4,4,0,0]} />
                    <Bar dataKey="Tâches closes" fill="#4ade80" radius={[4,4,0,0]} />
                    <Bar dataKey="Shifts" fill={GOLD} radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="rounded-xl border p-5" style={{ background: CARD_BG, borderColor: CARD_BORDER }}>
              <div className="flex items-center gap-2 mb-4">
                <Award size={14} style={{ color: GOLD }} />
                <p className="text-sm font-semibold text-white">Profil comparatif services</p>
                <span className="text-xs ml-1" style={{ color: 'rgba(255,255,255,0.35)' }}>normalisé 0–100</span>
              </div>
              {loading || radarData.length === 0 ? (
                <div className="h-52 flex items-center justify-center" style={{ color: 'rgba(255,255,255,0.2)' }}>Chargement…</div>
              ) : (
                <ResponsiveContainer width="100%" height={210}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0,100]} tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Radar name="Volume tâches" dataKey="tasks" stroke={YELLOW} fill={YELLOW} fillOpacity={0.15} />
                    <Radar name="Résolution" dataKey="résolution" stroke="#4ade80" fill="#4ade80" fillOpacity={0.12} />
                    <Radar name="Shifts" dataKey="shifts" stroke={GOLD} fill={GOLD} fillOpacity={0.12} />
                    <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }} />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>)}

        {/* ══════════ INDIVIDUAL TASK MANAGEMENT ══════════ */}
        {activeTab === 'individual' && (<>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <div className="lg:col-span-2 rounded-xl border p-5" style={{ background: CARD_BG, borderColor: CARD_BORDER }}>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={14} style={{ color: GOLD }} />
                <p className="text-sm font-semibold text-white">Évolution temporelle</p>
              </div>
              {loading || chartTimeseries.length === 0 ? (
                <div className="h-48 flex items-center justify-center" style={{ color: 'rgba(255,255,255,0.2)' }}>Pas encore de données</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartTimeseries}>
                    <defs>
                      <linearGradient id="gradCreated" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={YELLOW} stopOpacity={0.3} /><stop offset="95%" stopColor={YELLOW} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradClosed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4ade80" stopOpacity={0.25} /><stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }} />
                    <Area type="monotone" dataKey="Créées" stroke={YELLOW} strokeWidth={2} fill="url(#gradCreated)" dot={{ fill: YELLOW, r: 3 }} />
                    <Area type="monotone" dataKey="Closes" stroke="#4ade80" strokeWidth={2} fill="url(#gradClosed)" dot={{ fill: '#4ade80', r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="rounded-xl border p-5" style={{ background: CARD_BG, borderColor: CARD_BORDER }}>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 size={14} style={{ color: GOLD }} />
                <p className="text-sm font-semibold text-white">Répartition</p>
              </div>
              {loading ? (
                <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-8 rounded" style={{ background: 'rgba(255,255,255,0.04)' }} />)}</div>
              ) : (
                <div className="space-y-3">
                  {(() => {
                    const total = categories.reduce((s, c) => s + c.value, 0) || 1;
                    return categories.map(c => (
                      <div key={c.name}>
                        <div className="flex justify-between text-xs mb-1">
                          <span style={{ color: 'rgba(255,255,255,0.55)' }}>{c.name}</span>
                          <span style={{ color: c.color }} className="font-bold">{c.value}</span>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${Math.round((c.value/total)*100)}%`, background: c.color }} />
                        </div>
                      </div>
                    ));
                  })()}
                  {categories.length === 0 && <p className="text-xs text-center py-8" style={{ color: 'rgba(255,255,255,0.2)' }}>Aucune donnée</p>}
                </div>
              )}
            </div>
          </div>
          <div className="rounded-xl border" style={{ background: CARD_BG, borderColor: CARD_BORDER }}>
            <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: CARD_BORDER }}>
              <Users size={15} style={{ color: GOLD }} />
              <p className="text-sm font-semibold text-white">Classement équipe</p>
              <span className="ml-auto text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{teamStats.length} membres</span>
            </div>
            {loading ? (
              <div className="p-6 space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-12 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }} />)}</div>
            ) : teamStats.length === 0 ? (
              <div className="p-10 text-center text-sm" style={{ color: 'rgba(255,255,255,0.2)' }}>Aucun membre trouvé</div>
            ) : (
              <div className="p-3 space-y-1">{teamStats.map((m, i) => <MemberRow key={m.staff_id} member={m} rank={i + 1} />)}</div>
            )}
          </div>
          <IndividualBubbleChart teamStats={teamStats} loading={loading} />
        </>)}

        {/* ══════════ INDIVIDUAL TRAINING RESULTS ══════════ */}
        {activeTab === 'trainingIndividual' && (
          <div>
            <SubTabBar
              tabs={[
                { id: 'byIndividual', label: 'Par Individu' },
                { id: 'byFormation',  label: 'Par Formation' },
                { id: 'byCompetence', label: 'Par Compétence' },
              ]}
              active={indivTrainTab}
              onChange={(id) => setIndivTrainTab(id as IndivTrainTab)}
            />

            {/* Par Individu */}
            {indivTrainTab === 'byIndividual' && (
              <div className="rounded-xl border" style={{ background: CARD_BG, borderColor: CARD_BORDER }}>
                <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: CARD_BORDER }}>
                  <Users size={15} style={{ color: GOLD }} />
                  <p className="text-sm font-semibold text-white">Résultats par membre</p>
                  <span className="ml-auto text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {memberStats.length} membres — cliquer pour voir le radar
                  </span>
                </div>
                {trainingLoading ? (
                  <div className="p-8 text-center text-sm" style={{ color: 'rgba(255,255,255,0.25)' }}>Chargement…</div>
                ) : memberStats.length === 0 ? (
                  <div className="p-10 text-center text-sm" style={{ color: 'rgba(255,255,255,0.2)' }}>Aucun résultat</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(187,165,122,0.1)' }}>
                          {['Membre', 'Service', 'QCMs passés', 'Score moyen', 'Meilleur score', 'Dernière formation'].map(h => (
                            <th key={h} className="px-5 py-3 text-left text-xs font-medium" style={{ color: 'rgba(187,165,122,0.55)' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {memberStats.map((m, i) => {
                          const svcColor  = SERVICE_COLORS[m.service || ''] || GOLD;
                          const isSelected = selectedMemberId === m.user_id;
                          const dateStr   = m.last_completed_at
                            ? (() => { try { return format(parseISO(m.last_completed_at), 'd MMM yyyy', { locale: fr }); } catch { return '—'; } })()
                            : '—';
                          return (
                            <>
                              <tr key={m.user_id}
                                onClick={() => setSelectedMemberId(isSelected ? null : m.user_id)}
                                className="cursor-pointer transition-all"
                                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: isSelected ? `${svcColor}12` : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                                <td className="px-5 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                      style={{ background: svcColor + '22', color: svcColor, border: `1px solid ${isSelected ? svcColor : svcColor + '44'}` }}>
                                      {(m.display_name.split(' ')[0]?.[0] || '') + (m.display_name.split(' ')[1]?.[0] || '')}
                                    </div>
                                    <span className="text-white font-medium">{m.display_name}</span>
                                    {isSelected && <span className="text-xs ml-1" style={{ color: svcColor }}>▾</span>}
                                  </div>
                                </td>
                                <td className="px-5 py-3">
                                  <span className="px-2 py-0.5 rounded-md text-xs font-medium" style={{ background: svcColor + '20', color: svcColor }}>
                                    {serviceLabel(m.service)}
                                  </span>
                                </td>
                                <td className="px-5 py-3 text-center">
                                  <span className="font-bold" style={{ color: YELLOW }}>{m.quiz_count}</span>
                                </td>
                                <td className="px-5 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', minWidth: 60 }}>
                                      <div className="h-1.5 rounded-full" style={{ width: `${m.avg_score}%`, background: m.avg_score >= 70 ? '#4ade80' : m.avg_score >= 50 ? YELLOW : '#f87171' }} />
                                    </div>
                                    <span className="text-xs font-bold w-10 text-right" style={{ color: m.avg_score >= 70 ? '#4ade80' : m.avg_score >= 50 ? YELLOW : '#f87171' }}>{m.avg_score}%</span>
                                  </div>
                                </td>
                                <td className="px-5 py-3 text-center">
                                  <span className="font-bold" style={{ color: GOLD }}>{m.best_score}%</span>
                                </td>
                                <td className="px-5 py-3 text-xs" style={{ color: 'rgba(255,255,255,0.45)', maxWidth: 200 }}>
                                  <p className="truncate">{m.last_document}</p>
                                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>{dateStr}</p>
                                </td>
                              </tr>
                              {/* Radar expand */}
                              {isSelected && (() => {
                                const radar  = memberCompetencies[m.user_id];
                                const sColor = SERVICE_COLORS[m.service || ''] || GOLD;
                                return (
                                  <tr key={`radar-${m.user_id}`} style={{ background: `${sColor}08` }}>
                                    <td colSpan={6} className="px-6 py-4">
                                      <div className="flex items-start gap-6">
                                        <div className="flex-shrink-0">
                                          <p className="text-xs font-semibold mb-1" style={{ color: sColor }}>Radar compétences</p>
                                          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{m.display_name}</p>
                                        </div>
                                        {!radar || radar.length === 0 ? (
                                          <p className="text-xs py-2" style={{ color: 'rgba(255,255,255,0.25)' }}>Aucune donnée de compétence pour ce membre</p>
                                        ) : (
                                          <ResponsiveContainer width="100%" height={200}>
                                            <RadarChart data={radar}>
                                              <PolarGrid stroke="rgba(255,255,255,0.08)" />
                                              <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                                              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 8 }} />
                                              <Tooltip content={<CustomTooltip />} />
                                              <Radar name="Score" dataKey="score" stroke={sColor} fill={sColor} fillOpacity={0.2} />
                                            </RadarChart>
                                          </ResponsiveContainer>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })()}
                            </>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Par Formation */}
            {indivTrainTab === 'byFormation' && (
              <FormationCards formationStats={formationStats} trainingLoading={trainingLoading} />
            )}

            {/* Par Compétence */}
            {indivTrainTab === 'byCompetence' && (
              <CompetenceRadars serviceRadars={serviceRadars} trainingLoading={trainingLoading} />
            )}
          </div>
        )}

        {/* ══════════ SERVICES TRAINING RESULTS ══════════ */}
        {activeTab === 'trainingServices' && (
          <div>
            <SubTabBar
              tabs={[
                { id: 'byService',    label: 'Par Service' },
                { id: 'byFormation',  label: 'Par Formation' },
                { id: 'byCompetence', label: 'Par Compétence' },
              ]}
              active={svcTrainTab}
              onChange={(id) => setSvcTrainTab(id as SvcTrainTab)}
            />

            {/* Par Service */}
            {svcTrainTab === 'byService' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {trainingLoading ? (
                  [1,2,3,4].map(i => <div key={i} className="h-32 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }} />)
                ) : byServiceAgg.length === 0 ? (
                  <div className="col-span-4 p-10 text-center text-sm" style={{ color: 'rgba(255,255,255,0.2)' }}>Aucune donnée</div>
                ) : byServiceAgg.map(sd => {
                  const svcColor = SERVICE_COLORS[sd.service] || GOLD;
                  return (
                    <div key={sd.service} className="rounded-xl border p-5" style={{ background: CARD_BG, borderColor: CARD_BORDER }}>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: svcColor }} />
                        <p className="text-sm font-semibold text-white">{serviceLabel(sd.service)}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xl font-bold" style={{ color: YELLOW }}>{sd.quizzes}</p>
                          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>QCMs passés</p>
                        </div>
                        <div>
                          <p className="text-xl font-bold" style={{ color: GOLD }}>{sd.members}</p>
                          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>membres</p>
                        </div>
                        <div>
                          <p className="text-xl font-bold" style={{ color: sd.avg_score >= 70 ? '#4ade80' : sd.avg_score >= 50 ? YELLOW : '#f87171' }}>{sd.avg_score}%</p>
                          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>score moyen</p>
                        </div>
                        <div>
                          <p className="text-xl font-bold" style={{ color: sd.success_rate >= 70 ? '#4ade80' : sd.success_rate >= 50 ? GOLD : '#f87171' }}>{sd.success_rate}%</p>
                          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>réussite</p>
                        </div>
                      </div>
                      <div className="mt-3 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-1 rounded-full" style={{ width: `${sd.avg_score}%`, background: svcColor }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Par Formation */}
            {svcTrainTab === 'byFormation' && (
              <FormationCards formationStats={formationStats} trainingLoading={trainingLoading} />
            )}

            {/* Par Compétence */}
            {svcTrainTab === 'byCompetence' && (
              <CompetenceRadars serviceRadars={serviceRadars} trainingLoading={trainingLoading} />
            )}
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs mt-6" style={{ color: 'rgba(255,255,255,0.18)' }}>
          Données issues de Supabase · Hover sur un membre pour le détail · Vue Direction uniquement
        </p>

      </div>
    </AdminLayout>
  );
}

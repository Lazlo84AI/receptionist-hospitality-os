import { useState, useMemo, useEffect } from 'react';
import { AdminLayout } from './AdminLayout';
import {
  BarChart3, Users, CheckCircle2, TrendingUp,
  Activity, Award, Zap, Target, Clock, AlertTriangle,
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, ScatterChart, Scatter, ZAxis,
} from 'recharts';
import { useMyStatistics, UserTaskStats, TimeseriesEntry } from '@/hooks/useMyStatistics';
import { useTrainingAnalytics } from '@/hooks/useTrainingAnalytics';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
type AnalyticsTab = 'shiftServices' | 'shiftIndividual' | 'services' | 'individual' | 'trainingIndividual' | 'trainingServices';
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

// ─── Shift Member Row (individual shift management) ───────────────────────────
const ShiftMemberRow = ({
  row, rank, dailyData,
}: {
  row: any;
  rank: number;
  dailyData: { date: string; started: number; completed: number }[];
}) => {
  const [hovered, setHovered] = useState(false);
  const svcColor  = SERVICE_COLORS[row.service || ''] || GOLD;
  const rateColor = row.rate >= 80 ? '#4ade80' : row.rate >= 50 ? YELLOW : '#f87171';
  const initials  = row.display_name
    ? (row.display_name.split(' ')[0]?.[0] || '') + (row.display_name.split(' ')[1]?.[0] || '')
    : '?';

  return (
    <div className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>

      {/* Hover chart — apparaît au-dessus de la ligne */}
      {hovered && dailyData.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 z-50 mb-1 rounded-xl border p-4 shadow-2xl"
          style={{ background: '#0F0C24', borderColor: svcColor + '44', minHeight: 130 }}>
          <p className="text-xs font-semibold mb-2" style={{ color: svcColor }}>
            {row.display_name} — évolution shifts
          </p>
          <ResponsiveContainer width="100%" height={85}>
            <LineChart data={dailyData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="started"   name="Démarrés"  stroke="#4ade80" strokeWidth={2} dot={{ fill: '#4ade80', r: 3 }} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="completed" name="Clôturés"  stroke={GOLD}    strokeWidth={2} dot={{ fill: GOLD, r: 3 }}    activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Ligne principale */}
      <div className="flex items-center gap-4 rounded-xl px-4 py-3 transition-all duration-200 cursor-default"
        style={{ background: hovered ? 'rgba(187,165,122,0.06)' : 'transparent', border: `1px solid ${hovered ? CARD_BORDER : 'transparent'}` }}>
        <span className="text-sm font-bold w-6 text-center flex-shrink-0" style={{ color: rank <= 3 ? YELLOW : 'rgba(255,255,255,0.3)' }}>
          {rank <= 3 ? ['🥇','🥈','🥉'][rank-1] : `#${rank}`}
        </span>
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
          style={{ background: `${svcColor}22`, color: svcColor, border: `1px solid ${svcColor}44` }}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{row.display_name}</p>
          <p className="text-xs" style={{ color: svcColor + '99' }}>{serviceLabel(row.service)}</p>
        </div>
        <div className="hidden md:flex items-center gap-5 text-xs">
          <div className="text-center">
            <p className="font-bold" style={{ color: YELLOW }}>{row.started}</p>
            <p style={{ color: 'rgba(255,255,255,0.35)' }}>démarrés</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-green-400">{row.completed}</p>
            <p style={{ color: 'rgba(255,255,255,0.35)' }}>clôturés</p>
          </div>
          <div className="text-center">
            <p className="font-bold" style={{ color: row.unclosed > 0 ? '#f87171' : 'rgba(255,255,255,0.2)' }}>{row.unclosed}</p>
            <p style={{ color: 'rgba(255,255,255,0.35)' }}>non fermés</p>
          </div>
        </div>
        <div className="w-28 flex-shrink-0">
          <div className="flex justify-between text-xs mb-1">
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>sérieux</span>
            <span style={{ color: rateColor }} className="font-bold">{row.rate}%</span>
          </div>
          <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${row.rate}%`, background: rateColor }} />
          </div>
        </div>
      </div>
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

// ─── Formation cards ─────────────────────────────────────────────────────────
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
                <div><p className="text-lg font-bold" style={{ color: YELLOW }}>{f.participant_count}</p><p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>passants</p></div>
                <div><p className="text-lg font-bold" style={{ color: f.avg_score >= 70 ? '#4ade80' : f.avg_score >= 50 ? YELLOW : '#f87171' }}>{f.avg_score}%</p><p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>score moyen</p></div>
                <div><p className="text-lg font-bold" style={{ color: f.success_rate >= 70 ? '#4ade80' : f.success_rate >= 50 ? GOLD : '#f87171' }}>{f.success_rate}%</p><p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>réussite</p></div>
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

// ─── Competence radars ────────────────────────────────────────────────────────
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
  const { teamStats, benchmarks, loading, refetch: refetchStats } = useMyStatistics();

  // ── Period filter state ────────────────────────────────────────────────────
  const [periodFilter, setPeriodFilter] = useState<'day'|'week'|'month'|'custom'>('month');
  const [pendingStart, setPendingStart] = useState<string>(() => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [pendingEnd,   setPendingEnd]   = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [appliedStart, setAppliedStart] = useState<string>(() => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [appliedEnd,   setAppliedEnd]   = useState<string>(() => new Date().toISOString().slice(0, 10));

  // ── Raw per-user day data ──────────────────────────────────────────────────
  const [rawDayRows,  setRawDayRows]  = useState<any[]>([]);
  const [rawLoading,  setRawLoading]  = useState(true);
  const [allTimeseries, setAllTimeseries] = useState<TimeseriesEntry[]>([]);

  // ── Shifts state ───────────────────────────────────────────────────────────
  const [periodShifts,       setPeriodShifts]       = useState<{ started: number; completed: number } | null>(null);
  const [periodShiftDetails, setPeriodShiftDetails] = useState<any[]>([]);

  // ── Fetch timeseries ───────────────────────────────────────────────────────
  useEffect(() => {
    setRawLoading(true);
    supabase
      .from('v_tasks_timeseries')
      .select('period_type, period, period_label, tasks_created, tasks_completed, staff_id, display_name, service')
      .order('period', { ascending: true })
      .then(({ data }) => {
        if (!data) { setRawLoading(false); return; }
        setRawDayRows(
          data
            .filter((r: any) => r.period_type === 'day')
            .map((r: any) => ({
              staff_id:        r.staff_id        || '',
              display_name:    r.display_name    || '',
              service:         r.service         || null,
              period:          r.period          as string,
              period_label:    r.period_label    as string,
              tasks_created:   Number(r.tasks_created)   || 0,
              tasks_completed: Number(r.tasks_completed) || 0,
            }))
        );
        setRawLoading(false);
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

  // ── Active range ───────────────────────────────────────────────────────────
  const activeRange = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    if (periodFilter === 'day') return { start: todayStr, end: todayStr };
    if (periodFilter === 'week') {
      const d = new Date(now);
      const dow = d.getDay();
      d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
      return { start: d.toISOString().slice(0, 10), end: todayStr };
    }
    if (periodFilter === 'month') return { start: `${todayStr.slice(0, 7)}-01`, end: todayStr };
    return { start: appliedStart, end: appliedEnd };
  }, [periodFilter, appliedStart, appliedEnd]);

  // ── Fetch shifts for active range ──────────────────────────────────────────
  useEffect(() => {
    setPeriodShifts(null);
    setPeriodShiftDetails([]);
    supabase
      .from('shifts')
      .select('id, user_id, status, start_time, end_time, service')
      .gte('start_time', `${activeRange.start}T00:00:00`)
      .lte('start_time', `${activeRange.end}T23:59:59`)
      .then(({ data }) => {
        const rows = data || [];
        setPeriodShiftDetails(rows);
        setPeriodShifts({
          started:   rows.length,
          completed: rows.filter((s: any) => s.status === 'completed' && s.end_time != null).length,
        });
      });
  }, [activeRange.start, activeRange.end]);

  // ── Period KPIs (tasks) ────────────────────────────────────────────────────
  const periodKPIs = useMemo(() => {
    const filtered  = rawDayRows.filter(r => r.period >= activeRange.start && r.period <= activeRange.end);
    const created   = filtered.reduce((s, r) => s + r.tasks_created,   0);
    const completed = filtered.reduce((s, r) => s + r.tasks_completed, 0);
    return { created, completed, rate: resolutionRate(created, completed) };
  }, [rawDayRows, activeRange]);

  // ── Period ranking ─────────────────────────────────────────────────────────
  const periodRanking = useMemo((): UserTaskStats[] => {
    const filtered = rawDayRows.filter(r => r.period >= activeRange.start && r.period <= activeRange.end);
    const byStaff  = new Map<string, { display_name: string; service: string | null; created: number; completed: number }>();
    filtered.forEach(r => {
      if (!r.staff_id) return;
      const prev = byStaff.get(r.staff_id);
      if (prev) { prev.created += r.tasks_created; prev.completed += r.tasks_completed; }
      else byStaff.set(r.staff_id, { display_name: r.display_name, service: r.service, created: r.tasks_created, completed: r.tasks_completed });
    });
    teamStats.forEach(m => {
      if (!byStaff.has(m.staff_id))
        byStaff.set(m.staff_id, { display_name: m.display_name, service: m.service, created: 0, completed: 0 });
    });
    return Array.from(byStaff.entries())
      .map(([staff_id, d]) => {
        const orig = teamStats.find(m => m.staff_id === staff_id);
        return {
          ...(orig ?? {}),
          staff_id,
          auth_user_id:             orig?.auth_user_id             ?? '',
          display_name:             d.display_name,
          service:                  d.service,
          first_name:               orig?.first_name               ?? null,
          last_name:                orig?.last_name                ?? null,
          role:                     orig?.role                     ?? '',
          department:               orig?.department               ?? null,
          hierarchy:                orig?.hierarchy                ?? null,
          is_active:                orig?.is_active                ?? true,
          avatar_url:               orig?.avatar_url               ?? null,
          tasks_created_total:      d.created,
          tasks_completed:          d.completed,
          tasks_in_progress:        orig?.tasks_in_progress        ?? 0,
          tasks_pending:            orig?.tasks_pending            ?? 0,
          incidents_count:          orig?.incidents_count          ?? 0,
          client_requests_count:    orig?.client_requests_count    ?? 0,
          follow_ups_count:         orig?.follow_ups_count         ?? 0,
          internal_tasks_count:     orig?.internal_tasks_count     ?? 0,
          tasks_assigned_total:     orig?.tasks_assigned_total     ?? 0,
          tasks_assigned_completed: orig?.tasks_assigned_completed ?? 0,
          tasks_created_today:      orig?.tasks_created_today      ?? 0,
          tasks_created_this_week:  orig?.tasks_created_this_week  ?? 0,
          tasks_created_this_month: orig?.tasks_created_this_month ?? 0,
          shifts_total:             orig?.shifts_total             ?? 0,
          shifts_active:            orig?.shifts_active            ?? 0,
          shifts_completed:         orig?.shifts_completed         ?? 0,
          shifts_today:             orig?.shifts_today             ?? 0,
          shifts_this_week:         orig?.shifts_this_week         ?? 0,
          shifts_this_month:        orig?.shifts_this_month        ?? 0,
          last_shift_at:            orig?.last_shift_at            ?? null,
          last_task_created_at:     orig?.last_task_created_at     ?? null,
          is_inactive:              orig?.is_inactive              ?? false,
        } as UserTaskStats;
      })
      .sort((a, b) => b.tasks_created_total - a.tasks_created_total);
  }, [rawDayRows, activeRange, teamStats]);

  // ── Shifts par service (inclut tous les services de l'equipe) ─────────────
  const shiftsByService = useMemo(() => {
    const acc: Record<string, { started: number; completed: number; unclosed: number }> = {};

    // Pré-initialiser tous les services connus depuis teamStats (meme avec 0)
    teamStats.forEach(m => {
      const svc = m.service ? m.service.toLowerCase().trim() : null;
      if (svc && !acc[svc]) acc[svc] = { started: 0, completed: 0, unclosed: 0 };
    });

    // Remplir avec les données réelles de shifts
    periodShiftDetails.forEach(s => {
      const memberSvc = teamStats.find(m => m.staff_id === s.user_id);
      const svc = (s.service || memberSvc?.service || 'N/A').toLowerCase().trim();
      if (!acc[svc]) acc[svc] = { started: 0, completed: 0, unclosed: 0 };
      acc[svc].started++;
      if (s.status === 'completed' && s.end_time != null) acc[svc].completed++;
      else acc[svc].unclosed++;
    });

    return Object.entries(acc)
      .map(([service, d]) => ({
        service,
        started:   d.started,
        completed: d.completed,
        unclosed:  d.unclosed,
        rate:      d.started > 0 ? Math.round((d.completed / d.started) * 100) : 0,
      }))
      .sort((a, b) => b.started - a.started);
  }, [periodShiftDetails, teamStats]);

  // ── Shifts par individu (inclut tous les membres) ─────────────────────────
  const shiftsByUser = useMemo(() => {
    const acc: Record<string, { started: number; completed: number; unclosed: number; display_name: string; service: string | null }> = {};
    periodShiftDetails.forEach(s => {
      const uid = s.user_id;
      if (!uid) return;
      if (!acc[uid]) {
        const member = teamStats.find(m => m.staff_id === uid);
        acc[uid] = {
          started:      0,
          completed:    0,
          unclosed:     0,
          display_name: member?.display_name || 'Inconnu',
          service:      s.service || member?.service || null,
        };
      }
      acc[uid].started++;
      if (s.status === 'completed' && s.end_time != null) acc[uid].completed++;
      else acc[uid].unclosed++;
    });
    // Inclure TOUS les membres meme sans shift
    teamStats.forEach(m => {
      if (!acc[m.staff_id]) {
        acc[m.staff_id] = { started: 0, completed: 0, unclosed: 0, display_name: m.display_name, service: m.service };
      }
    });
    return Object.entries(acc)
      .map(([user_id, d]) => ({ ...d, user_id, rate: d.started > 0 ? Math.round((d.completed / d.started) * 100) : 0 }))
      .sort((a, b) => b.started - a.started);
  }, [periodShiftDetails, teamStats]);

  // ── Timeline de shifts par user (pour hover chart) ─────────────────────────
  const userDailyShifts = useMemo(() => {
    const dailyMap: Record<string, Record<string, { started: number; completed: number }>> = {};
    periodShiftDetails.forEach(s => {
      if (!s.user_id || !s.start_time) return;
      const date = (s.start_time as string).slice(0, 10);
      if (!dailyMap[s.user_id]) dailyMap[s.user_id] = {};
      if (!dailyMap[s.user_id][date]) dailyMap[s.user_id][date] = { started: 0, completed: 0 };
      dailyMap[s.user_id][date].started++;
      if (s.status === 'completed' && s.end_time) dailyMap[s.user_id][date].completed++;
    });
    const result: Record<string, { date: string; started: number; completed: number }[]> = {};
    Object.entries(dailyMap).forEach(([uid, dates]) => {
      result[uid] = Object.entries(dates)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, d]) => ({ date: date.slice(5), ...d })); // MM-DD
    });
    return result;
  }, [periodShiftDetails]);

  // ── Shared computations ────────────────────────────────────────────────────
  const activeMembers = teamStats.filter(m => !m.is_inactive).length;

  const serviceBarData = benchmarks.map(b => ({
    name: serviceLabel(b.service),
    'Tâches créées': Math.round(b.avg_tasks_created),
    'Tâches closes': Math.round(b.avg_tasks_completed),
    'Shifts': Math.round(b.avg_shifts_completed),
  }));

  const maxTasks  = Math.max(...benchmarks.map(b => b.avg_tasks_created), 1);
  const maxShifts = Math.max(...benchmarks.map(b => b.avg_shifts_completed), 1);
  const radarData = benchmarks.map(b => ({
    subject:    serviceLabel(b.service),
    tasks:      Math.round((b.avg_tasks_created / maxTasks) * 100),
    résolution: resolutionRate(b.avg_tasks_created, b.avg_tasks_completed),
    shifts:     Math.round((b.avg_shifts_completed / maxShifts) * 100),
  }));

  const chartTimeseries = useMemo(() => {
    if (periodFilter === 'custom') {
      return allTimeseries
        .filter(t => t.period_type === 'day' && t.period >= appliedStart && t.period <= appliedEnd)
        .map(t => ({ label: t.period_label, Créées: t.tasks_created, Closes: t.tasks_completed }));
    }
    return allTimeseries
      .filter(t => t.period_type === periodFilter)
      .map(t => ({ label: t.period_label, Créées: t.tasks_created, Closes: t.tasks_completed }));
  }, [allTimeseries, periodFilter, appliedStart, appliedEnd]);

  const categories = [
    { name: 'Incidents',       value: teamStats.reduce((s,m) => s + m.incidents_count, 0),       color: '#f87171' },
    { name: 'Demandes client', value: teamStats.reduce((s,m) => s + m.client_requests_count, 0), color: GOLD },
    { name: 'Follow-ups',      value: teamStats.reduce((s,m) => s + m.follow_ups_count, 0),      color: YELLOW },
    { name: 'Tâches internes', value: teamStats.reduce((s,m) => s + m.internal_tasks_count, 0),  color: '#6B8CBA' },
  ].filter(c => c.value > 0);

  const periodLabel = periodFilter === 'day'   ? "aujourd'hui"
    : periodFilter === 'week'  ? 'cette semaine'
    : periodFilter === 'month' ? 'ce mois'
    : `${activeRange.start} → ${activeRange.end}`;

  const kpiLoading = loading || rawLoading;

  // ── Sub-tabs state ─────────────────────────────────────────────────────────
  const [activeTab,        setActiveTab]        = useState<AnalyticsTab>('shiftServices');
  const [indivTrainTab,    setIndivTrainTab]    = useState<IndivTrainTab>('byIndividual');
  const [svcTrainTab,      setSvcTrainTab]      = useState<SvcTrainTab>('byService');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedFormation, setSelectedFormation] = useState<string | null>(null);
  const [formationRadarData, setFormationRadarData] = useState<any[]>([]);

  const { memberStats, formationStats, serviceRadars, memberCompetencies, loading: trainingLoading } = useTrainingAnalytics();

  // ── Modal radar membre (Individual Training) ───────────────────────────────
  const [modalMemberId, setModalMemberId] = useState<string | null>(null);
  const [modalMetierAxes, setModalMetierAxes] = useState<{ subject: string; score: number; competency_key: string }[]>([]);
  const [modalManagerAxes, setModalManagerAxes] = useState<{ subject: string; score: number; competency_key: string }[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    if (!modalMemberId) {
      setModalMetierAxes([]);
      setModalManagerAxes([]);
      return;
    }
    const member = memberStats.find(m => m.user_id === modalMemberId);
    if (!member) return;

    const fetchModalData = async () => {
      setModalLoading(true);
      try {
        // Cles metier (service du membre, hierarchy=Collaborator) — TOUTES les keys du profil avec label
        const { data: metierKeys } = await (supabase as any)
          .from('service_competency_profiles')
          .select('competency_key, label')
          .eq('service', member.service)
          .eq('hierarchy', 'Collaborator');

        // Si Manager: cles transversales (service=NULL, hierarchy=Manager) avec label
        let managerKeys: any[] = [];
        if (member.hierarchy === 'Manager') {
          const { data } = await (supabase as any)
            .from('service_competency_profiles')
            .select('competency_key, label')
            .is('service', null)
            .eq('hierarchy', 'Manager');
          managerKeys = data || [];
        }

        // Map des scores existants du user (peut etre vide pour certaines keys du profil)
        const userScores = memberCompetencies[modalMemberId] || [];
        const userScoreMap = new Map<string, number>(
          userScores.map((s: any) => [s.competency_key, s.score])
        );

        // Construire les axes en partant des keys du profil : score si existe, sinon 0
        const metierAxes = (metierKeys || []).map((k: any) => ({
          competency_key: k.competency_key,
          subject: k.label || k.competency_key,
          score: userScoreMap.get(k.competency_key) ?? 0,
        }));

        const managerAxes = managerKeys.map((k: any) => ({
          competency_key: k.competency_key,
          subject: k.label || k.competency_key,
          score: userScoreMap.get(k.competency_key) ?? 0,
        }));

        setModalMetierAxes(metierAxes);
        setModalManagerAxes(managerAxes);
      } catch (err) {
        console.error('Modal radar fetch error:', err);
      } finally {
        setModalLoading(false);
      }
    };

    fetchModalData();
  }, [modalMemberId, memberStats, memberCompetencies]);

  // ── Effect pour charger le radar de formation sélectionnée ──────────────
  useEffect(() => {
    if (!selectedFormation) {
      setFormationRadarData([]);
      return;
    }

    // Query formation_criteria_mapping pour cette formation
    const fetchFormationRadar = async () => {
      try {
        const { data: mappings } = await (supabase as any)
          .from('formation_criteria_mapping')
          .select('competency_key, weight')
          .ilike('document_name', `%${selectedFormation}%`);

        if (mappings && mappings.length > 0) {
          // Transformer en données radar
          const radarData = mappings.map((m: any) => ({
            subject: m.competency_key,
            score: Math.round(m.weight * 10), // Convertir 0-10 vers 0-100
            potential: Math.round(m.weight * 10), // Score potentiel identique
          }));
          setFormationRadarData(radarData);
        } else {
          setFormationRadarData([]);
        }
      } catch (err) {
        console.error('Erreur formation radar:', err);
        setFormationRadarData([]);
      }
    };

    fetchFormationRadar();
  }, [selectedFormation]);

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

  const shiftBarData = shiftsByService.map(s => ({
    name:         serviceLabel(s.service),
    'Démarrés':   s.started,
    'Clôturés':   s.completed,
    'Non fermés': s.unclosed,
  }));

  // ── Render ─────────────────────────────────────────────────────────────────
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
          <div className="flex flex-col items-end gap-2">
            <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: CARD_BORDER }}>
              {(['day','week','month'] as const).map(p => (
                <button key={p} onClick={() => setPeriodFilter(p)} className="px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{ background: periodFilter === p ? GOLD : 'transparent', color: periodFilter === p ? '#13102B' : 'rgba(255,255,255,0.5)' }}>
                  {p === 'day' ? 'Jour' : p === 'week' ? 'Semaine' : 'Mois'}
                </button>
              ))}
              <button onClick={() => setPeriodFilter('custom')} className="px-3 py-1.5 text-xs font-medium transition-colors"
                style={{ background: periodFilter === 'custom' ? GOLD : 'transparent', color: periodFilter === 'custom' ? '#13102B' : 'rgba(255,255,255,0.5)', borderLeft: `1px solid ${CARD_BORDER}` }}>
                Periode
              </button>
            </div>
            {periodFilter === 'custom' && (
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>Du</span>
                  <input type="date" value={pendingStart} onChange={e => setPendingStart(e.target.value)}
                    className="rounded-lg px-2 py-1 text-xs outline-none"
                    style={{ background: 'rgba(30,26,55,0.9)', border: `1px solid ${CARD_BORDER}`, color: GOLD, colorScheme: 'dark' }} />
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>au</span>
                  <input type="date" value={pendingEnd} onChange={e => setPendingEnd(e.target.value)}
                    className="rounded-lg px-2 py-1 text-xs outline-none"
                    style={{ background: 'rgba(30,26,55,0.9)', border: `1px solid ${CARD_BORDER}`, color: GOLD, colorScheme: 'dark' }} />
                </div>
                <button
                  onClick={() => { setAppliedStart(pendingStart); setAppliedEnd(pendingEnd); refetchStats(); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                  style={{ background: GOLD, color: '#13102B' }}>
                  Appliquer aux statistiques
                </button>
              </div>
            )}
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl p-5 border flex items-start gap-3" style={{ background: CARD_BG, borderColor: CARD_BORDER }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${YELLOW}18`, color: YELLOW }}><Zap size={16}/></div>
            <div>
              <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Tâches {periodLabel}</p>
              <p className="text-2xl font-bold" style={{ color: kpiLoading ? 'rgba(255,255,255,0.2)' : YELLOW }}>{kpiLoading ? '—' : periodKPIs.created}</p>
            </div>
          </div>
          <div className="rounded-xl p-5 border flex items-start gap-3" style={{ background: CARD_BG, borderColor: CARD_BORDER }}>
            {(() => {
              const c = periodKPIs.rate > 70 ? '#4ade80' : periodKPIs.rate > 40 ? YELLOW : '#f87171';
              return (<>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${c}18`, color: c }}><Target size={16}/></div>
                <div>
                  <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Taux résolution</p>
                  <p className="text-2xl font-bold" style={{ color: kpiLoading ? 'rgba(255,255,255,0.2)' : c }}>{kpiLoading ? '—' : `${periodKPIs.rate}%`}</p>
                </div>
              </>);
            })()}
          </div>
          <div className="rounded-xl p-5 border flex items-start gap-3" style={{ background: CARD_BG, borderColor: CARD_BORDER }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#4ade8018', color: '#4ade80' }}><Activity size={16}/></div>
            <div className="flex-1">
              <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Shifts {periodLabel}</p>
              {kpiLoading || !periodShifts ? (
                <p className="text-2xl font-bold" style={{ color: 'rgba(255,255,255,0.2)' }}>—</p>
              ) : (
                <div>
                  <p className="text-xl font-bold leading-tight" style={{ color: '#4ade80' }}>
                    {periodShifts.started}<span className="text-xs font-normal ml-1" style={{ color: 'rgba(255,255,255,0.35)' }}>démarrés</span>
                  </p>
                  <p className="text-sm font-semibold mt-0.5" style={{ color: GOLD }}>
                    {periodShifts.completed}<span className="text-xs font-normal ml-1" style={{ color: 'rgba(255,255,255,0.35)' }}>clôturés</span>
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="rounded-xl p-5 border flex items-start gap-3" style={{ background: CARD_BG, borderColor: CARD_BORDER }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${GOLD}18`, color: GOLD }}><Users size={16}/></div>
            <div>
              <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Membres actifs</p>
              <p className="text-2xl font-bold" style={{ color: loading ? 'rgba(255,255,255,0.2)' : GOLD }}>{loading ? '—' : activeMembers}</p>
            </div>
          </div>
        </div>

        {/* ── Tab Navigation : 6 onglets — pleine largeur ───────────────── */}
        <div className="flex items-center p-1 rounded-xl mb-6 w-full"
          style={{ backgroundColor: 'rgba(30,26,55,0.9)', border: '1px solid rgba(187,165,122,0.15)' }}>
          {([
            { id: 'shiftServices',      label: 'Services Shift',           icon: Clock },
            { id: 'shiftIndividual',    label: 'Individual Shift',         icon: AlertTriangle },
            { id: 'services',           label: 'Services Task Management', icon: BarChart3 },
            { id: 'individual',         label: 'Individual Task',          icon: Users },
            { id: 'trainingIndividual', label: 'Individual Training',      icon: Award },
            { id: 'trainingServices',   label: 'Services Training',        icon: Target },
          ] as { id: AnalyticsTab; label: string; icon: any }[]).map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className="flex flex-1 items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-200"
              style={activeTab === id ? { backgroundColor: 'rgba(187,165,122,0.18)', color: '#BBA57A' } : { color: 'rgba(187,165,122,0.45)' }}>
              <Icon size={13} />{label}
            </button>
          ))}
        </div>

        {/* ══════════ SERVICES SHIFT MANAGEMENT ══════════ */}
        {activeTab === 'shiftServices' && (
          <div>
            {periodShifts && (
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="rounded-xl p-5 border flex items-center gap-4" style={{ background: CARD_BG, borderColor: CARD_BORDER }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#4ade8022', color: '#4ade80' }}><Activity size={18}/></div>
                  <div>
                    <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Shifts démarrés</p>
                    <p className="text-3xl font-bold" style={{ color: '#4ade80' }}>{periodShifts.started}</p>
                  </div>
                </div>
                <div className="rounded-xl p-5 border flex items-center gap-4" style={{ background: CARD_BG, borderColor: CARD_BORDER }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${GOLD}22`, color: GOLD }}><CheckCircle2 size={18}/></div>
                  <div>
                    <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Shifts clôturés</p>
                    <p className="text-3xl font-bold" style={{ color: GOLD }}>{periodShifts.completed}</p>
                  </div>
                </div>
                <div className="rounded-xl p-5 border flex items-center gap-4" style={{ background: CARD_BG, borderColor: CARD_BORDER }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${periodShifts.started - periodShifts.completed > 0 ? '#f87171' : '#4ade80'}22`, color: periodShifts.started - periodShifts.completed > 0 ? '#f87171' : '#4ade80' }}><AlertTriangle size={18}/></div>
                  <div>
                    <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Non fermés</p>
                    <p className="text-3xl font-bold" style={{ color: periodShifts.started - periodShifts.completed > 0 ? '#f87171' : '#4ade80' }}>
                      {periodShifts.started - periodShifts.completed}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-xl border p-5" style={{ background: CARD_BG, borderColor: CARD_BORDER }}>
                <div className="flex items-center gap-2 mb-4">
                  <Clock size={14} style={{ color: GOLD }} />
                  <p className="text-sm font-semibold text-white">Shifts par service</p>
                  <span className="text-xs ml-1 px-2 py-0.5 rounded-md" style={{ background: 'rgba(187,165,122,0.12)', color: GOLD }}>{periodLabel}</span>
                </div>
                {shiftBarData.length === 0 ? (
                  <div className="h-52 flex items-center justify-center text-sm" style={{ color: 'rgba(255,255,255,0.2)' }}>Aucune donnée</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={shiftBarData} barCategoryGap="30%">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(187,165,122,0.05)' }} />
                      <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }} />
                      <Bar dataKey="Démarrés"   fill="#4ade80" radius={[4,4,0,0]} />
                      <Bar dataKey="Clôturés"   fill={GOLD}    radius={[4,4,0,0]} />
                      <Bar dataKey="Non fermés" fill="#f87171" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="space-y-3">
                {shiftsByService.length === 0 ? (
                  <div className="rounded-xl border p-10 text-center text-sm" style={{ background: CARD_BG, borderColor: CARD_BORDER, color: 'rgba(255,255,255,0.2)' }}>
                    Aucun shift sur cette période
                  </div>
                ) : shiftsByService.map(s => {
                  const svcColor  = SERVICE_COLORS[s.service?.toLowerCase() || ''] || GOLD;
                  const rateColor = s.rate >= 80 ? '#4ade80' : s.rate >= 50 ? YELLOW : '#f87171';
                  return (
                    <div key={s.service} className="rounded-xl border p-4" style={{ background: CARD_BG, borderColor: CARD_BORDER }}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: svcColor }} />
                        <p className="text-sm font-semibold text-white">{serviceLabel(s.service)}</p>
                        <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-md" style={{ background: `${rateColor}22`, color: rateColor }}>
                          {s.rate}% sérieux
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-center mb-3">
                        <div><p className="text-xl font-bold" style={{ color: '#4ade80' }}>{s.started}</p><p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>démarrés</p></div>
                        <div><p className="text-xl font-bold" style={{ color: GOLD }}>{s.completed}</p><p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>clôturés</p></div>
                        <div><p className="text-xl font-bold" style={{ color: s.unclosed > 0 ? '#f87171' : 'rgba(255,255,255,0.2)' }}>{s.unclosed}</p><p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>non fermés</p></div>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${s.rate}%`, background: rateColor }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ══════════ INDIVIDUAL SHIFT MANAGEMENT ══════════ */}
        {activeTab === 'shiftIndividual' && (
          <div>
            {periodShifts && (
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="rounded-xl p-5 border flex items-center gap-4" style={{ background: CARD_BG, borderColor: CARD_BORDER }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#4ade8022', color: '#4ade80' }}><Activity size={18}/></div>
                  <div><p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Shifts démarrés</p><p className="text-3xl font-bold" style={{ color: '#4ade80' }}>{periodShifts.started}</p></div>
                </div>
                <div className="rounded-xl p-5 border flex items-center gap-4" style={{ background: CARD_BG, borderColor: CARD_BORDER }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${GOLD}22`, color: GOLD }}><CheckCircle2 size={18}/></div>
                  <div><p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Shifts clôturés</p><p className="text-3xl font-bold" style={{ color: GOLD }}>{periodShifts.completed}</p></div>
                </div>
                <div className="rounded-xl p-5 border flex items-center gap-4" style={{ background: CARD_BG, borderColor: CARD_BORDER }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#f8717122', color: '#f87171' }}><AlertTriangle size={18}/></div>
                  <div><p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Non fermés</p><p className="text-3xl font-bold" style={{ color: periodShifts.started - periodShifts.completed > 0 ? '#f87171' : '#4ade80' }}>{periodShifts.started - periodShifts.completed}</p></div>
                </div>
              </div>
            )}

            <div className="rounded-xl border" style={{ background: CARD_BG, borderColor: CARD_BORDER }}>
              <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: CARD_BORDER }}>
                <AlertTriangle size={15} style={{ color: GOLD }} />
                <p className="text-sm font-semibold text-white">Classement shifts — sérieux de déclaration</p>
                <span className="text-xs ml-2 px-2 py-0.5 rounded-md" style={{ background: 'rgba(187,165,122,0.12)', color: GOLD }}>{periodLabel}</span>
                <span className="ml-auto text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{shiftsByUser.length} membres</span>
              </div>
              <div className="hidden md:flex items-center gap-4 px-5 py-2 border-b text-xs" style={{ borderColor: 'rgba(187,165,122,0.06)', color: 'rgba(255,255,255,0.3)' }}>
                <span className="w-6 flex-shrink-0" /><span className="w-8 flex-shrink-0" /><span className="flex-1" />
                <div className="flex items-center gap-5 mr-4">
                  <span className="w-16 text-center">démarrés</span>
                  <span className="w-16 text-center">clôturés</span>
                  <span className="w-16 text-center" style={{ color: '#f87171' }}>non fermés</span>
                </div>
                <span className="w-28 text-right">taux sérieux</span>
              </div>
              {!periodShifts ? (
                <div className="p-6 space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-12 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }} />)}</div>
              ) : shiftsByUser.length === 0 ? (
                <div className="p-10 text-center text-sm" style={{ color: 'rgba(255,255,255,0.2)' }}>Aucun shift sur cette période</div>
              ) : (
                <div className="p-3 space-y-1">
                  {shiftsByUser.map((row, i) => (
                    <ShiftMemberRow
                      key={row.user_id || row.display_name + i}
                      row={row}
                      rank={i + 1}
                      dailyData={userDailyShifts[row.user_id] || []}
                    />
                  ))}
                </div>
              )}
            </div>

            {periodShifts && (periodShifts.started - periodShifts.completed) > 0 && (
              <div className="mt-4 rounded-xl border px-5 py-4 flex items-start gap-3" style={{ background: 'rgba(248,113,113,0.06)', borderColor: 'rgba(248,113,113,0.25)' }}>
                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#f87171' }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#f87171' }}>
                    {periodShifts.started - periodShifts.completed} shift{periodShifts.started - periodShifts.completed > 1 ? 's' : ''} non fermé{periodShifts.started - periodShifts.completed > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(248,113,113,0.7)' }}>
                    Ces shifts ont été démarrés mais jamais clôturés. Rappeler aux membres concernés de fermer leur shift après chaque prise de service.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

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
              <span className="text-xs ml-2 px-2 py-0.5 rounded-md" style={{ background: 'rgba(187,165,122,0.12)', color: GOLD }}>{periodLabel}</span>
              <span className="ml-auto text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{periodRanking.length} membres</span>
            </div>
            {kpiLoading ? (
              <div className="p-6 space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-12 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }} />)}</div>
            ) : periodRanking.length === 0 ? (
              <div className="p-10 text-center text-sm" style={{ color: 'rgba(255,255,255,0.2)' }}>Aucun membre trouvé</div>
            ) : (
              <div className="p-3 space-y-1">{periodRanking.map((m, i) => <MemberRow key={m.staff_id} member={m} rank={i + 1} />)}</div>
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
            {indivTrainTab === 'byIndividual' && (
              <div className="rounded-xl border" style={{ background: CARD_BG, borderColor: CARD_BORDER }}>
                <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: CARD_BORDER }}>
                  <Users size={15} style={{ color: GOLD }} />
                  <p className="text-sm font-semibold text-white">Résultats par membre</p>
                  <span className="ml-auto text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{memberStats.length} membres — cliquer pour voir le radar</span>
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
                          const svcColor   = SERVICE_COLORS[m.service || ''] || GOLD;
                          const dateStr    = m.last_completed_at
                            ? (() => { try { return format(parseISO(m.last_completed_at), 'd MMM yyyy', { locale: fr }); } catch { return '—'; } })()
                            : '—';
                          return (
                            <tr key={m.user_id}
                              onClick={() => setModalMemberId(m.user_id)}
                              className="cursor-pointer transition-all hover:opacity-90"
                              style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                    style={{ background: svcColor + '22', color: svcColor, border: `1px solid ${svcColor}44` }}>
                                    {(m.display_name.split(' ')[0]?.[0] || '') + (m.display_name.split(' ')[1]?.[0] || '')}
                                  </div>
                                  <span className="text-white font-medium">{m.display_name}</span>
                                  {m.hierarchy === 'Manager' && (
                                    <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: `${YELLOW}22`, color: YELLOW }}>MGR</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-5 py-3">
                                <span className="px-2 py-0.5 rounded-md text-xs font-medium" style={{ background: svcColor + '20', color: svcColor }}>{serviceLabel(m.service)}</span>
                              </td>
                              <td className="px-5 py-3 text-center"><span className="font-bold" style={{ color: YELLOW }}>{m.quiz_count}</span></td>
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', minWidth: 60 }}>
                                    <div className="h-1.5 rounded-full" style={{ width: `${m.avg_score}%`, background: m.avg_score >= 70 ? '#4ade80' : m.avg_score >= 50 ? YELLOW : '#f87171' }} />
                                  </div>
                                  <span className="text-xs font-bold w-10 text-right" style={{ color: m.avg_score >= 70 ? '#4ade80' : m.avg_score >= 50 ? YELLOW : '#f87171' }}>{m.avg_score}%</span>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-center"><span className="font-bold" style={{ color: GOLD }}>{m.best_score}%</span></td>
                              <td className="px-5 py-3 text-xs" style={{ color: 'rgba(255,255,255,0.45)', maxWidth: 200 }}>
                                <p className="truncate">{m.last_document}</p>
                                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>{dateStr}</p>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            {indivTrainTab === 'byFormation' && <FormationCards formationStats={formationStats} trainingLoading={trainingLoading} selectedFormation={selectedFormation} onFormationSelect={setSelectedFormation} formationRadarData={formationRadarData} />}
            {indivTrainTab === 'byCompetence' && <CompetenceRadars serviceRadars={serviceRadars} trainingLoading={trainingLoading} />}
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
                        <div><p className="text-xl font-bold" style={{ color: YELLOW }}>{sd.quizzes}</p><p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>QCMs passés</p></div>
                        <div><p className="text-xl font-bold" style={{ color: GOLD }}>{sd.members}</p><p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>membres</p></div>
                        <div><p className="text-xl font-bold" style={{ color: sd.avg_score >= 70 ? '#4ade80' : sd.avg_score >= 50 ? YELLOW : '#f87171' }}>{sd.avg_score}%</p><p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>score moyen</p></div>
                        <div><p className="text-xl font-bold" style={{ color: sd.success_rate >= 70 ? '#4ade80' : sd.success_rate >= 50 ? GOLD : '#f87171' }}>{sd.success_rate}%</p><p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>réussite</p></div>
                      </div>
                      <div className="mt-3 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-1 rounded-full" style={{ width: `${sd.avg_score}%`, background: svcColor }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {svcTrainTab === 'byFormation' && <FormationCards formationStats={formationStats} trainingLoading={trainingLoading} selectedFormation={selectedFormation} onFormationSelect={setSelectedFormation} formationRadarData={formationRadarData} />}
            {svcTrainTab === 'byCompetence' && <CompetenceRadars serviceRadars={serviceRadars} trainingLoading={trainingLoading} />}
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs mt-6" style={{ color: 'rgba(255,255,255,0.18)' }}>
          Données issues de Supabase · Hover sur un membre pour le détail · Vue Direction uniquement
        </p>

      </div>

      {/* Modal radar membre - apparait au clic sur une ligne du tableau Individual Training */}
      <Dialog open={!!modalMemberId} onOpenChange={(open) => { if (!open) setModalMemberId(null); }}>
        <DialogContent className="max-w-5xl bg-[#1E1A37] border-[#BBA57A]/20 text-white">
          <DialogHeader>
            <DialogTitle style={{ color: GOLD }}>
              {modalMemberId ? memberStats.find(m => m.user_id === modalMemberId)?.display_name : ''}
              <span className="ml-2 text-sm font-normal" style={{ color: 'rgba(255,255,255,0.5)' }}>
                — {serviceLabel(memberStats.find(m => m.user_id === modalMemberId)?.service ?? null)}
              </span>
              {memberStats.find(m => m.user_id === modalMemberId)?.hierarchy === 'Manager' && (
                <span className="ml-2 px-2 py-0.5 rounded-md text-xs font-bold" style={{ background: `${YELLOW}22`, color: YELLOW }}>
                  MANAGER
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {modalLoading ? (
            <div className="py-12 text-center text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Chargement…</div>
          ) : (
            <div className={modalManagerAxes.length > 0 ? "grid grid-cols-2 gap-6" : "grid grid-cols-1"}>
              {/* Bloc metier */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: GOLD }}>
                  Compétences {serviceLabel(memberStats.find(m => m.user_id === modalMemberId)?.service ?? null).toLowerCase()}
                </p>
                {modalMetierAxes.length === 0 ? (
                  <p className="text-xs py-4" style={{ color: 'rgba(255,255,255,0.3)' }}>Aucun score sur ce profil</p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={280}>
                      <RadarChart data={modalMetierAxes}>
                        <PolarGrid stroke="rgba(255,255,255,0.08)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 8 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Radar name="Score" dataKey="score" stroke={GOLD} fill={GOLD} fillOpacity={0.3} />
                      </RadarChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-3">
                      {modalMetierAxes.map((axis: any) => (
                        <div key={axis.competency_key} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.7)' }}>{axis.subject}</span>
                            <span className="font-bold" style={{ color: GOLD }}>{axis.score}</span>
                          </div>
                          <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                            <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${axis.score}%`, background: `linear-gradient(to right, ${GOLD}, ${YELLOW})` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Bloc Manager (si applicable) */}
              {modalManagerAxes.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: GOLD }}>
                    Compétences management
                  </p>
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart data={modalManagerAxes}>
                      <PolarGrid stroke="rgba(255,255,255,0.08)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 8 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Radar name="Score" dataKey="score" stroke={YELLOW} fill={YELLOW} fillOpacity={0.3} />
                    </RadarChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-3">
                    {modalManagerAxes.map((axis: any) => (
                      <div key={axis.competency_key} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.7)' }}>{axis.subject}</span>
                          <span className="font-bold" style={{ color: YELLOW }}>{axis.score}</span>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${axis.score}%`, background: `linear-gradient(to right, ${GOLD}, ${YELLOW})` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

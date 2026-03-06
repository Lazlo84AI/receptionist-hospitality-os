import { useState } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { useMyStatistics, TimeseriesEntry } from '@/hooks/useMyStatistics';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, Legend,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, TrendingUp, CheckCircle2, Clock, AlertCircle,
  Users, Calendar, BarChart3, Activity, Zap,
} from 'lucide-react';

// ─── Brand colours ─────────────────────────────────────────────────────────
const GOLD  = '#BBA57A';
const NAVY  = '#1E1A37';
const YELLOW = '#DEAE35';

const CATEGORY_COLORS: Record<string, string> = {
  incident:       '#ef4444',
  client_request: '#3b82f6',
  follow_up:      '#f59e0b',
  internal_task:  '#8b5cf6',
};

// ─── Types ─────────────────────────────────────────────────────────────────
type PeriodType = 'day' | 'week' | 'month';

// ─── Helpers ───────────────────────────────────────────────────────────────
const filterByPeriod = (ts: TimeseriesEntry[], type: PeriodType) =>
  ts.filter(e => e.period_type === type);

// ─── Sub-components ────────────────────────────────────────────────────────

const PeriodTabs = ({
  value, onChange,
}: { value: PeriodType; onChange: (p: PeriodType) => void }) => (
  <div className="flex gap-1 bg-[#f0ece4] rounded-lg p-1">
    {(['day', 'week', 'month'] as PeriodType[]).map(p => (
      <button
        key={p}
        onClick={() => onChange(p)}
        className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
          value === p
            ? 'bg-[#BBA57A] text-white shadow-sm'
            : 'text-[#BBA57A] hover:bg-[#BBA57A]/10'
        }`}
      >
        {p.charAt(0).toUpperCase() + p.slice(1)}
      </button>
    ))}
  </div>
);

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

// ─── RankedTeamTables component (Manager / Director only) ──────────────────
const MemberBadges = ({ member, isMe }: { member: any; isMe: boolean }) => (
  <div>
    <div className="flex items-center gap-2">
      <span className="font-semibold" style={{ color: isMe ? GOLD : NAVY }}>
        {member.display_name}
      </span>
      {isMe && <Badge className="text-xs border-0" style={{ background: `${GOLD}20`, color: GOLD }}>You</Badge>}
      {member.hierarchy === 'Director' && <Badge className="text-xs border-0 bg-yellow-100 text-yellow-600">Director</Badge>}
      {member.hierarchy === 'Manager'  && <Badge className="text-xs border-0 bg-blue-100 text-blue-600">Manager</Badge>}
    </div>
    <div className="text-xs text-gray-400 mt-0.5">{member.role}</div>
  </div>
);

const StatusDot = ({ inactive }: { inactive: boolean }) => inactive ? (
  <span className="inline-flex items-center gap-1.5 text-xs text-red-500 font-medium">
    <span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Inactive
  </span>
) : (
  <span className="inline-flex items-center gap-1.5 text-xs text-green-600 font-medium">
    <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse" /> Active
  </span>
);

const RankedTeamTables = ({ teamStats, myStats }: { teamStats: any[]; myStats: any }) => {
  const [rankMode, setRankMode] = useState<'tasks' | 'shifts'>('tasks');

  const tasksSorted  = [...teamStats].sort((a, b) => b.tasks_created_total - a.tasks_created_total);
  const shiftsSorted = [...teamStats].sort((a, b) => b.shifts_completed - a.shifts_completed);
  const sorted = rankMode === 'tasks' ? tasksSorted : shiftsSorted;

  return (
    <div>
      {/* Toggle */}
      <div className="flex gap-1 bg-[#f0ece4] rounded-lg p-1 w-fit mb-4">
        {(['tasks', 'shifts'] as const).map(mode => (
          <button key={mode} onClick={() => setRankMode(mode)}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              rankMode === mode
                ? 'bg-[#BBA57A] text-white shadow-sm'
                : 'text-[#BBA57A] hover:bg-[#BBA57A]/10'
            }`}>
            {mode === 'tasks' ? '📋 Tasks' : '🔄 Shifts'}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-[#BBA57A]/15 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#BBA57A]/15 text-gray-400 text-xs uppercase tracking-wider">
              <th className="text-left px-5 py-3">#</th>
              <th className="text-left px-5 py-3">Name</th>
              <th className="text-left px-5 py-3">Service</th>
              {rankMode === 'tasks' ? (
                <>
                  <th className="text-center px-5 py-3">Created</th>
                  <th className="text-center px-5 py-3">Completed</th>
                  <th className="text-center px-5 py-3">In Progress</th>
                </>
              ) : (
                <>
                  <th className="text-center px-5 py-3">Shifts Opened</th>
                  <th className="text-center px-5 py-3">Shifts Closed</th>
                  <th className="text-center px-5 py-3">This Month</th>
                </>
              )}
              <th className="text-center px-5 py-3">Status</th>
              <th className="text-left px-5 py-3">Last Activity</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((member, index) => {
              const isMe = member.auth_user_id === myStats?.auth_user_id;
              return (
                <tr key={member.staff_id}
                  className={`border-b border-gray-50 transition-colors ${
                    isMe ? 'bg-[#BBA57A]/5' : 'hover:bg-[#faf8f4]'
                  }`}>
                  <td className="px-5 py-3 font-mono text-gray-400 text-sm">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </td>
                  <td className="px-5 py-3">
                    <MemberBadges member={member} isMe={isMe} />
                  </td>
                  <td className="px-5 py-3 text-gray-500 capitalize text-xs">{member.service ?? '—'}</td>
                  {rankMode === 'tasks' ? (
                    <>
                      <td className="px-5 py-3 text-center font-bold" style={{ color: NAVY }}>{member.tasks_created_total}</td>
                      <td className="px-5 py-3 text-center font-bold text-green-600">{member.tasks_completed}</td>
                      <td className="px-5 py-3 text-center text-yellow-500 font-semibold">{member.tasks_in_progress}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-5 py-3 text-center font-bold" style={{ color: NAVY }}>{member.shifts_total}</td>
                      <td className="px-5 py-3 text-center font-bold text-green-600">{member.shifts_completed}</td>
                      <td className="px-5 py-3 text-center" style={{ color: GOLD }}>{member.shifts_this_month}</td>
                    </>
                  )}
                  <td className="px-5 py-3 text-center"><StatusDot inactive={member.is_inactive} /></td>
                  <td className="px-5 py-3 text-xs text-gray-400">
                    {member.last_task_created_at
                      ? new Date(member.last_task_created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Main page ─────────────────────────────────────────────────────────────
const MyStatistics = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tasksPeriod, setTasksPeriod] = useState<PeriodType>('month');
  const [shiftsPeriod, setShiftsPeriod] = useState<PeriodType>('month');

  const {
    myStats, teamStats, timeseries, benchmarks,
    canSeeTeamDetail,
    loading, error,
  } = useMyStatistics();

  // ── Derived KPIs for selected period (Tasks) ──
  const taskKpis = {
    day:   { created: myStats?.tasks_created_today      ?? 0, label: 'today' },
    week:  { created: myStats?.tasks_created_this_week  ?? 0, label: 'this week' },
    month: { created: myStats?.tasks_created_this_month ?? 0, label: 'this month' },
  }[tasksPeriod];

  const shiftKpis = {
    day:   { count: myStats?.shifts_today      ?? 0, label: 'today' },
    week:  { count: myStats?.shifts_this_week  ?? 0, label: 'this week' },
    month: { count: myStats?.shifts_this_month ?? 0, label: 'this month' },
  }[shiftsPeriod];

  // ── Chart data for Tasks progression ──
  const tasksChartData = filterByPeriod(timeseries, tasksPeriod).map(e => ({
    label:     e.period_label,
    Created:   e.tasks_created,
    Completed: e.tasks_completed,
  }));

  // ── Chart data for Shifts progression (from v_user_task_stats shifts_* fields) ──
  // We build shift timeseries from myStats period fields — simple bar
  const shiftsBarData = [
    { label: 'Total',     value: myStats?.shifts_total     ?? 0, fill: GOLD  },
    { label: 'Closed',    value: myStats?.shifts_completed ?? 0, fill: '#22c55e' },
    { label: 'Active',    value: myStats?.shifts_active    ?? 0, fill: YELLOW },
    { label: shiftsPeriod === 'day'
        ? 'Today'
        : shiftsPeriod === 'week' ? 'This Week' : 'This Month',
      value: shiftKpis.count,
      fill: NAVY,
    },
  ];

  // ── Pie chart — category breakdown (all time, not period-dependent) ──
  const pieData = myStats ? [
    { name: 'Incidents',       value: myStats.incidents_count,       color: CATEGORY_COLORS.incident },
    { name: 'Client Requests', value: myStats.client_requests_count, color: CATEGORY_COLORS.client_request },
    { name: 'Follow-ups',      value: myStats.follow_ups_count,      color: CATEGORY_COLORS.follow_up },
    { name: 'Internal Tasks',  value: myStats.internal_tasks_count,  color: CATEGORY_COLORS.internal_task },
  ].filter(d => d.value > 0) : [];

  // ── Status breakdown for shifts section ──
  const statusPieData = myStats ? [
    { name: 'Completed / Archived', value: myStats.tasks_completed,  color: '#22c55e' },
    { name: 'In Progress',          value: myStats.tasks_in_progress, color: YELLOW },
    { name: 'Pending',              value: myStats.tasks_pending,     color: '#9ca3af' },
  ].filter(d => d.value > 0) : [];

  const myBenchmark = benchmarks.find(b => b.service === myStats?.service);

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

  const tooltipStyle = {
    contentStyle: { background: '#fff', border: `1px solid ${GOLD}40`, borderRadius: 10, fontSize: 12 },
    labelStyle:   { color: NAVY, fontWeight: 600 },
  };

  return (
    <div className="min-h-screen bg-[#faf8f4]">
      <Header onMenuToggle={() => setIsSidebarOpen(prev => !prev)} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-10">

        {/* ── Page header ── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold font-playfair" style={{ color: NAVY }}>
              My Analytics
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {myStats?.display_name}
              {myStats?.service && <> · <span className="capitalize">{myStats.service}</span></>}
              {' · '}
              <span className={
                myStats?.hierarchy === 'Director' ? 'text-yellow-500 font-semibold' :
                myStats?.hierarchy === 'Manager'  ? 'text-blue-500 font-semibold'   :
                'text-gray-500'
              }>
                {myStats?.hierarchy ?? 'Collaborator'}
              </span>
            </p>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            BLOC 1 — MY TASKS
        ══════════════════════════════════════════ */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <SectionTitle>My Tasks</SectionTitle>
            <PeriodTabs value={tasksPeriod} onChange={setTasksPeriod} />
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard
              icon={<BarChart3 className="w-4 h-4" />}
              label="Created"
              value={taskKpis.created}
              sub={`${taskKpis.label} · ${myStats?.tasks_created_total ?? 0} all time`}
            />
            <KpiCard
              icon={<CheckCircle2 className="w-4 h-4" />}
              label="Completed"
              value={myStats?.tasks_completed ?? 0}
              accent="#22c55e"
              sub="incl. archived at shift close"
            />
            <KpiCard
              icon={<Clock className="w-4 h-4" />}
              label="In Progress"
              value={myStats?.tasks_in_progress ?? 0}
              accent={YELLOW}
              sub={`${myStats?.tasks_pending ?? 0} pending`}
            />
            <KpiCard
              icon={<Users className="w-4 h-4" />}
              label="Assigned to Me"
              value={myStats?.tasks_assigned_total ?? 0}
              sub={`${myStats?.tasks_assigned_completed ?? 0} completed`}
            />
          </div>

          {/* Tasks charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Created vs Completed — bar chart by period */}
            <Card>
              <p className="text-sm font-semibold mb-1" style={{ color: NAVY }}>
                Created vs Completed
              </p>
              <p className="text-xs text-gray-400 mb-4">
                Evolution by {tasksPeriod}
              </p>
              {tasksChartData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                  No data for this period
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={tasksChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0ece4" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} allowDecimals={false} />
                    <Tooltip {...tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Created"   fill={GOLD}    radius={[4,4,0,0]} />
                    <Bar dataKey="Completed" fill="#22c55e" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* Category breakdown — pie */}
            <Card>
              <p className="text-sm font-semibold mb-1" style={{ color: NAVY }}>
                Breakdown by Category
              </p>
              <p className="text-xs text-gray-400 mb-4">All time distribution</p>
              {pieData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                  No tasks yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name"
                      cx="50%" cy="50%" outerRadius={75}
                      label={({ value }) => value}>
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            BLOC 2 — MY SHIFTS
        ══════════════════════════════════════════ */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <SectionTitle>My Shifts</SectionTitle>
            <PeriodTabs value={shiftsPeriod} onChange={setShiftsPeriod} />
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard
              icon={<Calendar className="w-4 h-4" />}
              label="Shifts Opened"
              value={myStats?.shifts_total ?? 0}
              sub="all time"
            />
            <KpiCard
              icon={<CheckCircle2 className="w-4 h-4" />}
              label="Shifts Closed"
              value={myStats?.shifts_completed ?? 0}
              accent="#22c55e"
              sub="all time"
            />
            <KpiCard
              icon={<Activity className="w-4 h-4" />}
              label="Active Now"
              value={myStats?.shifts_active ?? 0}
              accent={YELLOW}
              sub="currently running"
            />
            <KpiCard
              icon={<TrendingUp className="w-4 h-4" />}
              label={shiftsPeriod === 'day' ? 'Today' : shiftsPeriod === 'week' ? 'This Week' : 'This Month'}
              value={shiftKpis.count}
              sub={`shifts ${shiftKpis.label}`}
            />
          </div>

          {/* Shifts charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Shifts overview bar */}
            <Card>
              <p className="text-sm font-semibold mb-1" style={{ color: NAVY }}>
                Shifts Overview
              </p>
              <p className="text-xs text-gray-400 mb-4">
                Total / Closed / Active / {shiftsPeriod === 'day' ? 'Today' : shiftsPeriod === 'week' ? 'This Week' : 'This Month'}
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={shiftsBarData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0ece4" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} allowDecimals={false} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="value" radius={[4,4,0,0]}>
                    {shiftsBarData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Task status breakdown — pie (relevant to shift activity) */}
            <Card>
              <p className="text-sm font-semibold mb-1" style={{ color: NAVY }}>
                Task Status Breakdown
              </p>
              <p className="text-xs text-gray-400 mb-4">Completed · In Progress · Pending</p>
              {statusPieData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                  No data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={statusPieData} dataKey="value" nameKey="name"
                      cx="50%" cy="50%" outerRadius={75}
                      label={({ value }) => value}>
                      {statusPieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>
        </section>

        {/* ── Service Benchmarks ── */}
        {myBenchmark && (
          <section>
            <SectionTitle>
              Service Benchmarks — {myBenchmark.service ?? 'Unassigned'}
            </SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Tasks Created',   min: myBenchmark.min_tasks_created,    max: myBenchmark.max_tasks_created,    avg: myBenchmark.avg_tasks_created },
                { label: 'Tasks Completed', min: myBenchmark.min_tasks_completed,  max: myBenchmark.max_tasks_completed,  avg: myBenchmark.avg_tasks_completed },
                { label: 'Shifts Closed',   min: myBenchmark.min_shifts_completed, max: myBenchmark.max_shifts_completed, avg: myBenchmark.avg_shifts_completed },
              ].map(bm => (
                <Card key={bm.label}>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">{bm.label}</p>
                  <div className="flex justify-between text-sm">
                    <div className="text-center">
                      <div className="text-lg font-bold" style={{ color: NAVY }}>{bm.min}</div>
                      <div className="text-xs text-gray-400">Min</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold" style={{ color: GOLD }}>{bm.avg}</div>
                      <div className="text-xs text-gray-400">Avg</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold" style={{ color: NAVY }}>{bm.max}</div>
                      <div className="text-xs text-gray-400">Max</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════
            BLOC 3 — TEAM RANKING
        ══════════════════════════════════════════ */}
        <section>
          <SectionTitle>Team Ranking</SectionTitle>

          {/* Collaborator — two rank cards only, no names */}
          {!canSeeTeamDetail && myStats && (() => {
            const tasksSorted  = [...teamStats].sort((a, b) => b.tasks_created_total - a.tasks_created_total);
            const shiftsSorted = [...teamStats].sort((a, b) => b.shifts_completed - a.shifts_completed);
            const tasksRank    = tasksSorted.findIndex(s => s.auth_user_id === myStats.auth_user_id) + 1;
            const shiftsRank   = shiftsSorted.findIndex(s => s.auth_user_id === myStats.auth_user_id) + 1;
            const total        = teamStats.length;
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="text-center space-y-2 py-8">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Tasks Ranking</p>
                  <p className="text-6xl font-bold" style={{ color: GOLD }}>#{tasksRank}</p>
                  <p className="text-gray-400 text-sm">out of {total} members</p>
                  <p className="text-xs text-gray-400">Sorted by tasks created</p>
                </Card>
                <Card className="text-center space-y-2 py-8">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Shifts Ranking</p>
                  <p className="text-6xl font-bold" style={{ color: NAVY }}>#{shiftsRank}</p>
                  <p className="text-gray-400 text-sm">out of {total} members</p>
                  <p className="text-xs text-gray-400">Sorted by shifts closed</p>
                </Card>
                <p className="text-xs text-gray-300 col-span-2 text-center">
                  Detailed team view is available to Managers and Directors.
                </p>
              </div>
            );
          })()}

          {canSeeTeamDetail && (
            <RankedTeamTables teamStats={teamStats} myStats={myStats} />
          )}
        </section>

      </main>
    </div>
  );
};

export default MyStatistics;

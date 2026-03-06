import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserTaskStats {
  staff_id: string;
  auth_user_id: string;
  display_name: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  service: string | null;
  department: string | null;
  hierarchy: string | null;
  is_active: boolean;
  avatar_url: string | null;
  // Tasks
  tasks_created_total: number;
  tasks_completed: number;
  tasks_in_progress: number;
  tasks_pending: number;
  // By category
  incidents_count: number;
  client_requests_count: number;
  follow_ups_count: number;
  internal_tasks_count: number;
  // Assigned
  tasks_assigned_total: number;
  tasks_assigned_completed: number;
  // Periods
  tasks_created_today: number;
  tasks_created_this_week: number;
  tasks_created_this_month: number;
  // Shifts
  shifts_total: number;
  shifts_active: number;
  shifts_completed: number;
  shifts_today: number;
  shifts_this_week: number;
  shifts_this_month: number;
  last_shift_at: string | null;
  last_task_created_at: string | null;
  is_inactive: boolean;
}

export interface TimeseriesEntry {
  auth_user_id: string;
  staff_id: string;
  display_name: string;
  service: string | null;
  period_type: 'day' | 'week' | 'month';
  period: string;
  period_label: string;
  tasks_created: number;
  tasks_completed: number;
}

export interface ServiceBenchmark {
  service: string | null;
  team_size: number;
  active_members: number;
  inactive_members: number;
  min_tasks_created: number;
  max_tasks_created: number;
  avg_tasks_created: number;
  min_tasks_completed: number;
  max_tasks_completed: number;
  avg_tasks_completed: number;
  min_shifts_completed: number;
  max_shifts_completed: number;
  avg_shifts_completed: number;
}

export interface MyStatisticsData {
  // Current user's own stats
  myStats: UserTaskStats | null;
  // Team ranking (all members)
  teamStats: UserTaskStats[];
  // Timeseries for charts (current user only)
  timeseries: TimeseriesEntry[];
  // Service benchmarks
  benchmarks: ServiceBenchmark[];
  // Access level
  isManager: boolean;    // hierarchy = 'Manager'
  isDirector: boolean;   // hierarchy = 'Director'
  canSeeTeamDetail: boolean; // Manager OR Director
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useMyStatistics = () => {
  const [data, setData] = useState<MyStatisticsData>({
    myStats: null,
    teamStats: [],
    timeseries: [],
    benchmarks: [],
    isManager: false,
    isDirector: false,
    canSeeTeamDetail: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = async () => {
    try {
      setLoading(true);

      // 1. Get current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // 2. Fetch all team stats from view
      const { data: teamStatsRaw, error: teamError } = await supabase
        .from('v_user_task_stats')
        .select('*')
        .order('tasks_created_total', { ascending: false });

      if (teamError) throw teamError;

      const teamStats: UserTaskStats[] = (teamStatsRaw || []).map((r: any) => ({
        ...r,
        tasks_created_total: Number(r.tasks_created_total) || 0,
        tasks_completed: Number(r.tasks_completed) || 0,
        tasks_in_progress: Number(r.tasks_in_progress) || 0,
        tasks_pending: Number(r.tasks_pending) || 0,
        incidents_count: Number(r.incidents_count) || 0,
        client_requests_count: Number(r.client_requests_count) || 0,
        follow_ups_count: Number(r.follow_ups_count) || 0,
        internal_tasks_count: Number(r.internal_tasks_count) || 0,
        tasks_assigned_total: Number(r.tasks_assigned_total) || 0,
        tasks_assigned_completed: Number(r.tasks_assigned_completed) || 0,
        tasks_created_today: Number(r.tasks_created_today) || 0,
        tasks_created_this_week: Number(r.tasks_created_this_week) || 0,
        tasks_created_this_month: Number(r.tasks_created_this_month) || 0,
        shifts_total: Number(r.shifts_total) || 0,
        shifts_active: Number(r.shifts_active) || 0,
        shifts_completed: Number(r.shifts_completed) || 0,
        shifts_today: Number(r.shifts_today) || 0,
        shifts_this_week: Number(r.shifts_this_week) || 0,
        shifts_this_month: Number(r.shifts_this_month) || 0,
      }));

      // 3. Isolate current user's stats
      const myStats = teamStats.find(s => s.auth_user_id === user.id) || null;

      // 4. Determine access level
      const hierarchy = myStats?.hierarchy || 'Collaborator';
      const isManager = hierarchy === 'Manager';
      const isDirector = hierarchy === 'Director';
      const canSeeTeamDetail = isManager || isDirector;

      // 5. Fetch timeseries for current user only
      const { data: timeseriesRaw, error: tsError } = await supabase
        .from('v_tasks_timeseries')
        .select('*')
        .eq('auth_user_id', user.id)
        .order('period', { ascending: true });

      if (tsError) throw tsError;

      const timeseries: TimeseriesEntry[] = (timeseriesRaw || []).map((r: any) => ({
        ...r,
        tasks_created: Number(r.tasks_created) || 0,
        tasks_completed: Number(r.tasks_completed) || 0,
      }));

      // 6. Fetch service benchmarks
      const { data: benchmarksRaw, error: benchError } = await supabase
        .from('v_service_benchmarks')
        .select('*')
        .order('service', { ascending: true });

      if (benchError) throw benchError;

      const benchmarks: ServiceBenchmark[] = (benchmarksRaw || []).map((r: any) => ({
        ...r,
        team_size: Number(r.team_size) || 0,
        active_members: Number(r.active_members) || 0,
        inactive_members: Number(r.inactive_members) || 0,
        avg_tasks_created: Number(r.avg_tasks_created) || 0,
        avg_tasks_completed: Number(r.avg_tasks_completed) || 0,
        avg_shifts_completed: Number(r.avg_shifts_completed) || 0,
      }));

      setData({
        myStats,
        teamStats,
        timeseries,
        benchmarks,
        isManager,
        isDirector,
        canSeeTeamDetail,
      });
      setError(null);
    } catch (err) {
      console.error('❌ useMyStatistics error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  return { ...data, loading, error, refetch: fetchStatistics };
};

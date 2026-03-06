-- ============================================================
-- HOSPITALITY OS — STATISTICS VIEWS
-- Date   : 2026-03-06
-- Author : Wilfried de Renty
-- Object : 3 SQL views for My Statistics page
-- ============================================================
-- EXECUTION ORDER : run this entire file once in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- DROP existing views (safe re-run)
-- ============================================================
DROP VIEW IF EXISTS public.v_service_benchmarks;
DROP VIEW IF EXISTS public.v_tasks_monthly;
DROP VIEW IF EXISTS public.v_user_task_stats;

-- ============================================================
-- VIEW 1 : v_user_task_stats
-- Per-member stats: tasks created/completed/in_progress/pending,
-- breakdown by category, assigned tasks, shifts opened/closed
-- ============================================================
CREATE OR REPLACE VIEW public.v_user_task_stats AS
SELECT
  sd.id                                                           AS staff_id,
  sd.auth_user_id,
  COALESCE(sd.full_name, CONCAT(sd.first_name, ' ', sd.last_name))
                                                                  AS display_name,
  sd.first_name,
  sd.last_name,
  sd.role::text                                                   AS role,
  sd.service,
  sd.department,
  sd.hierarchy,
  sd.is_active,
  sd.avatar_url,

  -- ── TASKS CREATED (real-time from task table) ──────────────
  (SELECT COUNT(*) FROM public.task t
   WHERE t.created_by = sd.auth_user_id
     AND t.status != 'archived')                                  AS tasks_created_total,

  (SELECT COUNT(*) FROM public.task t
   WHERE t.created_by = sd.auth_user_id
     AND t.status = 'completed')                                  AS tasks_completed,

  (SELECT COUNT(*) FROM public.task t
   WHERE t.created_by = sd.auth_user_id
     AND t.status = 'in_progress')                                AS tasks_in_progress,

  (SELECT COUNT(*) FROM public.task t
   WHERE t.created_by = sd.auth_user_id
     AND t.status = 'pending')                                    AS tasks_pending,

  -- ── BREAKDOWN BY CATEGORY ──────────────────────────────────
  (SELECT COUNT(*) FROM public.task t
   WHERE t.created_by = sd.auth_user_id
     AND t.category = 'incident')                                 AS incidents_count,

  (SELECT COUNT(*) FROM public.task t
   WHERE t.created_by = sd.auth_user_id
     AND t.category = 'client_request')                          AS client_requests_count,

  (SELECT COUNT(*) FROM public.task t
   WHERE t.created_by = sd.auth_user_id
     AND t.category = 'follow_up')                               AS follow_ups_count,

  (SELECT COUNT(*) FROM public.task t
   WHERE t.created_by = sd.auth_user_id
     AND t.category = 'internal_task')                           AS internal_tasks_count,

  -- ── TASKS ASSIGNED TO THIS USER ────────────────────────────
  -- Note: task.assigned_to is uuid[] — we use auth_user_id for matching
  (SELECT COUNT(*) FROM public.task t
   WHERE sd.auth_user_id = ANY(t.assigned_to)
     AND t.status != 'archived')                                  AS tasks_assigned_total,

  (SELECT COUNT(*) FROM public.task t
   WHERE sd.auth_user_id = ANY(t.assigned_to)
     AND t.status = 'completed')                                  AS tasks_assigned_completed,

  -- ── DAILY / MONTHLY CREATED (last 30 days / current month) ─
  (SELECT COUNT(*) FROM public.task t
   WHERE t.created_by = sd.auth_user_id
     AND t.created_at >= NOW() - INTERVAL '30 days'
     AND t.status != 'archived')                                  AS tasks_created_last30d,

  (SELECT COUNT(*) FROM public.task t
   WHERE t.created_by = sd.auth_user_id
     AND date_trunc('month', t.created_at) = date_trunc('month', NOW())
     AND t.status != 'archived')                                  AS tasks_created_this_month,

  -- ── SHIFTS ─────────────────────────────────────────────────
  -- shifts.user_id → staff_directory.id  (direct FK)
  (SELECT COUNT(*) FROM public.shifts s
   WHERE s.user_id = sd.id)                                       AS shifts_total,

  (SELECT COUNT(*) FROM public.shifts s
   WHERE s.user_id = sd.id
     AND s.status = 'active')                                     AS shifts_active,

  (SELECT COUNT(*) FROM public.shifts s
   WHERE s.user_id = sd.id
     AND s.status = 'completed')                                  AS shifts_completed,

  (SELECT COUNT(*) FROM public.shifts s
   WHERE s.user_id = sd.id
     AND date_trunc('month', s.start_time) = date_trunc('month', NOW()))
                                                                  AS shifts_this_month,

  (SELECT MAX(s.start_time) FROM public.shifts s
   WHERE s.user_id = sd.id)                                       AS last_shift_at,

  -- ── ACTIVITY — INACTIF detection (Option B: 30 days) ───────
  (SELECT MAX(t.created_at) FROM public.task t
   WHERE t.created_by = sd.auth_user_id)                         AS last_task_created_at,

  CASE
    WHEN (
      SELECT MAX(t.created_at) FROM public.task t
      WHERE t.created_by = sd.auth_user_id
    ) < NOW() - INTERVAL '30 days'
    OR (
      SELECT MAX(t.created_at) FROM public.task t
      WHERE t.created_by = sd.auth_user_id
    ) IS NULL
    THEN true
    ELSE false
  END                                                             AS is_inactive_30d

FROM public.staff_directory sd
WHERE sd.auth_user_id IS NOT NULL;


-- ============================================================
-- VIEW 2 : v_tasks_monthly
-- Monthly time series per user + category — feeds BarChart
-- Last 12 months only (performance)
-- ============================================================
CREATE OR REPLACE VIEW public.v_tasks_monthly AS
SELECT
  sd.auth_user_id,
  sd.id                                                          AS staff_id,
  COALESCE(sd.full_name, CONCAT(sd.first_name, ' ', sd.last_name))
                                                                 AS display_name,
  sd.service,
  date_trunc('month', t.created_at)                             AS month,
  TO_CHAR(date_trunc('month', t.created_at), 'Mon YYYY')        AS month_label,
  t.category::text                                              AS category,
  COUNT(*)                                                      AS task_count,
  COUNT(*) FILTER (WHERE t.status = 'completed')                AS completed_count,
  COUNT(*) FILTER (WHERE t.status = 'in_progress')              AS in_progress_count,
  COUNT(*) FILTER (WHERE t.status = 'pending')                  AS pending_count
FROM public.task t
JOIN public.staff_directory sd
  ON t.created_by = sd.auth_user_id
WHERE t.status != 'archived'
  AND t.created_at >= NOW() - INTERVAL '12 months'
GROUP BY
  sd.auth_user_id,
  sd.id,
  sd.full_name,
  sd.first_name,
  sd.last_name,
  sd.service,
  date_trunc('month', t.created_at),
  t.category;


-- ============================================================
-- VIEW 3 : v_service_benchmarks
-- MIN / MAX / AVG per service group — feeds benchmark cards
-- Depends on v_user_task_stats (created above)
-- ============================================================
CREATE OR REPLACE VIEW public.v_service_benchmarks AS
SELECT
  service,
  COUNT(*)                                    AS team_size,

  -- Tasks created
  MIN(tasks_created_total)::integer           AS min_tasks_created,
  MAX(tasks_created_total)::integer           AS max_tasks_created,
  ROUND(AVG(tasks_created_total), 1)          AS avg_tasks_created,

  -- Tasks completed
  MIN(tasks_completed)::integer               AS min_tasks_completed,
  MAX(tasks_completed)::integer               AS max_tasks_completed,
  ROUND(AVG(tasks_completed), 1)              AS avg_tasks_completed,

  -- Shifts closed
  MIN(shifts_completed)::integer              AS min_shifts_completed,
  MAX(shifts_completed)::integer              AS max_shifts_completed,
  ROUND(AVG(shifts_completed), 1)             AS avg_shifts_completed,

  -- Active vs inactive members
  COUNT(*) FILTER (WHERE is_inactive_30d = false) AS active_members,
  COUNT(*) FILTER (WHERE is_inactive_30d = true)  AS inactive_members

FROM public.v_user_task_stats
WHERE auth_user_id IS NOT NULL
GROUP BY service;


-- ============================================================
-- RLS — Grant read access to authenticated users
-- ============================================================
GRANT SELECT ON public.v_user_task_stats    TO authenticated;
GRANT SELECT ON public.v_tasks_monthly      TO authenticated;
GRANT SELECT ON public.v_service_benchmarks TO authenticated;


-- ============================================================
-- QUICK VALIDATION QUERIES
-- Run these after executing the views to verify data
-- ============================================================

-- Check v_user_task_stats
-- SELECT display_name, service, tasks_created_total, tasks_completed,
--        shifts_total, shifts_completed, is_inactive_30d
-- FROM public.v_user_task_stats
-- ORDER BY tasks_created_total DESC;

-- Check v_tasks_monthly
-- SELECT display_name, month_label, category, task_count, completed_count
-- FROM public.v_tasks_monthly
-- ORDER BY month DESC, display_name;

-- Check v_service_benchmarks
-- SELECT * FROM public.v_service_benchmarks;

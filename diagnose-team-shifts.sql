-- ============================================================
-- DIAGNOSTIC: Pourquoi "View Reception Shifts" est vide?
-- ============================================================

-- Date limite (3 jours)
SELECT NOW() - INTERVAL '3 days' AS date_limite_3_jours;

-- ============================================================
-- 1. TOUS LES SHIFTS EN BDD
-- ============================================================
SELECT 
  '1. TOUS LES SHIFTS' AS diagnostic,
  COUNT(*) AS total_shifts
FROM shifts;

-- Répartition par statut
SELECT 
  '1a. Par STATUT' AS diagnostic,
  status,
  COUNT(*) AS count
FROM shifts
GROUP BY status
ORDER BY count DESC;

-- Répartition par service
SELECT 
  '1b. Par SERVICE' AS diagnostic,
  COALESCE(service, 'NULL') AS service,
  COUNT(*) AS count
FROM shifts
GROUP BY service
ORDER BY count DESC;

-- Les 5 shifts les plus récents
SELECT 
  '1c. Les 5 PLUS RÉCENTS' AS diagnostic,
  id,
  status,
  service,
  user_id,
  start_time,
  end_time,
  created_at
FROM shifts
ORDER BY created_at DESC
LIMIT 5;

-- ============================================================
-- 2. SHIFTS "COMPLETED"
-- ============================================================
SELECT 
  '2. SHIFTS COMPLETED' AS diagnostic,
  COUNT(*) AS total_completed
FROM shifts
WHERE status = 'completed';

-- Liste des shifts completed
SELECT 
  '2a. LISTE COMPLETED' AS diagnostic,
  id,
  user_id,
  service,
  status,
  start_time,
  end_time
FROM shifts
WHERE status = 'completed'
ORDER BY end_time DESC;

-- ============================================================
-- 3. SHIFTS COMPLETED DES 3 DERNIERS JOURS
-- ============================================================
SELECT 
  '3. COMPLETED RÉCENTS (3 jours)' AS diagnostic,
  COUNT(*) AS total_completed_recent
FROM shifts
WHERE status = 'completed'
  AND end_time >= NOW() - INTERVAL '3 days';

-- Liste
SELECT 
  '3a. LISTE COMPLETED RÉCENTS' AS diagnostic,
  id,
  user_id,
  service,
  status,
  end_time
FROM shifts
WHERE status = 'completed'
  AND end_time >= NOW() - INTERVAL '3 days'
ORDER BY end_time DESC;

-- ============================================================
-- 4. VÉRIFICATION STAFF_DIRECTORY
-- ============================================================

-- User IDs uniques dans shifts
SELECT 
  '4. USER IDS dans SHIFTS' AS diagnostic,
  COUNT(DISTINCT user_id) AS user_ids_uniques
FROM shifts;

-- Vérifier si ces user_ids existent dans staff_directory
WITH shift_users AS (
  SELECT DISTINCT user_id FROM shifts
)
SELECT 
  '4a. USER IDS dans STAFF_DIRECTORY' AS diagnostic,
  COUNT(*) AS users_dans_staff_directory
FROM shift_users su
INNER JOIN staff_directory sd ON su.user_id = sd.id;

-- User IDs manquants dans staff_directory (PROBLÈME!)
WITH shift_users AS (
  SELECT DISTINCT user_id FROM shifts
)
SELECT 
  '4b. USER IDS MANQUANTS dans STAFF_DIRECTORY' AS diagnostic,
  su.user_id
FROM shift_users su
LEFT JOIN staff_directory sd ON su.user_id = sd.id
WHERE sd.id IS NULL;

-- Staff trouvé pour les shifts
SELECT 
  '4c. STAFF trouvé' AS diagnostic,
  sd.id,
  sd.first_name,
  sd.last_name,
  sd.service,
  sd.department
FROM shifts s
INNER JOIN staff_directory sd ON s.user_id = sd.id
GROUP BY sd.id, sd.first_name, sd.last_name, sd.service, sd.department;

-- ============================================================
-- 5. VÉRIFICATION SHIFT_HANDOVERS
-- ============================================================
SELECT 
  '5. SHIFT_HANDOVERS' AS diagnostic,
  COUNT(*) AS total_handovers
FROM shift_handovers;

-- Handovers pour les shifts completed
SELECT 
  '5a. HANDOVERS pour COMPLETED' AS diagnostic,
  sh.id AS handover_id,
  sh.from_shift_id,
  sh.to_shift_id,
  CASE WHEN sh.handover_data IS NOT NULL THEN 'OUI' ELSE 'NON' END AS has_handover_data,
  CASE WHEN sh.handover_data::jsonb ? 'all_tasks' THEN 
    jsonb_array_length(sh.handover_data::jsonb->'all_tasks')
  ELSE 0 END AS nb_tasks,
  sh.handover_data::jsonb->>'total_tasks_count' AS total_tasks_count
FROM shift_handovers sh
INNER JOIN shifts s ON sh.from_shift_id = s.id
WHERE s.status = 'completed'
ORDER BY sh.created_at DESC
LIMIT 10;

-- ============================================================
-- 6. SIMULATION REQUÊTE EXACTE DU HOOK
-- ============================================================
SELECT 
  '6. SIMULATION HOOK useTeamShifts (service=reception)' AS diagnostic,
  COUNT(*) AS resultats_hook
FROM shifts s
INNER JOIN staff_directory sd ON s.user_id = sd.id
WHERE s.status = 'completed'
  AND s.service = 'reception'
  AND s.end_time >= NOW() - INTERVAL '3 days';

-- Détails si résultats
SELECT 
  '6a. DÉTAILS SIMULATION HOOK' AS diagnostic,
  s.id AS shift_id,
  s.user_id,
  s.service,
  s.status,
  s.end_time,
  sd.first_name,
  sd.last_name,
  sd.service AS staff_service,
  (SELECT COUNT(*) FROM shift_handovers WHERE from_shift_id = s.id) AS nb_handovers
FROM shifts s
INNER JOIN staff_directory sd ON s.user_id = sd.id
WHERE s.status = 'completed'
  AND s.service = 'reception'
  AND s.end_time >= NOW() - INTERVAL '3 days'
ORDER BY s.end_time DESC;

-- ============================================================
-- 7. RÉSUMÉ FINAL
-- ============================================================
SELECT 
  'RÉSUMÉ' AS section,
  'Total shifts' AS metric,
  COUNT(*) AS value
FROM shifts
UNION ALL
SELECT 
  'RÉSUMÉ',
  'Shifts completed',
  COUNT(*)
FROM shifts
WHERE status = 'completed'
UNION ALL
SELECT 
  'RÉSUMÉ',
  'Completed récents (3j)',
  COUNT(*)
FROM shifts
WHERE status = 'completed'
  AND end_time >= NOW() - INTERVAL '3 days'
UNION ALL
SELECT 
  'RÉSUMÉ',
  'Résultat hook (reception)',
  COUNT(*)
FROM shifts s
INNER JOIN staff_directory sd ON s.user_id = sd.id
WHERE s.status = 'completed'
  AND s.service = 'reception'
  AND s.end_time >= NOW() - INTERVAL '3 days';

-- ============================================================
-- FIN DU DIAGNOSTIC
-- ============================================================

-- AUDIT COMPLET DES DONNÉES - HOSPITALITY OS
-- Script pour voir TOUT ce qu'il y a en base avant nettoyage

-- 1. COMPTER TOUTES LES DONNÉES PAR TABLE
SELECT 'task' as table_name, COUNT(*) as total_records FROM task
UNION ALL
SELECT 'comments', COUNT(*) FROM comments
UNION ALL
SELECT 'attachments', COUNT(*) FROM attachments
UNION ALL
SELECT 'reminders', COUNT(*) FROM reminders
UNION ALL
SELECT 'activity_log', COUNT(*) FROM activity_log
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL
SELECT 'locations', COUNT(*) FROM locations
UNION ALL
SELECT 'shifts', COUNT(*) FROM shifts
ORDER BY table_name;

-- 2. DÉTAIL DES TÂCHES (aperçu)
SELECT 
    id,
    title,
    type,
    status,
    assigned_to,
    created_at,
    updated_at
FROM task 
ORDER BY created_at DESC
LIMIT 10;

-- 3. RÉPARTITION PAR TYPE DE TÂCHE
SELECT 
    type,
    COUNT(*) as count
FROM task 
GROUP BY type
ORDER BY count DESC;

-- 4. RÉPARTITION PAR STATUS
SELECT 
    status,
    COUNT(*) as count
FROM task 
GROUP BY status
ORDER BY count DESC;

-- 5. TÂCHES RÉCENTES (derniers 7 jours)
SELECT 
    COUNT(*) as recent_tasks
FROM task 
WHERE created_at > NOW() - INTERVAL '7 days';

-- 6. VÉRIFIER S'IL Y A DES DONNÉES LIÉES
SELECT 
    'task_with_comments' as relation,
    COUNT(DISTINCT t.id) as count
FROM task t 
INNER JOIN comments c ON t.id = c.task_id
UNION ALL
SELECT 
    'task_with_attachments',
    COUNT(DISTINCT t.id)
FROM task t 
INNER JOIN attachments a ON t.id = a.task_id
UNION ALL
SELECT 
    'task_with_reminders',
    COUNT(DISTINCT t.id)
FROM task t 
INNER JOIN reminders r ON t.id = r.task_id;

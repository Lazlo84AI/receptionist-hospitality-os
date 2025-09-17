-- SCRIPT DE NETTOYAGE SUPABASE - HOSPITALITY OS
-- ⚠️ ATTENTION : Ce script supprime TOUTES les données de test
-- À exécuter AVANT livraison client

-- 1. SUPPRIMER LES COMMENTAIRES (en cascade)
DELETE FROM comments 
WHERE task_id IN (
  SELECT id FROM task 
  WHERE created_at > '2024-01-01'  -- Ajuster la date selon besoin
);

-- 2. SUPPRIMER LES ATTACHMENTS (en cascade)
DELETE FROM attachments 
WHERE task_id IN (
  SELECT id FROM task 
  WHERE created_at > '2024-01-01'
);

-- 3. SUPPRIMER LES REMINDERS (en cascade)
DELETE FROM reminders 
WHERE task_id IN (
  SELECT id FROM task 
  WHERE created_at > '2024-01-01'
);

-- 4. SUPPRIMER LES ACTIVITY LOGS (en cascade)
DELETE FROM activity_log 
WHERE task_id IN (
  SELECT id FROM task 
  WHERE created_at > '2024-01-01'
);

-- 5. SUPPRIMER LES TÂCHES PRINCIPALES
DELETE FROM task 
WHERE created_at > '2024-01-01';

-- 6. SUPPRIMER internal_tasks SI ELLE EXISTE
-- DELETE FROM internal_tasks;

-- 7. REMETTRE À ZÉRO LES SEQUENCES (optionnel)
-- ALTER SEQUENCE task_id_seq RESTART WITH 1;

-- VÉRIFICATION POST-NETTOYAGE
SELECT 'Tasks restantes' as table_name, COUNT(*) as count FROM task
UNION ALL
SELECT 'Comments restants', COUNT(*) FROM comments
UNION ALL
SELECT 'Attachments restants', COUNT(*) FROM attachments
UNION ALL
SELECT 'Reminders restants', COUNT(*) FROM reminders
UNION ALL
SELECT 'Activity logs restants', COUNT(*) FROM activity_log;

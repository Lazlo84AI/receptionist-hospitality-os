-- NETTOYAGE COMPLET - HOSPITALITY OS
-- ⚠️ SUPPRESSION TOTALE DES DONNÉES DE TEST
-- À exécuter EN PRODUCTION avant livraison client

-- ÉTAPE 1: Supprimer les données liées (ordre important pour les foreign keys)

-- 1.1 Activity logs (logs d'activité)
DELETE FROM activity_log WHERE task_id IS NOT NULL;
TRUNCATE activity_log RESTART IDENTITY CASCADE;

-- 1.2 Comments (commentaires)
DELETE FROM comments WHERE task_id IS NOT NULL;
TRUNCATE comments RESTART IDENTITY CASCADE;

-- 1.3 Attachments (pièces jointes)
DELETE FROM attachments WHERE task_id IS NOT NULL;
TRUNCATE attachments RESTART IDENTITY CASCADE;

-- 1.4 Reminders (rappels)
DELETE FROM reminders WHERE task_id IS NOT NULL;
TRUNCATE reminders RESTART IDENTITY CASCADE;

-- ÉTAPE 2: Supprimer les tâches principales
TRUNCATE task RESTART IDENTITY CASCADE;

-- ÉTAPE 3: Nettoyer les tables de support (OPTIONNEL)
-- Décommenter si tu veux aussi vider ces tables

-- 3.1 Shifts (si pas de vrais shifts)
-- TRUNCATE shifts RESTART IDENTITY CASCADE;

-- 3.2 Storage files (fichiers Supabase)
-- NOTE: Les fichiers dans Supabase Storage doivent être supprimés séparément

-- ÉTAPE 4: Vérification post-nettoyage
SELECT 'POST-CLEANUP AUDIT' as status;

SELECT 'task' as table_name, COUNT(*) as remaining_records FROM task
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
ORDER BY table_name;

-- CONFIRMATION
SELECT 'DATABASE CLEANED SUCCESSFULLY' as result;

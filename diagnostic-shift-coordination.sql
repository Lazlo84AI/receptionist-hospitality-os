-- DIAGNOSTIC : Vérification des pré-requis pour shift coordination
-- Exécuter dans Supabase SQL Editor

-- 1. Vérifier que la colonne shift_id existe dans task
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'task' AND column_name = 'shift_id';

-- 2. Vérifier le profil utilisateur (service doit être défini)
SELECT id, email, service, first_name, last_name 
FROM profiles 
WHERE email = 'wilfried.de.renty@gmail.com';  -- Remplacer par votre email

-- 3. Vérifier s'il y a des shifts existants
SELECT id, user_id, start_time, end_time, status, service
FROM shifts
ORDER BY start_time DESC
LIMIT 5;

-- 4. Vérifier s'il y a des handovers existants
SELECT id, from_shift_id, created_at,
  jsonb_array_length(handover_data->'all_tasks') as total_tasks
FROM shift_handovers
ORDER BY created_at DESC
LIMIT 3;

-- 5. Vérifier les cartes existantes et leurs shift_id
SELECT id, title, status, shift_id, created_by, service
FROM task
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY updated_at DESC
LIMIT 10;

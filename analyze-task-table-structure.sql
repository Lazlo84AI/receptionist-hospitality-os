-- ANALYSE COMPLÈTE DE LA STRUCTURE DE LA TABLE TASK
-- Objectif: Identifier où stocker le "client_name" / "guest_name"

-- 1. Structure complète de la table task
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'task'
ORDER BY ordinal_position;

-- 2. Contraintes et index sur la table task
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public' 
  AND tc.table_name = 'task'
ORDER BY tc.constraint_type, kcu.column_name;

-- 3. Échantillon de données existantes (pour voir le contenu réel)
SELECT 
    id,
    title,
    description,
    category,
    origin_type,
    service,
    assigned_to,
    created_by,
    created_at,
    priority
FROM task 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Rechercher des colonnes qui pourraient contenir des infos client/guest
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'task'
  AND (column_name ILIKE '%client%' 
       OR column_name ILIKE '%guest%' 
       OR column_name ILIKE '%name%'
       OR column_name ILIKE '%customer%')
ORDER BY column_name;

-- 5. Vérifier les énumérations existantes pour category et origin_type
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname IN ('task_category', 'task_origin_type', 'task_service', 'task_priority')
ORDER BY t.typname, e.enumsortorder;

-- 6. Analyser les tâches de type "client_request" si elles existent
SELECT 
    category,
    origin_type,
    title,
    description,
    COUNT(*) as count
FROM task 
WHERE category = 'client_request' 
   OR origin_type = 'client'
   OR title ILIKE '%client%'
   OR title ILIKE '%guest%'
GROUP BY category, origin_type, title, description
ORDER BY count DESC;

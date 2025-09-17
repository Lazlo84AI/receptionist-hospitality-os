-- Script pour vérifier les ENUMs existants dans Supabase
-- À exécuter dans le Query Editor de Supabase

-- 1. Vérifier l'ENUM task_status actuel
SELECT 
    t.typname as enum_name,
    string_agg(e.enumlabel, ', ' order by e.enumsortorder) as enum_values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'task_status'
GROUP BY t.typname;

-- 2. Vérifier si task_priority existe
SELECT 
    t.typname as enum_name,
    string_agg(e.enumlabel, ', ' order by e.enumsortorder) as enum_values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'task_priority'
GROUP BY t.typname;

-- 3. Vérifier la structure de la table task
SELECT column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name = 'task' 
ORDER BY ordinal_position;
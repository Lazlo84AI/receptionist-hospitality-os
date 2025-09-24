-- VÉRIFICATION DES FONCTIONS ET TRIGGERS EXISTANTS
-- Rechercher les fonctions liées à profiles/staff_directory

-- 1. Lister toutes les fonctions qui mentionnent profiles ou staff
SELECT 
    proname as function_name,
    pg_get_functiondef(oid) as definition
FROM pg_proc 
WHERE proname ILIKE '%profile%' 
   OR proname ILIKE '%staff%'
   OR proname ILIKE '%sync%'
   OR pg_get_functiondef(oid) ILIKE '%staff_directory%'
   OR pg_get_functiondef(oid) ILIKE '%profiles%';

-- 2. Lister tous les triggers sur ces tables
SELECT 
    t.tgname as trigger_name,
    c.relname as table_name,
    p.proname as function_name,
    t.tgenabled
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE c.relname IN ('profiles', 'staff_directory')
ORDER BY c.relname, t.tgname;
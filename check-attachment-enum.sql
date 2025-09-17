-- Vérifier les valeurs acceptées par l'ENUM attachment_type
-- À exécuter dans Supabase Query Editor

SELECT 
    t.typname as enum_name,
    string_agg(e.enumlabel, ', ' order by e.enumsortorder) as enum_values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'attachment_type'
GROUP BY t.typname;
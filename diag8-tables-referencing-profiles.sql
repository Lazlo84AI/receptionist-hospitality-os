-- DIAGNOSTIC 8: TABLES QUI RÉFÉRENCENT PROFILES
-- Pour connaître l'impact d'une modification

SELECT DISTINCT
    tc.table_name as referencing_table,
    kcu.column_name as referencing_column
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND ccu.table_name = 'profiles'
  AND ccu.column_name = 'id'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

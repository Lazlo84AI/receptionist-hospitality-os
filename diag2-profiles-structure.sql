-- DIAGNOSTIC 2: STRUCTURE DE LA TABLE PROFILES
-- Exécuter seulement si 'profiles' existe

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

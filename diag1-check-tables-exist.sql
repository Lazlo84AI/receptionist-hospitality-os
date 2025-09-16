-- DIAGNOSTIC 1: VÉRIFICATION DE L'EXISTENCE DES TABLES
-- Exécuter d'abord pour savoir quelles tables existent vraiment

SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'profiles_ordered', 'user_profiles')
ORDER BY table_name;

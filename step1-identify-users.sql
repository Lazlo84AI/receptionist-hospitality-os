-- ÉTAPE 1: IDENTIFIER WILFRIED DANS PROFILES
SELECT id, first_name, last_name, full_name, email, department, job_title
FROM profiles 
WHERE LOWER(first_name) LIKE '%wilfried%' 
   OR LOWER(last_name) LIKE '%renty%'
   OR LOWER(full_name) LIKE '%wilfried%';

-- ÉTAPE 2: VOIR VOTRE ID AUTH ACTUEL
SELECT auth.uid() as current_auth_id;

-- ÉTAPE 3: VOIR TOUS LES USERS AUTH
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

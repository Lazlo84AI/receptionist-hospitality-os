-- 1. TROUVER WILFRIED DANS PROFILES
SELECT id, first_name, last_name, full_name, email 
FROM profiles 
WHERE LOWER(first_name) LIKE '%wilfried%' 
   OR LOWER(last_name) LIKE '%renty%'
   OR LOWER(full_name) LIKE '%wilfried%';

-- 2. TROUVER L'UTILISATEUR AUTH ACTUEL (à exécuter depuis votre session)
SELECT auth.uid() as current_user_id;

-- 3. SI BESOIN, CRÉER/METTRE À JOUR LE PROFIL WILFRIED AVEC L'ID AUTH
-- (Remplacez 'YOUR_AUTH_ID' par l'ID réel de votre session auth)
UPDATE profiles 
SET id = auth.uid()  -- ou remplacez par votre vrai auth ID
WHERE LOWER(full_name) LIKE '%wilfried%' 
   OR LOWER(first_name) LIKE '%wilfried%';

-- 4. VÉRIFICATION FINALE
SELECT p.*, u.email as auth_email
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE LOWER(p.first_name) LIKE '%wilfried%';

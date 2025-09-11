-- ÉTAPE 3: CORRIGER WILFRIED DE RENTY (VOTRE CAS)

-- Identifier votre ID auth actuel
SELECT auth.uid() as your_auth_id;

-- Voir si Wilfried existe dans profiles
SELECT * FROM profiles WHERE LOWER(full_name) LIKE '%wilfried%';

-- OPTION A: Si Wilfried existe déjà, mettre à jour son ID avec votre auth ID
-- (Remplacez YOUR_AUTH_ID par le résultat de auth.uid())
UPDATE profiles 
SET 
  id = 'YOUR_AUTH_ID',  -- Remplacez par votre vrai auth ID
  email = 'wilfried@catapult.eu'  -- Votre vrai email
WHERE LOWER(full_name) LIKE '%wilfried%';

-- OPTION B: Si Wilfried n'existe pas, le créer avec votre auth ID
INSERT INTO profiles (
  id,
  first_name,
  last_name,
  full_name,
  email,
  department,
  job_title,
  role,
  hierarchy
) VALUES (
  'YOUR_AUTH_ID',  -- Remplacez par votre auth ID
  'Wilfried',
  'de Renty',
  'Wilfried de Renty',
  'wilfried@catapult.eu',
  'Management',
  'Hotel Manager',
  'manager',
  'director'
) ON CONFLICT (id) DO NOTHING;

-- Vérification finale
SELECT p.*, u.email as auth_email
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE p.id = 'YOUR_AUTH_ID';  -- Remplacez par votre auth ID

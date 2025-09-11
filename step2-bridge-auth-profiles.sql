-- ÉTAPE 2: BRIDGE AUTH VERS PROFILES
-- (Remplacez VOTRE_AUTH_ID et WILFRIED_PROFILE_ID par les vrais IDs)

-- Option A: Mettre à jour le profil Wilfried avec votre ID auth
UPDATE profiles 
SET id = 'VOTRE_AUTH_ID'  -- Remplacez par auth.uid() de l'étape 1
WHERE id = 'WILFRIED_PROFILE_ID';  -- Remplacez par l'ID du profil Wilfried

-- Option B: OU créer un nouveau profil avec votre ID auth
INSERT INTO profiles (
  id, 
  first_name, 
  last_name, 
  full_name, 
  email, 
  department, 
  job_title, 
  role
) VALUES (
  'VOTRE_AUTH_ID',  -- Votre ID auth
  'Wilfried',
  'de Renty', 
  'Wilfried de Renty',
  'wilfried@catapult.eu',  -- Votre email auth
  'Management',
  'Hotel Manager',
  'manager'
);

-- ÉTAPE 3: VÉRIFICATION
SELECT p.*, u.email as auth_email
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE p.id = 'VOTRE_AUTH_ID';

-- Script SQL final - Utilisation des VRAIS rôles du formulaire d'inscription
-- Basé sur l'image fournie avec les 5 rôles exacts

-- Étape 1: Supprimer la contrainte de type sur la colonne role
ALTER TABLE profiles ALTER COLUMN role TYPE TEXT;

-- Étape 2: Supprimer l'ancien ENUM user_role
DROP TYPE IF EXISTS user_role CASCADE;

-- Étape 3: Créer le nouvel ENUM avec les 5 rôles EXACTS du formulaire
CREATE TYPE user_role AS ENUM (
    'a receptionist',
    'Housekeeping Supervisor', 
    'Room Attendant',
    'restaurant staff',
    'tech maintenance team'
);

-- Étape 4: Remettre la colonne role au type ENUM
ALTER TABLE profiles ALTER COLUMN role TYPE user_role USING role::user_role;

-- Étape 5: Mettre à jour department selon la LOGIQUE COHÉRENTE des rôles
UPDATE profiles 
SET department = CASE 
    WHEN role::text = 'a receptionist' THEN 'Reception'
    WHEN role::text = 'restaurant staff' THEN 'Reception'  -- Restaurant fait partie de Reception
    WHEN role::text = 'Housekeeping Supervisor' THEN 'Housekeeping'
    WHEN role::text = 'Room Attendant' THEN 'Housekeeping'
    WHEN role::text = 'tech maintenance team' THEN 'Maintenance'
    ELSE 'Reception'
END;

-- Étape 6: Mettre à jour job_title selon les rôles exacts
UPDATE profiles 
SET job_title = CASE 
    WHEN role::text = 'a receptionist' THEN 'Réceptionniste'
    WHEN role::text = 'restaurant staff' THEN 'Valet Petit déjeuner'
    WHEN role::text = 'Housekeeping Supervisor' THEN 'Gouvernante'
    WHEN role::text = 'Room Attendant' THEN 'Femme de chambre'
    WHEN role::text = 'tech maintenance team' THEN 'Technicien de maintenance'
    ELSE job_title
END;

-- Étape 7: Créer la vue avec l'ordre EXACT demandé
-- job_title AVANT role, phone APRÈS email
CREATE OR REPLACE VIEW profiles_ordered AS
SELECT 
    id,
    email,          -- email en premier
    phone,          -- phone APRÈS email
    first_name,
    last_name,
    job_title,      -- job_title AVANT role
    role,           -- role après job_title
    department,
    avatar_url,
    hierarchy,
    is_active,
    created_at,
    updated_at
FROM profiles;

-- Vérification finale avec l'ordre correct
SELECT 
    email,
    phone,
    first_name,
    last_name,
    job_title,      -- job_title AVANT role
    role::text as role_from_form,
    department,
    is_active
FROM profiles 
WHERE is_active = true
ORDER BY department, job_title;
-- Script SQL pour modifier l'ENUM user_role selon les vrais rôles du formulaire
-- Supprime l'ancien ENUM et crée le nouveau avec les bonnes valeurs

-- Étape 1: Supprimer la contrainte de type sur la colonne role
ALTER TABLE profiles ALTER COLUMN role TYPE TEXT;

-- Étape 2: Supprimer l'ancien ENUM user_role
DROP TYPE IF EXISTS user_role CASCADE;

-- Étape 3: Créer le nouvel ENUM avec les vrais rôles du formulaire
CREATE TYPE user_role AS ENUM (
    'a receptionist',
    'Housekeeping Supervisor', 
    'Room Attendant',
    'restaurant staff',
    'tech maintenance team'
);

-- Étape 4: Remettre la colonne role au type ENUM
ALTER TABLE profiles ALTER COLUMN role TYPE user_role USING role::user_role;

-- Étape 5: Mettre à jour department selon les vrais rôles
UPDATE profiles 
SET department = CASE 
    WHEN role::text = 'a receptionist' OR role::text = 'restaurant staff' THEN 'Reception'
    WHEN role::text = 'Housekeeping Supervisor' OR role::text = 'Room Attendant' THEN 'Housekeeping'
    WHEN role::text = 'tech maintenance team' THEN 'Maintenance'
    ELSE 'Reception'
END;

-- Étape 6: Mettre à jour job_title selon les vrais rôles
UPDATE profiles 
SET job_title = CASE 
    WHEN role::text = 'a receptionist' THEN 'Réceptionniste'
    WHEN role::text = 'Housekeeping Supervisor' THEN 'Gouvernante'
    WHEN role::text = 'Room Attendant' THEN 'Femme de chambre'
    WHEN role::text = 'restaurant staff' THEN 'Valet Petit déjeuner'
    WHEN role::text = 'tech maintenance team' THEN 'Technicien de maintenance'
    ELSE job_title
END;

-- Étape 7: Créer la vue avec l'ordre souhaité
CREATE OR REPLACE VIEW profiles_ordered AS
SELECT 
    id,
    phone,          -- phone à gauche d'email
    email,
    first_name,
    last_name,
    job_title,      -- job_title à gauche de role
    role,
    department,
    avatar_url,
    hierarchy,
    is_active,
    created_at,
    updated_at
FROM profiles;

-- Vérification finale
SELECT 
    phone,
    email,
    first_name,
    last_name,
    job_title,
    role::text as role_from_form,
    department,
    is_active
FROM profiles 
WHERE is_active = true
ORDER BY department, role;
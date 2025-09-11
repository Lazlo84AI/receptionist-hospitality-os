-- Script SQL corrigé - Suppression de la vue d'abord
-- Résolution de l'erreur 9AB81

-- Étape 1: Supprimer la vue qui utilise la colonne role
DROP VIEW IF EXISTS profiles_ordered CASCADE;

-- Étape 2: Supprimer la contrainte de type sur la colonne role
ALTER TABLE profiles ALTER COLUMN role TYPE TEXT;

-- Étape 3: Supprimer l'ancien ENUM user_role
DROP TYPE IF EXISTS user_role CASCADE;

-- Étape 4: Créer le nouvel ENUM avec les 5 rôles EXACTS du formulaire
CREATE TYPE user_role AS ENUM (
    'a receptionist',
    'Housekeeping Supervisor', 
    'Room Attendant',
    'restaurant staff',
    'tech maintenance team'
);

-- Étape 5: Remettre la colonne role au type ENUM
ALTER TABLE profiles ALTER COLUMN role TYPE user_role USING role::user_role;

-- Étape 6: Mettre à jour department selon la logique cohérente
UPDATE profiles 
SET department = CASE 
    WHEN role::text = 'a receptionist' THEN 'Reception'
    WHEN role::text = 'restaurant staff' THEN 'Reception'
    WHEN role::text = 'Housekeeping Supervisor' THEN 'Housekeeping'
    WHEN role::text = 'Room Attendant' THEN 'Housekeeping'
    WHEN role::text = 'tech maintenance team' THEN 'Maintenance'
    ELSE 'Reception'
END;

-- Étape 7: Mettre à jour job_title selon les rôles exacts
UPDATE profiles 
SET job_title = CASE 
    WHEN role::text = 'a receptionist' THEN 'Réceptionniste'
    WHEN role::text = 'restaurant staff' THEN 'Valet Petit déjeuner'
    WHEN role::text = 'Housekeeping Supervisor' THEN 'Gouvernante'
    WHEN role::text = 'Room Attendant' THEN 'Femme de chambre'
    WHEN role::text = 'tech maintenance team' THEN 'Technicien de maintenance'
    ELSE job_title
END;

-- Étape 8: Recréer la vue avec l'ordre correct
CREATE VIEW profiles_ordered AS
SELECT 
    id,
    email,
    phone,
    first_name,
    last_name,
    job_title,
    role,
    department,
    avatar_url,
    hierarchy,
    is_active,
    created_at,
    updated_at
FROM profiles;

-- Vérification
SELECT 
    email,
    phone,
    first_name,
    last_name,
    job_title,
    role::text,
    department
FROM profiles 
WHERE is_active = true
ORDER BY department, job_title;
-- Script SQL final - Nettoyage complet des anciennes valeurs "staff"
-- Suppression de toutes les valeurs qui ne sont PAS dans le formulaire

-- Étape 1: Supprimer la vue
DROP VIEW IF EXISTS profiles_ordered CASCADE;

-- Étape 2: Convertir role en TEXT pour nettoyer
ALTER TABLE profiles ALTER COLUMN role TYPE TEXT;

-- Étape 3: NETTOYER toutes les anciennes valeurs incorrectes
UPDATE profiles 
SET role = CASE 
    -- Garder seulement les rôles qui existent dans le formulaire
    WHEN role = 'a receptionist' THEN 'a receptionist'
    WHEN role = 'Housekeeping Supervisor' THEN 'Housekeeping Supervisor'
    WHEN role = 'Room Attendant' THEN 'Room Attendant'
    WHEN role = 'restaurant staff' THEN 'restaurant staff'
    WHEN role = 'tech maintenance team' THEN 'tech maintenance team'
    
    -- Mapper les anciennes valeurs vers les bonnes
    WHEN role = 'staff' AND department = 'housekeeping' THEN 'Room Attendant'
    WHEN role = 'staff' AND department = 'maintenance' THEN 'tech maintenance team'
    WHEN role = 'staff' THEN 'a receptionist'  -- Par défaut réceptionniste
    WHEN role = 'housekeeping' THEN 'Room Attendant'
    WHEN role = 'maintenance' THEN 'tech maintenance team'
    WHEN role = 'admin' THEN 'a receptionist'  -- Admin devient réceptionniste
    WHEN role = 'manager' THEN 'Housekeeping Supervisor'  -- Manager devient superviseur
    
    -- Si pas reconnu, par défaut réceptionniste
    ELSE 'a receptionist'
END;

-- Étape 4: Supprimer l'ancien ENUM
DROP TYPE IF EXISTS user_role CASCADE;

-- Étape 5: Créer le nouvel ENUM avec SEULEMENT les 5 rôles du formulaire
CREATE TYPE user_role AS ENUM (
    'a receptionist',
    'Housekeeping Supervisor', 
    'Room Attendant',
    'restaurant staff',
    'tech maintenance team'
);

-- Étape 6: Reconvertir role en ENUM
ALTER TABLE profiles ALTER COLUMN role TYPE user_role USING role::user_role;

-- Étape 7: Mettre à jour department
UPDATE profiles 
SET department = CASE 
    WHEN role::text = 'a receptionist' THEN 'Reception'
    WHEN role::text = 'restaurant staff' THEN 'Reception'
    WHEN role::text = 'Housekeeping Supervisor' THEN 'Housekeeping'
    WHEN role::text = 'Room Attendant' THEN 'Housekeeping'
    WHEN role::text = 'tech maintenance team' THEN 'Maintenance'
END;

-- Étape 8: Mettre à jour job_title
UPDATE profiles 
SET job_title = CASE 
    WHEN role::text = 'a receptionist' THEN 'Réceptionniste'
    WHEN role::text = 'restaurant staff' THEN 'Valet Petit déjeuner'
    WHEN role::text = 'Housekeeping Supervisor' THEN 'Gouvernante'
    WHEN role::text = 'Room Attendant' THEN 'Femme de chambre'
    WHEN role::text = 'tech maintenance team' THEN 'Technicien de maintenance'
END;

-- Étape 9: Recréer la vue
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

-- Vérification - plus aucun "staff" ne doit apparaître
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
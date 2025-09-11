-- Script SQL pour réorganiser la table profiles selon les spécifications
-- Basé sur les données visibles dans l'interface Supabase

-- Étape 1: Mettre à jour la colonne department (seulement 3 valeurs autorisées)
UPDATE profiles 
SET department = CASE 
    WHEN department = 'a receptionist' OR department = 'restaurant staff' OR role = 'staff' THEN 'Reception'
    WHEN department = 'housekeeping' OR role = 'housekeeping' OR department = 'Room Attendant' OR department = 'Housekeeping Supervisor' THEN 'Housekeeping'
    WHEN department = 'maintenance' OR role = 'maintenance' OR department = 'tech maintenance team' THEN 'Maintenance'
    WHEN role = 'admin' THEN 'Reception' -- Directeur rattaché à Reception
    WHEN role = 'manager' THEN 'Reception' -- Manager rattaché à Reception
    ELSE 'Reception' -- Par défaut, tout le monde est rattaché à Reception
END;

-- Étape 2: Mettre à jour la colonne role selon la logique department
UPDATE profiles 
SET role = CASE 
    WHEN job_title = 'Directeur' THEN 'admin'
    WHEN job_title = 'Cheffe de réception' THEN 'manager' 
    WHEN department = 'Housekeeping' THEN 'housekeeping'
    WHEN department = 'Maintenance' THEN 'maintenance'
    WHEN department = 'Reception' THEN 'staff'
    ELSE 'staff'
END;

-- Étape 3: Vérifier que toutes les colonnes job_title sont bien remplies
UPDATE profiles 
SET job_title = CASE 
    WHEN job_title IS NULL OR job_title = '' THEN
        CASE 
            WHEN role = 'admin' THEN 'Directeur'
            WHEN role = 'manager' AND department = 'Reception' THEN 'Cheffe de réception'
            WHEN role = 'housekeeping' AND department = 'Housekeeping' THEN 'Femme de chambre'
            WHEN role = 'maintenance' AND department = 'Maintenance' THEN 'Technicien de maintenance'
            WHEN role = 'staff' AND department = 'Reception' THEN 'Réceptionniste'
            ELSE job_title -- Garder la valeur existante si elle est déjà remplie
        END
    ELSE job_title -- Garder la valeur existante si elle est déjà remplie
END;

-- Étape 4: Ajouter des contraintes pour maintenir la cohérence
-- Supprimer les anciennes contraintes si elles existent
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS check_department_values;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS check_role_values;

-- Ajouter les nouvelles contraintes
ALTER TABLE profiles 
ADD CONSTRAINT check_department_values 
CHECK (department IN ('Housekeeping', 'Reception', 'Maintenance'));

ALTER TABLE profiles 
ADD CONSTRAINT check_role_values 
CHECK (role IN ('admin', 'manager', 'staff', 'maintenance', 'housekeeping'));

-- Étape 5: Créer une vue avec l'ordre des colonnes souhaité
-- phone à gauche d'email, job_title à gauche de role
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

-- Étape 6: Vérification finale des données
SELECT 
    phone,
    email,
    first_name,
    last_name,
    job_title,
    role,
    department,
    is_active
FROM profiles 
WHERE is_active = true
ORDER BY department, job_title;

-- Étape 7: Statistiques par département
SELECT 
    department,
    role,
    COUNT(*) as nombre_employes
FROM profiles 
WHERE is_active = true
GROUP BY department, role
ORDER BY department, role;
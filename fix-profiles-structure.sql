-- Modification de la structure de la table profiles
-- 1. Réorganiser les colonnes et clarifier la logique

-- Étape 1: Ajouter la nouvelle colonne job_title si elle n'existe pas déjà
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS job_title TEXT;

-- Étape 2: Mettre à jour les job_title avec les bonnes valeurs depuis la colonne role existante
UPDATE profiles 
SET job_title = CASE 
    WHEN role = 'staff' AND department = 'reception' THEN 'Réceptionniste'
    WHEN role = 'staff' AND department = 'housekeeping' THEN 'Femme de chambre'
    WHEN role = 'staff' AND department = 'maintenance' THEN 'Technicien de maintenance'
    WHEN role = 'manager' AND department = 'reception' THEN 'Cheffe de réception'
    WHEN role = 'housekeeping' THEN 'Gouvernante'
    WHEN role = 'maintenance' THEN 'Technicien de maintenance'
    WHEN role = 'admin' THEN 'Directeur'
    ELSE 'Staff'
END;

-- Étape 3: Normaliser la colonne department (seulement 3 valeurs)
UPDATE profiles 
SET department = CASE 
    WHEN department = 'housekeeping' OR role = 'housekeeping' THEN 'Housekeeping'
    WHEN department = 'reception' OR department = 'a receptionist' OR department = 'restaurant staff' THEN 'Reception'
    WHEN department = 'maintenance' OR role = 'maintenance' OR department = 'tech maintenance team' THEN 'Maintenance'
    ELSE 'Reception' -- Par défaut
END;

-- Étape 4: Normaliser la colonne role (pour les permissions système)
UPDATE profiles 
SET role = CASE 
    WHEN job_title = 'Directeur' THEN 'admin'
    WHEN job_title = 'Cheffe de réception' THEN 'manager'
    WHEN department = 'Housekeeping' THEN 'housekeeping'
    WHEN department = 'Maintenance' THEN 'maintenance'
    ELSE 'staff'
END;

-- Étape 5: Ajouter des contraintes pour maintenir la cohérence
ALTER TABLE profiles 
ADD CONSTRAINT check_department_values 
CHECK (department IN ('Housekeeping', 'Reception', 'Maintenance'));

ALTER TABLE profiles 
ADD CONSTRAINT check_role_values 
CHECK (role IN ('admin', 'manager', 'staff', 'maintenance', 'housekeeping'));

-- Étape 6: Réorganiser l'ordre des colonnes (PostgreSQL ne permet pas de réorganiser directement)
-- On va créer une vue pour l'ordre souhaité
CREATE OR REPLACE VIEW profiles_ordered AS
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

-- Vérification des données
SELECT 
    first_name,
    last_name,
    job_title,
    role,
    department,
    email
FROM profiles 
WHERE is_active = true
ORDER BY department, job_title;
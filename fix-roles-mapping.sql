-- Script SQL pour mapper correctement les rôles du formulaire vers l'ENUM user_role
-- Basé sur les valeurs visibles dans le formulaire d'inscription

-- Étape 1: Mettre à jour department selon les rôles actuels
UPDATE profiles 
SET department = CASE 
    WHEN role::text LIKE '%receptionist%' OR role::text = 'manager' OR role::text = 'admin' THEN 'Reception'
    WHEN role::text = 'housekeeping' OR role::text LIKE '%Housekeeping%' OR role::text LIKE '%Room Attendant%' THEN 'Housekeeping'
    WHEN role::text = 'maintenance' OR role::text LIKE '%maintenance%' THEN 'Maintenance'
    ELSE 'Reception'
END;

-- Étape 2: Mapper les rôles du formulaire vers l'ENUM user_role
UPDATE profiles 
SET role = CASE 
    -- Admin (Directeur)
    WHEN role::text = 'admin' OR job_title = 'Directeur' THEN 'admin'::user_role
    
    -- Manager (Cheffe de réception, Gouvernante)
    WHEN role::text = 'manager' OR 
         job_title = 'Cheffe de réception' OR 
         job_title = 'Gouvernante' OR
         role::text = 'Housekeeping Supervisor' THEN 'manager'::user_role
    
    -- Housekeeping (Femme de chambre, Room Attendant)
    WHEN role::text = 'housekeeping' OR 
         job_title = 'Femme de chambre' OR
         role::text = 'Room Attendant' THEN 'housekeeping'::user_role
    
    -- Maintenance (Technicien)
    WHEN role::text = 'maintenance' OR 
         job_title = 'Technicien de maintenance' OR
         role::text = 'tech maintenance team' THEN 'maintenance'::user_role
    
    -- Staff (Réceptionniste, restaurant staff, etc.)
    WHEN role::text = 'staff' OR 
         role::text = 'a receptionist' OR 
         role::text = 'restaurant staff' OR
         job_title = 'Réceptionniste' OR
         job_title = 'Valet Petit déjeuner' THEN 'staff'::user_role
    
    -- Par défaut staff
    ELSE 'staff'::user_role
END;

-- Étape 3: Synchroniser les job_title avec les nouveaux rôles
UPDATE profiles 
SET job_title = CASE 
    WHEN role = 'admin' THEN 'Directeur'
    WHEN role = 'manager' AND department = 'Reception' THEN 'Cheffe de réception'
    WHEN role = 'manager' AND department = 'Housekeeping' THEN 'Gouvernante'
    WHEN role = 'housekeeping' THEN 'Femme de chambre'
    WHEN role = 'maintenance' THEN 'Technicien de maintenance'
    WHEN role = 'staff' AND department = 'Reception' THEN 'Réceptionniste'
    WHEN role = 'staff' AND department = 'Housekeeping' THEN 'Femme de chambre'
    ELSE job_title -- Garder la valeur existante si elle est cohérente
END
WHERE job_title IS NULL OR job_title = '';

-- Étape 4: Créer la vue avec le bon ordre des colonnes
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
    role::text as role_enum,
    department,
    is_active
FROM profiles 
WHERE is_active = true
ORDER BY department, role, job_title;
-- SCRIPT SQL COMPLET CORRIGÉ - Synchronisation role + hierarchy
-- Date : 2025-09-24

-- ===========================================
-- ÉTAPE 1: Ajouter les nouvelles valeurs ENUM
-- ===========================================
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'Receptionist';  -- Avec majuscule
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'Director';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'Restaurant staff';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'Tech maintenance team';

-- ===========================================
-- ÉTAPE 2: Migrer les données role avec majuscules
-- ===========================================
UPDATE public.staff_directory 
SET role = 'Receptionist'::public.user_role 
WHERE role = 'receptionist'::public.user_role;

UPDATE public.staff_directory 
SET role = 'Restaurant staff'::public.user_role 
WHERE role = 'restaurant staff'::public.user_role;

UPDATE public.staff_directory 
SET role = 'Tech maintenance team'::public.user_role 
WHERE role = 'tech maintenance team'::public.user_role;

-- ===========================================
-- ÉTAPE 3: Gérer les contraintes hierarchy
-- ===========================================
ALTER TABLE public.staff_directory DROP CONSTRAINT IF EXISTS check_hierarchy;
ALTER TABLE public.staff_directory DROP CONSTRAINT IF EXISTS check_hierarchy_new;

-- Migrer hierarchy Normal → Collaborator
UPDATE public.staff_directory SET hierarchy = 'Collaborator' WHERE hierarchy = 'Normal';
UPDATE public.profiles SET hierarchy = 'Collaborator' WHERE hierarchy = 'Normal';

-- Migrer hierarchy Director → Collaborator  
UPDATE public.staff_directory SET hierarchy = 'Collaborator' WHERE hierarchy = 'Director';
UPDATE public.profiles SET hierarchy = 'Collaborator' WHERE hierarchy = 'Director';

-- Nouvelle contrainte
ALTER TABLE public.staff_directory 
ADD CONSTRAINT check_hierarchy_final 
CHECK (hierarchy = ANY (ARRAY['Collaborator'::text, 'Manager'::text]));

-- ===========================================
-- ÉTAPE 4: FONCTION DE SYNCHRONISATION AUTOMATIQUE
-- ===========================================
CREATE OR REPLACE FUNCTION sync_profiles_to_staff_directory()
RETURNS TRIGGER AS $$
BEGIN
    -- Synchroniser les deux champs: role ET hierarchy
    UPDATE public.staff_directory 
    SET 
        role = NEW.role::public.user_role,  -- Synchroniser le rôle
        hierarchy = NEW.hierarchy,           -- Synchroniser la hiérarchie
        first_name = COALESCE(NEW.first_name, first_name),
        last_name = COALESCE(NEW.last_name, last_name),
        email = COALESCE(NEW.email, email),
        updated_at = NOW()
    WHERE auth_user_id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- ÉTAPE 5: TRIGGER AUTOMATIQUE
-- ===========================================
DROP TRIGGER IF EXISTS trigger_sync_profiles_to_staff ON public.profiles;

CREATE OR REPLACE TRIGGER trigger_sync_profiles_to_staff
    AFTER INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_profiles_to_staff_directory();

-- ===========================================
-- ÉTAPE 6: VÉRIFICATION FINALE
-- ===========================================
SELECT 'staff_directory roles' as check_type, role::text, COUNT(*) 
FROM public.staff_directory 
WHERE role IS NOT NULL
GROUP BY role
UNION ALL
SELECT 'staff_directory hierarchy' as check_type, hierarchy, COUNT(*) 
FROM public.staff_directory 
WHERE hierarchy IS NOT NULL
GROUP BY hierarchy
UNION ALL
SELECT 'profiles hierarchy' as check_type, hierarchy, COUNT(*) 
FROM public.profiles 
WHERE hierarchy IS NOT NULL
GROUP BY hierarchy
ORDER BY check_type, role;
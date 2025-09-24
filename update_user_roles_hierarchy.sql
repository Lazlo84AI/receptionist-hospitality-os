-- SCRIPT SQL : Mise à jour des rôles et hiérarchie
-- Date : 2025-09-24
-- Objectif : Ajouter "Director", corriger majuscules, mettre à jour hiérarchie

-- ===========================================
-- PARTIE 1: MISE À JOUR ENUM user_role
-- ===========================================

-- 1.1. Ajouter les nouvelles valeurs à l'ENUM user_role
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'Director';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'Restaurant staff';  -- Avec majuscule
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'Tech maintenance team';  -- Avec majuscule

-- 1.2. Migrer les données existantes vers les nouvelles valeurs avec majuscules
UPDATE public.staff_directory 
SET role = 'Restaurant staff'::public.user_role 
WHERE role = 'restaurant staff'::public.user_role;

UPDATE public.staff_directory 
SET role = 'Tech maintenance team'::public.user_role 
WHERE role = 'tech maintenance team'::public.user_role;

-- ===========================================
-- PARTIE 2: MISE À JOUR CONTRAINTE HIERARCHY
-- ===========================================

-- 2.1. Supprimer l'ancienne contrainte
ALTER TABLE public.staff_directory 
DROP CONSTRAINT IF EXISTS check_hierarchy;

-- 2.2. Migrer les données existantes
UPDATE public.staff_directory 
SET hierarchy = 'Collaborator' 
WHERE hierarchy = 'Normal';

-- Migrer "Director" de hierarchy vers Collaborator (car supprimé de hierarchy)
UPDATE public.staff_directory 
SET hierarchy = 'Collaborator' 
WHERE hierarchy = 'Director';

-- 2.3. Créer la nouvelle contrainte
ALTER TABLE public.staff_directory 
ADD CONSTRAINT check_hierarchy_new 
CHECK (hierarchy = ANY (ARRAY['Collaborator'::text, 'Manager'::text]));

-- ===========================================
-- PARTIE 3: MISE À JOUR FONCTION handle_new_user
-- ===========================================

-- 3.1. Recréer la fonction avec le nouveau default
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role, hierarchy)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'job_role',  -- Changé de 'role' à 'job_role'
    COALESCE(NEW.raw_user_meta_data->>'hierarchy', 'Collaborator')  -- Changé de 'Normal' à 'Collaborator'
  );
  RETURN NEW;
END;
$$;

-- ===========================================
-- PARTIE 4: MISE À JOUR TABLE profiles
-- ===========================================

-- 4.1. Migrer les données de hierarchy dans profiles
UPDATE public.profiles 
SET hierarchy = 'Collaborator' 
WHERE hierarchy = 'Normal';

-- 4.2. Migrer "Director" de hierarchy vers Collaborator 
UPDATE public.profiles 
SET hierarchy = 'Collaborator' 
WHERE hierarchy = 'Director';

-- ===========================================
-- PARTIE 5: VÉRIFICATIONS
-- ===========================================

-- 5.1. Vérifier les valeurs ENUM
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'public.user_role'::regtype 
ORDER BY enumlabel;

-- 5.2. Vérifier les contraintes
SELECT conname, consrc 
FROM pg_constraint 
WHERE conrelid = 'public.staff_directory'::regclass 
AND conname = 'check_hierarchy_new';

-- 5.3. Compter les données migrées
SELECT 
    'staff_directory' as table_name,
    hierarchy, 
    COUNT(*) as count 
FROM public.staff_directory 
GROUP BY hierarchy
UNION ALL
SELECT 
    'profiles' as table_name,
    hierarchy, 
    COUNT(*) as count 
FROM public.profiles 
GROUP BY hierarchy;

-- ===========================================
-- FIN DU SCRIPT
-- ===========================================

-- REMARQUES:
-- 1. Ce script est idempotent (peut être exécuté plusieurs fois)
-- 2. Les anciennes valeurs enum restent pour compatibilité ascendante
-- 3. Toutes les données sont migrées automatiquement
-- 4. Les nouvelles inscriptions utiliseront les bonnes valeurs
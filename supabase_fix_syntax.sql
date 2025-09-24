-- SCRIPT SQL CORRIGÉ - Exécution directe Supabase
-- Date : 2025-09-24

-- ÉTAPE 1: Ajouter les nouveaux rôles à l'ENUM
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'Director';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'Restaurant staff';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'Tech maintenance team';

-- ÉTAPE 2: Mettre à jour les majuscules dans staff_directory
UPDATE public.staff_directory 
SET role = 'Restaurant staff'::public.user_role 
WHERE role = 'restaurant staff'::public.user_role;

UPDATE public.staff_directory 
SET role = 'Tech maintenance team'::public.user_role 
WHERE role = 'tech maintenance team'::public.user_role;

-- ÉTAPE 3: Supprimer l'ancienne contrainte hierarchy
ALTER TABLE public.staff_directory DROP CONSTRAINT IF EXISTS check_hierarchy;

-- ÉTAPE 4: Migrer hierarchy Normal vers Collaborator
UPDATE public.staff_directory SET hierarchy = 'Collaborator' WHERE hierarchy = 'Normal';
UPDATE public.profiles SET hierarchy = 'Collaborator' WHERE hierarchy = 'Normal';

-- ÉTAPE 5: Migrer hierarchy Director vers Collaborator  
UPDATE public.staff_directory SET hierarchy = 'Collaborator' WHERE hierarchy = 'Director';
UPDATE public.profiles SET hierarchy = 'Collaborator' WHERE hierarchy = 'Director';

-- ÉTAPE 6: Créer la nouvelle contrainte hierarchy
ALTER TABLE public.staff_directory 
ADD CONSTRAINT check_hierarchy_new 
CHECK (hierarchy = ANY (ARRAY['Collaborator'::text, 'Manager'::text]));

-- ÉTAPE 7: Vérification finale
SELECT 'staff_directory' as table_name, hierarchy, COUNT(*) 
FROM public.staff_directory GROUP BY hierarchy
UNION ALL
SELECT 'profiles' as table_name, hierarchy, COUNT(*) 
FROM public.profiles GROUP BY hierarchy;
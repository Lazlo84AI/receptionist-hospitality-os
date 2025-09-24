-- SCRIPT SQL SIMPLIFIÉ : Mise à jour par étapes
-- Date : 2025-09-24
-- À exécuter dans l'ordre dans Supabase SQL Editor

-- ==========================================
-- ÉTAPE 1: Ajouter "Director" à l'ENUM
-- ==========================================
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'Director';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'Restaurant staff';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'Tech maintenance team';

-- ==========================================  
-- ÉTAPE 2: Mettre à jour les majuscules
-- ==========================================
UPDATE public.staff_directory 
SET role = 'Restaurant staff'::public.user_role 
WHERE role = 'restaurant staff'::public.user_role;

UPDATE public.staff_directory 
SET role = 'Tech maintenance team'::public.user_role 
WHERE role = 'tech maintenance team'::public.user_role;

-- ==========================================
-- ÉTAPE 3: Supprimer ancienne contrainte
-- ==========================================
ALTER TABLE public.staff_directory DROP CONSTRAINT IF EXISTS check_hierarchy;

-- ==========================================
-- ÉTAPE 4: Migrer hierarchy Normal → Collaborator
-- ==========================================
UPDATE public.staff_directory SET hierarchy = 'Collaborator' WHERE hierarchy = 'Normal';
UPDATE public.profiles SET hierarchy = 'Collaborator' WHERE hierarchy = 'Normal';

-- ==========================================
-- ÉTAPE 5: Migrer hierarchy Director → Collaborator  
-- ==========================================
UPDATE public.staff_directory SET hierarchy = 'Collaborator' WHERE hierarchy = 'Director';
UPDATE public.profiles SET hierarchy = 'Collaborator' WHERE hierarchy = 'Director';

-- ==========================================
-- ÉTAPE 6: Nouvelle contrainte hierarchy
-- ==========================================
ALTER TABLE public.staff_directory 
ADD CONSTRAINT check_hierarchy_new 
CHECK (hierarchy = ANY (ARRAY['Collaborator'::text, 'Manager'::text]));

-- ==========================================
-- ÉTAPE 7: Vérification finale
-- ==========================================
SELECT hierarchy, COUNT(*) FROM public.staff_directory GROUP BY hierarchy;
SELECT hierarchy, COUNT(*) FROM public.profiles GROUP BY hierarchy;
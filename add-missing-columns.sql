-- ÉTAPE 1: AJOUTER LES COLONNES MANQUANTES À PROFILES
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role TEXT,
ADD COLUMN IF NOT EXISTS hierarchy TEXT;

-- Mise à jour des rôles existants si nécessaire
UPDATE profiles SET role = 'receptionist' WHERE role IS NULL AND department = 'Reception';
UPDATE profiles SET role = 'housekeeping' WHERE role IS NULL AND department = 'Housekeeping';
UPDATE profiles SET role = 'maintenance' WHERE role IS NULL AND department = 'Maintenance';

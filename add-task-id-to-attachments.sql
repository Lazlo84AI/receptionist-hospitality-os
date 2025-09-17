-- Script SQL pour modifier la table attachments
-- À exécuter dans le Query Editor de Supabase

-- 1. Ajouter la colonne task_id pour lier aux tâches
ALTER TABLE attachments 
ADD COLUMN task_id UUID REFERENCES task(id) ON DELETE CASCADE;

-- 2. Vérifier la structure actuelle (optionnel)
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'attachments' 
-- ORDER BY ordinal_position;
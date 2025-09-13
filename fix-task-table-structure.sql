-- Phase 1 : Correction de la structure de la table task
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Rendre les champs obligatoires non-nullable
ALTER TABLE task ALTER COLUMN id SET NOT NULL;
ALTER TABLE task ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE task ADD CONSTRAINT task_pkey PRIMARY KEY (id);

ALTER TABLE task ALTER COLUMN title SET NOT NULL;
ALTER TABLE task ALTER COLUMN category SET NOT NULL;
ALTER TABLE task ALTER COLUMN priority SET NOT NULL;
ALTER TABLE task ALTER COLUMN priority SET DEFAULT 'normal';
ALTER TABLE task ALTER COLUMN status SET NOT NULL;
ALTER TABLE task ALTER COLUMN status SET DEFAULT 'pending';
ALTER TABLE task ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE task ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE task ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE task ALTER COLUMN updated_at SET DEFAULT now();

-- 2. Supprimer les doublons de colonnes (garder les versions optimales)
-- On garde location_id (UUID) et on supprime location (text) 
-- Mais d'abord on va migrer les données location (text) vers location_id

-- 3. Ajouter des contraintes de validation
ALTER TABLE task ADD CONSTRAINT valid_priority CHECK (priority IN ('normal', 'urgent'));
ALTER TABLE task ADD CONSTRAINT valid_status CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'));
ALTER TABLE task ADD CONSTRAINT valid_category CHECK (category IN ('incident', 'client_request', 'follow_up', 'internal_task'));

-- 4. Créer un trigger pour auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_task_updated_at 
    BEFORE UPDATE ON task 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Ajouter des index pour les performances
CREATE INDEX idx_task_status ON task(status);
CREATE INDEX idx_task_category ON task(category);
CREATE INDEX idx_task_priority ON task(priority);
CREATE INDEX idx_task_created_by ON task(created_by);
CREATE INDEX idx_task_location_id ON task(location_id);

-- Phase 3 : Nettoyage et optimisation post-migration
-- À exécuter après validation de la migration

-- 1. Supprimer la colonne location (text) une fois location_id mappé
-- ALTER TABLE task DROP COLUMN location;

-- 2. Supprimer les tables obsolètes (ATTENTION: SAUVEGARDER D'ABORD)
-- DROP TABLE IF EXISTS internal_tasks;
-- DROP TABLE IF EXISTS incidents;
-- DROP TABLE IF EXISTS client_requests;
-- DROP TABLE IF EXISTS follow_ups;

-- 3. Créer des vues pour compatibilité si nécessaire
CREATE OR REPLACE VIEW incidents_view AS
SELECT * FROM task WHERE category = 'incident';

CREATE OR REPLACE VIEW client_requests_view AS  
SELECT * FROM task WHERE category = 'client_request';

CREATE OR REPLACE VIEW follow_ups_view AS
SELECT * FROM task WHERE category = 'follow_up';

CREATE OR REPLACE VIEW internal_tasks_view AS
SELECT * FROM task WHERE category = 'internal_task';

-- 4. Mise à jour des politiques RLS pour la table task
ALTER TABLE task ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent voir toutes les tâches (lecture)
CREATE POLICY "Users can view all tasks" ON task
    FOR SELECT USING (true);

-- Politique : Les utilisateurs peuvent créer des tâches
CREATE POLICY "Users can create tasks" ON task
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Politique : Les utilisateurs peuvent modifier leurs propres tâches ou celles qui leur sont assignées
CREATE POLICY "Users can update own or assigned tasks" ON task
    FOR UPDATE USING (
        auth.uid() = created_by OR 
        auth.uid() = ANY(assigned_to) OR
        auth.uid() = current_receptionist_id
    );

-- 5. Statistiques finales
SELECT 
    'Migration terminée' as status,
    count(*) as total_tasks,
    count(DISTINCT category) as categories_count,
    count(DISTINCT service) as services_count,
    count(DISTINCT priority) as priority_levels,
    count(DISTINCT status) as status_types
FROM task;

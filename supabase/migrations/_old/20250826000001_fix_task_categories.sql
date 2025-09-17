-- Migration pour corriger les catégories de tâches manquantes
-- Date: $(date)
-- Description: Ajout de l'ENUM task_category manquant et mise à jour des contraintes

-- 1. Créer l'ENUM pour les catégories de tâches
CREATE TYPE public.task_category AS ENUM (
    'incident', 
    'client_request', 
    'follow_up', 
    'internal_task'
);

-- 2. Ajouter des contraintes sur les colonnes task_type existantes
-- (Alternative à la modification du type de colonne pour éviter les problèmes de migration)

-- Contrainte pour comments.task_type
ALTER TABLE public.comments 
ADD CONSTRAINT comments_task_type_check 
CHECK (task_type IN ('incident', 'client_request', 'follow_up', 'internal_task'));

-- Contrainte pour checklists.task_type  
ALTER TABLE public.checklists 
ADD CONSTRAINT checklists_task_type_check 
CHECK (task_type IN ('incident', 'client_request', 'follow_up', 'internal_task'));

-- Contrainte pour reminders.task_type
ALTER TABLE public.reminders 
ADD CONSTRAINT reminders_task_type_check 
CHECK (task_type IN ('incident', 'client_request', 'follow_up', 'internal_task'));

-- Contrainte pour attachments.task_type
ALTER TABLE public.attachments 
ADD CONSTRAINT attachments_task_type_check 
CHECK (task_type IN ('incident', 'client_request', 'follow_up', 'internal_task'));

-- Contrainte pour escalations.task_type
ALTER TABLE public.escalations 
ADD CONSTRAINT escalations_task_type_check 
CHECK (task_type IN ('incident', 'client_request', 'follow_up', 'internal_task'));

-- Contrainte pour activity_log.task_type (nullable)
ALTER TABLE public.activity_log 
ADD CONSTRAINT activity_log_task_type_check 
CHECK (task_type IS NULL OR task_type IN ('incident', 'client_request', 'follow_up', 'internal_task'));

-- Contrainte pour task_members.task_type
ALTER TABLE public.task_members 
ADD CONSTRAINT task_members_task_type_check 
CHECK (task_type IN ('incident', 'client_request', 'follow_up', 'internal_task'));

-- 3. Ajouter un commentaire pour documentation
COMMENT ON TYPE public.task_category IS 'Enumération des catégories de tâches disponibles dans HospitalityOS';

-- 4. Ajouter des index pour optimiser les requêtes par task_type
CREATE INDEX IF NOT EXISTS idx_comments_task_type ON public.comments(task_type);
CREATE INDEX IF NOT EXISTS idx_checklists_task_type ON public.checklists(task_type);  
CREATE INDEX IF NOT EXISTS idx_reminders_task_type ON public.reminders(task_type);
CREATE INDEX IF NOT EXISTS idx_attachments_task_type ON public.attachments(task_type);
CREATE INDEX IF NOT EXISTS idx_escalations_task_type ON public.escalations(task_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_task_type ON public.activity_log(task_type);
CREATE INDEX IF NOT EXISTS idx_task_members_task_type ON public.task_members(task_type);

-- 5. Créer une vue unifiée pour toutes les tâches avec leur catégorie (OPTIONNEL)
CREATE OR REPLACE VIEW public.unified_tasks AS
SELECT 
    id,
    title,
    'incident' as task_category,
    priority::text as priority,
    status::text as status,
    description,
    assigned_to,
    location,
    null as guest_name,
    null as room_number,
    null as recipient,
    null as due_date,
    null as arrival_date,
    created_at,
    updated_at
FROM public.incidents

UNION ALL

SELECT 
    id,
    CONCAT(request_type, ' - ', guest_name) as title,
    'client_request' as task_category,
    priority::text as priority,
    preparation_status::text as status,
    request_details as description,
    assigned_to,
    null as location,
    guest_name,
    room_number,
    null as recipient,
    null as due_date,
    arrival_date,
    created_at,
    updated_at
FROM public.client_requests

UNION ALL

SELECT 
    id,
    title,
    'follow_up' as task_category,
    priority::text as priority,
    status::text as status,
    notes as description,
    assigned_to,
    null as location,
    null as guest_name,
    null as room_number,
    recipient,
    due_date,
    null as arrival_date,
    created_at,
    updated_at
FROM public.follow_ups

UNION ALL

SELECT 
    id,
    title,
    'internal_task' as task_category,
    priority::text as priority,
    status::text as status,
    description,
    assigned_to,
    location,
    null as guest_name,
    null as room_number,
    null as recipient,
    due_date,
    null as arrival_date,
    created_at,
    updated_at
FROM public.internal_tasks;

-- Ajouter des commentaires de documentation
COMMENT ON VIEW public.unified_tasks IS 'Vue unifiée de toutes les tâches avec leur catégorie explicite';

-- Phase 2 : Migration des données internal_tasks vers task
-- À exécuter après avoir corrigé la structure de la table task

-- 1. D'abord, créer les locations manquantes dans la table locations si nécessaire
-- (nous traiterons les locations texte en créant des entrées correspondantes)

-- 2. Migration des données avec transformation des champs
INSERT INTO task (
    id,
    title,
    description,
    category,                    -- task_type devient category
    origin_type,
    service,                     -- department devient service
    assigned_to,                 -- Conversion UUID vers ARRAY
    created_by,
    location,                    -- Temporaire, sera mappé vers location_id plus tard
    location_id,
    priority,
    status,
    created_at,
    updated_at,
    checklist_items,            -- checklists devient checklist_items
    collaborators,              -- Nouveau champ
    reminder_date,              -- due_date devient reminder_date
    validation_status           -- Nouveau champ par défaut
)
SELECT 
    id,
    title,
    description,
    task_type,                   -- task_type → category
    origin_type,
    department,                  -- department → service
    CASE 
        WHEN assigned_to IS NOT NULL THEN ARRAY[assigned_to]::uuid[]
        ELSE NULL
    END,                        -- UUID → ARRAY[UUID]
    created_by,
    location,                   -- Garder temporairement
    location_id,
    priority,
    status,
    created_at,
    updated_at,
    checklists,                 -- checklists → checklist_items
    CASE 
        WHEN assigned_to IS NOT NULL THEN jsonb_build_object('members', ARRAY[assigned_to])
        ELSE NULL
    END,                        -- Créer structure collaborators
    due_date,                   -- due_date → reminder_date
    'pending'                   -- validation_status par défaut
FROM internal_tasks;

-- 3. Vérification des données migrées
SELECT 
    'Données migrées' as info,
    count(*) as total_tasks,
    count(CASE WHEN category = 'incident' THEN 1 END) as incidents,
    count(CASE WHEN category = 'follow_up' THEN 1 END) as follow_ups,
    count(CASE WHEN category = 'internal_task' THEN 1 END) as internal_tasks,
    count(CASE WHEN category = 'client_request' THEN 1 END) as client_requests
FROM task;

-- 4. Afficher quelques exemples pour validation
SELECT id, title, category, service, priority, status, assigned_to, location
FROM task 
ORDER BY created_at DESC 
LIMIT 5;

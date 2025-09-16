-- Créer une internal_task directement en SQL dans Supabase
-- À copier-coller dans l'éditeur SQL de Supabase

-- 1. Récupérer un utilisateur existant (remplacez par votre ID si vous le connaissez)
-- SELECT id, first_name, last_name FROM profiles LIMIT 1;

-- 2. Créer l'internal_task (remplacez USER_ID_ICI par un vrai ID)
INSERT INTO task (
  title,
  description, 
  category,
  priority,
  service,
  origin_type,
  assigned_to,
  created_by,
  updated_by,
  location,
  status,
  checklist_items,
  collaborators,
  reminder_date,
  validation_status,
  requires_validation,
  attachment_url
) VALUES (
  'Internal Task Test - SQL Direct - ' || NOW()::text,
  'Tâche interne créée directement en SQL pour tester la structure',
  'internal_task',                    -- ENUM task_category
  'normal',                          -- ENUM priority_level
  'reception',                       -- ENUM task_service  
  'team',                           -- ENUM task_origin
  '["USER_ID_ICI"]'::jsonb,         -- ARRAY d'IDs en JSONB
  'USER_ID_ICI',                    -- ID du créateur
  'USER_ID_ICI',                    -- ID pour logging
  'Reception Desk',                  -- Location
  'pending',                         -- Status
  NULL,                             -- Pas de checklist
  '{"members": ["USER_ID_ICI"]}'::jsonb,  -- Collaborators en JSONB
  NULL,                             -- Pas de reminder
  'pending',                        -- Validation status
  false,                            -- Pas de validation requise
  NULL                              -- Pas d'attachment
);

-- 3. Vérifier la création
SELECT * FROM task WHERE category = 'internal_task' ORDER BY created_at DESC LIMIT 1;

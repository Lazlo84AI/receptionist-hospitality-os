-- Script pour assigner les 2 tâches au shift actif
-- Étape 1: Trouver le shift actif
SELECT id, status, start_time, user_id 
FROM shifts 
WHERE status = 'active' 
ORDER BY start_time DESC 
LIMIT 1;

-- Étape 2: Vérifier les tâches à assigner
SELECT id, title, shift_id, created_at 
FROM task 
WHERE id IN (
  '9c8a37eb-79dc-4abe-8739-c6ff787d5171',
  '07c29476-932a-4c6a-8343-93cdca62e75f'
);

-- Étape 3: Assigner les tâches au shift actif
-- REMPLACER <SHIFT_ID> par l'ID du shift actif trouvé à l'étape 1
UPDATE task 
SET 
  shift_id = (SELECT id FROM shifts WHERE status = 'active' ORDER BY start_time DESC LIMIT 1),
  updated_at = NOW()
WHERE id IN (
  '9c8a37eb-79dc-4abe-8739-c6ff787d5171',
  '07c29476-932a-4c6a-8343-93cdca62e75f'
);

-- Étape 4: Vérifier que l'assignation a fonctionné
SELECT id, title, shift_id, updated_at 
FROM task 
WHERE id IN (
  '9c8a37eb-79dc-4abe-8739-c6ff787d5171',
  '07c29476-932a-4c6a-8343-93cdca62e75f'
);

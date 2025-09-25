-- SOLUTION: Ajouter colonne guest_name à la table task
-- Objectif: Permettre le stockage du nom client pour les client_request

-- 1. Ajouter la colonne guest_name
ALTER TABLE task 
ADD COLUMN guest_name VARCHAR(255);

-- 2. Ajouter un commentaire pour documentation
COMMENT ON COLUMN task.guest_name IS 'Nom du client pour les tâches de type client_request';

-- 3. Créer un index pour optimiser les recherches par nom de client
CREATE INDEX idx_task_guest_name ON task(guest_name) 
WHERE guest_name IS NOT NULL;

-- 4. Optionnel: Ajouter une contrainte pour s'assurer que guest_name n'est rempli que pour client_request
-- (Décommenter si vous voulez cette validation stricte)
-- ALTER TABLE task 
-- ADD CONSTRAINT check_guest_name_only_for_client_requests 
-- CHECK (
--   (category = 'client_request' AND guest_name IS NOT NULL) OR 
--   (category != 'client_request' AND guest_name IS NULL) OR
--   guest_name IS NULL
-- );

-- 5. VERIFICATION: Tester la structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'task'
  AND column_name = 'guest_name';

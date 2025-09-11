-- =====================================================
-- MIGRATION TEAM DISPATCH - Script SQL pour Supabase
-- À exécuter UNE SEULE FOIS dans l'éditeur SQL Supabase
-- =====================================================

-- 1. CORRIGER LES NOMS MANQUANTS DANS LA TABLE PROFILES
-- =====================================================

-- Mettre à jour les profils avec des vrais noms
UPDATE profiles 
SET 
  first_name = 'Marie',
  last_name = 'Dubois',
  department = 'housekeeping',
  role = 'housekeeping'
WHERE email LIKE '%marie.dubois%' OR email LIKE '%marie%';

UPDATE profiles 
SET 
  first_name = 'Sophie',
  last_name = 'Laurent', 
  department = 'housekeeping',
  role = 'housekeeping'
WHERE email LIKE '%sophie%' AND first_name IS NULL;

UPDATE profiles 
SET 
  first_name = 'Claire',
  last_name = 'Martin',
  department = 'housekeeping', 
  role = 'housekeeping'
WHERE email LIKE '%claire%' AND first_name IS NULL;

UPDATE profiles 
SET 
  first_name = 'Emma',
  last_name = 'Bernard',
  department = 'housekeeping',
  role = 'housekeeping' 
WHERE email LIKE '%emma%' AND first_name IS NULL;

UPDATE profiles 
SET 
  first_name = 'Lucas',
  last_name = 'Moreau',
  department = 'restaurant',
  role = 'staff'
WHERE email LIKE '%lucas%' OR role = 'chef' AND first_name IS NULL;

UPDATE profiles 
SET 
  first_name = 'Isabelle', 
  last_name = 'Petit',
  department = 'management',
  role = 'manager'
WHERE role = 'manager' AND first_name IS NULL;

-- Générer des noms à partir des emails pour les autres profils
UPDATE profiles 
SET 
  first_name = INITCAP(SPLIT_PART(SPLIT_PART(email, '@', 1), '.', 1)),
  last_name = INITCAP(SPLIT_PART(SPLIT_PART(email, '@', 1), '.', 2))
WHERE first_name IS NULL 
  AND last_name IS NULL 
  AND email IS NOT NULL 
  AND email LIKE '%.%@%';


-- 2. CRÉER LES LOCATIONS MANQUANTES
-- =====================================================

-- Insérer les chambres et espaces communs
INSERT INTO locations (name, type, floor, building, is_active) VALUES
('Chambre 101', 'room', 1, 'Principal', true),
('Chambre 102', 'room', 1, 'Principal', true),
('Chambre 103', 'room', 1, 'Principal', true),
('Chambre 105', 'room', 1, 'Principal', true),
('Chambre 107', 'room', 1, 'Principal', true),
('Chambre 201', 'room', 2, 'Principal', true),
('Chambre 203', 'room', 2, 'Principal', true),
('Chambre 205', 'room', 2, 'Principal', true),
('Chambre 207', 'room', 2, 'Principal', true),
('Chambre 208', 'room', 2, 'Principal', true),
('Suite 301', 'room', 3, 'Principal', true),
('Chambre 302', 'room', 3, 'Principal', true),
('Chambre 305', 'room', 3, 'Principal', true),
('Suite 401', 'room', 4, 'Principal', true),
('Salle Versailles', 'common_area', 1, 'Principal', true),
('Espace Spa', 'common_area', -1, 'Principal', true),
('Bureau Gouvernante', 'staff_area', 0, 'Principal', true)
ON CONFLICT (name) DO NOTHING; -- Éviter les doublons si déjà existant


-- 3. CORRIGER LES LOCATIONS DANS LES TÂCHES
-- =====================================================

-- Corriger les incidents sans location
UPDATE incidents 
SET 
  location = 'Chambre 101',
  location_id = (SELECT id FROM locations WHERE name = 'Chambre 101' LIMIT 1)
WHERE location IS NULL OR location = '' OR location = 'No location';

-- Corriger les internal_tasks sans location  
UPDATE internal_tasks
SET 
  location = 'Chambre 105', 
  location_id = (SELECT id FROM locations WHERE name = 'Chambre 105' LIMIT 1)
WHERE location IS NULL OR location = '' OR location = 'No location';

-- Lier les location_id pour les incidents qui ont un nom de location mais pas d'ID
UPDATE incidents 
SET location_id = locations.id
FROM locations 
WHERE incidents.location = locations.name 
  AND incidents.location_id IS NULL;

-- Lier les location_id pour les internal_tasks
UPDATE internal_tasks
SET location_id = locations.id  
FROM locations
WHERE internal_tasks.location = locations.name
  AND internal_tasks.location_id IS NULL;


-- 4. ASSIGNER LES TÂCHES AUX MEMBRES D'ÉQUIPE
-- =====================================================

-- Créer une fonction temporaire pour l'assignment cyclique
DO $$
DECLARE
  member_ids UUID[];
  task_record RECORD;
  current_index INT := 0;
BEGIN
  -- Récupérer les IDs des membres actifs
  SELECT ARRAY(
    SELECT id FROM profiles 
    WHERE is_active = true 
    ORDER BY 
      CASE 
        WHEN department = 'housekeeping' THEN 1
        WHEN department = 'restaurant' THEN 2  
        WHEN role = 'manager' THEN 3
        ELSE 4
      END,
      first_name
  ) INTO member_ids;
  
  -- Si aucun membre trouvé, arrêter
  IF array_length(member_ids, 1) IS NULL THEN
    RAISE NOTICE 'Aucun membre d''équipe actif trouvé';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Trouvé % membres d''équipe', array_length(member_ids, 1);
  
  -- Assigner les incidents
  FOR task_record IN SELECT id FROM incidents ORDER BY created_at LOOP
    UPDATE incidents 
    SET assigned_to = member_ids[(current_index % array_length(member_ids, 1)) + 1]
    WHERE id = task_record.id;
    
    current_index := current_index + 1;
  END LOOP;
  
  -- Assigner les internal_tasks
  current_index := 0;
  FOR task_record IN SELECT id FROM internal_tasks ORDER BY created_at LOOP
    UPDATE internal_tasks
    SET assigned_to = member_ids[(current_index % array_length(member_ids, 1)) + 1] 
    WHERE id = task_record.id;
    
    current_index := current_index + 1;
  END LOOP;
  
  -- Assigner les client_requests
  current_index := 0;
  FOR task_record IN SELECT id FROM client_requests ORDER BY created_at LOOP
    UPDATE client_requests
    SET assigned_to = member_ids[(current_index % array_length(member_ids, 1)) + 1]
    WHERE id = task_record.id;
    
    current_index := current_index + 1; 
  END LOOP;
  
  -- Assigner les follow_ups
  current_index := 0;
  FOR task_record IN SELECT id FROM follow_ups ORDER BY created_at LOOP
    UPDATE follow_ups
    SET assigned_to = member_ids[(current_index % array_length(member_ids, 1)) + 1]
    WHERE id = task_record.id;
    
    current_index := current_index + 1;
  END LOOP;
  
END $$;


-- 5. VARIABILISER QUELQUES LOCATIONS POUR PLUS DE RÉALISME
-- =====================================================

-- Assigner des chambres différentes de manière aléatoire
WITH random_rooms AS (
  SELECT name FROM locations WHERE type = 'room' ORDER BY RANDOM()
),
incidents_to_update AS (
  SELECT 
    i.id,
    (SELECT name FROM random_rooms OFFSET (row_number() OVER() - 1) % 14 LIMIT 1) as new_location
  FROM incidents i
  WHERE i.location = 'Chambre 101'
)
UPDATE incidents 
SET 
  location = itu.new_location,
  location_id = l.id
FROM incidents_to_update itu
JOIN locations l ON l.name = itu.new_location  
WHERE incidents.id = itu.id;

-- Même chose pour internal_tasks
WITH random_rooms AS (
  SELECT name FROM locations WHERE type = 'room' ORDER BY RANDOM()  
),
tasks_to_update AS (
  SELECT 
    t.id,
    (SELECT name FROM random_rooms OFFSET (row_number() OVER() - 1) % 14 LIMIT 1) as new_location
  FROM internal_tasks t
  WHERE t.location = 'Chambre 105'
)
UPDATE internal_tasks
SET 
  location = ttu.new_location,
  location_id = l.id
FROM tasks_to_update ttu
JOIN locations l ON l.name = ttu.new_location
WHERE internal_tasks.id = ttu.id;


-- 6. VÉRIFICATION FINALE
-- =====================================================

-- Compter les résultats
SELECT 
  'Profils avec noms' as type,
  COUNT(*) as count
FROM profiles 
WHERE first_name IS NOT NULL AND last_name IS NOT NULL

UNION ALL

SELECT 
  'Locations créées' as type,
  COUNT(*) as count  
FROM locations

UNION ALL

SELECT 
  'Incidents avec location' as type,
  COUNT(*) as count
FROM incidents  
WHERE location IS NOT NULL AND location != 'No location'

UNION ALL

SELECT 
  'Tâches assignées' as type,
  COUNT(*) as count
FROM incidents
WHERE assigned_to IS NOT NULL

UNION ALL

SELECT 
  'Internal tasks assignées' as type,
  COUNT(*) as count  
FROM internal_tasks
WHERE assigned_to IS NOT NULL;

-- Message final
DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ MIGRATION TEAM DISPATCH TERMINÉE !';
  RAISE NOTICE '🔄 Rechargez votre page Team Dispatch pour voir les changements';
  RAISE NOTICE '';
END $$;
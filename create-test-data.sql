-- Script SQL pour créer des données de test si nécessaire

-- 1. Créer des profils de test (remplacez les UUIDs par de vrais UUIDs)
INSERT INTO profiles (id, first_name, last_name, email, role, department, is_active)
VALUES 
  ('test-user-1', 'Wilfried', 'de Renty', 'wilfried@example.com', 'manager', 'Management', true),
  ('test-user-2', 'Marie', 'Dupont', 'marie@example.com', 'receptionist', 'Reception', true),
  ('test-user-3', 'Jean', 'Martin', 'jean@example.com', 'maintenance', 'Maintenance', true)
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  email = EXCLUDED.email;

-- 2. Créer des tâches de test assignées
INSERT INTO internal_tasks (id, title, description, task_type, priority, status, assigned_to, location)
VALUES 
  (
    gen_random_uuid(),
    'Test - Ascenseur bloqué entre étages',
    'Ascenseur principal bloqué entre le 2ème et 3ème étage',
    'incident',
    'urgent',
    'pending',
    'test-user-1',
    'Couloir étage 3'
  ),
  (
    gen_random_uuid(),
    'Test - Éclairage défaillant couloir',
    'Plusieurs ampoules grillées dans le couloir étage 3',
    'incident',
    'normal',
    'in_progress',
    'test-user-2',
    'Couloir étage 3 chambres 35-38'
  ),
  (
    gen_random_uuid(),
    'Test - Feedback satisfaction Mme Leroy',
    'Recueillir le feedback de satisfaction de Mme Leroy chambre 31',
    'follow_up',
    'normal',
    'pending',
    'test-user-3',
    'Accueil'
  );

-- 3. Vérification des données créées
SELECT 
  t.title,
  t.status,
  t.priority,
  p.first_name || ' ' || p.last_name as assigned_to_name,
  t.location
FROM internal_tasks t
LEFT JOIN profiles p ON t.assigned_to = p.id
WHERE t.title LIKE 'Test -%'
ORDER BY t.created_at DESC;

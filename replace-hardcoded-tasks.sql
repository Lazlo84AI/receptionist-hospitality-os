-- Remplacer les données hardcodées par des données réalistes

-- Mettre à jour les incidents avec de vraies données
UPDATE incidents SET 
  title = 'Maintenance climatisation chambre',
  location = '50'
WHERE title LIKE '%Presidential Suite%' OR title LIKE '%Air Conditioning%';

UPDATE incidents SET 
  title = 'Nettoyage urgent chambre',
  location = '27'
WHERE location = 'Room 207' OR title LIKE '%Room 207%';

UPDATE incidents SET 
  title = 'Rapport sécurité espace bien-être',
  location = 'Espace bien être'
WHERE title LIKE '%Pool Safety%';

-- Mettre à jour les demandes clients
UPDATE client_requests SET 
  guest_name = 'Famille Dubois',
  room_number = '35',
  request_details = 'Coordination événement mariage'
WHERE title LIKE '%Wedding%' OR request_details LIKE '%Wedding%';

-- Mettre à jour les tâches internes problématiques
UPDATE internal_tasks SET 
  title = 'Maintenance ascenseur périodique',
  location = 'Ascenseur'
WHERE title LIKE '%Elevator%';

-- Supprimer uniquement les données vraiment inutiles
DELETE FROM incidents WHERE title IS NULL OR title = '' OR title LIKE '%test%' OR title LIKE '%demo%';
DELETE FROM client_requests WHERE guest_name IS NULL OR guest_name = '' OR guest_name LIKE '%test%';
DELETE FROM internal_tasks WHERE title IS NULL OR title = '' OR title LIKE '%test%' OR title LIKE '%demo%';

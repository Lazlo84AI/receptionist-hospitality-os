-- Supprimer toutes les tâches sans location valide

-- Supprimer les incidents sans location
DELETE FROM incidents WHERE location IS NULL OR location = '' OR location = 'No location' OR location = 'Unknown Location';

-- Supprimer les demandes clients sans chambre
DELETE FROM client_requests WHERE room_number IS NULL OR room_number = '' OR room_number = 'No location';

-- Supprimer les tâches internes sans location
DELETE FROM internal_tasks WHERE location IS NULL OR location = '' OR location = 'No location' OR location = 'Unknown Location';

-- Supprimer les follow-ups problématiques
DELETE FROM follow_ups WHERE recipient IS NULL OR recipient = '' OR recipient LIKE '%test%' OR recipient LIKE '%demo%';

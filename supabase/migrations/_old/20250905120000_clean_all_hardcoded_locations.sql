-- Migration pour remplacer TOUTES les locations hardcodées 
-- par les vraies locations de la table locations

-- ================================================================
-- ÉTAPE 1: Nettoyer les incidents avec de vraies locations
-- ================================================================

-- Remplacer les locations hardcodées par des vraies locations
UPDATE public.incidents 
SET location = '50' 
WHERE location IN ('Espace Spa', 'Pool Area', 'Presidential Suite');

UPDATE public.incidents 
SET location = 'Accueil' 
WHERE location IN ('Spa Reception', 'Main Lobby', 'Reception');

UPDATE public.incidents 
SET location = 'Ascenseur' 
WHERE location IN ('Elevator Maintenance Required', 'Main Elevator');

UPDATE public.incidents 
SET location = 'Salle petit-déjeuner bar' 
WHERE location IN ('Restaurant', 'Dining Area');

UPDATE public.incidents 
SET location = 'Chaufferie' 
WHERE location IN ('HVAC Service Company', 'Heating System');

-- Vérifier et corriger les numéros de chambres invalides
UPDATE public.incidents 
SET location = '35' 
WHERE location IN ('Room 207', '207');

UPDATE public.incidents 
SET location = '27' 
WHERE location IN ('Room 305', '305');

-- ================================================================
-- ÉTAPE 2: Nettoyer les demandes clients (client_requests)
-- ================================================================

UPDATE public.client_requests 
SET room_number = '35' 
WHERE room_number IN ('50', 'Presidential Suite', 'Room 305');

UPDATE public.client_requests 
SET room_number = '27' 
WHERE room_number IN ('Room 207', '207');

UPDATE public.client_requests 
SET room_number = '30' 
WHERE room_number IN ('Multiple Rooms', 'Various');

-- ================================================================
-- ÉTAPE 3: Nettoyer les tâches internes (internal_tasks)
-- ================================================================

UPDATE public.internal_tasks 
SET location = 'Cuisine' 
WHERE location IN ('Restaurant Kitchen', 'Kitchen', 'HVAC Service Company');

UPDATE public.internal_tasks 
SET location = 'Accueil' 
WHERE location IN ('Main Lobby', 'Reception Area');

UPDATE public.internal_tasks 
SET location = '50' 
WHERE location IN ('Presidential Suite', 'Room 50');

UPDATE public.internal_tasks 
SET location = 'Chaufferie' 
WHERE location IN ('Heating System', 'HVAC');

-- ================================================================
-- ÉTAPE 4: Nettoyer les follow-ups si nécessaire
-- ================================================================

-- Follow-ups n'ont généralement pas de location spécifique
-- mais on nettoie quand même s'il y en a
UPDATE public.follow_ups 
SET recipient = 'Mr. Robert Anderson' 
WHERE recipient LIKE '%Anderson%' AND recipient != 'Mr. Robert Anderson';

-- ================================================================
-- ÉTAPE 5: Vérification de la cohérence des données
-- ================================================================

-- Corriger toutes les locations qui ne correspondent pas à une vraie location
-- Pour les incidents
UPDATE public.incidents 
SET location = '30' 
WHERE location IS NOT NULL 
AND location NOT IN (SELECT name FROM public.locations WHERE is_active = true)
AND location != 'Unknown Location';

-- Pour les client_requests  
UPDATE public.client_requests 
SET room_number = '31' 
WHERE room_number IS NOT NULL 
AND room_number NOT IN (SELECT name FROM public.locations WHERE is_active = true AND type = 'room');

-- Pour les internal_tasks
UPDATE public.internal_tasks 
SET location = '32' 
WHERE location IS NOT NULL 
AND location NOT IN (SELECT name FROM public.locations WHERE is_active = true)
AND location != 'Unknown Location';

-- ================================================================
-- ÉTAPE 6: Vérification finale et rapport
-- ================================================================

DO $$
DECLARE
    incident_count INTEGER;
    client_count INTEGER;
    task_count INTEGER;
    total_locations INTEGER;
BEGIN
    -- Compter les tâches mises à jour
    SELECT COUNT(*) INTO incident_count FROM public.incidents;
    SELECT COUNT(*) INTO client_count FROM public.client_requests;
    SELECT COUNT(*) INTO task_count FROM public.internal_tasks;
    SELECT COUNT(*) INTO total_locations FROM public.locations WHERE is_active = true;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'NETTOYAGE DES LOCATIONS TERMINÉ';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total des locations valides: %', total_locations;
    RAISE NOTICE 'Incidents mis à jour: %', incident_count;
    RAISE NOTICE 'Demandes clients mises à jour: %', client_count;
    RAISE NOTICE 'Tâches internes mises à jour: %', task_count;
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Toutes les locations hardcodées ont été remplacées';
    RAISE NOTICE 'par les vraies locations de l''hôtel';
    RAISE NOTICE '========================================';
END $$;

-- ================================================================
-- ÉTAPE 7: Ajouter quelques tâches d'exemple avec vraies locations
-- ================================================================

-- Supprimer les anciennes tâches de démo si elles existent
DELETE FROM public.incidents WHERE title LIKE '%Pool Chemistry%' OR title LIKE '%Water Leak%';
DELETE FROM public.client_requests WHERE guest_name LIKE '%Mrs. Catherine%' OR guest_name LIKE '%Mr. Robert%';

-- Ajouter de nouvelles tâches avec vraies locations
INSERT INTO public.incidents (id, title, description, incident_type, priority, status, location, assigned_to, created_at, updated_at)
VALUES 
(gen_random_uuid(), 'Problème climatisation chambre', 'Climatisation ne fonctionne pas correctement', 'technical', 'urgent', 'pending', '35', 'Pierre Leroy', NOW() - INTERVAL '36 hours 17 minutes', NOW() - INTERVAL '36 hours 17 minutes'),
(gen_random_uuid(), 'Fuite d''eau salle de bain', 'Petite fuite détectée sous le lavabo', 'maintenance', 'normal', 'in_progress', '27', 'Jean Dupont', NOW() - INTERVAL '36 hours 17 minutes', NOW() - INTERVAL '36 hours 17 minutes'),
(gen_random_uuid(), 'Maintenance ascenseur requise', 'Contrôle technique périodique', 'maintenance', 'urgent', 'completed', 'Ascenseur', 'Thomas Anderson', NOW() - INTERVAL '36 hours 17 minutes', NOW() - INTERVAL '36 hours 17 minutes');

INSERT INTO public.client_requests (id, guest_name, room_number, request_type, request_details, preparation_status, arrival_date, priority, assigned_to, created_at, updated_at)
VALUES 
(gen_random_uuid(), 'Mrs. Catherine Dubois', '35', 'special_occasion', 'Anniversaire de mariage - décoration chambre', 'in_progress', NOW() + INTERVAL '2 days', 'normal', 'Marie Dubois', NOW() - INTERVAL '36 hours 17 minutes', NOW() - INTERVAL '36 hours 17 minutes'),
(gen_random_uuid(), 'Mr. Robert Anderson', '50', 'special_preparation', 'Suite présidentielle - arrivée VIP', 'completed', NOW() + INTERVAL '1 day', 'urgent', 'Emma Wilson', NOW() - INTERVAL '36 hours 17 minutes', NOW() - INTERVAL '36 hours 17 minutes'),
(gen_random_uuid(), 'Chen Family', '30', 'wedding_party', 'Organisation mariage - préparation multiple chambres', 'completed', NOW() + INTERVAL '3 days', 'urgent', 'Emma Wilson', NOW() - INTERVAL '36 hours 17 minutes', NOW() - INTERVAL '36 hours 17 minutes');

INSERT INTO public.follow_ups (id, title, recipient, follow_up_type, notes, status, due_date, priority, assigned_to, created_at, updated_at)
VALUES 
(gen_random_uuid(), 'Suivi technicien climatisation', 'HVAC Service Company', 'vendor_followup', 'Confirmer intervention prévue demain', 'pending', NOW() + INTERVAL '1 day', 'urgent', 'Sophie Martin', NOW() - INTERVAL '36 hours 17 minutes', NOW() - INTERVAL '36 hours 17 minutes'),
(gen_random_uuid(), 'Enquête satisfaction client', 'Mr. Robert Anderson', 'guest_survey', 'Envoyer questionnaire post-séjour', 'pending', NOW() + INTERVAL '2 days', 'normal', 'Emma Wilson', NOW() - INTERVAL '36 hours 17 minutes', NOW() - INTERVAL '36 hours 17 minutes');

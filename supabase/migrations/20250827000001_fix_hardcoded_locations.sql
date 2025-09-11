-- Fix hardcoded location data with real hotel structure
-- Remove all fake locations and create proper room/location structure

-- First, delete all existing fake location data
DELETE FROM public.locations;

-- Insert real ROOMS according to specifications
-- Floor 1: Rooms 10-18 (excluding 13)
INSERT INTO public.locations (id, name, type, floor, building, capacity, amenities, is_active) VALUES
(gen_random_uuid(), '10', 'room', 1, 'Main Tower', 2, '["minibar", "city_view", "safe"]', true),
(gen_random_uuid(), '11', 'room', 1, 'Main Tower', 2, '["minibar", "city_view", "safe"]', true),
(gen_random_uuid(), '12', 'room', 1, 'Main Tower', 2, '["minibar", "city_view", "safe"]', true),
(gen_random_uuid(), '14', 'room', 1, 'Main Tower', 2, '["minibar", "city_view", "safe"]', true),
(gen_random_uuid(), '15', 'room', 1, 'Main Tower', 2, '["minibar", "city_view", "safe"]', true),
(gen_random_uuid(), '16', 'room', 1, 'Main Tower', 2, '["minibar", "city_view", "safe"]', true),
(gen_random_uuid(), '17', 'room', 1, 'Main Tower', 2, '["minibar", "city_view", "safe"]', true),
(gen_random_uuid(), '18', 'room', 1, 'Main Tower', 2, '["minibar", "city_view", "safe"]', true),

-- Floor 2: Rooms 20-28 (excluding 23)
(gen_random_uuid(), '20', 'room', 2, 'Main Tower', 2, '["minibar", "garden_view", "safe"]', true),
(gen_random_uuid(), '21', 'room', 2, 'Main Tower', 2, '["minibar", "garden_view", "safe"]', true),
(gen_random_uuid(), '22', 'room', 2, 'Main Tower', 2, '["minibar", "garden_view", "safe"]', true),
(gen_random_uuid(), '24', 'room', 2, 'Main Tower', 2, '["minibar", "garden_view", "safe"]', true),
(gen_random_uuid(), '25', 'room', 2, 'Main Tower', 2, '["minibar", "garden_view", "safe"]', true),
(gen_random_uuid(), '26', 'room', 2, 'Main Tower', 2, '["minibar", "garden_view", "safe"]', true),
(gen_random_uuid(), '27', 'room', 2, 'Main Tower', 2, '["minibar", "garden_view", "safe"]', true),
(gen_random_uuid(), '28', 'room', 2, 'Main Tower', 2, '["minibar", "garden_view", "safe"]', true),

-- Floor 3: Rooms 30-38 (excluding 33)
(gen_random_uuid(), '30', 'room', 3, 'Main Tower', 2, '["minibar", "partial_city_view", "safe"]', true),
(gen_random_uuid(), '31', 'room', 3, 'Main Tower', 2, '["minibar", "partial_city_view", "safe"]', true),
(gen_random_uuid(), '32', 'room', 3, 'Main Tower', 2, '["minibar", "partial_city_view", "safe"]', true),
(gen_random_uuid(), '34', 'room', 3, 'Main Tower', 2, '["minibar", "partial_city_view", "safe"]', true),
(gen_random_uuid(), '35', 'room', 3, 'Main Tower', 2, '["minibar", "partial_city_view", "safe"]', true),
(gen_random_uuid(), '36', 'room', 3, 'Main Tower', 2, '["minibar", "partial_city_view", "safe"]', true),
(gen_random_uuid(), '37', 'room', 3, 'Main Tower', 2, '["minibar", "partial_city_view", "safe"]', true),
(gen_random_uuid(), '38', 'room', 3, 'Main Tower', 2, '["minibar", "partial_city_view", "safe"]', true),

-- Floor 4: Rooms 40-48 (excluding 43)
(gen_random_uuid(), '40', 'room', 4, 'Main Tower', 2, '["minibar", "premium_view", "safe"]', true),
(gen_random_uuid(), '41', 'room', 4, 'Main Tower', 2, '["minibar", "premium_view", "safe"]', true),
(gen_random_uuid(), '42', 'room', 4, 'Main Tower', 2, '["minibar", "premium_view", "safe"]', true),
(gen_random_uuid(), '44', 'room', 4, 'Main Tower', 2, '["minibar", "premium_view", "safe"]', true),
(gen_random_uuid(), '45', 'room', 4, 'Main Tower', 2, '["minibar", "premium_view", "safe"]', true),
(gen_random_uuid(), '46', 'room', 4, 'Main Tower', 2, '["minibar", "premium_view", "safe"]', true),
(gen_random_uuid(), '47', 'room', 4, 'Main Tower', 2, '["minibar", "premium_view", "safe"]', true),
(gen_random_uuid(), '48', 'room', 4, 'Main Tower', 2, '["minibar", "premium_view", "safe"]', true),

-- Floor 5: Rooms 50-58 (excluding 53)
(gen_random_uuid(), '50', 'room', 5, 'Main Tower', 2, '["minibar", "panoramic_view", "safe"]', true),
(gen_random_uuid(), '51', 'room', 5, 'Main Tower', 2, '["minibar", "panoramic_view", "safe"]', true),
(gen_random_uuid(), '52', 'room', 5, 'Main Tower', 2, '["minibar", "panoramic_view", "safe"]', true),
(gen_random_uuid(), '54', 'room', 5, 'Main Tower', 2, '["minibar", "panoramic_view", "safe"]', true),
(gen_random_uuid(), '55', 'room', 5, 'Main Tower', 2, '["minibar", "panoramic_view", "safe"]', true),
(gen_random_uuid(), '56', 'room', 5, 'Main Tower', 2, '["minibar", "panoramic_view", "safe"]', true),
(gen_random_uuid(), '57', 'room', 5, 'Main Tower', 2, '["minibar", "panoramic_view", "safe"]', true),
(gen_random_uuid(), '58', 'room', 5, 'Main Tower', 2, '["minibar", "panoramic_view", "safe"]', true);

-- Insert COMMON AREAS according to specifications

-- Ground Floor (0) - Grand Floor
INSERT INTO public.locations (id, name, type, floor, building, capacity, amenities, is_active) VALUES
(gen_random_uuid(), 'Accueil', 'common_area', 0, 'Main Tower', 50, '["reception_desk", "seating_area"]', true),
(gen_random_uuid(), 'Ascenseur', 'common_area', 0, 'Main Tower', 8, '["elevator_access"]', true),
(gen_random_uuid(), 'Bagagerie', 'common_area', 0, 'Main Tower', 20, '["luggage_storage"]', true),
(gen_random_uuid(), 'Bureau', 'office', 0, 'Main Tower', 4, '["desk", "office_supplies"]', true),
(gen_random_uuid(), 'Cabine Moteur Ascenseur', 'staff_area', 0, 'Main Tower', 2, '["elevator_machinery"]', true),
(gen_random_uuid(), 'Cour', 'common_area', 0, 'Main Tower', 30, '["outdoor_seating"]', true),
(gen_random_uuid(), 'Escalier Rez-de-Chaussée - Premier', 'corridor', 0, 'Main Tower', 0, '["stairs"]', true),
(gen_random_uuid(), 'Escalier Rez-de-Chaussée - Sous-Sol', 'corridor', 0, 'Main Tower', 0, '["stairs"]', true),
(gen_random_uuid(), 'Espace Spa', 'common_area', 0, 'Main Tower', 15, '["spa_reception", "relaxation"]', true),
(gen_random_uuid(), 'Executive Lounge', 'common_area', 0, 'Main Tower', 50, '["bar", "business_center", "city_view"]', true),
(gen_random_uuid(), 'Salle Petit Déjeuner', 'common_area', 0, 'Main Tower', 80, '["dining_tables", "buffet_area"]', true),
(gen_random_uuid(), 'Bar', 'common_area', 0, 'Main Tower', 40, '["bar_counter", "lounge_seating"]', true),
(gen_random_uuid(), 'Salon', 'common_area', 0, 'Main Tower', 60, '["comfortable_seating", "fireplace"]', true),
(gen_random_uuid(), 'Terrasse', 'common_area', 0, 'Main Tower', 25, '["outdoor_seating", "garden_view"]', true);

-- Floor 1
INSERT INTO public.locations (id, name, type, floor, building, capacity, amenities, is_active) VALUES
(gen_random_uuid(), 'Couloir Étage 1 - Chambres 10-14', 'corridor', 1, 'Main Tower', 0, '["room_access"]', true),
(gen_random_uuid(), 'Couloir Étage 1 - Chambres 15-18', 'corridor', 1, 'Main Tower', 0, '["room_access"]', true),
(gen_random_uuid(), 'Escalier Premier - Deuxième', 'corridor', 1, 'Main Tower', 0, '["stairs"]', true),
(gen_random_uuid(), 'Palier Premier Étage', 'corridor', 1, 'Main Tower', 0, '["elevator_access"]', true);

-- Floor 2
INSERT INTO public.locations (id, name, type, floor, building, capacity, amenities, is_active) VALUES
(gen_random_uuid(), 'Couloir Étage 2 - Chambres 20-24', 'corridor', 2, 'Main Tower', 0, '["room_access"]', true),
(gen_random_uuid(), 'Couloir Étage 2 - Chambres 25-28', 'corridor', 2, 'Main Tower', 0, '["room_access"]', true),
(gen_random_uuid(), 'Escalier Deuxième - Troisième', 'corridor', 2, 'Main Tower', 0, '["stairs"]', true),
(gen_random_uuid(), 'Palier Deuxième Étage', 'corridor', 2, 'Main Tower', 0, '["elevator_access"]', true),
(gen_random_uuid(), 'Spa Réception', 'common_area', 2, 'Main Tower', 20, '["reception_desk", "waiting_area"]', true);

-- Floor 3
INSERT INTO public.locations (id, name, type, floor, building, capacity, amenities, is_active) VALUES
(gen_random_uuid(), 'Couloir Étage 3 - Chambres 30-34', 'corridor', 3, 'Main Tower', 0, '["room_access"]', true),
(gen_random_uuid(), 'Couloir Étage 3 - Chambres 35-38', 'corridor', 3, 'Main Tower', 0, '["room_access"]', true),
(gen_random_uuid(), 'Escalier 2e à 4e', 'corridor', 3, 'Main Tower', 0, '["stairs"]', true),
(gen_random_uuid(), 'Palier 3e Étage', 'corridor', 3, 'Main Tower', 0, '["elevator_access"]', true);

-- Floor 4
INSERT INTO public.locations (id, name, type, floor, building, capacity, amenities, is_active) VALUES
(gen_random_uuid(), 'Couloir Étage 4 - Chambres 40-44', 'corridor', 4, 'Main Tower', 0, '["room_access"]', true),
(gen_random_uuid(), 'Couloir Étage 4 - Chambres 45-48', 'corridor', 4, 'Main Tower', 0, '["room_access"]', true),
(gen_random_uuid(), 'Escalier 4e à 5e', 'corridor', 4, 'Main Tower', 0, '["stairs"]', true),
(gen_random_uuid(), 'Palier 4e Étage', 'corridor', 4, 'Main Tower', 0, '["elevator_access"]', true);

-- Floor 5
INSERT INTO public.locations (id, name, type, floor, building, capacity, amenities, is_active) VALUES
(gen_random_uuid(), 'Couloir Étage 5 - Chambres 50-52', 'corridor', 5, 'Main Tower', 0, '["room_access"]', true),
(gen_random_uuid(), 'Couloir Étage 5 - Chambres 54-58', 'corridor', 5, 'Main Tower', 0, '["room_access"]', true),
(gen_random_uuid(), 'Palier 5e Étage', 'corridor', 5, 'Main Tower', 0, '["elevator_access"]', true);

-- Floor 6 - Roof
INSERT INTO public.locations (id, name, type, floor, building, capacity, amenities, is_active) VALUES
(gen_random_uuid(), 'Toit', 'common_area', 6, 'Main Tower', 20, '["panoramic_view", "rooftop_access"]', true);

-- Basement (-1) - Staff Areas
INSERT INTO public.locations (id, name, type, floor, building, capacity, amenities, is_active) VALUES
(gen_random_uuid(), 'Atelier', 'staff_area', -1, 'Main Tower', 8, '["work_tools", "repair_equipment"]', true),
(gen_random_uuid(), 'Centrale d''Aspiration', 'staff_area', -1, 'Main Tower', 2, '["vacuum_system"]', true),
(gen_random_uuid(), 'Chaufferie', 'staff_area', -1, 'Main Tower', 4, '["heating_system"]', true),
(gen_random_uuid(), 'Couloir', 'corridor', -1, 'Main Tower', 0, '["staff_access"]', true),
(gen_random_uuid(), 'Cuisine', 'staff_area', -1, 'Main Tower', 15, '["industrial_kitchen", "storage"]', true),
(gen_random_uuid(), 'Espace Bien-Être', 'staff_area', -1, 'Main Tower', 10, '["staff_relaxation"]', true),
(gen_random_uuid(), 'Lingerie', 'staff_area', -1, 'Main Tower', 6, '["laundry_equipment"]', true),
(gen_random_uuid(), 'Salle de Réunion', 'staff_area', -1, 'Main Tower', 12, '["meeting_table", "projector"]', true),
(gen_random_uuid(), 'Vestiaire Staff', 'staff_area', -1, 'Main Tower', 20, '["lockers", "changing_room"]', true),
(gen_random_uuid(), 'Vide-Linge', 'staff_area', -1, 'Main Tower', 4, '["linen_chute"]', true),
(gen_random_uuid(), 'WC Public', 'staff_area', -1, 'Main Tower', 2, '["restroom"]', true);

-- Update existing tasks with fake locations to use real locations
-- Presidential Suite -> Room 50 (top floor VIP-style room)
UPDATE public.incidents 
SET location = '50' 
WHERE location IN ('Presidential Suite');

UPDATE public.client_requests 
SET room_number = '50' 
WHERE room_number IN ('Presidential Suite');

UPDATE public.internal_tasks 
SET location = '50' 
WHERE location IN ('Presidential Suite');

-- Room 305 -> Room 35 (Floor 3)
UPDATE public.incidents 
SET location = '35' 
WHERE location IN ('Room 305');

UPDATE public.client_requests 
SET room_number = '35' 
WHERE room_number IN ('Room 305');

UPDATE public.internal_tasks 
SET location = '35' 
WHERE location IN ('Room 305');

-- Room 207 -> Room 27 (Floor 2)
UPDATE public.incidents 
SET location = '27' 
WHERE location IN ('Room 207');

UPDATE public.client_requests 
SET room_number = '27' 
WHERE room_number IN ('Room 207');

UPDATE public.internal_tasks 
SET location = '27' 
WHERE location IN ('Room 207');

-- Multiple Rooms -> Couloir Étage 3 - Chambres 30-34 (for wedding setup)
UPDATE public.client_requests 
SET room_number = 'Couloir Étage 3 - Chambres 30-34' 
WHERE room_number IN ('Multiple Rooms');

-- Pool Area -> Espace Spa (closest equivalent)
UPDATE public.incidents 
SET location = 'Espace Spa' 
WHERE location IN ('Pool Area');

UPDATE public.internal_tasks 
SET location = 'Espace Spa' 
WHERE location IN ('Pool Area');

-- Main Lobby -> Accueil
UPDATE public.incidents 
SET location = 'Accueil' 
WHERE location IN ('Main Lobby');

UPDATE public.internal_tasks 
SET location = 'Accueil' 
WHERE location IN ('Main Lobby');

-- Spa Reception -> Spa Réception
UPDATE public.incidents 
SET location = 'Spa Réception' 
WHERE location IN ('Spa Reception');

UPDATE public.internal_tasks 
SET location = 'Spa Réception' 
WHERE location IN ('Spa Reception');

-- Restaurant Kitchen -> Cuisine
UPDATE public.internal_tasks 
SET location = 'Cuisine' 
WHERE location IN ('Restaurant Kitchen');

-- Grand Ballroom -> Salon (closest large event space)
UPDATE public.internal_tasks 
SET location = 'Salon' 
WHERE location IN ('Grand Ballroom');

-- Remove any other fake location references that might exist
UPDATE public.incidents 
SET location = '30' 
WHERE location NOT IN (SELECT name FROM public.locations WHERE is_active = true);

UPDATE public.client_requests 
SET room_number = '31' 
WHERE room_number NOT IN (SELECT name FROM public.locations WHERE is_active = true);

UPDATE public.internal_tasks 
SET location = '32' 
WHERE location NOT IN (SELECT name FROM public.locations WHERE is_active = true);

-- Comment to document the change
COMMENT ON TABLE public.locations IS 'Updated with real hotel structure - Rooms 10-18, 20-28, 30-38, 40-48, 50-58 plus real common areas and staff areas';

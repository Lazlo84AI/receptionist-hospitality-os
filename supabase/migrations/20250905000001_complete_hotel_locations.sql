-- Complete hotel location structure according to specifications
-- 4 main categories: Rooms - Common Areas - Ground Floor - Staff Areas

-- Delete all existing locations to start fresh
DELETE FROM public.locations;

-- ========================================
-- CATEGORY 1: ROOMS (40 rooms total)
-- Floors 1-5, excluding room number 3 on each floor
-- ========================================

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

-- ========================================
-- CATEGORY 2: COMMON AREAS (Corridors and stairs by floors)
-- ========================================

-- Floor 1 Common Areas
INSERT INTO public.locations (id, name, type, floor, building, capacity, amenities, is_active) VALUES
(gen_random_uuid(), 'Couloir étage 1 chambres 10-14', 'common_area', 1, 'Main Tower', 0, '["corridor_access"]', true),
(gen_random_uuid(), 'Couloir étage 1 chambres 15-18', 'common_area', 1, 'Main Tower', 0, '["corridor_access"]', true),

-- Floor 2 Common Areas
(gen_random_uuid(), 'Couloir étage 2 chambres 20-24', 'common_area', 2, 'Main Tower', 0, '["corridor_access"]', true),
(gen_random_uuid(), 'Couloir étage 2 chambres 25-28', 'common_area', 2, 'Main Tower', 0, '["corridor_access"]', true),

-- Floor 3 Common Areas
(gen_random_uuid(), 'Couloir étage 3 chambres 30-34', 'common_area', 3, 'Main Tower', 0, '["corridor_access"]', true),
(gen_random_uuid(), 'Couloir étage 3 chambres 35-38', 'common_area', 3, 'Main Tower', 0, '["corridor_access"]', true),

-- Floor 4 Common Areas
(gen_random_uuid(), 'Couloir étage 4 chambres 40-44', 'common_area', 4, 'Main Tower', 0, '["corridor_access"]', true),
(gen_random_uuid(), 'Couloir étage 4 chambres 45-48', 'common_area', 4, 'Main Tower', 0, '["corridor_access"]', true),

-- Floor 5 Common Areas
(gen_random_uuid(), 'Couloir étage 5 chambres 50-52', 'common_area', 5, 'Main Tower', 0, '["corridor_access"]', true),
(gen_random_uuid(), 'Couloir étage 5 chambres 54-58', 'common_area', 5, 'Main Tower', 0, '["corridor_access"]', true),

-- Stairs and Special Areas (distributed across floors for organization)
(gen_random_uuid(), 'Escalier RDC – 1er (palier RDC included)', 'common_area', 0, 'Main Tower', 0, '["stairs"]', true),
(gen_random_uuid(), 'Escalier 1er – 2e (palier 1er included)', 'common_area', 1, 'Main Tower', 0, '["stairs"]', true),
(gen_random_uuid(), 'Escalier 2e – 3e (palier 2e included)', 'common_area', 2, 'Main Tower', 0, '["stairs"]', true),
(gen_random_uuid(), 'Escalier 3e – 4e (palier 3e included)', 'common_area', 3, 'Main Tower', 0, '["stairs"]', true),
(gen_random_uuid(), 'Escalier 4e – 5e (palier 4e included)', 'common_area', 4, 'Main Tower', 0, '["stairs"]', true),
(gen_random_uuid(), 'Escalier RDC – Sous-sol (palier sous-sol included)', 'common_area', -1, 'Main Tower', 0, '["stairs"]', true),

-- Roof and Special Areas
(gen_random_uuid(), 'Toit', 'common_area', 6, 'Main Tower', 20, '["rooftop_access"]', true),
(gen_random_uuid(), 'Cabine moteur ascenseur', 'common_area', 6, 'Main Tower', 2, '["elevator_machinery"]', true);

-- ========================================
-- CATEGORY 3: GROUND FLOOR (RDC - Floor 0)
-- ========================================

INSERT INTO public.locations (id, name, type, floor, building, capacity, amenities, is_active) VALUES
(gen_random_uuid(), 'Terrasse', 'ground_floor', 0, 'Main Tower', 30, '["outdoor_seating", "garden_view"]', true),
(gen_random_uuid(), 'Accueil', 'ground_floor', 0, 'Main Tower', 50, '["reception_desk", "seating_area"]', true),
(gen_random_uuid(), 'Ascenseur', 'ground_floor', 0, 'Main Tower', 8, '["elevator_access"]', true),
(gen_random_uuid(), 'Salon', 'ground_floor', 0, 'Main Tower', 60, '["comfortable_seating", "fireplace"]', true),
(gen_random_uuid(), 'Salle petit-déjeuner bar', 'ground_floor', 0, 'Main Tower', 80, '["dining_tables", "bar_counter"]', true),
(gen_random_uuid(), 'Bagagerie bureau', 'ground_floor', 0, 'Main Tower', 20, '["luggage_storage", "desk"]', true),
(gen_random_uuid(), 'Cours', 'ground_floor', 0, 'Main Tower', 40, '["outdoor_area", "courtyard"]', true);

-- ========================================
-- CATEGORY 4: STAFF AREAS (Sous-sol - Floor -1)
-- ========================================

INSERT INTO public.locations (id, name, type, floor, building, capacity, amenities, is_active) VALUES
(gen_random_uuid(), 'Lingerie', 'staff_area', -1, 'Main Tower', 6, '["laundry_equipment"]', true),
(gen_random_uuid(), 'Chaufferie', 'staff_area', -1, 'Main Tower', 4, '["heating_system"]', true),
(gen_random_uuid(), 'Vide linge', 'staff_area', -1, 'Main Tower', 4, '["linen_chute"]', true),
(gen_random_uuid(), 'Centrale d''aspiration', 'staff_area', -1, 'Main Tower', 2, '["vacuum_system"]', true),
(gen_random_uuid(), 'Couloir', 'staff_area', -1, 'Main Tower', 0, '["staff_corridor"]', true),
(gen_random_uuid(), 'Salle de réunion', 'staff_area', -1, 'Main Tower', 12, '["meeting_table", "projector"]', true),
(gen_random_uuid(), 'Espace bien être', 'staff_area', -1, 'Main Tower', 10, '["staff_relaxation"]', true),
(gen_random_uuid(), 'Cuisine', 'staff_area', -1, 'Main Tower', 15, '["industrial_kitchen", "storage"]', true),
(gen_random_uuid(), 'Atelier', 'staff_area', -1, 'Main Tower', 8, '["work_tools", "repair_equipment"]', true),
(gen_random_uuid(), 'WC public', 'staff_area', -1, 'Main Tower', 2, '["restroom"]', true),
(gen_random_uuid(), 'Vestiaires staff', 'staff_area', -1, 'Main Tower', 20, '["lockers", "changing_room"]', true);

-- Add comment to document the structure
COMMENT ON TABLE public.locations IS 'Complete hotel structure: 40 Rooms (floors 1-5), Common Areas (corridors/stairs), Ground Floor (RDC areas), Staff Areas (basement)';

-- Delete all existing locations
DELETE FROM public.locations;

-- ROOMS (40 chambres)
INSERT INTO public.locations (id, name, type, floor, building, capacity, amenities, is_active) VALUES
-- Floor 1
(gen_random_uuid(), '10', 'room', 1, 'Main Tower', 2, '["minibar", "safe"]', true),
(gen_random_uuid(), '11', 'room', 1, 'Main Tower', 2, '["minibar", "safe"]', true),
(gen_random_uuid(), '12', 'room', 1, 'Main Tower', 2, '["minibar", "safe"]', true),
(gen_random_uuid(), '14', 'room', 1, 'Main Tower', 2, '["minibar", "safe"]', true),
(gen_random_uuid(), '15', 'room', 1, 'Main Tower', 2, '["minibar", "safe"]', true),
(gen_random_uuid(), '16', 'room', 1, 'Main Tower', 2, '["minibar", "safe"]', true),
(gen_random_uuid(), '17', 'room', 1, 'Main Tower', 2, '["minibar", "safe"]', true),
(gen_random_uuid(), '18', 'room', 1, 'Main Tower', 2, '["minibar", "safe"]', true),
-- Floor 2
(gen_random_uuid(), '20', 'room', 2, 'Main Tower', 2, '["minibar", "safe"]', true),
(gen_random_uuid(), '21', 'room', 2, 'Main Tower', 2, '["minibar", "safe"]', true),
(gen_random_uuid(), '22', 'room', 2, 'Main Tower', 2, '["minibar", "safe"]', true),
(gen_random_uuid(), '24', 'room', 2, 'Main Tower', 2, '["minibar", "safe"]', true),
(gen_random_uuid(), '25', 'room', 2, 'Main Tower', 2, '["minibar", "safe"]', true),
(gen_random_uuid(), '26', 'room', 2, 'Main Tower', 2, '["minibar", "safe"]', true),
(gen_random_uuid(), '27', 'room', 2, 'Main Tower', 2, '["minibar", "safe"]', true),
(gen_random_uuid(), '28', 'room', 2, 'Main Tower', 2, '["minibar", "safe"]', true),
-- Floor 3
(gen_random_uuid(), '30', 'room', 3, 'Main Tower', 2, '["minibar", "safe"]', true),
(gen_random_uuid(), '31', 'room', 3, 'Main Tower', 2, '["minibar", "safe"]', true),
(gen_random_uuid(), '32', 'room', 3, 'Main Tower', 2, '["minibar", "safe"]', true),
(gen_random_uuid(), '34', 'room', 3, 'Main Tower', 2, '["minibar", "safe"]', true),
(gen_random_uuid(), '35', 'room', 3, 'Main Tower', 2, '["minibar", "safe"]', true),
(gen_random_uuid(), '36', 'room', 3, 'Main Tower', 2, '["minibar", "safe"]', true),
(gen_random_uuid(), '37', 'room', 3, 'Main Tower', 2, '["minibar", "safe"]', true),
(gen_random_uuid(), '38', 'room', 3, 'Main Tower', 2, '["minibar", "safe"]', true),
-- Floor 4
(gen_random_uuid(), '40', 'room', 4, 'Main Tower', 2, '["minibar", "safe"]', true),
(gen_random_uuid(), '41', 'room', 4, 'Main Tower', 2, '["minibar", "safe"]', true),
(gen_random_uuid(), '42', 'room', 4, 'Main Tower', 2, '["minibar", "safe"]', true),
(gen_random_uuid(), '44', 'room', 4, 'Main Tower', 2, '["minibar", "safe"]', true),
(gen_random_uuid(), '45', 'room', 4, 'Main Tower', 2, '["minibar", "safe"]', true),
(gen_random_uuid(), '46', 'room', 4, 'Main Tower', 2, '["minibar", "safe"]', true),
(gen_random_uuid(), '47', 'room', 4, 'Main Tower', 2, '["minibar", "safe"]', true),
(gen_random_uuid(), '48', 'room', 4, 'Main Tower', 2, '["minibar", "safe"]', true),
-- Floor 5
(gen_random_uuid(), '50', 'room', 5, 'Main Tower', 2, '["minibar", "safe"]', true),
(gen_random_uuid(), '51', 'room', 5, 'Main Tower', 2, '["minibar", "safe"]', true),
(gen_random_uuid(), '52', 'room', 5, 'Main Tower', 2, '["minibar", "safe"]', true),
(gen_random_uuid(), '54', 'room', 5, 'Main Tower', 2, '["minibar", "safe"]', true),
(gen_random_uuid(), '55', 'room', 5, 'Main Tower', 2, '["minibar", "safe"]', true),
(gen_random_uuid(), '56', 'room', 5, 'Main Tower', 2, '["minibar", "safe"]', true),
(gen_random_uuid(), '57', 'room', 5, 'Main Tower', 2, '["minibar", "safe"]', true),
(gen_random_uuid(), '58', 'room', 5, 'Main Tower', 2, '["minibar", "safe"]', true);

-- COMMON AREAS (Couloirs et escaliers)
INSERT INTO public.locations (id, name, type, floor, building, capacity, amenities, is_active) VALUES
(gen_random_uuid(), 'Couloir étage 1 chambres 10-14', 'common_area', 1, 'Main Tower', 0, '["corridor"]', true),
(gen_random_uuid(), 'Couloir étage 1 chambres 15-18', 'common_area', 1, 'Main Tower', 0, '["corridor"]', true),
(gen_random_uuid(), 'Couloir étage 2 chambres 20-24', 'common_area', 2, 'Main Tower', 0, '["corridor"]', true),
(gen_random_uuid(), 'Couloir étage 2 chambres 25-28', 'common_area', 2, 'Main Tower', 0, '["corridor"]', true),
(gen_random_uuid(), 'Couloir étage 3 chambres 30-34', 'common_area', 3, 'Main Tower', 0, '["corridor"]', true),
(gen_random_uuid(), 'Couloir étage 3 chambres 35-38', 'common_area', 3, 'Main Tower', 0, '["corridor"]', true),
(gen_random_uuid(), 'Couloir étage 4 chambres 40-44', 'common_area', 4, 'Main Tower', 0, '["corridor"]', true),
(gen_random_uuid(), 'Couloir étage 4 chambres 45-48', 'common_area', 4, 'Main Tower', 0, '["corridor"]', true),
(gen_random_uuid(), 'Couloir étage 5 chambres 50-52', 'common_area', 5, 'Main Tower', 0, '["corridor"]', true),
(gen_random_uuid(), 'Couloir étage 5 chambres 54-58', 'common_area', 5, 'Main Tower', 0, '["corridor"]', true),
(gen_random_uuid(), 'Escalier RDC – 1er (palier RDC included)', 'common_area', 0, 'Main Tower', 0, '["stairs"]', true),
(gen_random_uuid(), 'Escalier 1er – 2e (palier 1er included)', 'common_area', 1, 'Main Tower', 0, '["stairs"]', true),
(gen_random_uuid(), 'Escalier 2e – 3e (palier 2e included)', 'common_area', 2, 'Main Tower', 0, '["stairs"]', true),
(gen_random_uuid(), 'Escalier 3e – 4e (palier 3e included)', 'common_area', 3, 'Main Tower', 0, '["stairs"]', true),
(gen_random_uuid(), 'Escalier 4e – 5e (palier 4e included)', 'common_area', 4, 'Main Tower', 0, '["stairs"]', true),
(gen_random_uuid(), 'Escalier RDC – Sous-sol (palier sous-sol included)', 'common_area', -1, 'Main Tower', 0, '["stairs"]', true),
(gen_random_uuid(), 'Toit', 'common_area', 6, 'Main Tower', 20, '["rooftop"]', true),
(gen_random_uuid(), 'Cabine moteur ascenseur', 'common_area', 6, 'Main Tower', 2, '["machinery"]', true);

-- PUBLIC AREAS (Ex-Ground Floor - RDC)
INSERT INTO public.locations (id, name, type, floor, building, capacity, amenities, is_active) VALUES
(gen_random_uuid(), 'Terrasse', 'public_areas', 0, 'Main Tower', 30, '["outdoor"]', true),
(gen_random_uuid(), 'Accueil', 'public_areas', 0, 'Main Tower', 50, '["reception"]', true),
(gen_random_uuid(), 'Ascenseur', 'public_areas', 0, 'Main Tower', 8, '["elevator"]', true),
(gen_random_uuid(), 'Salon', 'public_areas', 0, 'Main Tower', 60, '["lounge"]', true),
(gen_random_uuid(), 'Salle petit-déjeuner bar', 'public_areas', 0, 'Main Tower', 80, '["dining"]', true),
(gen_random_uuid(), 'Bagagerie bureau', 'public_areas', 0, 'Main Tower', 20, '["luggage"]', true),
(gen_random_uuid(), 'Cours', 'public_areas', 0, 'Main Tower', 40, '["courtyard"]', true);

-- STAFF AREAS (Sous-sol)
INSERT INTO public.locations (id, name, type, floor, building, capacity, amenities, is_active) VALUES
(gen_random_uuid(), 'Lingerie', 'staff_area', -1, 'Main Tower', 6, '["laundry"]', true),
(gen_random_uuid(), 'Chaufferie', 'staff_area', -1, 'Main Tower', 4, '["heating"]', true),
(gen_random_uuid(), 'Vide linge', 'staff_area', -1, 'Main Tower', 4, '["linen"]', true),
(gen_random_uuid(), 'Centrale d''aspiration', 'staff_area', -1, 'Main Tower', 2, '["vacuum"]', true),
(gen_random_uuid(), 'Couloir', 'staff_area', -1, 'Main Tower', 0, '["corridor"]', true),
(gen_random_uuid(), 'Salle de réunion', 'staff_area', -1, 'Main Tower', 12, '["meeting"]', true),
(gen_random_uuid(), 'Espace bien être', 'staff_area', -1, 'Main Tower', 10, '["wellness"]', true),
(gen_random_uuid(), 'Cuisine', 'staff_area', -1, 'Main Tower', 15, '["kitchen"]', true),
(gen_random_uuid(), 'Atelier', 'staff_area', -1, 'Main Tower', 8, '["workshop"]', true),
(gen_random_uuid(), 'WC public', 'staff_area', -1, 'Main Tower', 2, '["restroom"]', true),
(gen_random_uuid(), 'Vestiaires staff', 'staff_area', -1, 'Main Tower', 20, '["lockers"]', true);

-- Insert all room locations (40 rooms total)
-- Floor 1: 10-18 (excluding 13)
INSERT INTO public.locations (name, type, floor) VALUES 
('10', 'room', 1),
('11', 'room', 1),
('12', 'room', 1),
('14', 'room', 1),
('15', 'room', 1),
('16', 'room', 1),
('17', 'room', 1),
('18', 'room', 1);

-- Floor 2: 20-28 (excluding 23)
INSERT INTO public.locations (name, type, floor) VALUES 
('20', 'room', 2),
('21', 'room', 2),
('22', 'room', 2),
('24', 'room', 2),
('25', 'room', 2),
('26', 'room', 2),
('27', 'room', 2),
('28', 'room', 2);

-- Floor 3: 30-38 (excluding 33)
INSERT INTO public.locations (name, type, floor) VALUES 
('30', 'room', 3),
('31', 'room', 3),
('32', 'room', 3),
('34', 'room', 3),
('35', 'room', 3),
('36', 'room', 3),
('37', 'room', 3),
('38', 'room', 3);

-- Floor 4: 40-48 (excluding 43)
INSERT INTO public.locations (name, type, floor) VALUES 
('40', 'room', 4),
('41', 'room', 4),
('42', 'room', 4),
('44', 'room', 4),
('45', 'room', 4),
('46', 'room', 4),
('47', 'room', 4),
('48', 'room', 4);

-- Floor 5: 50-52, 54-58
INSERT INTO public.locations (name, type, floor) VALUES 
('50', 'room', 5),
('51', 'room', 5),
('52', 'room', 5),
('54', 'room', 5),
('55', 'room', 5),
('56', 'room', 5),
('57', 'room', 5),
('58', 'room', 5);

-- Insert common areas
INSERT INTO public.locations (name, type, floor) VALUES 
('Couloir étage 1 chambres 10-14', 'common_area', 1),
('Couloir étage 1 chambres 15-18', 'common_area', 1),
('Couloir étage 2 chambres 20-24', 'common_area', 2),
('Couloir étage 2 chambres 25-28', 'common_area', 2),
('Couloir étage 3 chambres 30-34', 'common_area', 3),
('Couloir étage 3 chambres 35-38', 'common_area', 3),
('Couloir étage 4 chambres 40-44', 'common_area', 4),
('Couloir étage 4 chambres 45-48', 'common_area', 4),
('Couloir étage 5 chambres 50-52', 'common_area', 5),
('Couloir étage 5 chambres 54-58', 'common_area', 5),
('Escalier RDC – 1er', 'common_area', 0),
('Escalier 1er – 2e', 'common_area', 1),
('Escalier 2e – 3e', 'common_area', 2),
('Escalier 3e – 4e', 'common_area', 3),
('Escalier 4e – 5e', 'common_area', 4),
('Escalier RDC – Sous-sol', 'common_area', 0),
('Toit', 'common_area', 6),
('Cabine moteur ascenseur', 'common_area', NULL),
('Palier 1er étage', 'common_area', 1),
('Palier 2e étage', 'common_area', 2),
('Palier 3e étage', 'common_area', 3),
('Palier 4e étage', 'common_area', 4),
('Palier 5e étage', 'common_area', 5),
('Terrasse', 'common_area', NULL),
('Accueil', 'common_area', 0),
('Ascenseur', 'common_area', NULL),
('Salon', 'common_area', 0),
('Salle petit-déjeuner bar', 'common_area', 0),
('Bagagerie bureau', 'common_area', 0),
('Cours', 'common_area', 0),
('Espace Spa', 'common_area', 0);

-- Insert staff areas
INSERT INTO public.locations (name, type) VALUES 
('Lingerie', 'staff_area'),
('Chaufferie', 'staff_area'),
('Vide linge', 'staff_area'),
('Centrale d''aspiration', 'staff_area'),
('Couloir', 'staff_area'),
('Salle de réunion', 'staff_area'),
('Espace bien être', 'staff_area'),
('Cuisine', 'staff_area'),
('Atelier', 'staff_area'),
('WC public', 'staff_area'),
('Vestiaires staff', 'staff_area');
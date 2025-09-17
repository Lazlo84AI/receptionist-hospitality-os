-- Update all ground floor common areas to have floor = 0
UPDATE public.locations 
SET floor = 0 
WHERE type = 'common_area' 
AND name IN (
    'Terrasse',
    'Accueil',
    'Ascenseur',
    'Salon',
    'Salle petit-déjeuner bar',
    'Bagagerie bureau',
    'Cours',
    'Espace Spa',
    'Cabine moteur ascenseur'
);
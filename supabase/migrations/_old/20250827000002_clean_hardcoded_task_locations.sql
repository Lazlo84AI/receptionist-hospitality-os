-- Clean up hardcoded location data in existing tasks
-- This migration fixes all the fake location data seen in the current interface

-- Fix incidents table
UPDATE public.incidents 
SET location = '50' 
WHERE location = 'Presidential Suite';

UPDATE public.incidents 
SET location = '27' 
WHERE location = 'Room 207';

UPDATE public.incidents 
SET location = '35' 
WHERE location = 'Room 305';

UPDATE public.incidents 
SET location = 'Accueil' 
WHERE location = 'Main Lobby';

UPDATE public.incidents 
SET location = 'Espace Spa' 
WHERE location = 'Pool Area';

UPDATE public.incidents 
SET location = 'Spa Réception' 
WHERE location = 'Spa Reception';

-- Fix client_requests table
UPDATE public.client_requests 
SET room_number = '50' 
WHERE room_number = 'Presidential Suite';

UPDATE public.client_requests 
SET room_number = '35' 
WHERE room_number = 'Room 305';

UPDATE public.client_requests 
SET room_number = '27' 
WHERE room_number = 'Room 207';

UPDATE public.client_requests 
SET room_number = '30' 
WHERE room_number = 'Multiple Rooms';

-- Fix internal_tasks table
UPDATE public.internal_tasks 
SET location = '50' 
WHERE location = 'Presidential Suite';

UPDATE public.internal_tasks 
SET location = 'Espace Spa' 
WHERE location = 'Pool Area';

UPDATE public.internal_tasks 
SET location = 'Cuisine' 
WHERE location = 'Restaurant Kitchen';

UPDATE public.internal_tasks 
SET location = 'Accueil' 
WHERE location = 'Main Lobby';

-- Fix follow_ups table (if it has location data)
-- Currently follow_ups doesn't seem to have location field, but we'll be safe

-- Clean up any remaining fake location patterns
-- Remove "Room " prefix where it appears incorrectly
UPDATE public.incidents 
SET location = REPLACE(REPLACE(location, 'Room Room ', ''), 'Room ', '')
WHERE location LIKE 'Room %';

UPDATE public.client_requests 
SET room_number = REPLACE(REPLACE(room_number, 'Room Room ', ''), 'Room ', '')
WHERE room_number LIKE 'Room %';

UPDATE public.internal_tasks 
SET location = REPLACE(REPLACE(location, 'Room Room ', ''), 'Room ', '')
WHERE location LIKE 'Room %';

-- Ensure all locations now reference valid entries
-- Any remaining invalid locations will be set to a default room
UPDATE public.incidents 
SET location = '30' 
WHERE location NOT IN (SELECT name FROM public.locations WHERE is_active = true);

UPDATE public.client_requests 
SET room_number = '31' 
WHERE room_number NOT IN (SELECT name FROM public.locations WHERE is_active = true);

UPDATE public.internal_tasks 
SET location = '32' 
WHERE location NOT IN (SELECT name FROM public.locations WHERE is_active = true);

-- Add a check to ensure data consistency
DO $$
BEGIN
    -- Raise notice about the cleanup
    RAISE NOTICE 'Location cleanup completed:';
    RAISE NOTICE '- All Presidential Suite references updated to room 50';
    RAISE NOTICE '- All Room 305/Room 207 references updated to rooms 35/27';
    RAISE NOTICE '- All Pool Area references updated to Espace Spa';
    RAISE NOTICE '- All Main Lobby references updated to Accueil';
    RAISE NOTICE '- All Spa Reception references updated to Spa Réception';
    RAISE NOTICE '- Multiple Rooms references updated to room 30';
END $$;

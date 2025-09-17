-- Fix incorrect floor assignments
-- Move Executive Lounge from floor 8 to ground floor (0)
UPDATE public.locations 
SET floor = 0 
WHERE name = 'Executive Lounge' AND type = 'common_area';

-- Remove Presidential Suite from floor 10 (delete it entirely)
DELETE FROM public.locations 
WHERE name = 'Presidential Suite' AND type = 'room' AND floor = 10;

-- Ensure Toit stays at floor 6 as it's correct for roof
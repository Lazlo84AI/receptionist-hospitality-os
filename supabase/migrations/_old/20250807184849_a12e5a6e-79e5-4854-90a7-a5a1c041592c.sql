-- Update all staff areas without a floor to be in basement (floor = -1)
UPDATE public.locations 
SET floor = -1 
WHERE type = 'staff_area' 
AND floor IS NULL;
-- Ensure no locations have NULL floor values
-- Update any remaining NULL floors to appropriate values
UPDATE public.locations 
SET floor = CASE 
    WHEN type = 'staff_area' THEN -1  -- Basement for staff areas
    WHEN type = 'common_area' THEN 0  -- Ground floor for common areas
    ELSE 0  -- Default to ground floor
END
WHERE floor IS NULL;
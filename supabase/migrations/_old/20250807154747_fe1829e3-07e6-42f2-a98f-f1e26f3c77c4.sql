-- Add job_role and hierarchy columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN job_role TEXT,
ADD COLUMN hierarchy TEXT;

-- Add constraints for valid values
ALTER TABLE public.profiles 
ADD CONSTRAINT check_job_role 
CHECK (job_role IN ('a receptionist', 'a housekeeper', 'a cleaning staff member', 'restaurant staff', 'tech maintenance team'));

ALTER TABLE public.profiles 
ADD CONSTRAINT check_hierarchy 
CHECK (hierarchy IN ('Normal', 'Manager', 'Director'));
-- Create enum types for better data consistency
CREATE TYPE public.priority_level AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- Incidents table
CREATE TABLE public.incidents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    incident_type TEXT NOT NULL,
    priority priority_level NOT NULL DEFAULT 'medium',
    status task_status NOT NULL DEFAULT 'pending',
    location TEXT,
    assigned_to TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Client requests table
CREATE TABLE public.client_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    guest_name TEXT NOT NULL,
    room_number TEXT NOT NULL,
    request_type TEXT NOT NULL,
    request_details TEXT,
    preparation_status task_status NOT NULL DEFAULT 'pending',
    arrival_date DATE,
    priority priority_level NOT NULL DEFAULT 'medium',
    assigned_to TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Follow-ups table
CREATE TABLE public.follow_ups (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    recipient TEXT NOT NULL,
    follow_up_type TEXT NOT NULL,
    notes TEXT,
    status task_status NOT NULL DEFAULT 'pending',
    due_date DATE,
    priority priority_level NOT NULL DEFAULT 'medium',
    assigned_to TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Internal tasks table
CREATE TABLE public.internal_tasks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    task_type TEXT NOT NULL,
    priority priority_level NOT NULL DEFAULT 'medium',
    status task_status NOT NULL DEFAULT 'pending',
    location TEXT,
    department TEXT,
    due_date DATE,
    assigned_to TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing public access for now - you can restrict later)
CREATE POLICY "Allow public access to incidents" ON public.incidents FOR ALL USING (true);
CREATE POLICY "Allow public access to client_requests" ON public.client_requests FOR ALL USING (true);
CREATE POLICY "Allow public access to follow_ups" ON public.follow_ups FOR ALL USING (true);
CREATE POLICY "Allow public access to internal_tasks" ON public.internal_tasks FOR ALL USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_incidents_updated_at
    BEFORE UPDATE ON public.incidents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_requests_updated_at
    BEFORE UPDATE ON public.client_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_follow_ups_updated_at
    BEFORE UPDATE ON public.follow_ups
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_internal_tasks_updated_at
    BEFORE UPDATE ON public.internal_tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
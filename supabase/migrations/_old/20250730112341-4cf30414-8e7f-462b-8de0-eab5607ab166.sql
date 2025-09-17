-- Create additional enum types
CREATE TYPE public.shift_status AS ENUM ('active', 'completed', 'cancelled');
CREATE TYPE public.comment_type AS ENUM ('comment', 'system', 'escalation');
CREATE TYPE public.reminder_frequency AS ENUM ('once', 'daily', 'weekly', 'monthly');
CREATE TYPE public.attachment_type AS ENUM ('image', 'document', 'audio', 'video', 'other');
CREATE TYPE public.escalation_method AS ENUM ('email', 'sms', 'phone', 'internal');
CREATE TYPE public.user_role AS ENUM ('admin', 'manager', 'staff', 'maintenance', 'housekeeping');

-- User profiles table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'staff',
    department TEXT,
    phone TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Shifts table
CREATE TABLE public.shifts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    end_time TIMESTAMP WITH TIME ZONE,
    status shift_status NOT NULL DEFAULT 'active',
    voice_note_url TEXT,
    voice_note_transcription TEXT,
    handover_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Comments table (for all task types)
CREATE TABLE public.comments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    task_id UUID NOT NULL,
    task_type TEXT NOT NULL, -- 'incident', 'client_request', 'follow_up', 'internal_task'
    content TEXT NOT NULL,
    comment_type comment_type NOT NULL DEFAULT 'comment',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Checklists table
CREATE TABLE public.checklists (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL,
    task_type TEXT NOT NULL, -- 'incident', 'client_request', 'follow_up', 'internal_task'
    title TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]', -- Array of {id, text, completed, completedBy, completedAt}
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Reminders table
CREATE TABLE public.reminders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL,
    task_type TEXT NOT NULL, -- 'incident', 'client_request', 'follow_up', 'internal_task'
    title TEXT NOT NULL,
    message TEXT,
    reminder_time TIMESTAMP WITH TIME ZONE NOT NULL,
    frequency reminder_frequency NOT NULL DEFAULT 'once',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Attachments table
CREATE TABLE public.attachments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL,
    task_type TEXT NOT NULL, -- 'incident', 'client_request', 'follow_up', 'internal_task'
    filename TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    attachment_type attachment_type NOT NULL DEFAULT 'other',
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Escalations table
CREATE TABLE public.escalations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL,
    task_type TEXT NOT NULL, -- 'incident', 'client_request', 'follow_up', 'internal_task'
    escalated_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    escalated_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    method escalation_method NOT NULL,
    recipient_email TEXT,
    recipient_phone TEXT,
    message TEXT NOT NULL,
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activity log table (for tracking all activities)
CREATE TABLE public.activity_log (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    task_id UUID,
    task_type TEXT, -- 'incident', 'client_request', 'follow_up', 'internal_task'
    action TEXT NOT NULL, -- 'created', 'updated', 'assigned', 'commented', 'completed', etc.
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Team members junction table (for task assignments)
CREATE TABLE public.task_members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL,
    task_type TEXT NOT NULL, -- 'incident', 'client_request', 'follow_up', 'internal_task'
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'assignee', -- 'assignee', 'observer', 'approver'
    added_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(task_id, task_type, user_id)
);

-- Rooms/Locations table
CREATE TABLE public.locations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'room', 'common_area', 'corridor', 'office'
    floor INTEGER,
    building TEXT,
    capacity INTEGER,
    amenities JSONB DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all new tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing public access for now - you can restrict later)
CREATE POLICY "Allow public access to profiles" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Allow public access to shifts" ON public.shifts FOR ALL USING (true);
CREATE POLICY "Allow public access to comments" ON public.comments FOR ALL USING (true);
CREATE POLICY "Allow public access to checklists" ON public.checklists FOR ALL USING (true);
CREATE POLICY "Allow public access to reminders" ON public.reminders FOR ALL USING (true);
CREATE POLICY "Allow public access to attachments" ON public.attachments FOR ALL USING (true);
CREATE POLICY "Allow public access to escalations" ON public.escalations FOR ALL USING (true);
CREATE POLICY "Allow public access to activity_log" ON public.activity_log FOR ALL USING (true);
CREATE POLICY "Allow public access to task_members" ON public.task_members FOR ALL USING (true);
CREATE POLICY "Allow public access to locations" ON public.locations FOR ALL USING (true);

-- Create triggers for automatic timestamp updates on new tables
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shifts_updated_at
    BEFORE UPDATE ON public.shifts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_checklists_updated_at
    BEFORE UPDATE ON public.checklists
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reminders_updated_at
    BEFORE UPDATE ON public.reminders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_escalations_updated_at
    BEFORE UPDATE ON public.escalations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_locations_updated_at
    BEFORE UPDATE ON public.locations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for all tables
ALTER TABLE public.incidents REPLICA IDENTITY FULL;
ALTER TABLE public.client_requests REPLICA IDENTITY FULL;
ALTER TABLE public.follow_ups REPLICA IDENTITY FULL;
ALTER TABLE public.internal_tasks REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.shifts REPLICA IDENTITY FULL;
ALTER TABLE public.comments REPLICA IDENTITY FULL;
ALTER TABLE public.checklists REPLICA IDENTITY FULL;
ALTER TABLE public.reminders REPLICA IDENTITY FULL;
ALTER TABLE public.attachments REPLICA IDENTITY FULL;
ALTER TABLE public.escalations REPLICA IDENTITY FULL;
ALTER TABLE public.activity_log REPLICA IDENTITY FULL;
ALTER TABLE public.task_members REPLICA IDENTITY FULL;
ALTER TABLE public.locations REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.client_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.follow_ups;
ALTER PUBLICATION supabase_realtime ADD TABLE public.internal_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shifts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.checklists;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reminders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attachments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.escalations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_log;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.locations;
// Database types matching Supabase schema
export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: 'admin' | 'manager' | 'staff' | 'maintenance' | 'housekeeping';
  department: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string | null;
  incident_type: string;
  priority: 'normal' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  location: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientRequest {
  id: string;
  guest_name: string;
  room_number: string;
  request_type: string;
  request_details: string | null;
  preparation_status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  arrival_date: string | null;
  priority: 'normal' | 'urgent';
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface FollowUp {
  id: string;
  title: string;
  recipient: string;
  follow_up_type: string;
  notes: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date: string | null;
  priority: 'normal' | 'urgent';
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface InternalTask {
  id: string;
  title: string;
  description: string | null;
  task_type: string;
  priority: 'normal' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  location: string | null;
  department: string | null;
  due_date: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  task_id: string;
  task_type: 'incident' | 'client_request' | 'follow_up' | 'internal_task';
  content: string;
  comment_type: 'comment' | 'system' | 'escalation';
  created_at: string;
  updated_at: string;
}

export interface Checklist {
  id: string;
  task_id: string;
  task_type: 'incident' | 'client_request' | 'follow_up' | 'internal_task';
  title: string;
  items: ChecklistItem[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  completedBy: string | null;
  completedAt: string | null;
}

export interface Reminder {
  id: string;
  task_id: string;
  task_type: 'incident' | 'client_request' | 'follow_up' | 'internal_task';
  title: string;
  message: string | null;
  reminder_time: string;
  frequency: 'once' | 'daily' | 'weekly' | 'monthly';
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  name: string;
  type: 'room' | 'common_area' | 'corridor' | 'office';
  floor: number | null;
  building: string | null;
  capacity: number | null;
  amenities: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Shift {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  status: 'active' | 'completed' | 'cancelled';
  voice_note_url: string | null;
  voice_note_transcription: string | null;
  handover_notes: string | null;
  created_at: string;
  updated_at: string;
}

// Unified task interface for the UI
export interface TaskItem {
  id: string;
  title: string;
  type: 'incident' | 'client_request' | 'follow_up' | 'internal_task';
  priority: 'normal' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  description?: string;
  assignedTo?: string;
  dueDate?: string;
  location?: string;
  guestName?: string;
  roomNumber?: string;
  recipient?: string;
  created_at: string;
  updated_at: string;
}
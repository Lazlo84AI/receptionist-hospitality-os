// Database types matching Supabase schema
import type { 
  Priority, 
  TaskStatus, 
  UserRole, 
  ShiftStatus, 
  CommentType, 
  AttachmentType, 
  EscalationMethod, 
  ReminderFrequency 
} from './payloads';

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: UserRole;
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
  priority: Priority;
  status: TaskStatus;
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
  preparation_status: TaskStatus;
  arrival_date: string | null;
  priority: Priority;
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
  status: TaskStatus;
  due_date: string | null;
  priority: Priority;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface InternalTask {
  id: string;
  title: string;
  description: string | null;
  task_type: string;
  priority: Priority;
  status: TaskStatus;
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
  task_type: string;
  content: string;
  comment_type: CommentType;
  created_at: string;
  updated_at: string;
}

export interface Attachment {
  id: string;
  task_id: string;
  task_type: string;
  filename: string;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  attachment_type: AttachmentType;
  uploaded_by: string;
  created_at: string;
}

export interface Checklist {
  id: string;
  task_id: string;
  task_type: string;
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
  assigned_to?: string;
  due_date?: string;
}

export interface Escalation {
  id: string;
  task_id: string;
  task_type: string;
  message: string;
  method: EscalationMethod;
  escalated_by: string;
  escalated_to: string | null;
  recipient_email: string | null;
  recipient_phone: string | null;
  is_resolved: boolean;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  task_id: string;
  task_type: string;
  title: string;
  message: string | null;
  reminder_time: string;
  frequency: ReminderFrequency;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TaskMember {
  id: string;
  task_id: string;
  task_type: string;
  user_id: string;
  role: string;
  added_by: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  task_id: string | null;
  task_type: string | null;
  action: string;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface Location {
  id: string;
  name: string;
  type: string;
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
  status: ShiftStatus;
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
  priority: Priority;
  status: TaskStatus;
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

// API Response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// Realtime subscription types
export interface RealtimeSubscription {
  unsubscribe: () => void;
}

export interface DatabaseChange<T = any> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  schema: string;
  table: string;
  old?: T;
  new?: T;
  errors?: any[];
}
// Base types for common fields
export type Priority = 'low' | 'medium' | 'high' | 'urgent' | 'normal';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type UserRole = 'admin' | 'manager' | 'staff' | 'guest' | 'maintenance' | 'housekeeping';
export type ShiftStatus = 'active' | 'completed' | 'paused' | 'cancelled';
export type CommentType = 'comment' | 'note' | 'update' | 'system' | 'escalation';
export type AttachmentType = 'image' | 'document' | 'video' | 'audio' | 'other';
export type EscalationMethod = 'email' | 'phone' | 'sms' | 'internal';
export type ReminderFrequency = 'once' | 'daily' | 'weekly' | 'monthly';

// Incident Payloads - matches incidents table exactly
export interface CreateIncidentPayload {
  title: string;
  description?: string;
  incident_type: string;
  location?: string;
  priority: Priority;
  assigned_to?: string;
}

export interface UpdateIncidentPayload {
  id: string;
  title?: string;
  description?: string;
  incident_type?: string;
  location?: string;
  priority?: Priority;
  status?: TaskStatus;
  assigned_to?: string;
}

// Client Request Payloads - matches client_requests table exactly
export interface CreateClientRequestPayload {
  guest_name: string;
  room_number: string;
  request_type: string;
  request_details?: string;
  arrival_date?: string; // ISO date string
  priority: Priority;
  assigned_to?: string;
}

export interface UpdateClientRequestPayload {
  id: string;
  guest_name?: string;
  room_number?: string;
  request_type?: string;
  request_details?: string;
  arrival_date?: string;
  priority?: Priority;
  preparation_status?: TaskStatus;
  assigned_to?: string;
}

// Follow-up Payloads - matches follow_ups table exactly
export interface CreateFollowUpPayload {
  title: string;
  follow_up_type: string;
  recipient: string;
  notes?: string;
  due_date?: string; // ISO date string
  priority: Priority;
  assigned_to?: string;
}

export interface UpdateFollowUpPayload {
  id: string;
  title?: string;
  follow_up_type?: string;
  recipient?: string;
  notes?: string;
  due_date?: string;
  priority?: Priority;
  status?: TaskStatus;
  assigned_to?: string;
}

// Internal Task Payloads - matches internal_tasks table exactly
export interface CreateInternalTaskPayload {
  title: string;
  description?: string;
  task_type: string;
  department?: string;
  location?: string;
  due_date?: string; // ISO date string
  priority: Priority;
  assigned_to?: string;
}

export interface UpdateInternalTaskPayload {
  id: string;
  title?: string;
  description?: string;
  task_type?: string;
  department?: string;
  location?: string;
  due_date?: string;
  priority?: Priority;
  status?: TaskStatus;
  assigned_to?: string;
}

// Comment Payloads
export interface CreateCommentPayload {
  task_id: string;
  task_type: string;
  content: string;
  comment_type: CommentType;
  user_id: string;
}

export interface UpdateCommentPayload {
  id: string;
  content?: string;
  comment_type?: CommentType;
}

// Attachment Payloads
export interface CreateAttachmentPayload {
  task_id: string;
  task_type: string;
  filename: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  attachment_type: AttachmentType;
  uploaded_by: string;
}

// Checklist Payloads
export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  assigned_to?: string;
  due_date?: string;
}

export interface CreateChecklistPayload {
  task_id: string;
  task_type: string;
  title: string;
  items: ChecklistItem[];
  created_by: string;
}

export interface UpdateChecklistPayload {
  id: string;
  title?: string;
  items?: ChecklistItem[];
}

// Escalation Payloads
export interface CreateEscalationPayload {
  task_id: string;
  task_type: string;
  message: string;
  method: EscalationMethod;
  escalated_by: string;
  escalated_to?: string;
  recipient_email?: string;
  recipient_phone?: string;
}

export interface UpdateEscalationPayload {
  id: string;
  message?: string;
  is_resolved?: boolean;
  escalated_to?: string;
  recipient_email?: string;
  recipient_phone?: string;
}

// Reminder Payloads
export interface CreateReminderPayload {
  task_id: string;
  task_type: string;
  title: string;
  message?: string;
  reminder_time: string;
  frequency: ReminderFrequency;
  created_by: string;
}

export interface UpdateReminderPayload {
  id: string;
  title?: string;
  message?: string;
  reminder_time?: string;
  frequency?: ReminderFrequency;
  is_active?: boolean;
}

// Task Member Payloads
export interface AddTaskMemberPayload {
  task_id: string;
  task_type: string;
  user_id: string;
  role?: string;
  added_by: string;
}

export interface RemoveTaskMemberPayload {
  id: string;
}

// Shift Payloads
export interface StartShiftPayload {
  user_id: string;
  handover_notes?: string;
}

export interface EndShiftPayload {
  id: string;
  handover_notes?: string;
  voice_note_url?: string;
  voice_note_transcription?: string;
}

export interface UpdateShiftPayload {
  id: string;
  handover_notes?: string;
  voice_note_url?: string;
  voice_note_transcription?: string;
  status?: ShiftStatus;
}

// Activity Log Payloads
export interface CreateActivityLogPayload {
  user_id?: string;
  task_id?: string;
  task_type?: string;
  action: string;
  description: string;
  metadata?: Record<string, any>;
}

// Profile Payloads
export interface CreateProfilePayload {
  id: string; // User ID from auth
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  department?: string;
  role: UserRole;
  avatar_url?: string;
}

export interface UpdateProfilePayload {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  department?: string;
  role?: UserRole;
  avatar_url?: string;
  is_active?: boolean;
}

// Location Payloads
export interface CreateLocationPayload {
  name: string;
  type: string;
  building?: string;
  floor?: number;
  capacity?: number;
  amenities?: string[];
}

export interface UpdateLocationPayload {
  id: string;
  name?: string;
  type?: string;
  building?: string;
  floor?: number;
  capacity?: number;
  amenities?: string[];
  is_active?: boolean;
}

// Real-time Event Payloads
export interface RealtimeEventPayload<T = any> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  schema: string;
  table: string;
  old?: T;
  new?: T;
  errors?: any[];
}

// Specific realtime events for each table
export interface IncidentRealtimeEvent extends RealtimeEventPayload {
  table: 'incidents';
  new?: UpdateIncidentPayload;
  old?: UpdateIncidentPayload;
}

export interface ClientRequestRealtimeEvent extends RealtimeEventPayload {
  table: 'client_requests';
  new?: UpdateClientRequestPayload;
  old?: UpdateClientRequestPayload;
}

export interface FollowUpRealtimeEvent extends RealtimeEventPayload {
  table: 'follow_ups';
  new?: UpdateFollowUpPayload;
  old?: UpdateFollowUpPayload;
}

export interface InternalTaskRealtimeEvent extends RealtimeEventPayload {
  table: 'internal_tasks';
  new?: UpdateInternalTaskPayload;
  old?: UpdateInternalTaskPayload;
}

export interface CommentRealtimeEvent extends RealtimeEventPayload {
  table: 'comments';
  new?: CreateCommentPayload & { id: string; created_at: string };
  old?: CreateCommentPayload & { id: string; created_at: string };
}

export interface ShiftRealtimeEvent extends RealtimeEventPayload {
  table: 'shifts';
  new?: UpdateShiftPayload;
  old?: UpdateShiftPayload;
}

// Bulk operations
export interface BulkUpdateTasksPayload {
  task_ids: string[];
  task_type: string;
  updates: {
    status?: TaskStatus;
    priority?: Priority;
    assigned_to?: string;
  };
}

export interface BulkDeleteTasksPayload {
  task_ids: string[];
  task_type: string;
}

// Search and filter payloads
export interface TaskSearchPayload {
  query?: string;
  task_types?: string[];
  status?: TaskStatus[];
  priority?: Priority[];
  assigned_to?: string[];
  date_from?: string;
  date_to?: string;
  location?: string;
  limit?: number;
  offset?: number;
}

// Analytics payloads
export interface TaskAnalyticsPayload {
  date_from?: string;
  date_to?: string;
  group_by?: 'day' | 'week' | 'month';
  task_types?: string[];
  departments?: string[];
}

// Webhook payloads for external integrations
export interface WebhookEventPayload {
  event: string;
  timestamp: string;
  data: any;
  source: 'task_management' | 'shift_management' | 'escalation';
}

// Export all payload types
export type TaskPayload = CreateIncidentPayload | CreateClientRequestPayload | CreateFollowUpPayload | CreateInternalTaskPayload;
export type UpdateTaskPayload = UpdateIncidentPayload | UpdateClientRequestPayload | UpdateFollowUpPayload | UpdateInternalTaskPayload;
export type CreatePayload = TaskPayload | CreateCommentPayload | CreateAttachmentPayload | CreateChecklistPayload | CreateEscalationPayload | CreateReminderPayload | AddTaskMemberPayload | StartShiftPayload | CreateActivityLogPayload | CreateProfilePayload | CreateLocationPayload;
export type UpdatePayload = UpdateTaskPayload | UpdateCommentPayload | UpdateChecklistPayload | UpdateEscalationPayload | UpdateReminderPayload | EndShiftPayload | UpdateShiftPayload | UpdateProfilePayload | UpdateLocationPayload;
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          department: string | null
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          department?: string | null
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          department?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          category_type: string
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          name: string
          parent_id: string | null
          quick_access: boolean | null
        }
        Insert: {
          category_type: string
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          parent_id?: string | null
          quick_access?: boolean | null
        }
        Update: {
          category_type?: string
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          quick_access?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_ups: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string
          due_date: string
          follow_up_type: string
          id: string
          notes: string | null
          recipient: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by: string
          due_date: string
          follow_up_type: string
          id?: string
          notes?: string | null
          recipient: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string
          due_date?: string
          follow_up_type?: string
          id?: string
          notes?: string | null
          recipient?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          affected_departments: string[] | null
          assigned_to: string | null
          created_at: string | null
          created_by: string
          description: string | null
          escalation_path: Json | null
          id: string
          incident_type: string
          location_id: string | null
          priority: string | null
          related_task_ids: string[] | null
          resolved_at: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          affected_departments?: string[] | null
          assigned_to?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          escalation_path?: Json | null
          id?: string
          incident_type: string
          location_id?: string | null
          priority?: string | null
          related_task_ids?: string[] | null
          resolved_at?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          affected_departments?: string[] | null
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          escalation_path?: Json | null
          id?: string
          incident_type?: string
          location_id?: string | null
          priority?: string | null
          related_task_ids?: string[] | null
          resolved_at?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incidents_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_queries: {
        Row: {
          created_at: string | null
          id: string
          query_text: string
          query_voice_url: string | null
          response_sources: string[] | null
          response_text: string | null
          user_id: string
          was_helpful: boolean | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          query_text: string
          query_voice_url?: string | null
          response_sources?: string[] | null
          response_text?: string | null
          user_id: string
          was_helpful?: boolean | null
        }
        Update: {
          created_at?: string | null
          id?: string
          query_text?: string
          query_voice_url?: string | null
          response_sources?: string[] | null
          response_text?: string | null
          user_id?: string
          was_helpful?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_queries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          display_name: string
          id: string
          is_active: boolean | null
          location_code: string
          location_type: string
          metadata: Json | null
          parent_location_id: string | null
        }
        Insert: {
          display_name: string
          id?: string
          is_active?: boolean | null
          location_code: string
          location_type: string
          metadata?: Json | null
          parent_location_id?: string | null
        }
        Update: {
          display_name?: string
          id?: string
          is_active?: boolean | null
          location_code?: string
          location_type?: string
          metadata?: Json | null
          parent_location_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_parent_location_id_fkey"
            columns: ["parent_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_required: boolean | null
          action_taken: string | null
          body: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean | null
          notification_type: string
          priority: string
          read_at: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          action_required?: boolean | null
          action_taken?: string | null
          body?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          notification_type: string
          priority: string
          read_at?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          action_required?: boolean | null
          action_taken?: string | null
          body?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          notification_type?: string
          priority?: string
          read_at?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_handovers: {
        Row: {
          additional_notes: string | null
          created_at: string | null
          from_shift_id: string
          handover_data: Json
          id: string
          to_shift_id: string | null
          voice_notes_url: string | null
        }
        Insert: {
          additional_notes?: string | null
          created_at?: string | null
          from_shift_id: string
          handover_data: Json
          id?: string
          to_shift_id?: string | null
          voice_notes_url?: string | null
        }
        Update: {
          additional_notes?: string | null
          created_at?: string | null
          from_shift_id?: string
          handover_data?: Json
          id?: string
          to_shift_id?: string | null
          voice_notes_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shift_handovers_from_shift_id_fkey"
            columns: ["from_shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_handovers_to_shift_id_fkey"
            columns: ["to_shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          created_at: string | null
          end_time: string | null
          handover_notes: string | null
          id: string
          receptionist_id: string
          shift_type: string
          start_time: string
          status: string | null
          updated_at: string | null
          voice_handover_url: string | null
        }
        Insert: {
          created_at?: string | null
          end_time?: string | null
          handover_notes?: string | null
          id?: string
          receptionist_id: string
          shift_type: string
          start_time: string
          status?: string | null
          updated_at?: string | null
          voice_handover_url?: string | null
        }
        Update: {
          created_at?: string | null
          end_time?: string | null
          handover_notes?: string | null
          id?: string
          receptionist_id?: string
          shift_type?: string
          start_time?: string
          status?: string | null
          updated_at?: string | null
          voice_handover_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shifts_receptionist_id_fkey"
            columns: ["receptionist_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      special_requests: {
        Row: {
          arrival_date: string
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string
          guest_name: string
          id: string
          notes: string | null
          preparation_status: string | null
          request_details: string | null
          request_type: string
          room_number: string
          updated_at: string | null
        }
        Insert: {
          arrival_date: string
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by: string
          guest_name: string
          id?: string
          notes?: string | null
          preparation_status?: string | null
          request_details?: string | null
          request_type: string
          room_number: string
          updated_at?: string | null
        }
        Update: {
          arrival_date?: string
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string
          guest_name?: string
          id?: string
          notes?: string | null
          preparation_status?: string | null
          request_details?: string | null
          request_type?: string
          room_number?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "special_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "special_requests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_events: {
        Row: {
          created_at: string | null
          created_by: string | null
          event_type: string
          id: string
          payload: Json
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          event_type: string
          id?: string
          payload: Json
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          event_type?: string
          id?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "system_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          comment_text: string | null
          created_at: string | null
          id: string
          is_internal: boolean | null
          mentioned_users: string[] | null
          task_id: string | null
          user_id: string | null
          voice_recording_id: string | null
        }
        Insert: {
          comment_text?: string | null
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          mentioned_users?: string[] | null
          task_id?: string | null
          user_id?: string | null
          voice_recording_id?: string | null
        }
        Update: {
          comment_text?: string | null
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          mentioned_users?: string[] | null
          task_id?: string | null
          user_id?: string | null
          voice_recording_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_voice_recording_id_fkey"
            columns: ["voice_recording_id"]
            isOneToOne: false
            referencedRelation: "voice_recordings"
            referencedColumns: ["id"]
          },
        ]
      }
      task_updates: {
        Row: {
          created_at: string | null
          id: string
          new_values: Json | null
          previous_values: Json | null
          task_id: string | null
          update_type: string
          user_id: string | null
          voice_recording_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          new_values?: Json | null
          previous_values?: Json | null
          task_id?: string | null
          update_type: string
          user_id?: string | null
          voice_recording_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          new_values?: Json | null
          previous_values?: Json | null
          task_id?: string | null
          update_type?: string
          user_id?: string | null
          voice_recording_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_updates_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_updates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_updates_voice_recording_id_fkey"
            columns: ["voice_recording_id"]
            isOneToOne: false
            referencedRelation: "voice_recordings"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          category_id: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string
          department: string | null
          description: string | null
          due_date: string | null
          escalated_at: string | null
          escalation_channel: string | null
          escalation_date: string | null
          id: string
          incident_id: string | null
          location: string | null
          location_id: string | null
          priority: string | null
          reminder_date: string | null
          requires_cross_department_validation: boolean | null
          requires_validation: boolean | null
          status: string | null
          task_type: string
          title: string
          updated_at: string | null
          validated_by: string[] | null
          validation_deadline: string | null
          validation_status: Json | null
          visible_to_departments: string[] | null
          voice_note_url: string | null
        }
        Insert: {
          assigned_to?: string | null
          category_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by: string
          department?: string | null
          description?: string | null
          due_date?: string | null
          escalated_at?: string | null
          escalation_channel?: string | null
          escalation_date?: string | null
          id?: string
          incident_id?: string | null
          location?: string | null
          location_id?: string | null
          priority?: string | null
          reminder_date?: string | null
          requires_cross_department_validation?: boolean | null
          requires_validation?: boolean | null
          status?: string | null
          task_type: string
          title: string
          updated_at?: string | null
          validated_by?: string[] | null
          validation_deadline?: string | null
          validation_status?: Json | null
          visible_to_departments?: string[] | null
          voice_note_url?: string | null
        }
        Update: {
          assigned_to?: string | null
          category_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string
          department?: string | null
          description?: string | null
          due_date?: string | null
          escalated_at?: string | null
          escalation_channel?: string | null
          escalation_date?: string | null
          id?: string
          incident_id?: string | null
          location?: string | null
          location_id?: string | null
          priority?: string | null
          reminder_date?: string | null
          requires_cross_department_validation?: boolean | null
          requires_validation?: boolean | null
          status?: string | null
          task_type?: string
          title?: string
          updated_at?: string | null
          validated_by?: string[] | null
          validation_deadline?: string | null
          validation_status?: Json | null
          visible_to_departments?: string[] | null
          voice_note_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string | null
          department: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          permissions: Json | null
          role: string | null
          shift_type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean | null
          permissions?: Json | null
          role?: string | null
          shift_type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          permissions?: Json | null
          role?: string | null
          shift_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_relationships: {
        Row: {
          id: string
          is_active: boolean | null
          metadata: Json | null
          related_user_id: string | null
          relationship_type: string
          user_id: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          related_user_id?: string | null
          relationship_type: string
          user_id?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          related_user_id?: string | null
          relationship_type?: string
          user_id?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_relationships_related_user_id_fkey"
            columns: ["related_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_relationships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_recordings: {
        Row: {
          audio_url: string
          context: string
          created_at: string | null
          duration_seconds: number | null
          id: string
          transcription_status: string | null
          user_id: string | null
        }
        Insert: {
          audio_url: string
          context: string
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          transcription_status?: string | null
          user_id?: string | null
        }
        Update: {
          audio_url?: string
          context?: string
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          transcription_status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_recordings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_transcriptions: {
        Row: {
          ai_analysis: Json | null
          confidence_score: number | null
          created_at: string | null
          id: string
          processing_time_ms: number | null
          recording_id: string | null
          tasks_created: string[] | null
          transcribed_text: string
        }
        Insert: {
          ai_analysis?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          processing_time_ms?: number | null
          recording_id?: string | null
          tasks_created?: string[] | null
          transcribed_text: string
        }
        Update: {
          ai_analysis?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          processing_time_ms?: number | null
          recording_id?: string | null
          tasks_created?: string[] | null
          transcribed_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_transcriptions_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: false
            referencedRelation: "voice_recordings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

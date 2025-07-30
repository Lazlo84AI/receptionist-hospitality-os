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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          created_at: string
          description: string
          id: string
          metadata: Json | null
          task_id: string | null
          task_type: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          task_id?: string | null
          task_type?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          task_id?: string | null
          task_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          attachment_type: Database["public"]["Enums"]["attachment_type"]
          created_at: string
          file_size: number | null
          file_url: string
          filename: string
          id: string
          mime_type: string | null
          task_id: string
          task_type: string
          uploaded_by: string
        }
        Insert: {
          attachment_type?: Database["public"]["Enums"]["attachment_type"]
          created_at?: string
          file_size?: number | null
          file_url: string
          filename: string
          id?: string
          mime_type?: string | null
          task_id: string
          task_type: string
          uploaded_by: string
        }
        Update: {
          attachment_type?: Database["public"]["Enums"]["attachment_type"]
          created_at?: string
          file_size?: number | null
          file_url?: string
          filename?: string
          id?: string
          mime_type?: string | null
          task_id?: string
          task_type?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      checklists: {
        Row: {
          created_at: string
          created_by: string
          id: string
          items: Json
          task_id: string
          task_type: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          items?: Json
          task_id: string
          task_type: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          items?: Json
          task_id?: string
          task_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklists_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_requests: {
        Row: {
          arrival_date: string | null
          assigned_to: string | null
          created_at: string
          guest_name: string
          id: string
          preparation_status: Database["public"]["Enums"]["task_status"]
          priority: Database["public"]["Enums"]["priority_level"]
          request_details: string | null
          request_type: string
          room_number: string
          updated_at: string
        }
        Insert: {
          arrival_date?: string | null
          assigned_to?: string | null
          created_at?: string
          guest_name: string
          id?: string
          preparation_status?: Database["public"]["Enums"]["task_status"]
          priority?: Database["public"]["Enums"]["priority_level"]
          request_details?: string | null
          request_type: string
          room_number: string
          updated_at?: string
        }
        Update: {
          arrival_date?: string | null
          assigned_to?: string | null
          created_at?: string
          guest_name?: string
          id?: string
          preparation_status?: Database["public"]["Enums"]["task_status"]
          priority?: Database["public"]["Enums"]["priority_level"]
          request_details?: string | null
          request_type?: string
          room_number?: string
          updated_at?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          comment_type: Database["public"]["Enums"]["comment_type"]
          content: string
          created_at: string
          id: string
          task_id: string
          task_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment_type?: Database["public"]["Enums"]["comment_type"]
          content: string
          created_at?: string
          id?: string
          task_id: string
          task_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment_type?: Database["public"]["Enums"]["comment_type"]
          content?: string
          created_at?: string
          id?: string
          task_id?: string
          task_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      escalations: {
        Row: {
          created_at: string
          escalated_by: string
          escalated_to: string | null
          id: string
          is_resolved: boolean
          message: string
          method: Database["public"]["Enums"]["escalation_method"]
          recipient_email: string | null
          recipient_phone: string | null
          task_id: string
          task_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          escalated_by: string
          escalated_to?: string | null
          id?: string
          is_resolved?: boolean
          message: string
          method: Database["public"]["Enums"]["escalation_method"]
          recipient_email?: string | null
          recipient_phone?: string | null
          task_id: string
          task_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          escalated_by?: string
          escalated_to?: string | null
          id?: string
          is_resolved?: boolean
          message?: string
          method?: Database["public"]["Enums"]["escalation_method"]
          recipient_email?: string | null
          recipient_phone?: string | null
          task_id?: string
          task_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "escalations_escalated_by_fkey"
            columns: ["escalated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalations_escalated_to_fkey"
            columns: ["escalated_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_ups: {
        Row: {
          assigned_to: string | null
          created_at: string
          due_date: string | null
          follow_up_type: string
          id: string
          notes: string | null
          priority: Database["public"]["Enums"]["priority_level"]
          recipient: string
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          due_date?: string | null
          follow_up_type: string
          id?: string
          notes?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          recipient: string
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          due_date?: string | null
          follow_up_type?: string
          id?: string
          notes?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          recipient?: string
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      incidents: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string | null
          id: string
          incident_type: string
          location: string | null
          priority: Database["public"]["Enums"]["priority_level"]
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          id?: string
          incident_type: string
          location?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          id?: string
          incident_type?: string
          location?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      internal_tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          department: string | null
          description: string | null
          due_date: string | null
          id: string
          location: string | null
          priority: Database["public"]["Enums"]["priority_level"]
          status: Database["public"]["Enums"]["task_status"]
          task_type: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          department?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          location?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          status?: Database["public"]["Enums"]["task_status"]
          task_type: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          department?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          location?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          status?: Database["public"]["Enums"]["task_status"]
          task_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          amenities: Json | null
          building: string | null
          capacity: number | null
          created_at: string
          floor: number | null
          id: string
          is_active: boolean
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          amenities?: Json | null
          building?: string | null
          capacity?: number | null
          created_at?: string
          floor?: number | null
          id?: string
          is_active?: boolean
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          amenities?: Json | null
          building?: string | null
          capacity?: number | null
          created_at?: string
          floor?: number | null
          id?: string
          is_active?: boolean
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          email: string | null
          first_name: string | null
          id: string
          is_active: boolean
          last_name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          is_active?: boolean
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          created_at: string
          created_by: string
          frequency: Database["public"]["Enums"]["reminder_frequency"]
          id: string
          is_active: boolean
          message: string | null
          reminder_time: string
          task_id: string
          task_type: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          frequency?: Database["public"]["Enums"]["reminder_frequency"]
          id?: string
          is_active?: boolean
          message?: string | null
          reminder_time: string
          task_id: string
          task_type: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          frequency?: Database["public"]["Enums"]["reminder_frequency"]
          id?: string
          is_active?: boolean
          message?: string | null
          reminder_time?: string
          task_id?: string
          task_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          created_at: string
          end_time: string | null
          handover_notes: string | null
          id: string
          start_time: string
          status: Database["public"]["Enums"]["shift_status"]
          updated_at: string
          user_id: string
          voice_note_transcription: string | null
          voice_note_url: string | null
        }
        Insert: {
          created_at?: string
          end_time?: string | null
          handover_notes?: string | null
          id?: string
          start_time?: string
          status?: Database["public"]["Enums"]["shift_status"]
          updated_at?: string
          user_id: string
          voice_note_transcription?: string | null
          voice_note_url?: string | null
        }
        Update: {
          created_at?: string
          end_time?: string | null
          handover_notes?: string | null
          id?: string
          start_time?: string
          status?: Database["public"]["Enums"]["shift_status"]
          updated_at?: string
          user_id?: string
          voice_note_transcription?: string | null
          voice_note_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shifts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_members: {
        Row: {
          added_by: string
          created_at: string
          id: string
          role: string | null
          task_id: string
          task_type: string
          user_id: string
        }
        Insert: {
          added_by: string
          created_at?: string
          id?: string
          role?: string | null
          task_id: string
          task_type: string
          user_id: string
        }
        Update: {
          added_by?: string
          created_at?: string
          id?: string
          role?: string | null
          task_id?: string
          task_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_members_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      attachment_type: "image" | "document" | "audio" | "video" | "other"
      comment_type: "comment" | "system" | "escalation"
      escalation_method: "email" | "sms" | "phone" | "internal"
      priority_level: "low" | "medium" | "high" | "urgent"
      reminder_frequency: "once" | "daily" | "weekly" | "monthly"
      shift_status: "active" | "completed" | "cancelled"
      task_status: "pending" | "in_progress" | "completed" | "cancelled"
      user_role: "admin" | "manager" | "staff" | "maintenance" | "housekeeping"
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
    Enums: {
      attachment_type: ["image", "document", "audio", "video", "other"],
      comment_type: ["comment", "system", "escalation"],
      escalation_method: ["email", "sms", "phone", "internal"],
      priority_level: ["low", "medium", "high", "urgent"],
      reminder_frequency: ["once", "daily", "weekly", "monthly"],
      shift_status: ["active", "completed", "cancelled"],
      task_status: ["pending", "in_progress", "completed", "cancelled"],
      user_role: ["admin", "manager", "staff", "maintenance", "housekeeping"],
    },
  },
} as const

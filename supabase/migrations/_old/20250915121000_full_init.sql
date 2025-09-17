

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."attachment_type" AS ENUM (
    'image',
    'document',
    'audio',
    'video',
    'other'
);


ALTER TYPE "public"."attachment_type" OWNER TO "postgres";


CREATE TYPE "public"."comment_type" AS ENUM (
    'comment',
    'system',
    'escalation'
);


ALTER TYPE "public"."comment_type" OWNER TO "postgres";


CREATE TYPE "public"."escalation_method" AS ENUM (
    'email',
    'sms',
    'phone',
    'internal'
);


ALTER TYPE "public"."escalation_method" OWNER TO "postgres";


CREATE TYPE "public"."priority_level" AS ENUM (
    'normal',
    'urgent'
);


ALTER TYPE "public"."priority_level" OWNER TO "postgres";


CREATE TYPE "public"."reminder_frequency" AS ENUM (
    'once',
    'daily',
    'weekly',
    'monthly',
    'custom'
);


ALTER TYPE "public"."reminder_frequency" OWNER TO "postgres";


CREATE TYPE "public"."shift_status" AS ENUM (
    'active',
    'completed',
    'cancelled'
);


ALTER TYPE "public"."shift_status" OWNER TO "postgres";


CREATE TYPE "public"."task_category" AS ENUM (
    'incident',
    'client_request',
    'follow_up',
    'internal_task'
);


ALTER TYPE "public"."task_category" OWNER TO "postgres";


CREATE TYPE "public"."task_origin" AS ENUM (
    'client',
    'team',
    'maintenance'
);


ALTER TYPE "public"."task_origin" OWNER TO "postgres";


CREATE TYPE "public"."task_service" AS ENUM (
    'reception',
    'housekeeping',
    'maintenance',
    'direction'
);


ALTER TYPE "public"."task_service" OWNER TO "postgres";


CREATE TYPE "public"."task_status" AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'cancelled'
);


ALTER TYPE "public"."task_status" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'receptionist',
    'Housekeeping Supervisor',
    'Room Attendant',
    'restaurant staff',
    'tech maintenance team'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_old_handovers"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    DELETE FROM public.shift_handovers 
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;


ALTER FUNCTION "public"."cleanup_old_handovers"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_context"() RETURNS TABLE("user_role" "text", "user_hierarchy" "text", "user_department" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.role,
    p.hierarchy,
    sd.department
  FROM profiles p
  LEFT JOIN staff_directory sd ON sd.auth_user_id = p.id
  WHERE p.id = auth.uid();
END;
$$;


ALTER FUNCTION "public"."get_user_context"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role, hierarchy)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'role',
    COALESCE(NEW.raw_user_meta_data->>'hierarchy', 'Normal')
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_reminder_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE v_user uuid;
BEGIN
  v_user := COALESCE(NEW.updated_by, auth.uid());

  IF NEW.remind_at IS DISTINCT FROM OLD.remind_at THEN
    INSERT INTO public.activity_logs (id, user_id, entity_type, entity_id, action, new_values, created_at)
    VALUES (
      gen_random_uuid(),
      v_user,
      'reminder',
      NEW.id,
      'reminder_updated',
      jsonb_build_object('from', OLD.remind_at, 'to', NEW.remind_at),
      now()
    );
  END IF;

  RETURN NEW;
END $$;


ALTER FUNCTION "public"."log_reminder_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_task_comment_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO public.activity_logs (id, user_id, entity_type, entity_id, action, new_values, created_at)
  VALUES (
    gen_random_uuid(),
    NEW.user_id,
    'task',
    NEW.task_id,
    'comment_added',
    jsonb_build_object('comment_id', NEW.id, 'content', NEW.content),
    now()
  );
  RETURN NEW;
END $$;


ALTER FUNCTION "public"."log_task_comment_insert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_task_status_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE v_user uuid;
BEGIN
  v_user := COALESCE(NEW.updated_by, auth.uid(), NEW.created_by);

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.activity_logs (id, user_id, entity_type, entity_id, action, new_values, created_at)
    VALUES (
      gen_random_uuid(),
      v_user,
      'task',
      NEW.id,
      'status_changed',
      jsonb_build_object('from_status', OLD.status, 'to_status', NEW.status),
      now()
    );
  END IF;

  RETURN NEW;
END $$;


ALTER FUNCTION "public"."log_task_status_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."activity_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "department" "text",
    "entity_type" "text",
    "entity_id" "uuid",
    "action" "text",
    "old_values" "jsonb",
    "new_values" "jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."activity_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."attachments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "uuid" NOT NULL,
    "filename" "text" NOT NULL,
    "file_url" "text" NOT NULL,
    "file_size" integer,
    "mime_type" "text",
    "attachment_type" "public"."attachment_type" DEFAULT 'other'::"public"."attachment_type" NOT NULL,
    "uploaded_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."attachments" REPLICA IDENTITY FULL;


ALTER TABLE "public"."attachments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"(),
    "name" "text",
    "category_type" "text",
    "parent_id" "uuid",
    "icon" "text",
    "color" "text",
    "quick_access" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."checklists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "items" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "reminder_id" "uuid"
);

ALTER TABLE ONLY "public"."checklists" REPLICA IDENTITY FULL;


ALTER TABLE "public"."checklists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."client_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "guest_name" "text" NOT NULL,
    "room_number" "text" NOT NULL,
    "request_type" "text" NOT NULL,
    "request_details" "text",
    "preparation_status" "public"."task_status" DEFAULT 'pending'::"public"."task_status" NOT NULL,
    "arrival_date" "date",
    "priority" "public"."priority_level" DEFAULT 'normal'::"public"."priority_level" NOT NULL,
    "assigned_to" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "location_id" "uuid",
    "assigned_member_ids" "uuid"[],
    "origin_type" "text",
    "created_by" "uuid",
    "checklists" "jsonb",
    "attachments" "uuid"[],
    "reminders" "uuid"[]
);

ALTER TABLE ONLY "public"."client_requests" REPLICA IDENTITY FULL;


ALTER TABLE "public"."client_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "task_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "comment_type" "public"."comment_type" DEFAULT 'comment'::"public"."comment_type" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."comments" REPLICA IDENTITY FULL;


ALTER TABLE "public"."comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."escalations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "uuid" NOT NULL,
    "escalated_to" "uuid",
    "escalated_by" "uuid" NOT NULL,
    "method" "public"."escalation_method" NOT NULL,
    "recipient_email" "text",
    "recipient_phone" "text",
    "message" "text" NOT NULL,
    "is_resolved" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."escalations" REPLICA IDENTITY FULL;


ALTER TABLE "public"."escalations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."follow_ups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "recipient" "text" NOT NULL,
    "follow_up_type" "text" NOT NULL,
    "notes" "text",
    "status" "public"."task_status" DEFAULT 'pending'::"public"."task_status" NOT NULL,
    "due_date" "date",
    "assigned_to" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "location_id" "uuid",
    "assigned_member_ids" "uuid"[],
    "origin_type" "text",
    "created_by" "uuid",
    "checklists" "jsonb",
    "attachments" "uuid"[],
    "reminders" "uuid"[]
);

ALTER TABLE ONLY "public"."follow_ups" REPLICA IDENTITY FULL;


ALTER TABLE "public"."follow_ups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."incidents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "incident_type" "text" NOT NULL,
    "priority" "public"."priority_level" DEFAULT 'normal'::"public"."priority_level" NOT NULL,
    "status" "public"."task_status" DEFAULT 'pending'::"public"."task_status" NOT NULL,
    "location" "text",
    "assigned_to" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "location_id" "uuid",
    "assigned_member_ids" "uuid"[],
    "origin_type" "text",
    "created_by" "uuid",
    "checklists" "jsonb",
    "attachments" "uuid"[],
    "reminders" "uuid"[]
);

ALTER TABLE ONLY "public"."incidents" REPLICA IDENTITY FULL;


ALTER TABLE "public"."incidents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."internal_tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "task_type" "text" NOT NULL,
    "priority" "public"."priority_level" DEFAULT 'normal'::"public"."priority_level" NOT NULL,
    "status" "public"."task_status" DEFAULT 'pending'::"public"."task_status" NOT NULL,
    "location" "text",
    "department" "text",
    "due_date" "date",
    "assigned_to" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "assigned_member_ids" "uuid"[],
    "origin_type" "text",
    "checklists" "jsonb",
    "attachments" "jsonb"[],
    "reminders" "jsonb"[],
    "location_id" "uuid",
    "created_by" "uuid" NOT NULL
);

ALTER TABLE ONLY "public"."internal_tasks" REPLICA IDENTITY FULL;


ALTER TABLE "public"."internal_tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."knowledge_queries" (
    "id" "uuid" DEFAULT "gen_random_uuid"(),
    "user_id" "uuid",
    "query_text" "text",
    "query_voice_url" "text",
    "response_text" "text",
    "response_sources" "text"[] DEFAULT '{}'::"text"[],
    "was_helpful" boolean,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."knowledge_queries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."locations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "floor" integer,
    "building" "text",
    "capacity" integer,
    "amenities" "jsonb" DEFAULT '[]'::"jsonb",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "location_code" "text",
    "location_type" "text",
    "display_name" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);

ALTER TABLE ONLY "public"."locations" REPLICA IDENTITY FULL;


ALTER TABLE "public"."locations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"(),
    "user_id" "uuid",
    "notification_type" "text",
    "title" "text",
    "body" "text",
    "priority" "text",
    "entity_type" "text",
    "entity_id" "uuid",
    "is_read" boolean DEFAULT false,
    "read_at" timestamp with time zone,
    "action_required" boolean DEFAULT false,
    "action_taken" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "first_name" "text",
    "last_name" "text",
    "role" "text",
    "hierarchy" "text" DEFAULT 'Normal'::"text",
    "staff_directory_id" "uuid",
    "permissions" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles_backup" (
    "id" "uuid",
    "first_name" "text",
    "last_name" "text",
    "email" "text",
    "avatar_url" "text",
    "role" "public"."user_role",
    "department" "text",
    "phone" "text",
    "is_active" boolean,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "job_role" "text",
    "hierarchy" "text",
    "job_title" "text",
    "full_name" "text",
    "service" "text"
);


ALTER TABLE "public"."profiles_backup" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."staff_directory" (
    "id" "uuid" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "email" "text",
    "avatar_url" "text",
    "role" "public"."user_role" NOT NULL,
    "department" "text",
    "phone" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "hierarchy" "text",
    "job_title" "text",
    "full_name" "text",
    "service" "text",
    "auth_user_id" "uuid",
    CONSTRAINT "check_hierarchy" CHECK (("hierarchy" = ANY (ARRAY['Normal'::"text", 'Manager'::"text", 'Director'::"text"])))
);

ALTER TABLE ONLY "public"."staff_directory" REPLICA IDENTITY FULL;


ALTER TABLE "public"."staff_directory" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."profiles_ordered" AS
 SELECT "id",
    "email",
    "phone",
    "first_name",
    "last_name",
    "job_title",
    "role",
    "department",
    "avatar_url",
    "hierarchy",
    "is_active",
    "created_at",
    "updated_at"
   FROM "public"."staff_directory";


ALTER VIEW "public"."profiles_ordered" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reminders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text",
    "reminder_time" timestamp with time zone NOT NULL,
    "frequency" "public"."reminder_frequency" DEFAULT 'once'::"public"."reminder_frequency" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "schedule_type" "text",
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone,
    "start_time" time with time zone,
    "end_time" time with time zone,
    "recurrence_interval" integer DEFAULT 1,
    "recurrence_unit" "text" DEFAULT 'week'::"text",
    "recurrence_days" "text"[],
    "recurrence_end_type" "text" DEFAULT 'never'::"text",
    "recurrence_end_date" timestamp with time zone,
    "recurrence_occurrences" integer,
    "remind_at" timestamp with time zone,
    "priority" integer,
    "status" "text",
    "snooze_duration" integer
);

ALTER TABLE ONLY "public"."reminders" REPLICA IDENTITY FULL;


ALTER TABLE "public"."reminders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shift_handovers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "from_shift_id" "uuid" NOT NULL,
    "to_shift_id" "uuid",
    "handover_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "additional_notes" "text",
    "voice_notes_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."shift_handovers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shifts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "start_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    "end_time" timestamp with time zone,
    "status" "public"."shift_status" DEFAULT 'active'::"public"."shift_status" NOT NULL,
    "voice_note_url" "text",
    "voice_note_transcription" "text",
    "handover_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "receptionist_id" "uuid",
    "shift_type" "text",
    "voice_handover_url" "text"
);

ALTER TABLE ONLY "public"."shifts" REPLICA IDENTITY FULL;


ALTER TABLE "public"."shifts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"(),
    "event_type" "text",
    "payload" "jsonb",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."system_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "origin_type" "text",
    "assigned_to" "uuid"[] DEFAULT '{}'::"uuid"[],
    "created_by" "uuid",
    "location" "text",
    "location_id" "uuid",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "reminder_date" timestamp with time zone,
    "reminder_sent_at" timestamp with time zone,
    "escalation_date" timestamp with time zone,
    "escalated_at" timestamp with time zone,
    "escalation_channel" "text",
    "requires_validation" boolean DEFAULT true,
    "current_receptionist_id" "uuid",
    "validation_status" "text",
    "validation_deadline" timestamp with time zone,
    "checklist_items" "jsonb" DEFAULT '[]'::"jsonb",
    "attachment_url" "text",
    "voice_note_url" "text",
    "voice_transcript" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "collaborators" "jsonb",
    "reminder_id" "uuid",
    "updated_by" "uuid",
    "category" "public"."task_category",
    "priority" "public"."priority_level",
    "service" "public"."task_service",
    CONSTRAINT "valid_status" CHECK (("status" = ANY (ARRAY['pending'::"text", 'in_progress'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."task" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "uuid",
    "user_id" "uuid" DEFAULT "auth"."uid"(),
    "comment_text" "text",
    "voice_recording_id" "uuid",
    "is_internal" boolean DEFAULT true,
    "mentioned_users" "uuid"[] DEFAULT '{}'::"uuid"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "content" "text"
);


ALTER TABLE "public"."task_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'assignee'::"text",
    "added_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."task_members" REPLICA IDENTITY FULL;


ALTER TABLE "public"."task_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_updates" (
    "id" "uuid" DEFAULT "gen_random_uuid"(),
    "task_id" "uuid",
    "user_id" "uuid",
    "update_type" "text",
    "previous_values" "jsonb",
    "new_values" "jsonb",
    "voice_recording_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."task_updates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "full_name" "text",
    "role" "text" DEFAULT 'receptionist'::"text",
    "shift_type" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "permissions" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles_backup" (
    "id" "uuid",
    "email" "text",
    "full_name" "text",
    "role" "text",
    "shift_type" "text",
    "is_active" boolean,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "permissions" "jsonb"
);


ALTER TABLE "public"."user_profiles_backup" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_relationships" (
    "id" "uuid" DEFAULT "gen_random_uuid"(),
    "user_id" "uuid",
    "related_user_id" "uuid",
    "relationship_type" "text",
    "is_active" boolean DEFAULT true,
    "valid_from" timestamp with time zone DEFAULT "now"(),
    "valid_until" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."user_relationships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."voice_recordings" (
    "id" "uuid" DEFAULT "gen_random_uuid"(),
    "user_id" "uuid",
    "context" "text",
    "audio_url" "text",
    "duration_seconds" integer,
    "transcription_status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."voice_recordings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."voice_transcriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"(),
    "recording_id" "uuid",
    "transcribed_text" "text",
    "ai_analysis" "jsonb",
    "tasks_created" "uuid"[] DEFAULT '{}'::"uuid"[],
    "confidence_score" numeric,
    "processing_time_ms" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."voice_transcriptions" OWNER TO "postgres";


ALTER TABLE ONLY "public"."activity_logs"
    ADD CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attachments"
    ADD CONSTRAINT "attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."checklists"
    ADD CONSTRAINT "checklists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."client_requests"
    ADD CONSTRAINT "client_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."escalations"
    ADD CONSTRAINT "escalations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."follow_ups"
    ADD CONSTRAINT "follow_ups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."incidents"
    ADD CONSTRAINT "incidents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."internal_tasks"
    ADD CONSTRAINT "internal_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."staff_directory"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey1" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reminders"
    ADD CONSTRAINT "reminders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shifts"
    ADD CONSTRAINT "shifts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_comments"
    ADD CONSTRAINT "task_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_members"
    ADD CONSTRAINT "task_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task"
    ADD CONSTRAINT "task_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_activity_logs_entity" ON "public"."activity_logs" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_activity_logs_user" ON "public"."activity_logs" USING "btree" ("user_id");



CREATE INDEX "idx_checklists_reminder_id" ON "public"."checklists" USING "btree" ("reminder_id");



CREATE INDEX "idx_reminders_remind_at" ON "public"."reminders" USING "btree" ("remind_at");



CREATE INDEX "idx_shift_handovers_from_shift" ON "public"."shift_handovers" USING "btree" ("from_shift_id");



CREATE INDEX "idx_shift_handovers_pending" ON "public"."shift_handovers" USING "btree" ("created_at") WHERE ("to_shift_id" IS NULL);



CREATE INDEX "idx_shift_handovers_to_shift" ON "public"."shift_handovers" USING "btree" ("to_shift_id");



CREATE INDEX "idx_task_comments_task_id" ON "public"."task_comments" USING "btree" ("task_id");



CREATE INDEX "idx_task_comments_user_id" ON "public"."task_comments" USING "btree" ("user_id");



CREATE INDEX "idx_task_created_by" ON "public"."task" USING "btree" ("created_by");



CREATE INDEX "idx_task_location_id" ON "public"."task" USING "btree" ("location_id");



CREATE INDEX "idx_task_status" ON "public"."task" USING "btree" ("status");



CREATE OR REPLACE TRIGGER "trg_log_reminder_update" AFTER UPDATE ON "public"."reminders" FOR EACH ROW EXECUTE FUNCTION "public"."log_reminder_update"();



CREATE OR REPLACE TRIGGER "trg_log_task_comment_insert" AFTER INSERT ON "public"."task_comments" FOR EACH ROW EXECUTE FUNCTION "public"."log_task_comment_insert"();



CREATE OR REPLACE TRIGGER "trg_log_task_status_update" AFTER UPDATE ON "public"."task" FOR EACH ROW EXECUTE FUNCTION "public"."log_task_status_update"();



CREATE OR REPLACE TRIGGER "update_checklists_updated_at" BEFORE UPDATE ON "public"."checklists" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_client_requests_updated_at" BEFORE UPDATE ON "public"."client_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_comments_updated_at" BEFORE UPDATE ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_escalations_updated_at" BEFORE UPDATE ON "public"."escalations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_follow_ups_updated_at" BEFORE UPDATE ON "public"."follow_ups" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_incidents_updated_at" BEFORE UPDATE ON "public"."incidents" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_internal_tasks_updated_at" BEFORE UPDATE ON "public"."internal_tasks" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_locations_updated_at" BEFORE UPDATE ON "public"."locations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."staff_directory" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_reminders_updated_at" BEFORE UPDATE ON "public"."reminders" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_shift_handovers_updated_at" BEFORE UPDATE ON "public"."shift_handovers" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_shifts_updated_at" BEFORE UPDATE ON "public"."shifts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_task_updated_at" BEFORE UPDATE ON "public"."task" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."activity_logs"
    ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."staff_directory"("id");



ALTER TABLE ONLY "public"."attachments"
    ADD CONSTRAINT "attachments_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."staff_directory"("id");



ALTER TABLE ONLY "public"."checklists"
    ADD CONSTRAINT "checklists_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."staff_directory"("id");



ALTER TABLE ONLY "public"."checklists"
    ADD CONSTRAINT "checklists_reminder_id_fkey" FOREIGN KEY ("reminder_id") REFERENCES "public"."reminders"("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."staff_directory"("id");



ALTER TABLE ONLY "public"."escalations"
    ADD CONSTRAINT "escalations_escalated_by_fkey" FOREIGN KEY ("escalated_by") REFERENCES "public"."staff_directory"("id");



ALTER TABLE ONLY "public"."escalations"
    ADD CONSTRAINT "escalations_escalated_to_fkey" FOREIGN KEY ("escalated_to") REFERENCES "public"."staff_directory"("id");



ALTER TABLE ONLY "public"."incidents"
    ADD CONSTRAINT "incidents_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."staff_directory"("id");



ALTER TABLE ONLY "public"."incidents"
    ADD CONSTRAINT "incidents_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_staff_directory_id_fkey" FOREIGN KEY ("staff_directory_id") REFERENCES "public"."staff_directory"("id");



ALTER TABLE ONLY "public"."reminders"
    ADD CONSTRAINT "reminders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."staff_directory"("id");



ALTER TABLE ONLY "public"."shift_handovers"
    ADD CONSTRAINT "shift_handovers_from_shift_id_fkey" FOREIGN KEY ("from_shift_id") REFERENCES "public"."shifts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shift_handovers"
    ADD CONSTRAINT "shift_handovers_to_shift_id_fkey" FOREIGN KEY ("to_shift_id") REFERENCES "public"."shifts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."shifts"
    ADD CONSTRAINT "shifts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."staff_directory"("id");



ALTER TABLE ONLY "public"."staff_directory"
    ADD CONSTRAINT "staff_directory_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."task_members"
    ADD CONSTRAINT "task_members_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "public"."staff_directory"("id");



ALTER TABLE ONLY "public"."task_members"
    ADD CONSTRAINT "task_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."staff_directory"("id");



ALTER TABLE ONLY "public"."task"
    ADD CONSTRAINT "task_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



CREATE POLICY "Allow authenticated users to create handovers" ON "public"."shift_handovers" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated users to read handovers" ON "public"."shift_handovers" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated users to update handovers" ON "public"."shift_handovers" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow public access to attachments" ON "public"."attachments" USING (true);



CREATE POLICY "Allow public access to checklists" ON "public"."checklists" USING (true);



CREATE POLICY "Allow public access to client_requests" ON "public"."client_requests" USING (true);



CREATE POLICY "Allow public access to comments" ON "public"."comments" USING (true);



CREATE POLICY "Allow public access to escalations" ON "public"."escalations" USING (true);



CREATE POLICY "Allow public access to follow_ups" ON "public"."follow_ups" USING (true);



CREATE POLICY "Allow public access to incidents" ON "public"."incidents" USING (true);



CREATE POLICY "Allow public access to internal_tasks" ON "public"."internal_tasks" USING (true);



CREATE POLICY "Allow public access to locations" ON "public"."locations" USING (true);



CREATE POLICY "Allow public access to profiles" ON "public"."staff_directory" USING (true);



CREATE POLICY "Allow public access to reminders" ON "public"."reminders" USING (true);



CREATE POLICY "Allow public access to shifts" ON "public"."shifts" USING (true);



CREATE POLICY "Allow public access to task_members" ON "public"."task_members" USING (true);



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."activity_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."attachments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."checklists" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."client_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."escalations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."follow_ups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."incidents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."internal_tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."locations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "logs_insert_from_auth" ON "public"."activity_logs" FOR INSERT TO "authenticated" WITH CHECK (true);



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reminders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shift_handovers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shifts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."staff_directory" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."task_comments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "task_comments_insert_auth" ON "public"."task_comments" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "task_comments_select_auth" ON "public"."task_comments" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."task_members" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_handovers"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_handovers"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_handovers"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_context"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_context"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_context"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_reminder_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_reminder_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_reminder_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_task_comment_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_task_comment_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_task_comment_insert"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_task_status_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_task_status_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_task_status_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON TABLE "public"."activity_logs" TO "anon";
GRANT ALL ON TABLE "public"."activity_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_logs" TO "service_role";



GRANT ALL ON TABLE "public"."attachments" TO "anon";
GRANT ALL ON TABLE "public"."attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."attachments" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."checklists" TO "anon";
GRANT ALL ON TABLE "public"."checklists" TO "authenticated";
GRANT ALL ON TABLE "public"."checklists" TO "service_role";



GRANT ALL ON TABLE "public"."client_requests" TO "anon";
GRANT ALL ON TABLE "public"."client_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."client_requests" TO "service_role";



GRANT ALL ON TABLE "public"."comments" TO "anon";
GRANT ALL ON TABLE "public"."comments" TO "authenticated";
GRANT ALL ON TABLE "public"."comments" TO "service_role";



GRANT ALL ON TABLE "public"."escalations" TO "anon";
GRANT ALL ON TABLE "public"."escalations" TO "authenticated";
GRANT ALL ON TABLE "public"."escalations" TO "service_role";



GRANT ALL ON TABLE "public"."follow_ups" TO "anon";
GRANT ALL ON TABLE "public"."follow_ups" TO "authenticated";
GRANT ALL ON TABLE "public"."follow_ups" TO "service_role";



GRANT ALL ON TABLE "public"."incidents" TO "anon";
GRANT ALL ON TABLE "public"."incidents" TO "authenticated";
GRANT ALL ON TABLE "public"."incidents" TO "service_role";



GRANT ALL ON TABLE "public"."internal_tasks" TO "anon";
GRANT ALL ON TABLE "public"."internal_tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."internal_tasks" TO "service_role";



GRANT ALL ON TABLE "public"."knowledge_queries" TO "anon";
GRANT ALL ON TABLE "public"."knowledge_queries" TO "authenticated";
GRANT ALL ON TABLE "public"."knowledge_queries" TO "service_role";



GRANT ALL ON TABLE "public"."locations" TO "anon";
GRANT ALL ON TABLE "public"."locations" TO "authenticated";
GRANT ALL ON TABLE "public"."locations" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."profiles_backup" TO "anon";
GRANT ALL ON TABLE "public"."profiles_backup" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles_backup" TO "service_role";



GRANT ALL ON TABLE "public"."staff_directory" TO "anon";
GRANT ALL ON TABLE "public"."staff_directory" TO "authenticated";
GRANT ALL ON TABLE "public"."staff_directory" TO "service_role";



GRANT ALL ON TABLE "public"."profiles_ordered" TO "anon";
GRANT ALL ON TABLE "public"."profiles_ordered" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles_ordered" TO "service_role";



GRANT ALL ON TABLE "public"."reminders" TO "anon";
GRANT ALL ON TABLE "public"."reminders" TO "authenticated";
GRANT ALL ON TABLE "public"."reminders" TO "service_role";



GRANT ALL ON TABLE "public"."shift_handovers" TO "anon";
GRANT ALL ON TABLE "public"."shift_handovers" TO "authenticated";
GRANT ALL ON TABLE "public"."shift_handovers" TO "service_role";



GRANT ALL ON TABLE "public"."shifts" TO "anon";
GRANT ALL ON TABLE "public"."shifts" TO "authenticated";
GRANT ALL ON TABLE "public"."shifts" TO "service_role";



GRANT ALL ON TABLE "public"."system_events" TO "anon";
GRANT ALL ON TABLE "public"."system_events" TO "authenticated";
GRANT ALL ON TABLE "public"."system_events" TO "service_role";



GRANT ALL ON TABLE "public"."task" TO "anon";
GRANT ALL ON TABLE "public"."task" TO "authenticated";
GRANT ALL ON TABLE "public"."task" TO "service_role";



GRANT ALL ON TABLE "public"."task_comments" TO "anon";
GRANT ALL ON TABLE "public"."task_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."task_comments" TO "service_role";



GRANT ALL ON TABLE "public"."task_members" TO "anon";
GRANT ALL ON TABLE "public"."task_members" TO "authenticated";
GRANT ALL ON TABLE "public"."task_members" TO "service_role";



GRANT ALL ON TABLE "public"."task_updates" TO "anon";
GRANT ALL ON TABLE "public"."task_updates" TO "authenticated";
GRANT ALL ON TABLE "public"."task_updates" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles_backup" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles_backup" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles_backup" TO "service_role";



GRANT ALL ON TABLE "public"."user_relationships" TO "anon";
GRANT ALL ON TABLE "public"."user_relationships" TO "authenticated";
GRANT ALL ON TABLE "public"."user_relationships" TO "service_role";



GRANT ALL ON TABLE "public"."voice_recordings" TO "anon";
GRANT ALL ON TABLE "public"."voice_recordings" TO "authenticated";
GRANT ALL ON TABLE "public"."voice_recordings" TO "service_role";



GRANT ALL ON TABLE "public"."voice_transcriptions" TO "anon";
GRANT ALL ON TABLE "public"."voice_transcriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."voice_transcriptions" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






RESET ALL;

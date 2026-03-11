-- ============================================================
-- NOTIFICATIONS SYSTEM — TRIGGERS & RLS
-- Tables sources : task, task_comments, training_assignments
-- Table cible   : public.notifications
-- ============================================================

-- ------------------------------------------------------------
-- 1. RLS POLICIES sur notifications
-- ------------------------------------------------------------

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Lecture : chacun voit uniquement ses propres notifications
CREATE POLICY "notifications_select_own"
  ON public.notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- Mise à jour : chacun peut marquer ses notifs comme lues
CREATE POLICY "notifications_update_own"
  ON public.notifications
  FOR UPDATE
  USING (user_id = auth.uid());

-- Insertion : autorisée sans restriction (triggers SECURITY DEFINER)
CREATE POLICY "notifications_insert_open"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);


-- ------------------------------------------------------------
-- 2. TRIGGER — Nouvelle tâche assignée (table task)
-- Cas A : assigned_to[] contient des staff_directory.id
-- Cas B : service renseigné sans assigned_to → tout le service
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_notify_task_assigned()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_assignee_sd_id   uuid;
  v_auth_user_id     uuid;
  v_notification_type text;
BEGIN
  -- Déterminer le type de notification selon la catégorie de tâche
  v_notification_type := CASE NEW.category::text
    WHEN 'training'        THEN 'training_assigned'
    WHEN 'quiz'            THEN 'quiz_assigned'
    WHEN 'incident'        THEN 'task_assigned'
    WHEN 'client_request'  THEN 'task_assigned'
    WHEN 'follow_up'       THEN 'task_assigned'
    WHEN 'internal_task'   THEN 'task_assigned'
    ELSE 'task_assigned'
  END;

  -- CAS A : assigned_to[] renseigné → notifier chaque assigné
  IF NEW.assigned_to IS NOT NULL AND array_length(NEW.assigned_to, 1) > 0 THEN
    FOREACH v_assignee_sd_id IN ARRAY NEW.assigned_to LOOP
      -- Résoudre auth_user_id depuis staff_directory
      SELECT auth_user_id INTO v_auth_user_id
        FROM public.staff_directory
       WHERE id = v_assignee_sd_id
         AND auth_user_id IS NOT NULL
         AND is_active = true;

      IF v_auth_user_id IS NOT NULL THEN
        -- Ne pas notifier si l'assigné est aussi le créateur
        IF v_auth_user_id != COALESCE(NEW.created_by, '00000000-0000-0000-0000-000000000000') THEN
          INSERT INTO public.notifications (
            user_id, notification_type, title, body,
            priority, entity_type, entity_id,
            is_read, action_required, created_at
          ) VALUES (
            v_auth_user_id,
            v_notification_type,
            CASE NEW.category::text
              WHEN 'training'       THEN '📚 Nouvelle formation assignée'
              WHEN 'quiz'           THEN '📋 Nouveau QCM assigné'
              ELSE '✅ Nouvelle tâche assignée'
            END,
            COALESCE(NEW.title, 'Sans titre'),
            COALESCE(NEW.priority::text, 'medium'),
            'task',
            NEW.id,
            false,
            CASE NEW.category::text
              WHEN 'training' THEN true
              WHEN 'quiz'     THEN true
              ELSE false
            END,
            now()
          );
        END IF;
      END IF;
    END LOOP;

  -- CAS B : service renseigné, pas d'assigné individuel → tout le service actif
  ELSIF NEW.service IS NOT NULL AND (NEW.assigned_to IS NULL OR array_length(NEW.assigned_to, 1) = 0) THEN
    FOR v_auth_user_id IN
      SELECT sd.auth_user_id
        FROM public.staff_directory sd
       WHERE sd.service = NEW.service::text
         AND sd.is_active = true
         AND sd.auth_user_id IS NOT NULL
         AND sd.auth_user_id != COALESCE(NEW.created_by, '00000000-0000-0000-0000-000000000000')
    LOOP
      INSERT INTO public.notifications (
        user_id, notification_type, title, body,
        priority, entity_type, entity_id,
        is_read, action_required, created_at
      ) VALUES (
        v_auth_user_id,
        v_notification_type,
        '✅ Nouvelle tâche pour votre service',
        COALESCE(NEW.title, 'Sans titre'),
        COALESCE(NEW.priority::text, 'medium'),
        'task',
        NEW.id,
        false,
        false,
        now()
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_task_assigned
  AFTER INSERT ON public.task
  FOR EACH ROW
  EXECUTE FUNCTION fn_notify_task_assigned();


-- ------------------------------------------------------------
-- 3. TRIGGER — Nouveau commentaire (table task_comments)
-- Notifie : created_by de la tâche + assigned_to[]
-- Exclut  : le commentateur lui-même
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_notify_task_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_task              record;
  v_assignee_sd_id    uuid;
  v_auth_user_id      uuid;
  v_notified_users    uuid[] := '{}';
  v_task_title        text;
BEGIN
  -- Récupérer la tâche concernée
  SELECT id, title, created_by, assigned_to, service
    INTO v_task
    FROM public.task
   WHERE id = NEW.task_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  v_task_title := COALESCE(v_task.title, 'une tâche');

  -- Notifier le créateur de la tâche (si différent du commentateur)
  IF v_task.created_by IS NOT NULL AND v_task.created_by != NEW.user_id THEN
    INSERT INTO public.notifications (
      user_id, notification_type, title, body,
      priority, entity_type, entity_id,
      is_read, action_required, created_at
    ) VALUES (
      v_task.created_by,
      'task_comment',
      '💬 Nouveau commentaire',
      'Un commentaire a été ajouté sur : ' || v_task_title,
      'low',
      'task',
      v_task.id,
      false,
      false,
      now()
    );
    v_notified_users := array_append(v_notified_users, v_task.created_by);
  END IF;

  -- Notifier chaque membre de assigned_to[] (sauf commentateur et déjà notifiés)
  IF v_task.assigned_to IS NOT NULL AND array_length(v_task.assigned_to, 1) > 0 THEN
    FOREACH v_assignee_sd_id IN ARRAY v_task.assigned_to LOOP
      SELECT auth_user_id INTO v_auth_user_id
        FROM public.staff_directory
       WHERE id = v_assignee_sd_id
         AND auth_user_id IS NOT NULL
         AND is_active = true;

      IF v_auth_user_id IS NOT NULL
         AND v_auth_user_id != NEW.user_id
         AND NOT (v_auth_user_id = ANY(v_notified_users)) THEN
        INSERT INTO public.notifications (
          user_id, notification_type, title, body,
          priority, entity_type, entity_id,
          is_read, action_required, created_at
        ) VALUES (
          v_auth_user_id,
          'task_comment',
          '💬 Nouveau commentaire',
          'Un commentaire a été ajouté sur : ' || v_task_title,
          'low',
          'task',
          v_task.id,
          false,
          false,
          now()
        );
        v_notified_users := array_append(v_notified_users, v_auth_user_id);
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_task_comment
  AFTER INSERT ON public.task_comments
  FOR EACH ROW
  EXECUTE FUNCTION fn_notify_task_comment();


-- ------------------------------------------------------------
-- 4. TRIGGER — Formation assignée (table training_assignments)
-- assigned_to (staff_directory.id) → notif individuelle
-- service sans assigned_to → tout le service actif
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_notify_training_assigned()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_auth_user_id uuid;
BEGIN
  -- CAS A : assigné à un individu
  IF NEW.assigned_to IS NOT NULL THEN
    SELECT auth_user_id INTO v_auth_user_id
      FROM public.staff_directory
     WHERE id = NEW.assigned_to
       AND auth_user_id IS NOT NULL
       AND is_active = true;

    IF v_auth_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (
        user_id, notification_type, title, body,
        priority, entity_type, entity_id,
        is_read, action_required, created_at
      ) VALUES (
        v_auth_user_id,
        'training_assigned',
        '📚 Nouvelle formation assignée',
        COALESCE(NEW.program_name, 'Un programme de formation vous a été assigné'),
        'medium',
        'training_assignment',
        NEW.id,
        false,
        true,
        now()
      );
    END IF;

  -- CAS B : assigné à un service entier
  ELSIF NEW.service IS NOT NULL THEN
    FOR v_auth_user_id IN
      SELECT sd.auth_user_id
        FROM public.staff_directory sd
       WHERE sd.service = NEW.service
         AND sd.is_active = true
         AND sd.auth_user_id IS NOT NULL
    LOOP
      INSERT INTO public.notifications (
        user_id, notification_type, title, body,
        priority, entity_type, entity_id,
        is_read, action_required, created_at
      ) VALUES (
        v_auth_user_id,
        'training_assigned',
        '📚 Nouvelle formation assignée',
        COALESCE(NEW.program_name, 'Un programme de formation a été assigné à votre service'),
        'medium',
        'training_assignment',
        NEW.id,
        false,
        true,
        now()
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_training_assigned
  AFTER INSERT ON public.training_assignments
  FOR EACH ROW
  EXECUTE FUNCTION fn_notify_training_assigned();

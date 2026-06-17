-- ------------------------------------------------------------
-- Notifications : marquer "lu" automatiquement quand la tâche est archivée
-- ------------------------------------------------------------
-- Contexte : une notif task_assigned/task_comment reste "non lue" même après
--   que la tâche a été archivée (close). Résultat : la cloche se remplit de
--   notifs pointant vers des tâches archivées (170 non lues constatées), et
--   cliquer dessus ouvre une carte qui "ne ressort nulle part".
--
-- Choix : on NE supprime PAS (non destructif) — on marque ces notifs comme
--   lues. Elles quittent la liste des non lues mais restent dans l'historique.
-- ------------------------------------------------------------

-- 1. Fonction trigger : à l'archivage d'une tâche, marquer ses notifs comme lues
CREATE OR REPLACE FUNCTION public.fn_mark_notifications_read_on_task_archive()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = true, read_at = now()
  WHERE entity_type = 'task'
    AND entity_id = NEW.id
    AND is_read = false;
  RETURN NEW;
END;
$$;

-- 2. Trigger : uniquement à la transition vers 'archived'
DROP TRIGGER IF EXISTS trg_mark_notifications_read_on_task_archive ON public.task;
CREATE TRIGGER trg_mark_notifications_read_on_task_archive
  AFTER UPDATE OF status ON public.task
  FOR EACH ROW
  WHEN (NEW.status = 'archived' AND OLD.status IS DISTINCT FROM 'archived')
  EXECUTE FUNCTION public.fn_mark_notifications_read_on_task_archive();

-- 3. Backfill : marquer lues les notifs existantes liées à des tâches archivées
UPDATE public.notifications n
SET is_read = true, read_at = now()
FROM public.task t
WHERE n.entity_id = t.id
  AND n.entity_type = 'task'
  AND t.status = 'archived'
  AND n.is_read = false;

-- ------------------------------------------------------------
-- FIX — notifications : impossibilité de marquer une notif "lue"
-- ------------------------------------------------------------
-- Symptôme : l'état "lu" (is_read=true) ne persistait jamais ; au reload
--            les notifications réapparaissaient comme non lues.
--
-- Cause racine : la table public.notifications est publiée dans la
--   publication "supabase_realtime" (utilisée par le hook front pour les
--   postgres_changes). Or une table publiée qui diffuse les UPDATE doit
--   posséder une "replica identity". La table n'avait AUCUNE clé primaire
--   (colonne id sans contrainte PK) → pas de replica identity → Postgres
--   rejetait tout UPDATE avec SQLSTATE 55000 :
--     "cannot update table ... because it does not have a replica identity
--      and publishes updates".
--   Les INSERT et SELECT fonctionnaient, d'où l'illusion d'un système OK.
--
-- Correctif : ajouter la clé primaire manquante sur id (déjà unique et
--   non-null sur les 261 lignes existantes). Avec relreplident='d', la PK
--   devient automatiquement la replica identity → les UPDATE passent et le
--   Realtime identifie correctement les lignes.
-- ------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.notifications'::regclass AND contype = 'p'
  ) THEN
    ALTER TABLE public.notifications
      ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);
  END IF;
END $$;

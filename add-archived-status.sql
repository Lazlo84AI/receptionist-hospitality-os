-- =====================================================
-- MIGRATION: Ajouter le statut 'archived' à task_status
-- À exécuter dans l'éditeur SQL de Supabase
-- =====================================================

-- Ajouter 'archived' à l'enum task_status
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'archived';

-- Vérification: Afficher les valeurs de l'enum
SELECT unnest(enum_range(NULL::task_status)) AS task_status_values;

-- Message de confirmation
DO $$ 
BEGIN
  RAISE NOTICE '✅ Le statut "archived" a été ajouté à task_status';
  RAISE NOTICE '📋 Valeurs disponibles: pending, in_progress, completed, cancelled, archived';
END $$;
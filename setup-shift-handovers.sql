-- Vérification et adaptation de la table shift_handovers pour le Shift Continuity Manager

-- 1. Vérifier la structure actuelle
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'shift_handovers' 
AND table_schema = 'public';

-- 2. Si la table n'existe pas, la créer
CREATE TABLE IF NOT EXISTS public.shift_handovers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    from_shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
    to_shift_id UUID REFERENCES public.shifts(id) ON DELETE SET NULL,
    handover_data JSONB NOT NULL DEFAULT '{}',
    additional_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Index pour les performances
CREATE INDEX IF NOT EXISTS idx_shift_handovers_from_shift ON public.shift_handovers(from_shift_id);
CREATE INDEX IF NOT EXISTS idx_shift_handovers_to_shift ON public.shift_handovers(to_shift_id);
CREATE INDEX IF NOT EXISTS idx_shift_handovers_pending ON public.shift_handovers(created_at) WHERE to_shift_id IS NULL;

-- 4. RLS Policy pour la sécurité
ALTER TABLE public.shift_handovers ENABLE ROW LEVEL SECURITY;

-- Policy pour permettre la lecture des handovers
DROP POLICY IF EXISTS "Allow authenticated users to read handovers" ON public.shift_handovers;
CREATE POLICY "Allow authenticated users to read handovers" ON public.shift_handovers
FOR SELECT USING (auth.role() = 'authenticated');

-- Policy pour permettre l'insertion de handovers
DROP POLICY IF EXISTS "Allow authenticated users to create handovers" ON public.shift_handovers;
CREATE POLICY "Allow authenticated users to create handovers" ON public.shift_handovers
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy pour permettre la mise à jour (finalisation du handover)
DROP POLICY IF EXISTS "Allow authenticated users to update handovers" ON public.shift_handovers;
CREATE POLICY "Allow authenticated users to update handovers" ON public.shift_handovers
FOR UPDATE USING (auth.role() = 'authenticated');

-- 5. Fonction pour nettoyer les anciens handovers (optionnel)
CREATE OR REPLACE FUNCTION cleanup_old_handovers()
RETURNS void AS $$
BEGIN
    -- Supprimer les handovers de plus de 30 jours
    DELETE FROM public.shift_handovers 
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- 6. Test de la structure avec des données d'exemple (à supprimer après test)
-- Insérer un handover de test pour vérifier la structure
INSERT INTO public.shift_handovers (
    from_shift_id,
    to_shift_id,
    handover_data,
    additional_notes
) VALUES (
    (SELECT id FROM public.shifts ORDER BY created_at DESC LIMIT 1), -- Dernier shift
    NULL, -- En attente
    '{
        "timestamp": "2025-09-11T19:00:00Z",
        "voice_note_url": null,
        "voice_transcription": "Test handover",
        "total_tasks_count": 3,
        "tasks_by_status": {
            "pending": [],
            "in_progress": [],
            "completed": [],
            "resolved": []
        },
        "tasks_by_type": {
            "incident": [],
            "client_request": [],
            "follow_up": [],
            "internal_task": []
        },
        "all_tasks": [
            {
                "id": "test-1",
                "type": "incident",
                "status": "pending",
                "title": "Test incident",
                "assignedTo": null,
                "createdBy": "5b9b3e41-80ff-40d1-989c-cfbaf7d73c8e",
                "priority": "urgent"
            },
            {
                "id": "test-2", 
                "type": "client_request",
                "status": "in_progress",
                "title": "Test client request",
                "assignedTo": null,
                "createdBy": "ff01d346-2215-40c6-a00c-baec20e0b019",
                "priority": "normal"
            },
            {
                "id": "test-3",
                "type": "follow_up",
                "status": "pending", 
                "title": "Test follow-up assigné",
                "assignedTo": "5b9b3e41-80ff-40d1-989c-cfbaf7d73c8e",
                "createdBy": "ff01d346-2215-40c6-a00c-baec20e0b019",
                "priority": "normal"
            },
            {
                "id": "test-4",
                "type": "internal_task",
                "status": "pending", 
                "title": "Test tâche créée par moi",
                "assignedTo": "ff01d346-2215-40c6-a00c-baec20e0b019",
                "createdBy": "5b9b3e41-80ff-40d1-989c-cfbaf7d73c8e",
                "priority": "normal"
            },
            {
                "id": "test-5",
                "type": "follow_up",
                "status": "completed", 
                "title": "Test follow-up résolu",
                "assignedTo": "5b9b3e41-80ff-40d1-989c-cfbaf7d73c8e",
                "createdBy": "5b9b3e41-80ff-40d1-989c-cfbaf7d73c8e",
                "priority": "normal"
            }
        ]
    }',
    'Handover de test pour validation du système'
);

-- 7. Vérifier que l'insertion a fonctionné
SELECT 
    id,
    from_shift_id,
    to_shift_id,
    handover_data->>'total_tasks_count' as task_count,
    handover_data->'all_tasks'->0->>'title' as first_task_title,
    additional_notes,
    created_at
FROM public.shift_handovers 
ORDER BY created_at DESC 
LIMIT 5;
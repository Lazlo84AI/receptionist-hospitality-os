-- Table pour stocker les cartes de shift (snapshot des tâches à la fin du shift)
CREATE TABLE public.shift_tasks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
    task_id UUID NOT NULL, -- Référence vers internal_tasks ou autres
    task_data JSONB NOT NULL, -- Snapshot complet de la carte au moment du shift
    task_status TEXT NOT NULL, -- pending, in_progress, completed au moment du shift
    notes TEXT, -- Notes ajoutées pendant la review du shift
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour récupérer rapidement les cartes d'un shift
CREATE INDEX idx_shift_tasks_shift_id ON public.shift_tasks(shift_id);
CREATE INDEX idx_shift_tasks_task_id ON public.shift_tasks(task_id);
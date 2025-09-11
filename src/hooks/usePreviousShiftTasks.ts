// Hook pour récupérer les cartes du shift précédent
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ShiftTaskData {
  id: string;
  shift_id: string;
  task_id: string;
  task_data: any; // JSON parsé de la carte complète
  task_status: string;
  notes: string | null;
  reviewed_at: string;
  created_at: string;
}

export interface PreviousShiftData {
  shift: {
    id: string;
    user_id: string;
    end_time: string;
    voice_note_url: string | null;
    voice_note_transcription: string | null;
    handover_notes: string | null;
  };
  tasks: ShiftTaskData[];
  taskCount: number;
}

export const usePreviousShiftTasks = () => {
  const [data, setData] = useState<PreviousShiftData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPreviousShiftTasks();
  }, []);

  const fetchPreviousShiftTasks = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Récupérer le shift le plus récent terminé
      const { data: latestShift, error: shiftError } = await supabase
        .from('shifts')
        .select('*')
        .eq('status', 'completed')
        .order('end_time', { ascending: false })
        .limit(1)
        .single();

      if (shiftError) {
        if (shiftError.code === 'PGRST116') {
          // Aucun shift trouvé
          setData(null);
          return;
        }
        throw shiftError;
      }

      // 2. Récupérer toutes les cartes de ce shift
      const { data: shiftTasks, error: tasksError } = await supabase
        .from('shift_tasks')
        .select('*')
        .eq('shift_id', latestShift.id)
        .order('created_at', { ascending: true });

      if (tasksError) throw tasksError;

      // 3. Parser les données JSON des cartes
      const tasksWithParsedData = shiftTasks.map(task => ({
        ...task,
        task_data: JSON.parse(task.task_data)
      }));

      setData({
        shift: latestShift,
        tasks: tasksWithParsedData,
        taskCount: tasksWithParsedData.length
      });

    } catch (err: any) {
      console.error('Erreur récupération shift précédent:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { 
    data, 
    loading, 
    error, 
    refetch: fetchPreviousShiftTasks 
  };
};
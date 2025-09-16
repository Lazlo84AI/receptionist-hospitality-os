import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import getReminders from '@/lib/actions/getReminders';

interface ReminderData {
  id: string;
  title: string;
  message?: string;
  task_id?: string;
  task_type?: string;
  remind_at: string;
  status: string;
  // Pour les checklists
  checklist_title?: string;
  task_title?: string;
}

interface UseReminderNotificationsReturn {
  currentReminder: ReminderData | null;
  isReminderVisible: boolean;
  closeReminder: () => void;
  snoozeReminder: (reminderID: string, minutes: number) => Promise<void>;
  markReminderDone: (reminderID: string) => Promise<void>;
}

export function useReminderNotifications(): UseReminderNotificationsReturn {
  const [currentReminder, setCurrentReminder] = useState<ReminderData | null>(null);
  const [isReminderVisible, setIsReminderVisible] = useState(false);
  const [checkedReminders, setCheckedReminders] = useState<Set<string>>(new Set());

  // Fonction pour vérifier les reminders actifs
  const checkActiveReminders = useCallback(async () => {
    try {
      console.log('🔍 Vérification des reminders actifs...');
      
      // Utiliser la nouvelle fonction optimisée qui filtre côté base
      const activeReminders = await getReminders({ limit: 10, onlyActive: true });
      
      // Filtrer seulement ceux pas déjà affichés
      const remindersToShow = activeReminders.filter((reminder: ReminderData) => 
        !checkedReminders.has(reminder.id)
      );

      console.log(`📋 ${remindersToShow.length} reminders à afficher trouvés`);

      // Afficher le premier reminder actif (FIFO)
      if (remindersToShow.length > 0 && !isReminderVisible) {
        const reminderToShow = remindersToShow[0];
        
        console.log('🔔 Déclenchement du reminder:', reminderToShow.title);
        
        // Enrichir avec les données de task/checklist si nécessaire
        if (reminderToShow.task_id) {
          try {
            // Essayer de récupérer les détails de la tâche
            const { data: taskData, error: taskError } = await supabase
              .from('task')
              .select('title, type')
              .eq('id', reminderToShow.task_id)
              .single();

            if (!taskError && taskData) {
              reminderToShow.task_title = taskData.title;
              reminderToShow.task_type = taskData.type;
              
              // Si c'est une checklist, essayer de récupérer les détails
              if (taskData.type === 'checklist') {
                const { data: checklistData, error: checklistError } = await supabase
                  .from('checklists')
                  .select('title')
                  .eq('task_id', reminderToShow.task_id)
                  .single();
                
                if (!checklistError && checklistData) {
                  reminderToShow.checklist_title = checklistData.title;
                }
              }
            }
          } catch (error) {
            console.warn('⚠️ Erreur récupération détails task:', error);
          }
        }
        
        setCurrentReminder(reminderToShow);
        setIsReminderVisible(true);
        
        // Marquer comme vérifié pour éviter la re-affichage
        setCheckedReminders(prev => new Set([...prev, reminderToShow.id]));
      }
    } catch (error) {
      console.error('❌ Erreur vérification reminders:', error);
    }
  }, [isReminderVisible, checkedReminders]);

  // Fonction pour fermer le popup
  const closeReminder = useCallback(() => {
    setIsReminderVisible(false);
    setCurrentReminder(null);
  }, []);

  // Fonction pour snoozer un reminder
  const snoozeReminder = useCallback(async (reminderID: string, minutes: number) => {
    try {
      const newRemindAt = new Date();
      newRemindAt.setMinutes(newRemindAt.getMinutes() + minutes);

      console.log(`💤 Snooze reminder ${reminderID} pour ${minutes} minutes`);

      const { error } = await supabase
        .from('reminders')
        .update({ 
          remind_at: newRemindAt.toISOString(),
          status: 'snoozed',
          updated_at: new Date().toISOString()
        })
        .eq('id', reminderID);

      if (error) throw error;

      console.log('✅ Reminder snoozé avec succès');
      
      // Retirer de la liste des vérifiés pour permettre le re-déclenchement
      setCheckedReminders(prev => {
        const updated = new Set(prev);
        updated.delete(reminderID);
        return updated;
      });

    } catch (error) {
      console.error('❌ Erreur snooze reminder:', error);
    }
  }, []);

  // Fonction pour marquer un reminder comme terminé
  const markReminderDone = useCallback(async (reminderID: string) => {
    try {
      console.log(`✅ Marquage reminder ${reminderID} comme terminé`);

      const { error } = await supabase
        .from('reminders')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', reminderID);

      if (error) throw error;

      console.log('✅ Reminder marqué comme terminé');

    } catch (error) {
      console.error('❌ Erreur marquage reminder terminé:', error);
    }
  }, []);

  // Effet pour vérifier les reminders toutes les 30 secondes
  useEffect(() => {
    // Vérification initiale
    checkActiveReminders();

    // Intervalle de vérification toutes les 2 minutes (plus performant)
    const interval = setInterval(checkActiveReminders, 2 * 60 * 1000);

    console.log('🔄 Hook reminders notifications activé (vérification toutes les 2min)');

    return () => {
      clearInterval(interval);
      console.log('🛑 Hook reminders notifications désactivé');
    };
  }, [checkActiveReminders]);

  // Reset de la liste des vérifiés toutes les heures (pour les récurrents)
  useEffect(() => {
    const hourlyReset = setInterval(() => {
      console.log('🔄 Reset des reminders vérifiés');
      setCheckedReminders(new Set());
    }, 60 * 60 * 1000); // 1 heure

    return () => clearInterval(hourlyReset);
  }, []);

  return {
    currentReminder,
    isReminderVisible,
    closeReminder,
    snoozeReminder,
    markReminderDone,
  };
}
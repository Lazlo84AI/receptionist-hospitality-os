import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface TaskFormData {
  title: string;
  category: string;
  originType: string;
  priority: string;
  service: string;
  assignedMember: string;
  location: string;
  description: string;
  guestName?: string;
  roomNumber?: string;
  recipient?: string;
  dueDate?: Date | null;
}

interface ChecklistData {
  id: string;
  title: string;
  items: any[];
}

interface ReminderData {
  id: string;
  subject: string;
  scheduleType: string;
  date?: Date;
  time?: string;
  shifts?: string[];
  frequency?: string;
  endDate?: Date;
}

interface AttachmentData {
  id: string;
  name: string;
  size: number;
  type: 'file' | 'link';
  url?: string;
}

export function useCreateTask() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const createTask = async (
    formData: TaskFormData,
    checklists: ChecklistData[],
    reminders: ReminderData[],
    attachments: AttachmentData[]
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Convertir assigned member name en UUID array
      let assignedMemberIds = null;
      if (formData.assignedMember) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .or(`full_name.eq.${formData.assignedMember},first_name.eq.${formData.assignedMember.split(' ')[0]}`)
          .single();

        if (profileError) {
          console.warn('Profile not found:', formData.assignedMember);
        } else {
          assignedMemberIds = [profileData.id];
        }
      }

      // 2. Préparer les données pour la table unifiée TASK
      const taskData = {
        title: formData.title,
        description: formData.description,
        category: formData.category, // ENUM task_category
        priority: formData.priority, // ENUM priority_level  
        service: formData.service,   // ENUM task_service
        origin_type: formData.originType || 'team', // ENUM task_origin
        assigned_to: assignedMemberIds, // Array uuid[] - CORRECTION PRINCIPALE
        location: formData.location,
        status: 'pending',
        created_by: user?.id,
        updated_by: user?.id,
        // Ajouter les checklists si présentes
        checklist_items: checklists.length > 0 ? checklists : null,
        // Gérer les champs spécifiques selon le type
        ...(formData.category === 'client_request' && {
          guest_name: formData.guestName,
          room_number: formData.roomNumber || formData.location
        }),
        ...(formData.category === 'follow_up' && {
          recipient: formData.recipient || formData.assignedMember,
          due_date: formData.dueDate?.toISOString().split('T')[0] || null
        }),
        ...(formData.category === 'internal_task' && {
          due_date: formData.dueDate?.toISOString().split('T')[0] || null
        })
      };

      console.log('📊 Données préparées pour table TASK:', taskData);

      // 3. Insertion dans la table unifiée TASK (au lieu des tables séparées)
      const { data: result, error: insertError } = await supabase
        .from('task')
        .insert([taskData])
        .select()
        .single();

      if (insertError) {
        console.error('❌ Erreur insertion task:', insertError);
        throw insertError;
      }

      console.log('✅ Tâche créée dans table TASK:', result);

      const taskId = result.id;

      // 4. Ajouter les reminders dans la table séparée si nécessaire
      if (reminders.length > 0) {
        const reminderInserts = reminders.map(reminder => ({
          task_id: taskId,
          task_type: formData.category,
          subject: reminder.subject,
          schedule_type: reminder.scheduleType,
          date: reminder.date?.toISOString().split('T')[0] || null,
          time: reminder.time || null,
          shifts: reminder.shifts || null,
          frequency: reminder.frequency || null,
          end_date: reminder.endDate?.toISOString().split('T')[0] || null,
          created_by: user?.id
        }));

        const { error: reminderError } = await supabase
          .from('reminders')
          .insert(reminderInserts);

        if (reminderError) {
          console.warn('⚠️ Erreur ajout reminders:', reminderError);
        } else {
          console.log('✅ Reminders ajoutés:', reminderInserts.length);
        }
      }

      // 5. Ajouter les attachments dans la table séparée si nécessaire
      if (attachments.length > 0) {
        const attachmentInserts = attachments.map(attachment => ({
          task_id: taskId,
          task_type: formData.category,
          filename: attachment.name,
          file_url: attachment.url || '',
          file_size: attachment.size,
          attachment_type: attachment.type,
          uploaded_by: user?.id
        }));

        const { error: attachmentError } = await supabase
          .from('attachments')
          .insert(attachmentInserts);

        if (attachmentError) {
          console.warn('⚠️ Erreur ajout attachments:', attachmentError);
        } else {
          console.log('✅ Attachments ajoutés:', attachmentInserts.length);
        }
      }

      setIsLoading(false);
      return { success: true, data: result };

    } catch (err: any) {
      console.error('❌ ERREUR useCreateTask:', err);
      setError(err.message || 'An error occurred while creating the task');
      setIsLoading(false);
      return { success: false, error: err.message };
    }
  };

  return {
    createTask,
    isLoading,
    error
  };
}
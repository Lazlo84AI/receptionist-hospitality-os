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
      // 1. Convertir location name en location_id
      let locationId = null;
      if (formData.location) {
        const { data: locationData, error: locationError } = await supabase
          .from('locations')
          .select('id')
          .eq('name', formData.location)
          .single();

        if (locationError) {
          console.warn('Location not found:', formData.location);
        } else {
          locationId = locationData.id;
        }
      }

      // 2. Convertir assigned member name en UUID array
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

      // 3. Préparer les données communes
      const commonData = {
        priority: formData.priority,
        status: 'pending',
        location: formData.location, // Garder aussi le texte
        location_id: locationId,
        assigned_to: formData.assignedMember, // Garder aussi le texte
        assigned_member_ids: assignedMemberIds,
        origin_type: formData.originType,
        created_by: user?.id,
        checklists: checklists.length > 0 ? checklists : null,
        // Les attachments et reminders seront ajoutés via les tables séparées
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      let result;

      // 4. Insérer selon la catégorie
      switch (formData.category) {
        case 'incident':
          result = await supabase
            .from('incidents')
            .insert({
              ...commonData,
              title: formData.title,
              description: formData.description,
              incident_type: formData.originType || 'general'
            })
            .select()
            .single();
          break;

        case 'client_request':
          result = await supabase
            .from('client_requests')
            .insert({
              ...commonData,
              guest_name: formData.guestName || '',
              room_number: formData.roomNumber || formData.location || '',
              request_type: formData.title,
              request_details: formData.description,
              preparation_status: 'pending'
            })
            .select()
            .single();
          break;

        case 'follow_up':
          result = await supabase
            .from('follow_ups')
            .insert({
              ...commonData,
              title: formData.title,
              recipient: formData.recipient || formData.assignedMember || '',
              follow_up_type: formData.originType || 'general',
              notes: formData.description,
              due_date: formData.dueDate?.toISOString().split('T')[0] || null
            })
            .select()
            .single();
          break;

        case 'internal_task':
          result = await supabase
            .from('internal_tasks')
            .insert({
              ...commonData,
              title: formData.title,
              description: formData.description,
              task_type: formData.originType || 'general',
              department: formData.service,
              due_date: formData.dueDate?.toISOString().split('T')[0] || null
            })
            .select()
            .single();
          break;

        default:
          throw new Error(`Unknown category: ${formData.category}`);
      }

      if (result.error) {
        throw result.error;
      }

      const taskId = result.data.id;
      const taskType = formData.category;

      // 5. Ajouter les reminders dans la table séparée si nécessaire
      if (reminders.length > 0) {
        const reminderInserts = reminders.map(reminder => ({
          task_id: taskId,
          task_type: taskType,
          subject: reminder.subject,
          schedule_type: reminder.scheduleType,
          date: reminder.date?.toISOString().split('T')[0] || null,
          time: reminder.time || null,
          shifts: reminder.shifts || null,
          frequency: reminder.frequency || null,
          end_date: reminder.endDate?.toISOString().split('T')[0] || null,
          created_by: user?.id
        }));

        await supabase.from('reminders').insert(reminderInserts);
      }

      // 6. Ajouter les attachments dans la table séparée si nécessaire
      if (attachments.length > 0) {
        const attachmentInserts = attachments.map(attachment => ({
          task_id: taskId,
          task_type: taskType,
          filename: attachment.name,
          file_url: attachment.url || '',
          file_size: attachment.size,
          attachment_type: attachment.type,
          uploaded_by: user?.id
        }));

        await supabase.from('attachments').insert(attachmentInserts);
      }

      setIsLoading(false);
      return { success: true, data: result.data };

    } catch (err: any) {
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
// Shift Continuity Manager - Version simplifiée avec filtrage par service
import { supabase } from '@/integrations/supabase/client';
import { TaskItem } from '@/types/database';

/**
 * RÈGLES SIMPLIFIÉES :
 * - Les cartes 'in_progress' et 'pending' sont transférées au prochain shift
 * - Les cartes 'completed' et 'verified' ne sont PAS transférées (archivées uniquement)
 * - Critère 1 : Cartes créées PAR le service (ex: reception)
 * - Critère 2 : Cartes assignées À quelqu'un du service (ex: reception)
 */

export const saveShiftHandover = async (
  fromShiftId: string,
  tasks: TaskItem[],
  voiceNoteUrl?: string,
  transcription?: string,
  additionalNotes?: string
) => {
  console.log('💾 Sauvegarde handover - TOUTES les cartes archivées');
  
  const handoverData = {
    timestamp: new Date().toISOString(),
    voice_note_url: voiceNoteUrl || null,
    voice_transcription: transcription || null,
    total_tasks_count: tasks.length,
    
    tasks_by_status: {
      pending: tasks.filter(t => t.status === 'pending'),
      in_progress: tasks.filter(t => t.status === 'in_progress'), 
      completed: tasks.filter(t => t.status === 'completed'),
      resolved: tasks.filter(t => t.status === 'resolved')
    },
    
    tasks_by_type: {
      incident: tasks.filter(t => t.type === 'incident'),
      client_request: tasks.filter(t => t.type === 'client_request'),
      follow_up: tasks.filter(t => t.type === 'follow_up'),
      internal_task: tasks.filter(t => t.type === 'internal_task')
    },
    
    all_tasks: tasks.map(task => ({
      id: task.id,
      type: task.type,
      status: task.status,
      title: task.title,
      assignedTo: task.assignedTo,
      createdBy: task.createdBy || task.created_by, // Support des deux formats
      priority: task.priority,
      data: task
    }))
  };
  
  const { data, error } = await supabase
    .from('shift_handovers')
    .insert({
      from_shift_id: fromShiftId,
      handover_data: handoverData,
      additional_notes: additionalNotes || null
    })
    .select()
    .single();
    
  if (error) throw error;
  console.log('✅ Handover sauvegardé:', data.id);
  return data;
};

export const getShiftHandover = async (userService: string) => {
  console.log(`🔍 Récupération handover pour service: ${userService}`);
  
  // 1. Récupérer le dernier snapshot
  const { data: latestHandover, error: handoverError } = await supabase
    .from('shift_handovers')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
    
  if (handoverError || !latestHandover) {
    console.log('❌ Aucun handover en attente');
    return { tasks: [], voiceNote: null, notes: null };
  }
  
  const handoverData = latestHandover.handover_data;
  const allTasks = handoverData.all_tasks || [];
  
  console.log(`📦 ${allTasks.length} cartes archivées trouvées`);
  
  // 2. Collecter TOUS les UUIDs (créateurs + assignés)
  const allUserIds = new Set<string>();
  allTasks.forEach((taskSnapshot: any) => {
    if (taskSnapshot.createdBy) {
      allUserIds.add(taskSnapshot.createdBy);
    }
    if (taskSnapshot.data?.assigned_to) {
      taskSnapshot.data.assigned_to.forEach((id: string) => allUserIds.add(id));
    }
  });
  
  console.log(`👥 ${allUserIds.size} utilisateurs uniques à vérifier`);
  
  // 3. UNE SEULE requête pour récupérer tous les services
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, service')
    .in('id', Array.from(allUserIds));
  
  if (profileError) {
    console.error('❌ Erreur récupération profiles:', profileError);
    return { tasks: [], voiceNote: null, notes: null };
  }
  
  // 4. Mapping UUID → service
  const userServiceMap: Record<string, string> = {};
  profiles?.forEach(p => {
    if (p.service) {
      userServiceMap[p.id] = p.service;
    }
  });
  
  console.log(`🗺️ Mapping créé pour ${Object.keys(userServiceMap).length} utilisateurs`);
  
  // 5. Filtrer les tâches selon les 2 critères
  const tasksToTransfer = allTasks.filter((taskSnapshot: any) => {
    const task = taskSnapshot.data;
    
    // Filtre status : uniquement in_progress et pending
    if (task.status !== 'in_progress' && task.status !== 'pending') {
      console.log(`📦 Carte "${task.title}" archivée (${task.status})`);
      return false;
    }
    
    // Critère 1 : Créée par mon service
    const creatorService = userServiceMap[taskSnapshot.createdBy];
    if (creatorService === userService) {
      console.log(`✅ Carte "${task.title}" - créée par ${userService}`);
      return true;
    }
    
    // Critère 2 : Assignée à quelqu'un de mon service
    const assignedIds = task.assigned_to || [];
    const hasMyService = assignedIds.some((id: string) => 
      userServiceMap[id] === userService
    );
    if (hasMyService) {
      console.log(`✅ Carte "${task.title}" - assignée à ${userService}`);
      return true;
    }
    
    console.log(`⏭️ Carte "${task.title}" - pas pour ${userService}`);
    return false;
  });
  
  console.log(`📊 ${tasksToTransfer.length}/${allTasks.length} cartes transférées à ${userService}`);
  
  return {
    handoverId: latestHandover.id,
    tasks: tasksToTransfer.map((t: any) => t.data),
    voiceNote: {
      url: handoverData.voice_note_url,
      transcription: handoverData.voice_transcription
    },
    notes: latestHandover.additional_notes,
    stats: {
      totalArchived: allTasks.length,
      transferred: tasksToTransfer.length,
      archived: allTasks.length - tasksToTransfer.length
    }
  };
};

/**
 * Lie un ensemble de tâches à un nouveau shift
 * Met à jour le champ shift_id pour toutes les tâches spécifiées
 */
export const linkTasksToShift = async (taskIds: string[], newShiftId: string): Promise<void> => {
  if (taskIds.length === 0) {
    console.log('⚠️ Aucune tâche à lier au shift');
    return;
  }
  
  console.log(`🔗 Liaison de ${taskIds.length} tâches au shift ${newShiftId}`);
  
  const { error } = await supabase
    .from('task')
    .update({ 
      shift_id: newShiftId,
      updated_at: new Date().toISOString()
    })
    .in('id', taskIds);
    
  if (error) {
    console.error('❌ Erreur lors de la liaison des tâches:', error);
    throw error;
  }
  
  console.log(`✅ ${taskIds.length} tâches liées au shift ${newShiftId}`);
};

export const completeHandover = async (handoverId: string, newShiftId: string) => {
  // Cette fonction n'est plus nécessaire car to_shift_id a été supprimé
  // On garde la fonction pour compatibilité mais elle ne fait rien
  console.log('✓ Handover completed for shift:', newShiftId);
};

// Shift Continuity Manager - Version corrigée avec règles créateur + assigné
import { supabase } from '@/integrations/supabase/client';
import { TaskItem } from '@/types/database';

export interface HandoverRules {
  // Cartes TOUJOURS transférées (incidents en cours + client requests)
  alwaysTransfer: string[]; // ['incident', 'client_request']
  
  // Cartes transférées selon assignation OU création (follow-ups + internal tasks)
  conditionalTransfer: string[]; // ['follow_up', 'internal_task'] 
  
  // Cartes archivées mais pas transférées
  archiveOnly: string[]; // ['completed', 'resolved']
}

export const HANDOVER_RULES: HandoverRules = {
  alwaysTransfer: ['incident', 'client_request'],
  conditionalTransfer: ['follow_up', 'internal_task'],
  archiveOnly: ['completed', 'resolved']
};

/**
 * RÈGLES MÉTIER MISES À JOUR :
 * 1. Incidents & Client Requests → TOUJOURS transférés
 * 2. Follow-ups & Internal Tasks → Transférés si assigné OU créateur
 * 3. Cartes résolues → Archivées seulement
 */

export const saveShiftHandover = async (
  fromShiftId: string,
  tasks: TaskItem[],
  voiceNoteUrl?: string,
  transcription?: string,
  additionalNotes?: string
) => {
  console.log('Sauvegarde handover - TOUTES les cartes archivées');
  
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
      to_shift_id: null,
      handover_data: handoverData,
      additional_notes: additionalNotes || null
    })
    .select()
    .single();
    
  if (error) throw error;
  console.log('Handover sauvegardé:', data.id);
  return data;
};

export const getShiftHandover = async (newUserId: string) => {
  console.log('Récupération handover pour utilisateur:', newUserId);
  
  const { data: latestHandover, error: handoverError } = await supabase
    .from('shift_handovers')
    .select('*')
    .is('to_shift_id', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
    
  if (handoverError || !latestHandover) {
    console.log('Aucun handover en attente');
    return { tasks: [], voiceNote: null, notes: null };
  }
  
  const handoverData = latestHandover.handover_data;
  const allTasks = handoverData.all_tasks || [];
  
  console.log(`${allTasks.length} cartes archivées trouvées`);
  
  // RÈGLES DE FILTRAGE CORRIGÉES
  const tasksToTransfer = allTasks.filter(taskSnapshot => {
    const task = taskSnapshot.data;
    
    // RÈGLE 1: Cartes résolues = archivées seulement
    if (task.status === 'completed' || task.status === 'resolved') {
      console.log(`Carte ${task.title} archivée (${task.status})`);
      return false;
    }
    
    // RÈGLE 2: Incidents et client requests = TOUJOURS transférés  
    if (HANDOVER_RULES.alwaysTransfer.includes(task.type)) {
      console.log(`Carte ${task.title} transférée (${task.type} prioritaire)`);
      return true;
    }
    
    // RÈGLE 3 CORRIGÉE: Follow-ups et internal tasks = selon assignation OU création
    if (HANDOVER_RULES.conditionalTransfer.includes(task.type)) {
      const isAssigned = task.assignedTo === newUserId;
      const isCreator = taskSnapshot.createdBy === newUserId;
      
      if (isAssigned || isCreator) {
        const reason = [];
        if (isAssigned) reason.push('assignée');
        if (isCreator) reason.push('créée par l\'utilisateur');
        console.log(`Carte ${task.title} transférée (${reason.join(' et ')})`);
        return true;
      } else {
        console.log(`Carte ${task.title} non transférée (ni assignée ni créée par l'utilisateur)`);
        return false;
      }
    }
    
    return false;
  });
  
  console.log(`${tasksToTransfer.length} cartes sélectionnées pour transfert`);
  
  return {
    handoverId: latestHandover.id,
    tasks: tasksToTransfer.map(t => t.data),
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

export const completeHandover = async (handoverId: string, newShiftId: string) => {
  const { error } = await supabase
    .from('shift_handovers')
    .update({ to_shift_id: newShiftId })
    .eq('id', handoverId);
    
  if (error) throw error;
  console.log('Handover finalisé pour shift:', newShiftId);
};
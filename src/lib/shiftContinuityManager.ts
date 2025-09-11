// Shift Continuity Manager - Gestion intelligente des transferts entre équipes
import { supabase } from '@/integrations/supabase/client';
import { TaskItem } from '@/types/database';

export interface HandoverRules {
  // Cartes TOUJOURS transférées (incidents en cours + client requests)
  alwaysTransfer: string[]; // ['incident', 'client_request']
  
  // Cartes transférées selon assignation (follow-ups + internal tasks)
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
 * PHASE 1: Sauvegarde complète en fin de shift
 * Enregistre TOUTES les cartes + voice note/transcript
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
    
    // Archivage complet par statut
    tasks_by_status: {
      pending: tasks.filter(t => t.status === 'pending'),
      in_progress: tasks.filter(t => t.status === 'in_progress'), 
      completed: tasks.filter(t => t.status === 'completed'),
      resolved: tasks.filter(t => t.status === 'resolved')
    },
    
    // Archivage complet par type
    tasks_by_type: {
      incident: tasks.filter(t => t.type === 'incident'),
      client_request: tasks.filter(t => t.type === 'client_request'),
      follow_up: tasks.filter(t => t.type === 'follow_up'),
      internal_task: tasks.filter(t => t.type === 'internal_task')
    },
    
    // Snapshot complet de chaque carte
    all_tasks: tasks.map(task => ({
      id: task.id,
      type: task.type,
      status: task.status,
      title: task.title,
      assignedTo: task.assignedTo,
      priority: task.priority,
      data: task // Carte complète
    }))
  };
  
  // Insertion dans shift_handovers avec from_shift_id seulement
  const { data, error } = await supabase
    .from('shift_handovers')
    .insert({
      from_shift_id: fromShiftId,
      to_shift_id: null, // Sera rempli au prochain shift
      handover_data: handoverData,
      additional_notes: additionalNotes || null
    })
    .select()
    .single();
    
  if (error) throw error;
  console.log('✅ Handover sauvegardé:', data.id);
  return data;
};

/**
 * PHASE 2: Récupération intelligente en début de shift
 * Applique les règles métier pour filtrer les cartes
 */
export const getShiftHandover = async (newUserId: string) => {
  console.log('🔄 Récupération handover pour utilisateur:', newUserId);
  
  // 1. Récupérer le dernier handover sans to_shift_id
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
  
  console.log(`📋 ${allTasks.length} cartes archivées trouvées`);
  
  // 2. Appliquer les règles de filtrage intelligentes
  const tasksToTransfer = allTasks.filter(taskSnapshot => {
    const task = taskSnapshot.data;
    
    // RÈGLE 1: Cartes résolues = archivées seulement (pas transférées)
    if (task.status === 'completed' || task.status === 'resolved') {
      console.log(`📁 Carte ${task.title} archivée (${task.status})`);
      return false;
    }
    
    // RÈGLE 2: Incidents et client requests = TOUJOURS transférés
    if (HANDOVER_RULES.alwaysTransfer.includes(task.type)) {
      console.log(`🚨 Carte ${task.title} transférée (${task.type} prioritaire)`);
      return true;
    }
    
    // RÈGLE 3: Follow-ups et internal tasks = selon assignation OU création
    if (HANDOVER_RULES.conditionalTransfer.includes(task.type)) {
      // Transférer si l'utilisateur est assigné OU créateur de la carte
      const isAssigned = task.assignedTo === newUserId;
      const isCreator = task.createdBy === newUserId || task.created_by === newUserId;
      
      if (isAssigned || isCreator) {
        console.log(`👤 Carte ${task.title} transférée (${isAssigned ? 'assignée' : 'créée'} par l'utilisateur)`);
        return true;
      } else {
        console.log(`⏭️ Carte ${task.title} non transférée (ni assignée ni créée par l'utilisateur)`);
        return false;
      }
    }
    
    // Règle par défaut
    return false;
  });
  
  console.log(`✅ ${tasksToTransfer.length} cartes sélectionnées pour transfert`);
  
  return {
    handoverId: latestHandover.id,
    tasks: tasksToTransfer.map(t => t.data), // Retourner les cartes complètes
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
 * PHASE 3: Finaliser le handover (marquer comme traité)
 */
export const completeHandover = async (handoverId: string, newShiftId: string) => {
  const { error } = await supabase
    .from('shift_handovers')
    .update({ to_shift_id: newShiftId })
    .eq('id', handoverId);
    
  if (error) throw error;
  console.log('✅ Handover finalisé pour shift:', newShiftId);
};
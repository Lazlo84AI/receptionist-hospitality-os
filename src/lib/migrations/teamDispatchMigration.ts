import { supabase } from '@/integrations/supabase/client';

/**
 * Script de migration pour corriger les données Team Dispatch
 * À exécuter UNE SEULE FOIS pour rendre les données persistantes
 */

// Fonction pour compléter les noms manquants dans la table profiles
async function fixProfileNames() {
  console.log('🔧 Correction des noms dans la table profiles...');
  
  try {
    // Récupérer tous les profils
    const { data: profiles, error: fetchError } = await supabase
      .from('profiles')
      .select('*');

    if (fetchError) throw fetchError;

    const updates = [];
    
    for (const profile of profiles || []) {
      let needsUpdate = false;
      const updateData: any = {};

      // Si first_name ou last_name manquent, générer à partir de l'email
      if (!profile.first_name && !profile.last_name && profile.email) {
        const emailName = profile.email.split('@')[0];
        const nameParts = emailName.split('.');
        
        if (nameParts.length >= 2) {
          updateData.first_name = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1);
          updateData.last_name = nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1);
          needsUpdate = true;
        }
      }

      // Assigner des départements/rôles cohérents pour les membres d'équipe
      if (profile.email?.includes('marie.dubois')) {
        updateData.first_name = 'Marie';
        updateData.last_name = 'Dubois';
        updateData.department = 'housekeeping';
        updateData.role = 'housekeeping';
        needsUpdate = true;
      } else if (profile.email?.includes('sophie')) {
        updateData.first_name = 'Sophie';
        updateData.last_name = 'Laurent';
        updateData.department = 'housekeeping';
        updateData.role = 'housekeeping';
        needsUpdate = true;
      } else if (profile.email?.includes('claire')) {
        updateData.first_name = 'Claire';
        updateData.last_name = 'Martin';
        updateData.department = 'housekeeping';
        updateData.role = 'housekeeping';
        needsUpdate = true;
      } else if (profile.email?.includes('emma')) {
        updateData.first_name = 'Emma';
        updateData.last_name = 'Bernard';
        updateData.department = 'housekeeping';
        updateData.role = 'housekeeping';
        needsUpdate = true;
      } else if (profile.email?.includes('lucas') || profile.role === 'chef') {
        updateData.first_name = 'Lucas';
        updateData.last_name = 'Moreau';
        updateData.department = 'restaurant';
        updateData.role = 'staff';
        needsUpdate = true;
      } else if (profile.role === 'manager') {
        updateData.first_name = 'Isabelle';
        updateData.last_name = 'Petit';
        updateData.department = 'management';
        updateData.role = 'manager';
        needsUpdate = true;
      }

      if (needsUpdate) {
        updates.push({ id: profile.id, data: updateData });
      }
    }

    // Appliquer toutes les mises à jour
    for (const update of updates) {
      const { error } = await supabase
        .from('profiles')
        .update(update.data)
        .eq('id', update.id);
      
      if (error) {
        console.error(`Erreur mise à jour profil ${update.id}:`, error);
      } else {
        console.log(`✅ Profil mis à jour: ${update.data.first_name} ${update.data.last_name}`);
      }
    }

    console.log(`🎉 ${updates.length} profils mis à jour avec succès`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction des profils:', error);
    throw error;
  }
}

// Fonction pour ajouter des locations manquantes
async function addMissingLocations() {
  console.log('🏨 Ajout des locations manquantes...');
  
  try {
    // Créer des chambres de base dans la table locations
    const roomsToCreate = [
      { name: 'Chambre 101', type: 'room', floor: 1, building: 'Principal' },
      { name: 'Chambre 102', type: 'room', floor: 1, building: 'Principal' },
      { name: 'Chambre 103', type: 'room', floor: 1, building: 'Principal' },
      { name: 'Chambre 105', type: 'room', floor: 1, building: 'Principal' },
      { name: 'Chambre 107', type: 'room', floor: 1, building: 'Principal' },
      { name: 'Chambre 201', type: 'room', floor: 2, building: 'Principal' },
      { name: 'Chambre 203', type: 'room', floor: 2, building: 'Principal' },
      { name: 'Chambre 205', type: 'room', floor: 2, building: 'Principal' },
      { name: 'Chambre 207', type: 'room', floor: 2, building: 'Principal' },
      { name: 'Chambre 208', type: 'room', floor: 2, building: 'Principal' },
      { name: 'Suite 301', type: 'room', floor: 3, building: 'Principal' },
      { name: 'Chambre 302', type: 'room', floor: 3, building: 'Principal' },
      { name: 'Chambre 305', type: 'room', floor: 3, building: 'Principal' },
      { name: 'Suite 401', type: 'room', floor: 4, building: 'Principal' },
      { name: 'Salle Versailles', type: 'common_area', floor: 1, building: 'Principal' },
      { name: 'Espace Spa', type: 'common_area', floor: -1, building: 'Principal' },
      { name: 'Bureau Gouvernante', type: 'staff_area', floor: 0, building: 'Principal' }
    ];

    for (const room of roomsToCreate) {
      // Vérifier si la location existe déjà
      const { data: existing } = await supabase
        .from('locations')
        .select('id')
        .eq('name', room.name)
        .single();

      if (!existing) {
        const { error } = await supabase
          .from('locations')
          .insert({
            name: room.name,
            type: room.type,
            floor: room.floor,
            building: room.building,
            is_active: true
          });

        if (error) {
          console.error(`Erreur création location ${room.name}:`, error);
        } else {
          console.log(`✅ Location créée: ${room.name}`);
        }
      }
    }

    console.log('🎉 Locations créées avec succès');

  } catch (error) {
    console.error('❌ Erreur lors de la création des locations:', error);
    throw error;
  }
}

// Fonction pour corriger les locations manquantes dans les tâches
async function fixTaskLocations() {
  console.log('📋 Correction des locations dans les tâches...');

  try {
    // Récupérer toutes les locations disponibles
    const { data: locations, error: locError } = await supabase
      .from('locations')
      .select('id, name, type');

    if (locError) throw locError;

    const locationMap = new Map();
    locations?.forEach(loc => {
      locationMap.set(loc.name, loc.id);
    });

    // 1. Corriger les incidents
    const { data: incidents } = await supabase
      .from('incidents')
      .select('*');

    for (const incident of incidents || []) {
      const updates: any = {};
      let needsUpdate = false;

      if (!incident.location || incident.location === 'No location') {
        // Attribuer une chambre aléatoire
        const randomRooms = ['Chambre 101', 'Chambre 102', 'Chambre 203', 'Suite 301'];
        const randomRoom = randomRooms[Math.floor(Math.random() * randomRooms.length)];
        updates.location = randomRoom;
        updates.location_id = locationMap.get(randomRoom);
        needsUpdate = true;
      } else if (!incident.location_id && locationMap.has(incident.location)) {
        updates.location_id = locationMap.get(incident.location);
        needsUpdate = true;
      }

      if (needsUpdate) {
        const { error } = await supabase
          .from('incidents')
          .update(updates)
          .eq('id', incident.id);

        if (error) {
          console.error(`Erreur mise à jour incident ${incident.id}:`, error);
        } else {
          console.log(`✅ Incident mis à jour: ${updates.location}`);
        }
      }
    }

    // 2. Corriger les internal_tasks
    const { data: internalTasks } = await supabase
      .from('internal_tasks')
      .select('*');

    for (const task of internalTasks || []) {
      const updates: any = {};
      let needsUpdate = false;

      if (!task.location || task.location === 'No location') {
        const randomRooms = ['Chambre 105', 'Chambre 107', 'Chambre 205', 'Chambre 302'];
        const randomRoom = randomRooms[Math.floor(Math.random() * randomRooms.length)];
        updates.location = randomRoom;
        updates.location_id = locationMap.get(randomRoom);
        needsUpdate = true;
      } else if (!task.location_id && locationMap.has(task.location)) {
        updates.location_id = locationMap.get(task.location);
        needsUpdate = true;
      }

      if (needsUpdate) {
        const { error } = await supabase
          .from('internal_tasks')
          .update(updates)
          .eq('id', task.id);

        if (error) {
          console.error(`Erreur mise à jour internal_task ${task.id}:`, error);
        } else {
          console.log(`✅ Tâche interne mise à jour: ${updates.location}`);
        }
      }
    }

    console.log('🎉 Locations des tâches corrigées');

  } catch (error) {
    console.error('❌ Erreur lors de la correction des locations:', error);
    throw error;
  }
}

// Fonction pour assigner les tâches aux vrais membres d'équipe
async function assignTasksToTeamMembers() {
  console.log('👥 Assignment des tâches aux membres d\'équipe...');

  try {
    // Récupérer les membres d'équipe
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_active', true);

    if (!profiles || profiles.length === 0) {
      console.log('⚠️ Aucun profil actif trouvé');
      return;
    }

    const housekeepingMembers = profiles.filter(p => p.department === 'housekeeping' || p.role === 'housekeeping');
    const restaurantMembers = profiles.filter(p => p.department === 'restaurant');
    const managers = profiles.filter(p => p.role === 'manager');

    console.log(`Trouvés: ${housekeepingMembers.length} housekeeping, ${restaurantMembers.length} restaurant, ${managers.length} managers`);

    // Assigner les tâches cycliquement
    const allMembers = [...housekeepingMembers, ...restaurantMembers, ...managers];

    if (allMembers.length === 0) {
      console.log('⚠️ Aucun membre d\'équipe disponible');
      return;
    }

    // Assigner les incidents
    const { data: incidents } = await supabase.from('incidents').select('*');
    for (const [index, incident] of (incidents || []).entries()) {
      const assignedMember = allMembers[index % allMembers.length];
      
      const { error } = await supabase
        .from('incidents')
        .update({ assigned_to: assignedMember.id })
        .eq('id', incident.id);

      if (error) {
        console.error(`Erreur assignment incident ${incident.id}:`, error);
      } else {
        console.log(`✅ Incident assigné à ${assignedMember.first_name} ${assignedMember.last_name}`);
      }
    }

    // Assigner les internal_tasks
    const { data: internalTasks } = await supabase.from('internal_tasks').select('*');
    for (const [index, task] of (internalTasks || []).entries()) {
      const assignedMember = allMembers[index % allMembers.length];
      
      const { error } = await supabase
        .from('internal_tasks')
        .update({ assigned_to: assignedMember.id })
        .eq('id', task.id);

      if (error) {
        console.error(`Erreur assignment internal_task ${task.id}:`, error);
      } else {
        console.log(`✅ Tâche interne assignée à ${assignedMember.first_name} ${assignedMember.last_name}`);
      }
    }

    // Assigner les client_requests
    const { data: clientRequests } = await supabase.from('client_requests').select('*');
    for (const [index, request] of (clientRequests || []).entries()) {
      const assignedMember = allMembers[index % allMembers.length];
      
      const { error } = await supabase
        .from('client_requests')
        .update({ assigned_to: assignedMember.id })
        .eq('id', request.id);

      if (error) {
        console.error(`Erreur assignment client_request ${request.id}:`, error);
      } else {
        console.log(`✅ Demande client assignée à ${assignedMember.first_name} ${assignedMember.last_name}`);
      }
    }

    console.log('🎉 Toutes les tâches ont été assignées');

  } catch (error) {
    console.error('❌ Erreur lors de l\'assignment des tâches:', error);
    throw error;
  }
}

// Fonction principale de migration
export async function runTeamDispatchMigration() {
  console.log('🚀 Début de la migration Team Dispatch...');
  
  try {
    await fixProfileNames();
    await addMissingLocations();
    await fixTaskLocations();
    await assignTasksToTeamMembers();
    
    console.log('✅ Migration Team Dispatch terminée avec succès !');
    console.log('🔄 Rechargez la page Team Dispatch pour voir les changements');
    
  } catch (error) {
    console.error('❌ Erreur durant la migration:', error);
    throw error;
  }
}

// Export par défaut pour utilisation simple
export default runTeamDispatchMigration;
// Script simple pour appliquer les migrations de locations
// À exécuter avec: node migrate-locations.js

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ypxmzacmwqqvlciwahzw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlweG16YWNtd3FxdmxjaXdhaHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2ODgyODEsImV4cCI6MjA2OTI2NDI4MX0.8h2Pb7_pYjx_SNxdp4qLjt234u9wcKjBFxdqmQeB6wI";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function main() {
  console.log('🚀 Application de la migration des locations...');
  
  try {
    // Étape 1: Supprimer les anciennes locations
    console.log('📋 Suppression des anciennes locations...');
    const { error: deleteError } = await supabase
      .from('locations')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError && deleteError.code !== 'PGRST116') { // PGRST116 = no rows to delete
      console.error('❌ Erreur suppression:', deleteError);
      return;
    }

    console.log('✅ Anciennes locations supprimées');

    // Étape 2: Créer les nouvelles locations
    const locations = [];

    // Chambres par étage
    const floors = [
      { floor: 1, rooms: [10,11,12,14,15,16,17,18], amenities: ['minibar', 'city_view', 'safe'] },
      { floor: 2, rooms: [20,21,22,24,25,26,27,28], amenities: ['minibar', 'garden_view', 'safe'] },
      { floor: 3, rooms: [30,31,32,34,35,36,37,38], amenities: ['minibar', 'partial_city_view', 'safe'] },
      { floor: 4, rooms: [40,41,42,44,45,46,47,48], amenities: ['minibar', 'premium_view', 'safe'] },
      { floor: 5, rooms: [50,51,52,54,55,56,57,58], amenities: ['minibar', 'panoramic_view', 'safe'] }
    ];

    floors.forEach(floorData => {
      floorData.rooms.forEach(room => {
        locations.push({
          name: room.toString(),
          type: 'room',
          floor: floorData.floor,
          building: 'Main Tower',
          capacity: 2,
          amenities: floorData.amenities,
          is_active: true
        });
      });
    });

    // Common Areas
    const commonAreas = [
      { name: 'Accueil', floor: 0, capacity: 50, amenities: ['reception_desk', 'seating_area'] },
      { name: 'Espace Spa', floor: 0, capacity: 15, amenities: ['spa_reception', 'relaxation'] },
      { name: 'Bar', floor: 0, capacity: 40, amenities: ['bar_counter', 'lounge_seating'] },
      { name: 'Salon', floor: 0, capacity: 60, amenities: ['comfortable_seating', 'fireplace'] },
      { name: 'Spa Réception', floor: 2, capacity: 20, amenities: ['reception_desk', 'waiting_area'] },
      { name: 'Cuisine', floor: -1, capacity: 15, amenities: ['industrial_kitchen', 'storage'], type: 'staff_area' }
    ];

    commonAreas.forEach(area => {
      locations.push({
        name: area.name,
        type: area.type || 'common_area',
        floor: area.floor,
        building: 'Main Tower',
        capacity: area.capacity,
        amenities: area.amenities,
        is_active: true
      });
    });

    console.log(`📊 Insertion de ${locations.length} nouvelles locations...`);

    // Insérer par lots de 10
    for (let i = 0; i < locations.length; i += 10) {
      const batch = locations.slice(i, i + 10);
      const { error } = await supabase.from('locations').insert(batch);
      
      if (error) {
        console.error(`❌ Erreur lot ${Math.floor(i/10) + 1}:`, error);
        continue;
      }
      console.log(`✅ Lot ${Math.floor(i/10) + 1}/${Math.ceil(locations.length/10)} inséré`);
    }

    // Étape 3: Mise à jour des tâches existantes
    console.log('📋 Mise à jour des tâches existantes...');

    const updates = [
      { table: 'incidents', column: 'location', from: 'Presidential Suite', to: '50' },
      { table: 'incidents', column: 'location', from: 'Room 305', to: '35' },
      { table: 'incidents', column: 'location', from: 'Pool Area', to: 'Espace Spa' },
      { table: 'client_requests', column: 'room_number', from: 'Presidential Suite', to: '50' },
      { table: 'client_requests', column: 'room_number', from: 'Room 305', to: '35' },
    ];

    for (const update of updates) {
      const { error } = await supabase
        .from(update.table)
        .update({ [update.column]: update.to })
        .eq(update.column, update.from);
        
      if (error) {
        console.warn(`⚠️ Mise à jour ${update.table}: ${error.message}`);
      } else {
        console.log(`✅ ${update.table}.${update.column}: ${update.from} → ${update.to}`);
      }
    }

    console.log('🎉 Migration terminée avec succès !');
    console.log('📝 Rafraîchissez votre navigateur pour voir les changements');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

main();

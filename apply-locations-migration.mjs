import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ypxmzacmwqqvlciwahzw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlweG16YWNtd3FxdmxjaXdhaHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2ODgyODEsImV4cCI6MjA2OTI2NDI4MX0.8h2Pb7_pYjx_SNxdp4qLjt234u9wcKjBFxdqmQeB6wI";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function applyLocationsMigration() {
  console.log('🚀 Début de l\'application des migrations de locations...');
  
  try {
    // Migration 1: Suppression et recréation de la structure des locations
    console.log('📋 Étape 1: Suppression des anciennes locations...');
    const { error: deleteError } = await supabase
      .from('locations')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError) {
      console.error('❌ Erreur lors de la suppression:', deleteError);
      return;
    }

    console.log('✅ Anciennes locations supprimées');

    // Insertion des nouvelles locations
    const newLocations = [];

    // Rooms Floor 1: 10-18 (excluding 13)
    [10,11,12,14,15,16,17,18].forEach(room => {
      newLocations.push({
        name: room.toString(),
        type: 'room',
        floor: 1,
        building: 'Main Tower',
        capacity: 2,
        amenities: ['minibar', 'city_view', 'safe'],
        is_active: true
      });
    });

    // Rooms Floor 2: 20-28 (excluding 23)
    [20,21,22,24,25,26,27,28].forEach(room => {
      newLocations.push({
        name: room.toString(),
        type: 'room',
        floor: 2,
        building: 'Main Tower',
        capacity: 2,
        amenities: ['minibar', 'garden_view', 'safe'],
        is_active: true
      });
    });

    // Rooms Floor 3: 30-38 (excluding 33)
    [30,31,32,34,35,36,37,38].forEach(room => {
      newLocations.push({
        name: room.toString(),
        type: 'room',
        floor: 3,
        building: 'Main Tower',
        capacity: 2,
        amenities: ['minibar', 'partial_city_view', 'safe'],
        is_active: true
      });
    });

    // Rooms Floor 4: 40-48 (excluding 43)
    [40,41,42,44,45,46,47,48].forEach(room => {
      newLocations.push({
        name: room.toString(),
        type: 'room',
        floor: 4,
        building: 'Main Tower',
        capacity: 2,
        amenities: ['minibar', 'premium_view', 'safe'],
        is_active: true
      });
    });

    // Rooms Floor 5: 50-58 (excluding 53)
    [50,51,52,54,55,56,57,58].forEach(room => {
      newLocations.push({
        name: room.toString(),
        type: 'room',
        floor: 5,
        building: 'Main Tower',
        capacity: 2,
        amenities: ['minibar', 'panoramic_view', 'safe'],
        is_active: true
      });
    });

    // Common Areas - Ground Floor (0)
    const commonAreas = [
      { name: 'Accueil', type: 'common_area', floor: 0, capacity: 50, amenities: ['reception_desk', 'seating_area'] },
      { name: 'Ascenseur', type: 'common_area', floor: 0, capacity: 8, amenities: ['elevator_access'] },
      { name: 'Bagagerie', type: 'common_area', floor: 0, capacity: 20, amenities: ['luggage_storage'] },
      { name: 'Bureau', type: 'office', floor: 0, capacity: 4, amenities: ['desk', 'office_supplies'] },
      { name: 'Cour', type: 'common_area', floor: 0, capacity: 30, amenities: ['outdoor_seating'] },
      { name: 'Espace Spa', type: 'common_area', floor: 0, capacity: 15, amenities: ['spa_reception', 'relaxation'] },
      { name: 'Executive Lounge', type: 'common_area', floor: 0, capacity: 50, amenities: ['bar', 'business_center', 'city_view'] },
      { name: 'Salle Petit Déjeuner', type: 'common_area', floor: 0, capacity: 80, amenities: ['dining_tables', 'buffet_area'] },
      { name: 'Bar', type: 'common_area', floor: 0, capacity: 40, amenities: ['bar_counter', 'lounge_seating'] },
      { name: 'Salon', type: 'common_area', floor: 0, capacity: 60, amenities: ['comfortable_seating', 'fireplace'] },
      { name: 'Terrasse', type: 'common_area', floor: 0, capacity: 25, amenities: ['outdoor_seating', 'garden_view'] }
    ];

    commonAreas.forEach(area => {
      newLocations.push({
        ...area,
        building: 'Main Tower',
        is_active: true
      });
    });

    // Floor 2 - Spa Réception
    newLocations.push({
      name: 'Spa Réception',
      type: 'common_area',
      floor: 2,
      building: 'Main Tower',
      capacity: 20,
      amenities: ['reception_desk', 'waiting_area'],
      is_active: true
    });

    // Floor 6 - Toit
    newLocations.push({
      name: 'Toit',
      type: 'common_area',
      floor: 6,
      building: 'Main Tower',
      capacity: 20,
      amenities: ['panoramic_view', 'rooftop_access'],
      is_active: true
    });

    // Staff Areas - Basement (-1)
    const staffAreas = [
      { name: 'Atelier', capacity: 8, amenities: ['work_tools', 'repair_equipment'] },
      { name: 'Centrale d\'Aspiration', capacity: 2, amenities: ['vacuum_system'] },
      { name: 'Chaufferie', capacity: 4, amenities: ['heating_system'] },
      { name: 'Cuisine', capacity: 15, amenities: ['industrial_kitchen', 'storage'] },
      { name: 'Espace Bien-Être', capacity: 10, amenities: ['staff_relaxation'] },
      { name: 'Lingerie', capacity: 6, amenities: ['laundry_equipment'] },
      { name: 'Salle de Réunion', capacity: 12, amenities: ['meeting_table', 'projector'] },
      { name: 'Vestiaire Staff', capacity: 20, amenities: ['lockers', 'changing_room'] }
    ];

    staffAreas.forEach(area => {
      newLocations.push({
        ...area,
        type: 'staff_area',
        floor: -1,
        building: 'Main Tower',
        is_active: true
      });
    });

    console.log('📋 Étape 2: Insertion des nouvelles locations...');
    console.log(`📊 Nombre total de locations à créer: ${newLocations.length}`);

    // Insérer les nouvelles locations par petits lots
    const batchSize = 10;
    for (let i = 0; i < newLocations.length; i += batchSize) {
      const batch = newLocations.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from('locations')
        .insert(batch);

      if (insertError) {
        console.error(`❌ Erreur lors de l'insertion du lot ${Math.floor(i/batchSize) + 1}:`, insertError);
        return;
      }
      console.log(`✅ Lot ${Math.floor(i/batchSize) + 1}/${Math.ceil(newLocations.length/batchSize)} inséré`);
    }

    console.log('🎉 Migration 1 terminée avec succès !');
    return true;
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    return false;
  }
}

// Exécuter la migration
applyLocationsMigration()
  .then((success) => {
    if (success) {
      console.log('🎉 Toutes les migrations ont été appliquées avec succès !');
      console.log('📝 Prochaines étapes:');
      console.log('   1. Rafraîchissez votre navigateur sur http://localhost:8080/');
      console.log('   2. Vérifiez que les locations sont maintenant correctes');
    } else {
      console.log('❌ Échec de la migration');
    }
  })
  .catch((error) => {
    console.error('❌ Erreur générale:', error);
  });

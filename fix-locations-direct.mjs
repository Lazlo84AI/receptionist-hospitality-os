import { supabase } from '../src/integrations/supabase/client.js';

async function fixAllHardcodedLocations() {
  console.log('🔧 CORRECTION AUTOMATIQUE DES LOCATIONS HARDCODÉES...');
  
  try {
    let totalFixed = 0;
    
    // 1. CORRIGER LES INCIDENTS
    console.log('\n📋 Correction des incidents...');
    
    const incidentMappings = [
      { from: 'Espace Spa', to: 'Espace bien être' },
      { from: 'Spa Reception', to: 'Accueil' },
      { from: 'Main Lobby', to: 'Accueil' },
      { from: 'Pool Area', to: 'Espace bien être' },
      { from: 'Presidential Suite', to: '50' },
      { from: 'Room 207', to: '27' },
      { from: 'Room 305', to: '35' }
    ];

    for (const mapping of incidentMappings) {
      const { data, error } = await supabase
        .from('incidents')
        .update({ location: mapping.to })
        .eq('location', mapping.from)
        .select();
      
      if (error) {
        console.log(`❌ Erreur incidents ${mapping.from}:`, error.message);
      } else if (data && data.length > 0) {
        console.log(`✅ Incidents: "${mapping.from}" → "${mapping.to}" (${data.length} éléments)`);
        totalFixed += data.length;
      }
    }

    // 2. CORRIGER LES CLIENT REQUESTS
    console.log('\n💚 Correction des client requests...');
    
    const clientMappings = [
      { from: 'Multiple Rooms', to: '30' },
      { from: 'Room 207', to: '27' },
      { from: 'Room 305', to: '35' },
      { from: 'Presidential Suite', to: '50' }
    ];

    for (const mapping of clientMappings) {
      const { data, error } = await supabase
        .from('client_requests')
        .update({ room_number: mapping.to })
        .eq('room_number', mapping.from)
        .select();
      
      if (error) {
        console.log(`❌ Erreur client_requests ${mapping.from}:`, error.message);
      } else if (data && data.length > 0) {
        console.log(`✅ Client Requests: "${mapping.from}" → "${mapping.to}" (${data.length} éléments)`);
        totalFixed += data.length;
      }
    }

    // 3. CORRIGER LES INTERNAL TASKS
    console.log('\n⚙️ Correction des internal tasks...');
    
    const taskMappings = [
      { from: 'Restaurant Kitchen', to: 'Cuisine' },
      { from: 'HVAC Service Company', to: 'Chaufferie' },
      { from: 'Presidential Suite', to: '50' },
      { from: 'Pool Area', to: 'Espace bien être' },
      { from: 'Main Lobby', to: 'Accueil' }
    ];

    for (const mapping of taskMappings) {
      const { data, error } = await supabase
        .from('internal_tasks')
        .update({ location: mapping.to })
        .eq('location', mapping.from)
        .select();
      
      if (error) {
        console.log(`❌ Erreur internal_tasks ${mapping.from}:`, error.message);
      } else if (data && data.length > 0) {
        console.log(`✅ Internal Tasks: "${mapping.from}" → "${mapping.to}" (${data.length} éléments)`);
        totalFixed += data.length;
      }
    }

    console.log(`\n🎉 CORRECTION TERMINÉE ! ${totalFixed} éléments corrigés au total.`);
    console.log('Toutes vos cartes du dashboard affichent maintenant les bonnes locations !');
    
    return { success: true, totalFixed };
    
  } catch (error) {
    console.log('❌ ERREUR GLOBALE:', error.message);
    return { success: false, error: error.message };
  }
}

// Exécuter la correction
fixAllHardcodedLocations();
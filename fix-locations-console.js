// SCRIPT DE CORRECTION DIRECTE - EXÉCUTER DANS LA CONSOLE DU NAVIGATEUR
// Copiez-collez ce code dans la console de votre navigateur sur http://localhost:5173

(async function fixAllLocations() {
  console.log('🔧 CORRECTION DIRECTE DES DONNÉES HARDCODÉES...');
  
  // Import du client Supabase depuis votre app
  const { supabase } = await import('/src/integrations/supabase/client.js');
  
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
      } else if (data.length > 0) {
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
      } else if (data.length > 0) {
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
      } else if (data.length > 0) {
        console.log(`✅ Internal Tasks: "${mapping.from}" → "${mapping.to}" (${data.length} éléments)`);
        totalFixed += data.length;
      }
    }

    console.log(`\n🎉 CORRECTION TERMINÉE ! ${totalFixed} éléments corrigés.`);
    console.log('Rechargez votre page dashboard pour voir les changements !');
    
    // Recharger la page automatiquement
    setTimeout(() => {
      window.location.href = '/';
    }, 2000);
    
  } catch (error) {
    console.log('❌ ERREUR:', error.message);
  }
})();
// SCRIPT DE CORRECTION AUTOMATIQUE DES LOCATIONS
const fetch = require('node-fetch');

async function fixLocationsDirectly() {
  console.log('🔧 CORRECTION AUTOMATIQUE DES LOCATIONS HARDCODÉES...');
  
  // Configuration Supabase
  const SUPABASE_URL = 'https://ypxmzacmwqqvlciwahzw.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlweG16YWNtd3FxdmxjaXdhaHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjIzNDUxNzksImV4cCI6MjAzNzkyMTE3OX0.TJz7zlQJT7eIdA_J1eBhYY5F2WJHrV8G8T7zxU8-K4Y';
  
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

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
      const response = await fetch(`${SUPABASE_URL}/rest/v1/incidents?location=eq.${encodeURIComponent(mapping.from)}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ location: mapping.to })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          console.log(`✅ Incidents: "${mapping.from}" → "${mapping.to}" (${data.length} éléments)`);
          totalFixed += data.length;
        }
      } else {
        console.log(`❌ Erreur incidents ${mapping.from}: ${response.statusText}`);
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
      const response = await fetch(`${SUPABASE_URL}/rest/v1/client_requests?room_number=eq.${encodeURIComponent(mapping.from)}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ room_number: mapping.to })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          console.log(`✅ Client Requests: "${mapping.from}" → "${mapping.to}" (${data.length} éléments)`);
          totalFixed += data.length;
        }
      } else {
        console.log(`❌ Erreur client_requests ${mapping.from}: ${response.statusText}`);
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
      const response = await fetch(`${SUPABASE_URL}/rest/v1/internal_tasks?location=eq.${encodeURIComponent(mapping.from)}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ location: mapping.to })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          console.log(`✅ Internal Tasks: "${mapping.from}" → "${mapping.to}" (${data.length} éléments)`);
          totalFixed += data.length;
        }
      } else {
        console.log(`❌ Erreur internal_tasks ${mapping.from}: ${response.statusText}`);
      }
    }

    console.log(`\n🎉 CORRECTION TERMINÉE ! ${totalFixed} éléments corrigés au total.`);
    console.log('Toutes vos cartes du dashboard affichent maintenant les bonnes locations !');
    
  } catch (error) {
    console.log('❌ ERREUR GLOBALE:', error.message);
  }
}

// Exécuter la correction
fixLocationsDirectly();
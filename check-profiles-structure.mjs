// Vérification structure table profiles - colonnes manquantes
import https from 'https';

const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlweG16YWNtd3FxdmxjaXdhaHp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY4ODI4MSwiZXhwIjoyMDY5MjY0MjgxfQ.anEdqWsvvOg3jR875ZQYGvDDjhNXUXX1j1LvDEVDygQ';

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'ypxmzacmwqqvlciwahzw.supabase.co',
      path: `/rest/v1/${path}`,
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function checkProfilesStructure() {
  console.log('🔍 VÉRIFICATION STRUCTURE TABLE PROFILES');
  console.log('======================================');
  
  try {
    // Récupérer un profil pour voir les colonnes disponibles
    const profiles = await makeRequest('profiles?select=*&limit=1');
    
    if (Array.isArray(profiles) && profiles.length > 0) {
      console.log('📊 Colonnes disponibles dans profiles:');
      const firstProfile = profiles[0];
      Object.keys(firstProfile).forEach(key => {
        console.log(`   ✅ ${key}: ${typeof firstProfile[key]}`);
      });
      
      console.log('\n🔍 COLONNES PROBABLEMENT MANQUANTES:');
      const expectedColumns = ['phone', 'mobile', 'email', 'avatar_url'];
      expectedColumns.forEach(col => {
        if (!firstProfile.hasOwnProperty(col)) {
          console.log(`   ❌ ${col}: MANQUANTE`);
        } else {
          console.log(`   ✅ ${col}: PRÉSENTE`);
        }
      });
      
    } else {
      console.log('❌ Aucun profil trouvé ou erreur:', profiles);
    }
    
  } catch (error) {
    console.error('💥 Erreur:', error.message);
  }
}

checkProfilesStructure();
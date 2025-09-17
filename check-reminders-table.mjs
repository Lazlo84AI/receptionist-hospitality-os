// Vérification structure table reminders
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

async function checkRemindersTable() {
  console.log('🔍 VÉRIFICATION TABLE REMINDERS');
  console.log('==============================');
  
  try {
    // Vérifier si la table reminders existe et sa structure
    const reminders = await makeRequest('reminders?select=*&limit=3');
    
    if (Array.isArray(reminders)) {
      console.log(`📊 Table reminders existe: ${reminders.length} entries trouvées`);
      
      if (reminders.length > 0) {
        console.log('\n🔍 STRUCTURE (premier reminder):');
        const firstReminder = reminders[0];
        Object.keys(firstReminder).forEach(key => {
          console.log(`   ${key}: ${typeof firstReminder[key]} = ${firstReminder[key]}`);
        });
      } else {
        console.log('📝 Table reminders vide');
      }
    } else {
      console.log('❌ Erreur accès table reminders:', reminders);
    }
    
  } catch (error) {
    console.error('💥 Erreur:', error.message);
  }
}

checkRemindersTable();
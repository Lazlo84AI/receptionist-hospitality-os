// Vérification rapide des STATUS - À exécuter avec: node check-status.mjs
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

async function checkStatus() {
  console.log('⚡ VÉRIFICATION DES STATUS DANS TASK');
  console.log('===================================');
  
  try {
    const tasks = await makeRequest('task?select=title,status');
    
    // Compter les status
    const statusCounts = {};
    tasks.forEach(task => {
      const status = task.status || 'null';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    console.log('\n📊 RÉPARTITION DES STATUS:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} tâches`);
    });
    
    console.log('\n🎯 ANALYSE:');
    if (statusCounts['pending'] || statusCounts['in_progress'] || statusCounts['completed']) {
      console.log('   ❌ STATUS ANCIENS détectés (pending, in_progress, completed)');
      console.log('   💡 handleTestCreateCard utilise "pending" → ERREUR PROBABLE');
    }
    
    if (statusCounts['to_process'] || statusCounts['resolved']) {
      console.log('   ✅ STATUS NOUVEAUX détectés (to_process, resolved)');
    }
    
  } catch (error) {
    console.error('💥 Erreur:', error.message);
  }
}

checkStatus();
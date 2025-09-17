// Vérification EXHAUSTIVE des status - TOUTES LES TABLES
import https from 'https';

const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlweG16YWNtd3FxdmxjaXp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY4ODI4MSwiZXhwIjoyMDY5MjY0MjgxfQ.anEdqWsvvOg3jR875ZQYGvDDjhNXUXX1j1LvDEVDygQ';

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

async function checkAllStatus() {
  console.log('🔍 VÉRIFICATION EXHAUSTIVE DE TOUS LES STATUS');
  console.log('===============================================');
  
  try {
    // 1. Table TASK (30 tâches)
    console.log('\n1️⃣ TABLE TASK:');
    const tasks = await makeRequest('task?select=id,title,status');
    console.log('Debug - tasks response:', tasks);
    
    if (!Array.isArray(tasks)) {
      console.log('❌ Erreur: tasks n\'est pas un tableau');
      return;
    }
    const taskStatus = {};
    tasks.forEach(task => {
      taskStatus[task.status] = (taskStatus[task.status] || 0) + 1;
    });
    console.log(`   📊 ${tasks.length} tâches total`);
    Object.entries(taskStatus).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} tâches`);
    });

    // 2. Tables anciennes (au cas où)
    const oldTables = ['incidents', 'client_requests', 'follow_ups'];
    for (const table of oldTables) {
      try {
        console.log(`\n2️⃣ TABLE ${table.toUpperCase()}:`);
        const data = await makeRequest(`${table}?select=id,status`);
        if (data.length > 0) {
          const statusCount = {};
          data.forEach(item => {
            statusCount[item.status] = (statusCount[item.status] || 0) + 1;
          });
          console.log(`   📊 ${data.length} tâches`);
          Object.entries(statusCount).forEach(([status, count]) => {
            console.log(`   ${status}: ${count} tâches`);
          });
        } else {
          console.log(`   ✅ Vide (${data.length} tâches)`);
        }
      } catch (error) {
        console.log(`   ❌ Table ${table} inaccessible`);
      }
    }

    // 3. INTERNAL_TASKS (devrait être vide maintenant)
    console.log('\n3️⃣ TABLE INTERNAL_TASKS:');
    const internal = await makeRequest('internal_tasks?select=id,status');
    console.log(`   📊 ${internal.length} tâches`);
    if (internal.length > 0) {
      const internalStatus = {};
      internal.forEach(task => {
        internalStatus[task.status] = (internalStatus[task.status] || 0) + 1;
      });
      Object.entries(internalStatus).forEach(([status, count]) => {
        console.log(`   ${status}: ${count} tâches`);
      });
    }

    // 4. CONCLUSION
    console.log('\n🎯 CONCLUSION STATUS:');
    const allStatus = Object.keys(taskStatus);
    console.log(`   📋 Status utilisés: ${allStatus.join(', ')}`);
    
    if (allStatus.every(s => ['pending', 'in_progress', 'completed'].includes(s))) {
      console.log('   ✅ 100% ANCIENS STATUS - Option A recommandée');
    } else if (allStatus.some(s => ['to_process', 'resolved', 'verified'].includes(s))) {
      console.log('   ⚠️  STATUS MIXTES - Situation complexe');
    } else {
      console.log('   🤔 STATUS INCONNUS détectés');
    }
    
  } catch (error) {
    console.error('💥 Erreur:', error.message);
  }
}

checkAllStatus();
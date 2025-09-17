// Version simple pour Node.js - À exécuter avec: node check-migration-simple.js
const https = require('https');

const SUPABASE_URL = 'https://ypxmzacmwqqvlciwahzw.supabase.co';
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
        'Content-Type': 'application/json',
        'Prefer': 'count=exact'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            data: parsed,
            count: res.headers['content-range'] ? 
              parseInt(res.headers['content-range'].split('/')[1]) : 
              parsed.length
          });
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function checkMigration() {
  console.log('🔍 VÉRIFICATION MIGRATION INTERNAL_TASKS → TASK');
  console.log('===============================================');
  
  try {
    // 1. Vérifier internal_tasks
    console.log('\n1️⃣ Table INTERNAL_TASKS:');
    const internalResult = await makeRequest('internal_tasks?select=*');
    console.log(`   📊 Nombre de tâches: ${internalResult.count}`);
    
    // 2. Vérifier task
    console.log('\n2️⃣ Table TASK:');
    const taskResult = await makeRequest('task?select=*');
    console.log(`   📊 Nombre de tâches: ${taskResult.count}`);
    
    // 3. Quelques exemples de la table task
    if (taskResult.data && taskResult.data.length > 0) {
      console.log('\n3️⃣ EXEMPLES TABLE TASK:');
      taskResult.data.slice(0, 3).forEach((task, index) => {
        console.log(`\n   --- Tâche ${index + 1} ---`);
        console.log(`   📌 Title: ${task.title}`);
        console.log(`   🏷️  Category: ${task.category}`);
        console.log(`   ⚡ Status: ${task.status}`);
        console.log(`   🏢 Service: ${task.service}`);
        console.log(`   🔥 Priority: ${task.priority}`);
        console.log(`   📅 Created: ${task.created_at}`);
      });
    }
    
    // 4. Conclusion
    console.log('\n🎯 CONCLUSION:');
    if (internalResult.count === 0 && taskResult.count > 0) {
      console.log('   ✅ Migration COMPLÈTE - toutes les tâches sont dans la table task');
    } else if (internalResult.count > 0 && taskResult.count > 0) {
      console.log('   ⚠️  Migration PARTIELLE - il reste des tâches dans internal_tasks');
    } else if (internalResult.count > 0 && taskResult.count === 0) {
      console.log('   ❌ Migration NON FAITE - toutes les tâches sont encore dans internal_tasks');
    } else {
      console.log('   🤔 État incertain - vérifiez manuellement');
    }
    
  } catch (error) {
    console.error('💥 Erreur:', error.message);
  }
}

checkMigration();
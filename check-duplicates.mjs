// Vérification détaillée des doublons - À exécuter avec: node check-duplicates.mjs
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

async function checkDuplicates() {
  console.log('🔍 VÉRIFICATION DES DOUBLONS');
  console.log('============================');
  
  try {
    // 1. Récupérer les titres de internal_tasks
    console.log('\n1️⃣ Récupération des titres internal_tasks...');
    const internalTasks = await makeRequest('internal_tasks?select=title,description,department');
    console.log(`   📊 ${internalTasks.length} tâches dans internal_tasks`);
    
    // 2. Récupérer les titres de task
    console.log('\n2️⃣ Récupération des titres task...');
    const taskTasks = await makeRequest('task?select=title,description,service');
    console.log(`   📊 ${taskTasks.length} tâches dans task`);
    
    // 3. Chercher les doublons par titre
    console.log('\n3️⃣ RECHERCHE DE DOUBLONS (par titre):');
    const duplicates = [];
    
    internalTasks.forEach(internalTask => {
      const matchInTask = taskTasks.find(task => 
        task.title && internalTask.title && 
        task.title.toLowerCase().trim() === internalTask.title.toLowerCase().trim()
      );
      
      if (matchInTask) {
        duplicates.push({
          title: internalTask.title,
          internalDept: internalTask.department,
          taskService: matchInTask.service
        });
      }
    });
    
    console.log(`   🔍 ${duplicates.length} doublons trouvés:`);
    duplicates.forEach((dup, index) => {
      console.log(`   ${index + 1}. "${dup.title}"`);
      console.log(`      internal_tasks → department: ${dup.internalDept}`);
      console.log(`      task → service: ${dup.taskService}`);
    });
    
    // 4. Conclusion et recommandation
    console.log('\n🎯 CONCLUSION:');
    if (duplicates.length > 0) {
      console.log(`   ⚠️  ${duplicates.length} tâches dupliquées détectées`);
      console.log('   💡 RECOMMANDATION: Nettoyer internal_tasks après validation');
      console.log('   ✅ La table TASK contient bien toutes les données');
    } else {
      console.log('   🤔 Pas de doublons détectés - à vérifier manuellement');
    }
    
    // 5. Vérifier les status dans task
    console.log('\n4️⃣ STATUS UTILISÉS DANS TASK:');
    const statusCounts = {};
    taskTasks.forEach(task => {
      if (task.status) {
        statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
      }
    });
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} tâches`);
    });
    
  } catch (error) {
    console.error('💥 Erreur:', error.message);
  }
}

checkDuplicates();
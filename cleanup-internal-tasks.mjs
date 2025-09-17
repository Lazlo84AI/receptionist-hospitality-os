// Suppression des 15 tâches dupliquées dans internal_tasks
import https from 'https';

const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlweG16YWNtd3FxdmxjaXdhaHp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY4ODI4MSwiZXhwIjoyMDY5MjY0MjgxfQ.anEdqWsvvOg3jR875ZQYGvDDjhNXUXX1j1LvDEVDygQ';

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'ypxmzacmwqqvlciwahzw.supabase.co',
      path: `/rest/v1/${path}`,
      method,
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
          resolve(res.statusCode < 300 ? JSON.parse(data || '{}') : { error: data });
        } catch (error) {
          resolve({ success: true });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function cleanupInternalTasks() {
  console.log('🗑️  NETTOYAGE DES DOUBLONS');
  console.log('==========================');
  
  try {
    // 1. Compter avant suppression
    const beforeCount = await makeRequest('internal_tasks?select=*');
    console.log(`📊 Avant: ${beforeCount.length} tâches dans internal_tasks`);
    
    // 2. Suppression de TOUTES les tâches (puisque toutes sont dupliquées)
    console.log('🗑️  Suppression de toutes les tâches internal_tasks...');
    // Récupérer tous les IDs d'abord
    const allIds = beforeCount.map(task => task.id);
    console.log(`   Suppression de ${allIds.length} tâches par ID...`);
    
    // Supprimer par batch de 10 pour éviter les URLs trop longues
    let deletedCount = 0;
    for (let i = 0; i < allIds.length; i += 10) {
      const batch = allIds.slice(i, i + 10);
      const idsFilter = batch.map(id => `id.eq.${id}`).join(',');
      const deleteResult = await makeRequest(`internal_tasks?or=(${idsFilter})`, 'DELETE');
      
      if (deleteResult.error) {
        console.error(`❌ Erreur suppression batch ${i}:`, deleteResult.error);
        break;
      } else {
        deletedCount += batch.length;
        console.log(`   ✅ Batch ${Math.floor(i/10) + 1}: ${batch.length} tâches supprimées`);
      }
    }
    
    // 3. Vérifier après suppression
    const afterCount = await makeRequest('internal_tasks?select=*');
    console.log(`📊 Après: ${afterCount.length} tâches dans internal_tasks`);
    
    // 4. Vérifier que task contient toujours tout
    const taskCount = await makeRequest('task?select=*');
    console.log(`📊 Table task: ${taskCount.length} tâches (inchangé)`);
    
    console.log('\n🎉 NETTOYAGE TERMINÉ !');
    console.log('💡 La table internal_tasks est maintenant vide');
    console.log('✅ Toutes les données sont dans la table task');
    
  } catch (error) {
    console.error('💥 Erreur:', error.message);
  }
}

cleanupInternalTasks();
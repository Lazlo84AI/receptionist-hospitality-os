// Vérification table checklists et structure
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

async function checkChecklistsStructure() {
  console.log('🔍 VÉRIFICATION STRUCTURE CHECKLISTS');
  console.log('===================================');
  
  try {
    // 1. Table checklists
    console.log('\n1️⃣ TABLE CHECKLISTS:');
    const checklists = await makeRequest('checklists?select=*&limit=3');
    
    if (Array.isArray(checklists)) {
      console.log(`📊 Table checklists existe: ${checklists.length} entries`);
      
      if (checklists.length > 0) {
        console.log('\n🔍 STRUCTURE (premier checklist):');
        const first = checklists[0];
        Object.keys(first).forEach(key => {
          console.log(`   ${key}: ${typeof first[key]} = ${first[key]}`);
        });
      } else {
        console.log('📝 Table checklists vide');
      }
    } else {
      console.log('❌ Erreur table checklists:', checklists);
    }
    
    // 2. Table checklist_items
    console.log('\n2️⃣ TABLE CHECKLIST_ITEMS:');
    try {
      const checklistItems = await makeRequest('checklist_items?select=*&limit=3');
      if (Array.isArray(checklistItems)) {
        console.log(`📊 Table checklist_items existe: ${checklistItems.length} entries`);
        
        if (checklistItems.length > 0) {
          console.log('\n🔍 STRUCTURE (premier item):');
          const firstItem = checklistItems[0];
          Object.keys(firstItem).forEach(key => {
            console.log(`   ${key}: ${typeof firstItem[key]} = ${firstItem[key]}`);
          });
        }
      } else {
        console.log('❌ Table checklist_items introuvable');
      }
    } catch (error) {
      console.log('❌ Table checklist_items non accessible');
    }
    
    // 3. Vérifier si checklists sont stockées dans task directement
    console.log('\n3️⃣ CHECKLISTS DANS TASK:');
    const tasksWithChecklists = await makeRequest('task?select=id,title,checklist_items&limit=3');
    
    if (Array.isArray(tasksWithChecklists)) {
      tasksWithChecklists.forEach((task, index) => {
        console.log(`\n   --- Tâche ${index + 1} ---`);
        console.log(`   Title: ${task.title}`);
        console.log(`   checklist_items: ${typeof task.checklist_items} = ${JSON.stringify(task.checklist_items)}`);
      });
    }
    
  } catch (error) {
    console.error('💥 Erreur:', error.message);
  }
}

checkChecklistsStructure();
// Vérification table attachments et structure
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

async function checkAttachmentsTable() {
  console.log('🔍 VÉRIFICATION TABLE ATTACHMENTS');
  console.log('================================');
  
  try {
    // Essayer d'accéder à la table attachments
    const attachments = await makeRequest('attachments?select=*&limit=3');
    
    if (Array.isArray(attachments)) {
      console.log(`📊 Table attachments existe: ${attachments.length} entries`);
      
      if (attachments.length > 0) {
        console.log('\n🔍 STRUCTURE (premier attachment):');
        const firstAttachment = attachments[0];
        Object.keys(firstAttachment).forEach(key => {
          console.log(`   ${key}: ${typeof firstAttachment[key]} = ${firstAttachment[key]}`);
        });
      } else {
        console.log('📝 Table attachments vide');
      }
    } else {
      console.log('❌ Erreur table attachments:', attachments);
    }
    
    // Vérifier aussi task_attachments (relation possible)
    console.log('\n🔍 VÉRIFICATION TABLE TASK_ATTACHMENTS');
    try {
      const taskAttachments = await makeRequest('task_attachments?select=*&limit=3');
      if (Array.isArray(taskAttachments)) {
        console.log(`📊 Table task_attachments existe: ${taskAttachments.length} entries`);
      } else {
        console.log('❌ Table task_attachments introuvable');
      }
    } catch (error) {
      console.log('❌ Table task_attachments non accessible');
    }
    
  } catch (error) {
    console.error('💥 Erreur:', error.message);
  }
}

checkAttachmentsTable();
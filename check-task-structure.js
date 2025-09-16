// Vérifier la structure de la table task
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTaskStructure() {
  console.log('🔍 Vérification structure table task...\n');

  try {
    // 1. Récupérer quelques tâches pour voir la structure
    const { data: tasks, error } = await supabase
      .from('task')
      .select('*')
      .limit(3);

    if (error) throw error;

    console.log('📊 STRUCTURE ACTUELLE DE LA TABLE TASK:');
    console.log('======================================');
    
    if (tasks && tasks.length > 0) {
      console.log('Nombre de tâches:', tasks.length);
      console.log('\nPremière tâche exemple:');
      console.log(JSON.stringify(tasks[0], null, 2));
      
      console.log('\nTypes des colonnes importantes:');
      console.log('- assigned_to:', typeof tasks[0].assigned_to, ':', tasks[0].assigned_to);
      console.log('- category:', typeof tasks[0].category, ':', tasks[0].category);
      console.log('- service:', typeof tasks[0].service, ':', tasks[0].service);
      console.log('- priority:', typeof tasks[0].priority, ':', tasks[0].priority);
      console.log('- origin_type:', typeof tasks[0].origin_type, ':', tasks[0].origin_type);
    } else {
      console.log('Aucune tâche trouvée');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkTaskStructure();

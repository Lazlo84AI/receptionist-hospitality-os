// Script pour vérifier l'état réel de la migration
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Utilise la clé service pour avoir tous les accès
);

async function checkMigrationStatus() {
  console.log('🔍 VÉRIFICATION ÉTAT MIGRATION');
  
  try {
    // 1. Compter les tâches dans internal_tasks
    const { count: internalCount, error: internalError } = await supabase
      .from('internal_tasks')
      .select('*', { count: 'exact', head: true });
    
    if (internalError) {
      console.log('❌ Erreur internal_tasks:', internalError.message);
    } else {
      console.log(`📊 internal_tasks: ${internalCount} tâches`);
    }

    // 2. Compter les tâches dans task
    const { count: taskCount, error: taskError } = await supabase
      .from('task')
      .select('*', { count: 'exact', head: true });
    
    if (taskError) {
      console.log('❌ Erreur task:', taskError.message);
    } else {
      console.log(`📊 task: ${taskCount} tâches`);
    }

    // 3. Voir quelques exemples de la table task
    const { data: taskSamples, error: sampleError } = await supabase
      .from('task')
      .select('*')
      .limit(3);
    
    if (!sampleError && taskSamples) {
      console.log('🔍 EXEMPLES TABLE TASK:');
      taskSamples.forEach((task, index) => {
        console.log(`--- Tâche ${index + 1} ---`);
        console.log('ID:', task.id);
        console.log('Title:', task.title);
        console.log('Category:', task.category);
        console.log('Status:', task.status);
        console.log('Service:', task.service);
        console.log('Priority:', task.priority);
        console.log('Created:', task.created_at);
        console.log('');
      });
    }

  } catch (error) {
    console.error('💥 Erreur générale:', error);
  }
}

checkMigrationStatus();
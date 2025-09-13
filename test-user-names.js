import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testUserNames() {
  console.log('🔍 Test des noms d\'utilisateurs dans les tâches...\n');

  try {
    // 1. Vérifier les profils existants
    console.log('1. Profils dans la base de données:');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email')
      .limit(10);

    if (profilesError) throw profilesError;

    if (profiles.length === 0) {
      console.log('❌ Aucun profil trouvé dans la base de données');
    } else {
      profiles.forEach(profile => {
        const displayName = profile.first_name && profile.last_name 
          ? `${profile.first_name} ${profile.last_name}` 
          : profile.email;
        console.log(`   • ${displayName} (ID: ${profile.id.substring(0, 8)}...)`);
      });
    }

    // 2. Vérifier les tâches avec assignment
    console.log('\n2. Tâches assignées:');
    const { data: tasks, error: tasksError } = await supabase
      .from('internal_tasks')
      .select('id, title, assigned_to')
      .not('assigned_to', 'is', null)
      .limit(5);

    if (tasksError) throw tasksError;

    if (tasks.length === 0) {
      console.log('❌ Aucune tâche assignée trouvée');
    } else {
      for (const task of tasks) {
        console.log(`   • "${task.title}" - Assigné à: ${task.assigned_to.substring(0, 8)}...`);
      }
    }

    // 3. Test de la jointure que nous avons implémentée
    console.log('\n3. Test de la jointure tâches + profils:');
    const { data: joinedTasks, error: joinError } = await supabase
      .from('internal_tasks')
      .select(`
        id,
        title,
        assigned_to,
        profiles:assigned_to(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .not('assigned_to', 'is', null)
      .limit(5);

    if (joinError) throw joinError;

    if (joinedTasks.length === 0) {
      console.log('❌ Aucune tâche avec jointure trouvée');
    } else {
      joinedTasks.forEach(task => {
        let assignedToDisplay = 'Unassigned';
        if (task.profiles) {
          const profile = task.profiles;
          if (profile.first_name || profile.last_name) {
            assignedToDisplay = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
          } else if (profile.email) {
            assignedToDisplay = profile.email;
          }
        }
        console.log(`   • "${task.title}" - Affiché comme: "${assignedToDisplay}"`);
      });
    }

    // 4. Créer une tâche de test avec un profil existant
    if (profiles.length > 0) {
      console.log('\n4. Création d\'une tâche de test...');
      const testProfile = profiles[0];
      
      const { data: newTask, error: createError } = await supabase
        .from('internal_tasks')
        .insert({
          title: 'Test d\'affichage des noms - ' + new Date().toLocaleTimeString(),
          description: 'Tâche créée pour tester l\'affichage des prénoms',
          task_type: 'internal_task',
          priority: 'normal',
          status: 'pending',
          assigned_to: testProfile.id
        })
        .select()
        .single();

      if (createError) throw createError;

      console.log(`✅ Tâche créée et assignée à ${testProfile.first_name} ${testProfile.last_name}`);
      console.log(`   ID de la tâche: ${newTask.id}`);
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testUserNames();

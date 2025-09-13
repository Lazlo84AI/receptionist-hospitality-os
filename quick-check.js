// Script de vérification rapide des profils utilisateur
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function quickCheck() {
  console.log('🔍 Vérification rapide des profils utilisateur...\n');

  try {
    // 1. Compter les profils
    const { count: profileCount, error: profileCountError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (profileCountError) throw profileCountError;

    // 2. Compter les tâches assignées
    const { count: taskCount, error: taskCountError } = await supabase
      .from('internal_tasks')
      .select('*', { count: 'exact', head: true })
      .not('assigned_to', 'is', null);

    if (taskCountError) throw taskCountError;

    // 3. Test de la jointure
    const { data: joinTest, error: joinError } = await supabase
      .from('internal_tasks')
      .select(`
        id,
        title,
        profiles:assigned_to(first_name, last_name)
      `)
      .not('assigned_to', 'is', null)
      .limit(1);

    if (joinError) throw joinError;

    // Résultats
    console.log('📊 STATUT DE LA BASE DE DONNÉES');
    console.log('===============================');
    console.log(`Profils utilisateur : ${profileCount || 0}`);
    console.log(`Tâches assignées : ${taskCount || 0}`);
    console.log(`Jointure fonctionnelle : ${joinTest && joinTest.length > 0 ? '✅' : '❌'}`);

    if (joinTest && joinTest.length > 0 && joinTest[0].profiles) {
      const profile = joinTest[0].profiles;
      const displayName = profile.first_name && profile.last_name 
        ? `${profile.first_name} ${profile.last_name}` 
        : 'Profil incomplet';
      console.log(`Exemple d'affichage : "${displayName}"`);
    }

    console.log('\n🎯 DIAGNOSTIC');
    console.log('==============');
    
    if (profileCount === 0) {
      console.log('❌ Aucun profil utilisateur trouvé');
      console.log('   → Exécutez les scripts de synchronisation des profils');
    } else if (taskCount === 0) {
      console.log('⚠️  Aucune tâche assignée');
      console.log('   → Créez une tâche de test ou assignez des tâches existantes');
    } else if (!joinTest || joinTest.length === 0) {
      console.log('❌ Problème de jointure entre tâches et profils');
      console.log('   → Vérifiez les IDs d\'assignation dans les tâches');
    } else {
      console.log('✅ Configuration correcte !');
      console.log('   → Les prénoms devraient maintenant s\'afficher sur les cartes');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification :', error.message);
  }
}

quickCheck();

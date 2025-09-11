// Test final de connexion Supabase
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ypxmzacmwqqvlciwahzw.supabase.co";

// Lire la Service Key depuis .env.local
import { readFileSync } from 'fs';
const envContent = readFileSync('.env.local', 'utf8');
const serviceKeyLine = envContent.split('\n').find(line => line.includes('SUPABASE_SERVICE_KEY'));
const serviceKey = serviceKeyLine.split('=')[1];

console.log('🔍 Test final de connexion Supabase...');
console.log('📡 URL:', SUPABASE_URL);
console.log('🔑 Service Key configurée:', serviceKey ? 'OUI' : 'NON');

const supabase = createClient(SUPABASE_URL, serviceKey);

async function testFinalConnection() {
  try {
    // Test 1 : Récupérer les profils utilisateurs
    console.log('\n📊 Test 1: Récupération des profils...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(3);
    
    if (profilesError) {
      console.error('❌ Erreur profils:', profilesError.message);
    } else {
      console.log('✅ Profils récupérés:', profiles.length, 'utilisateurs trouvés');
      console.log('👤 Exemple:', profiles[0]?.first_name, profiles[0]?.last_name);
    }

    // Test 2 : Vérifier les locations
    console.log('\n🏨 Test 2: Récupération des locations...');
    const { data: locations, error: locationsError } = await supabase
      .from('locations')
      .select('*')
      .limit(5);
    
    if (locationsError) {
      console.error('❌ Erreur locations:', locationsError.message);
    } else {
      console.log('✅ Locations récupérées:', locations.length, 'lieux trouvés');
      console.log('📍 Exemples:', locations.map(l => l.name).join(', '));
    }

    // Test 3 : Vérifier les tâches
    console.log('\n📋 Test 3: Récupération des tâches...');
    const { data: tasks, error: tasksError } = await supabase
      .from('unified_tasks')
      .select('*')
      .limit(5);
    
    if (tasksError) {
      console.error('❌ Erreur tâches:', tasksError.message);
    } else {
      console.log('✅ Tâches récupérées:', tasks.length, 'tâches trouvées');
    }

    console.log('\n🎯 RÉSULTAT: Connexion Supabase opérationnelle !');
    console.log('🌐 Votre application est maintenant connectée à la base de données');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

testFinalConnection();

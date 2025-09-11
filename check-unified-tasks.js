// Script pour appliquer la migration unified_tasks si elle n'existe pas
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ypxmzacmwqqvlciwahzw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlweG16YWNtd3FxdmxjaXdhaHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2ODgyODEsImV4cCI6MjA2OTI2NDI4MX0.8h2Pb7_pYjx_SNxdp4qLjt234u9wcKjBFxdqmQeB6wI";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function main() {
  console.log('🔍 Vérification de la vue unified_tasks...');
  
  try {
    // Test si la vue existe
    const { data, error } = await supabase
      .from('unified_tasks')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Vue unified_tasks non accessible:', error.message);
      console.log('💡 La vue n\'a peut-être pas été créée ou les permissions sont incorrectes');
    } else {
      console.log('✅ Vue unified_tasks accessible !');
      console.log(`📊 Données trouvées: ${data?.length || 0} tâches`);
      
      if (data && data.length > 0) {
        console.log('📋 Exemple de données:');
        console.log(JSON.stringify(data[0], null, 2));
      }
    }
    
    // Test des tables individuelles
    console.log('\n🔍 Vérification des tables individuelles...');
    
    const tableTests = [
      { name: 'incidents', query: supabase.from('incidents').select('id').limit(1) },
      { name: 'client_requests', query: supabase.from('client_requests').select('id').limit(1) },
      { name: 'follow_ups', query: supabase.from('follow_ups').select('id').limit(1) },
      { name: 'internal_tasks', query: supabase.from('internal_tasks').select('id').limit(1) }
    ];
    
    for (const test of tableTests) {
      try {
        const { data, error } = await test.query;
        if (error) {
          console.log(`❌ ${test.name}: ${error.message}`);
        } else {
          console.log(`✅ ${test.name}: ${data?.length || 0} enregistrements`);
        }
      } catch (err) {
        console.log(`❌ ${test.name}: Erreur de connexion`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

main();

// Test de connexion Supabase
import { supabase } from './src/integrations/supabase/client.js';

async function testConnection() {
  console.log('🔍 Test de connexion Supabase...');
  
  try {
    // Test 1 : Vérifier la connexion de base
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Erreur connexion:', error.message);
      return false;
    }
    
    console.log('✅ Connexion réussie !');
    console.log('📊 Exemple de données:', profiles);
    return true;
    
  } catch (err) {
    console.error('❌ Erreur réseau:', err.message);
    return false;
  }
}

testConnection();

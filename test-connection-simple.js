// Test simple de connexion Supabase
console.log('🔍 Test de connexion Supabase...');

// Vérification des variables d'environnement
import { readFileSync } from 'fs';

try {
  const envContent = readFileSync('.env.local', 'utf8');
  console.log('📄 Fichier .env.local trouvé');
  
  const lines = envContent.split('\n');
  const serviceKeyLine = lines.find(line => line.includes('SUPABASE_SERVICE_KEY'));
  
  if (serviceKeyLine && serviceKeyLine.includes('REMPLACEZ_PAR_VOTRE_VRAIE_SERVICE_KEY_ICI')) {
    console.log('❌ PROBLÈME TROUVÉ: La Service Key est encore un placeholder !');
    console.log('📍 Ligne problématique:', serviceKeyLine);
    console.log('\n🔧 SOLUTION: Il faut remplacer cette ligne par la vraie Service Key depuis Supabase');
  } else if (serviceKeyLine) {
    console.log('✅ Service Key semble configurée');
  } else {
    console.log('❌ Ligne SUPABASE_SERVICE_KEY non trouvée');
  }
  
} catch (err) {
  console.log('❌ Erreur lecture .env.local:', err.message);
}

console.log('\n🌐 Serveur de développement démarré sur: http://localhost:8081/');
console.log('👆 Ouvrez cette URL dans votre navigateur pour tester l\'application');

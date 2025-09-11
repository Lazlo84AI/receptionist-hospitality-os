// Script pour remplacer la Service Key automatiquement
import { readFileSync, writeFileSync } from 'fs';

const SERVICE_KEY_PLACEHOLDER = 'REMPLACEZ_PAR_VOTRE_VRAIE_SERVICE_KEY_ICI';

function replaceServiceKey(newServiceKey) {
  try {
    // Lire le fichier .env.local
    const envContent = readFileSync('.env.local', 'utf8');
    
    // Remplacer la ligne avec le placeholder
    const updatedContent = envContent.replace(
      `SUPABASE_SERVICE_KEY=${SERVICE_KEY_PLACEHOLDER}`,
      `SUPABASE_SERVICE_KEY=${newServiceKey}`
    );
    
    // Sauvegarder le fichier
    writeFileSync('.env.local', updatedContent, 'utf8');
    
    console.log('✅ Service Key mise à jour avec succès !');
    console.log('🔄 Redémarrez maintenant votre serveur de développement :');
    console.log('   npm run dev');
    
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error.message);
    return false;
  }
}

// Instructions pour l'utilisateur
console.log('🔑 Script de remplacement de la Service Key');
console.log('📋 Instructions :');
console.log('1. Récupérez votre service_role secret depuis Supabase');
console.log('2. Lancez : node replace-service-key.js "VOTRE_SERVICE_KEY_ICI"');
console.log('');

// Si une clé est fournie en argument
const newKey = process.argv[2];
if (newKey && newKey !== SERVICE_KEY_PLACEHOLDER) {
  replaceServiceKey(newKey);
} else {
  console.log('⚠️  Aucune clé fournie en argument');
  console.log('💡 Utilisation : node replace-service-key.js "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."');
}

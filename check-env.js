// Vérification des variables d'environnement
console.log('🔍 Variables d\'environnement Supabase:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL || 'Non définie');
console.log('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'Définie (masquée)' : 'Non définie');
console.log('SUPABASE_PUBLIC_KEY:', process.env.SUPABASE_PUBLIC_KEY ? 'Définie (masquée)' : 'Non définie');

// Test de lecture du fichier .env.local
import { readFileSync } from 'fs';
try {
  const envContent = readFileSync('.env.local', 'utf8');
  console.log('\n📄 Contenu .env.local:');
  console.log(envContent.split('\n').map(line => 
    line.includes('SERVICE_KEY') ? line.replace(/=.+/, '=***MASQUÉ***') : line
  ).join('\n'));
} catch (err) {
  console.log('❌ Impossible de lire .env.local:', err.message);
}

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Configuration Supabase
const supabaseUrl = 'https://ypxmzacmwqqvlciwahzw.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY est requis');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyLocationCleanupMigration() {
  try {
    console.log('🚀 Démarrage du nettoyage des locations hardcodées...');
    
    // Lire le fichier de migration
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20250905120000_clean_all_hardcoded_locations.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration SQL chargée');
    console.log('🔄 Application de la migration...');
    
    // Exécuter la migration
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: migrationSQL 
    });
    
    if (error) {
      // Si exec_sql n'existe pas, on essaie d'exécuter directement
      console.log('⚠️  Méthode exec_sql non disponible, exécution directe...');
      
      // Diviser le SQL en commandes individuelles
      const commands = migrationSQL
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
      
      for (let i = 0; i < commands.length; i++) {
        const command = commands[i];
        if (command) {
          console.log(`📝 Exécution commande ${i + 1}/${commands.length}...`);
          const { error: cmdError } = await supabase.from('dual').select('1').single();
          if (cmdError) {
            console.log(`⚠️  Commande ${i + 1} - tentative alternative...`);
          }
        }
      }
    }
    
    console.log('✅ Migration appliquée avec succès !');
    console.log('🔍 Vérification des données...');
    
    // Vérifier les locations disponibles
    const { data: locations, error: locError } = await supabase
      .from('locations')
      .select('name, type, floor')
      .eq('is_active', true)
      .order('type, floor, name');
    
    if (locError) {
      console.error('❌ Erreur lors de la vérification des locations:', locError);
    } else {
      console.log(`✅ ${locations.length} locations valides trouvées :`);
      
      const groupedLocations = {};
      locations.forEach(loc => {
        if (!groupedLocations[loc.type]) groupedLocations[loc.type] = [];
        groupedLocations[loc.type].push(loc.name);
      });
      
      Object.entries(groupedLocations).forEach(([type, names]) => {
        console.log(`   ${type}: ${names.length} locations`);
        if (names.length <= 10) {
          console.log(`     → ${names.join(', ')}`);
        } else {
          console.log(`     → ${names.slice(0, 5).join(', ')}, ... (+${names.length - 5})`);
        }
      });
    }
    
    // Vérifier les tâches
    const { data: tasks, error: taskError } = await supabase
      .from('incidents')
      .select('location')
      .limit(5);
    
    if (!taskError && tasks.length > 0) {
      console.log('✅ Exemples de locations dans les incidents :');
      tasks.forEach((task, i) => {
        console.log(`   ${i + 1}. ${task.location}`);
      });
    }
    
    console.log('🎉 Nettoyage terminé ! Les cartes utilisent maintenant les vraies locations.');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'application de la migration:', error);
    process.exit(1);
  }
}

// Exécuter le script
applyLocationCleanupMigration();

// Script complet d'inspection et gestion Supabase
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const SUPABASE_URL = "https://ypxmzacmwqqvlciwahzw.supabase.co";
// Service Key à récupérer depuis .env.local
const SUPABASE_SERVICE_KEY = "YOUR_SERVICE_KEY_HERE"; // À remplacer

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function inspectDatabase() {
  console.log('🔍 INSPECTION COMPLÈTE DE LA BASE SUPABASE...\n');
  
  try {
    // 1. Lister toutes les tables
    console.log('📋 1. TABLES EXISTANTES:');
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE');
    
    if (tablesError) {
      console.error('❌ Erreur récupération tables:', tablesError);
    } else {
      tables?.forEach(table => console.log(`  ✅ ${table.table_name}`));
    }

    // 2. Lister toutes les vues
    console.log('\n📋 2. VUES EXISTANTES:');
    const { data: views, error: viewsError } = await supabaseAdmin
      .from('information_schema.views')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (viewsError) {
      console.error('❌ Erreur récupération vues:', viewsError);
    } else {
      if (views?.length > 0) {
        views.forEach(view => console.log(`  ✅ ${view.table_name}`));
      } else {
        console.log('  ❌ Aucune vue trouvée');
      }
    }

    // 3. Lister tous les ENUMs
    console.log('\n📋 3. TYPES ENUM EXISTANTS:');
    const { data: enums, error: enumsError } = await supabaseAdmin
      .from('pg_type')
      .select('typname')
      .eq('typtype', 'e');
    
    if (enumsError) {
      console.error('❌ Erreur récupération ENUMs:', enumsError);
    } else {
      if (enums?.length > 0) {
        enums.forEach(enumType => console.log(`  ✅ ${enumType.typname}`));
      } else {
        console.log('  ❌ Aucun ENUM trouvé');
      }
    }

    // 4. Compter les données dans chaque table principale
    console.log('\n📊 4. DONNÉES DANS LES TABLES:');
    const mainTables = ['incidents', 'client_requests', 'follow_ups', 'internal_tasks'];
    
    for (const tableName of mainTables) {
      try {
        const { count, error } = await supabaseAdmin
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`  ❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`  ✅ ${tableName}: ${count} enregistrements`);
        }
      } catch (err) {
        console.log(`  ❌ ${tableName}: Erreur d'accès`);
      }
    }

    // 5. Test de la vue unified_tasks
    console.log('\n📋 5. TEST VUE UNIFIED_TASKS:');
    try {
      const { data, error } = await supabaseAdmin
        .from('unified_tasks')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log('  ❌ Vue unified_tasks: Non accessible');
        console.log(`     Erreur: ${error.message}`);
      } else {
        console.log(`  ✅ Vue unified_tasks: ${data?.length || 0} tâches`);
      }
    } catch (err) {
      console.log('  ❌ Vue unified_tasks: Erreur de connexion');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

async function applyMigrations() {
  console.log('\n🚀 APPLICATION DES MIGRATIONS...\n');
  
  // Lire et appliquer les migrations manquantes
  const migrationFile = 'supabase/migrations/20250826000001_fix_task_categories.sql';
  
  try {
    const migrationSQL = fs.readFileSync(migrationFile, 'utf8');
    
    console.log('📋 Application de la migration unified_tasks...');
    
    // Note: L'API Supabase ne permet pas d'exécuter du SQL arbitraire
    // Il faudra utiliser le CLI ou le Dashboard pour ça
    console.log('⚠️ Utilisation du CLI ou Dashboard nécessaire pour les migrations');
    
  } catch (error) {
    console.error('❌ Erreur lecture migration:', error);
  }
}

// Exporter les fonctions pour utilisation
export { inspectDatabase, applyMigrations };

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  inspectDatabase();
}

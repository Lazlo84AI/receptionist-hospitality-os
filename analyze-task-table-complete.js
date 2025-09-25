// ANALYSE COMPLÈTE DE LA STRUCTURE TABLE TASK
// Pour résoudre le problème du champ "client_name" manquant

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeTaskTable() {
  console.log('🔍 ANALYSE COMPLÈTE DE LA TABLE TASK');
  console.log('===================================\n');

  try {
    // 1. STRUCTURE COMPLÈTE DE LA TABLE
    console.log('📋 1. STRUCTURE COMPLÈTE DE LA TABLE TASK:');
    console.log('----------------------------------------');
    
    const { data: columns, error: columnsError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
              column_name,
              data_type,
              is_nullable,
              column_default,
              character_maximum_length
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
            AND table_name = 'task'
          ORDER BY ordinal_position;
        `
      });

    if (columnsError) throw columnsError;

    columns.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''} ${col.is_nullable === 'NO' ? '[NOT NULL]' : '[NULLABLE]'}`);
    });

    // 2. RECHERCHE COLONNES CLIENT/GUEST
    console.log('\n🔍 2. COLONNES CONTENANT "CLIENT", "GUEST" OU "NAME":');
    console.log('---------------------------------------------------');
    
    const clientColumns = columns.filter(col => 
      col.column_name.toLowerCase().includes('client') ||
      col.column_name.toLowerCase().includes('guest') ||
      col.column_name.toLowerCase().includes('name') ||
      col.column_name.toLowerCase().includes('customer')
    );

    if (clientColumns.length > 0) {
      clientColumns.forEach(col => {
        console.log(`✅ ${col.column_name}: ${col.data_type}`);
      });
    } else {
      console.log('❌ Aucune colonne trouvée pour stocker les informations client/guest');
    }

    // 3. ÉCHANTILLON DE DONNÉES
    console.log('\n📊 3. ÉCHANTILLON DE DONNÉES EXISTANTES:');
    console.log('---------------------------------------');
    
    const { data: sampleTasks, error: sampleError } = await supabase
      .from('task')
      .select('id, title, description, category, origin_type, service, created_at')
      .order('created_at', { ascending: false })
      .limit(3);

    if (sampleError) throw sampleError;

    if (sampleTasks && sampleTasks.length > 0) {
      sampleTasks.forEach((task, index) => {
        console.log(`\nTâche ${index + 1}:`);
        console.log(`- ID: ${task.id}`);
        console.log(`- Titre: ${task.title}`);
        console.log(`- Catégorie: ${task.category}`);
        console.log(`- Type origine: ${task.origin_type}`);
        console.log(`- Service: ${task.service}`);
        console.log(`- Description: ${task.description ? task.description.substring(0, 100) + '...' : 'Aucune'}`);
      });
    } else {
      console.log('Aucune tâche trouvée');
    }

    // 4. ANALYSE DES ENUMS
    console.log('\n🏷️  4. ÉNUMÉRATIONS UTILISÉES:');
    console.log('-----------------------------');
    
    const { data: enums, error: enumsError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
              t.typname AS enum_name,
              array_agg(e.enumlabel ORDER BY e.enumsortorder) AS enum_values
          FROM pg_type t 
          JOIN pg_enum e ON t.oid = e.enumtypid  
          WHERE t.typname LIKE 'task_%'
          GROUP BY t.typname
          ORDER BY t.typname;
        `
      });

    if (enumsError) throw enumsError;

    if (enums && enums.length > 0) {
      enums.forEach(enumType => {
        console.log(`- ${enumType.enum_name}: [${enumType.enum_values.join(', ')}]`);
      });
    }

    // 5. RECHERCHE TÂCHES CLIENT REQUEST
    console.log('\n🎯 5. TÂCHES DE TYPE "CLIENT REQUEST":');
    console.log('------------------------------------');
    
    const { data: clientTasks, error: clientTasksError } = await supabase
      .from('task')
      .select('*')
      .eq('category', 'client_request')
      .limit(2);

    if (clientTasksError) throw clientTasksError;

    if (clientTasks && clientTasks.length > 0) {
      console.log(`Trouvé ${clientTasks.length} tâche(s) client_request:`);
      clientTasks.forEach((task, index) => {
        console.log(`\nTâche Client Request ${index + 1}:`);
        Object.entries(task).forEach(([key, value]) => {
          if (value !== null && value !== '') {
            console.log(`- ${key}: ${value}`);
          }
        });
      });
    } else {
      console.log('❌ Aucune tâche "client_request" trouvée');
    }

    // 6. RECOMMANDATIONS
    console.log('\n💡 6. RECOMMANDATIONS:');
    console.log('---------------------');
    
    const hasClientNameColumn = clientColumns.some(col => 
      col.column_name.toLowerCase().includes('client') || 
      col.column_name.toLowerCase().includes('guest')
    );

    if (!hasClientNameColumn) {
      console.log('🚨 PROBLÈME IDENTIFIÉ:');
      console.log('- Aucune colonne pour stocker le nom du client/guest');
      console.log('- Il faut ajouter une colonne "guest_name" ou "client_name"');
      console.log('');
      console.log('💡 SOLUTION RECOMMANDÉE:');
      console.log('- Ajouter une colonne "guest_name" de type VARCHAR');
      console.log('- Modifier le frontend pour mapper correctement ce champ');
    } else {
      console.log('✅ Colonnes client existantes trouvées');
    }

  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error.message);
    if (error.details) {
      console.error('Détails:', error.details);
    }
  }
}

// Exécuter l'analyse
analyzeTaskTable();

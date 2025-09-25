// SCRIPT DE TEST: Vérifier que la colonne guest_name fonctionne
// À exécuter APRÈS avoir appliqué le SQL add-guest-name-column.sql

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testGuestNameColumn() {
  console.log('🧪 TEST: Vérification de la colonne guest_name');
  console.log('==============================================\n');

  try {
    // 1. VÉRIFIER QUE LA COLONNE EXISTE
    console.log('1. Vérification structure table task...');
    
    const { data: columns, error: structureError } = await supabase
      .rpc('sql', {
        query: `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
            AND table_name = 'task'
            AND column_name = 'guest_name';
        `
      });

    if (structureError) throw structureError;

    if (columns && columns.length > 0) {
      console.log('✅ Colonne guest_name trouvée:');
      console.log(`   - Type: ${columns[0].data_type}`);
      console.log(`   - Nullable: ${columns[0].is_nullable}`);
    } else {
      throw new Error('❌ Colonne guest_name NON trouvée ! Exécutez d\'abord add-guest-name-column.sql');
    }

    // 2. TEST D'INSERTION
    console.log('\n2. Test d\'insertion avec guest_name...');
    
    // Récupérer user actuel
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    const testTaskData = {
      title: 'Test Client Request - ' + new Date().toISOString().slice(0,16),
      description: 'Test automatique pour vérifier la colonne guest_name',
      category: 'client_request',
      priority: 'normal',
      service: 'reception',
      origin_type: 'client',
      guest_name: 'Jean Dupont (TEST)',  // ← TEST DU NOUVEAU CHAMP
      location: '205',
      status: 'pending',
      created_by: user?.id || '00000000-0000-0000-0000-000000000000'
    };

    console.log('Données de test:', JSON.stringify(testTaskData, null, 2));

    const { data: result, error: insertError } = await supabase
      .from('task')
      .insert([testTaskData])
      .select()
      .single();

    if (insertError) {
      console.error('❌ ERREUR D\'INSERTION:', insertError);
      throw insertError;
    }

    console.log('✅ SUCCÈS! Tâche créée avec guest_name:');
    console.log(`   - ID: ${result.id}`);
    console.log(`   - Titre: ${result.title}`);
    console.log(`   - Guest Name: ${result.guest_name}`);
    console.log(`   - Catégorie: ${result.category}`);

    // 3. TEST DE LECTURE
    console.log('\n3. Test de lecture avec filtre sur guest_name...');
    
    const { data: clientTasks, error: readError } = await supabase
      .from('task')
      .select('id, title, guest_name, category')
      .eq('category', 'client_request')
      .not('guest_name', 'is', null)
      .limit(3);

    if (readError) throw readError;

    console.log(`✅ Trouvé ${clientTasks.length} tâche(s) client avec guest_name:`);
    clientTasks.forEach(task => {
      console.log(`   - ${task.title} | Client: ${task.guest_name}`);
    });

    // 4. NETTOYAGE (supprimer la tâche de test)
    console.log('\n4. Nettoyage...');
    
    const { error: deleteError } = await supabase
      .from('task')
      .delete()
      .eq('id', result.id);

    if (deleteError) {
      console.warn('⚠️ Erreur nettoyage:', deleteError.message);
    } else {
      console.log('✅ Tâche de test supprimée');
    }

    console.log('\n🎉 TOUS LES TESTS RÉUSSIS!');
    console.log('La colonne guest_name fonctionne correctement.');
    console.log('Vous pouvez maintenant créer des Client Request avec noms de clients.');

  } catch (error) {
    console.error('❌ ERREUR DANS LES TESTS:', error.message);
    if (error.details) {
      console.error('Détails:', error.details);
    }
    if (error.code) {
      console.error('Code erreur:', error.code);
    }
  }
}

// Exécuter les tests
testGuestNameColumn();

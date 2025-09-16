// Créer une internal_task directement en base Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createInternalTaskInDatabase() {
  console.log('🎯 CRÉATION INTERNAL_TASK DIRECTEMENT EN BASE');
  console.log('============================================\n');

  try {
    // 1. Récupérer un utilisateur existant pour assigned_to
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, full_name')
      .limit(1);

    if (profileError || !profiles || profiles.length === 0) {
      throw new Error('Aucun profil utilisateur trouvé');
    }

    const user = profiles[0];
    console.log('👤 Utilisateur pour assignation:', user);

    // 2. Préparer les données internal_task basées sur la structure existante
    const internalTaskData = {
      title: 'Internal Task Test - Créée en DB - ' + new Date().toISOString().slice(0,16).replace('T', ' '),
      description: 'Tâche interne créée directement en base pour tester la structure et le mapping frontend',
      category: 'internal_task',           // ENUM task_category
      priority: 'normal',                  // ENUM priority_level  
      service: 'reception',                // ENUM task_service
      origin_type: 'team',                 // ENUM task_origin
      assigned_to: [user.id],              // ARRAY d'IDs
      created_by: user.id,                 // ID du créateur
      updated_by: user.id,                 // ID pour triggers de logging
      location: 'Reception Desk',          // Location textuelle
      status: 'pending',                   // Status par défaut
      checklist_items: null,               // JSONB - null pour l'instant
      collaborators: {                     // JSONB - structure exemple
        members: [user.id]
      },
      reminder_date: null,                 // Date optionnelle
      validation_status: 'pending',        // Status de validation
      requires_validation: false,          // Boolean pour internal_task
      attachment_url: null                 // URL optionnelle
    };

    console.log('📊 Données à insérer:', internalTaskData);

    // 3. Insertion en base
    const { data: result, error: insertError } = await supabase
      .from('task')
      .insert([internalTaskData])
      .select('*')
      .single();

    if (insertError) {
      console.error('❌ Erreur insertion:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      });
      throw new Error(`Erreur insertion: ${insertError.message}`);
    }

    console.log('\n🎉 SUCCÈS! Internal Task créée:');
    console.log('================================');
    console.log(`ID: ${result.id}`);
    console.log(`Titre: ${result.title}`);
    console.log(`Catégorie: ${result.category}`);
    console.log(`Assigné à: ${JSON.stringify(result.assigned_to)}`);
    console.log(`Service: ${result.service}`);
    console.log(`Priorité: ${result.priority}`);
    console.log(`Status: ${result.status}`);
    
    console.log('\n📋 STRUCTURE COMPLÈTE:');
    console.log('======================');
    Object.entries(result).forEach(([key, value]) => {
      const type = Array.isArray(value) ? `array[${value.length}]` : 
                   value === null ? 'null' : typeof value;
      const displayValue = typeof value === 'object' ? JSON.stringify(value) : value;
      console.log(`${key.padEnd(20)} : ${type.padEnd(10)} = ${displayValue}`);
    });

    console.log('\n✅ Maintenant vérifiez le frontend pour voir si cette tâche apparaît !');
    
  } catch (error) {
    console.error('❌ ERREUR:', error.message);
    console.error('Détails:', error);
  }
}

createInternalTaskInDatabase();

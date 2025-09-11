import { supabase } from '@/integrations/supabase/client';

// Fonction de test indépendante pour création de tâches
export async function testCreateTask() {
  console.log('🧪 DÉBUT TEST CRÉATION TÂCHE');
  
  // Données de test minimales
  const testData = {
    title: 'Test Task - ' + new Date().toISOString().slice(0,10),
    category: 'incident', // ou 'client_request', 'follow_up', 'internal_task'
    priority: 'normal',
    service: 'reception',
    assignedMember: 'Islam Salhi - staff', // Nom exact depuis votre dropdown
    location: '10', // Room number / location name
    description: 'Ceci est un test de création automatique',
    originType: 'team'
  };

  try {
    console.log('📝 Données de test:', testData);
    
    // 1. RÉCUPÉRER USER ACTUEL
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw new Error(`Erreur user: ${userError.message}`);
    console.log('👤 User actuel:', user?.id);

    // 2. RÉCUPÉRER PROFILES POUR MAPPING
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, full_name, department');
    
    if (profilesError) throw new Error(`Erreur profiles: ${profilesError.message}`);
    console.log('👥 Profiles trouvés:', profiles.length);

    // 3. TROUVER L'UUID DU MEMBRE ASSIGNÉ
    const assignedMemberUUID = profiles.find(p => {
      const fullName = p.full_name || `${p.first_name} ${p.last_name}`;
      return fullName === testData.assignedMember.split(' - ')[0]; // Enlever " - staff"
    })?.id;

    if (!assignedMemberUUID) {
      throw new Error(`Membre non trouvé: ${testData.assignedMember}`);
    }
    console.log('✅ Membre trouvé:', assignedMemberUUID);

    // 4. DÉTERMINER TABLE CIBLE
    const tableMap = {
      'incident': 'incidents',
      'client_request': 'client_requests',
      'follow_up': 'follow_ups', 
      'internal_task': 'internal_tasks'
    };
    
    const targetTable = tableMap[testData.category];
    console.log('🎯 Table cible:', targetTable);

    // 5. PRÉPARER DONNÉES D'INSERTION
    const insertData = {
      title: testData.title,
      description: testData.description,
      priority: testData.priority,
      origin_type: testData.originType,
      assigned_to: testData.assignedMember.split(' - ')[0], // Nom sans suffix
      assigned_member_ids: [assignedMemberUUID],
      created_by: user.id,
      checklists: [],
      attachments: [],
      reminders: []
    };

    // Champs spécifiques selon le type
    if (testData.category === 'client_request') {
      insertData.guest_name = 'Test Guest';
      insertData.room_number = testData.location;
      insertData.request_type = 'test';
      insertData.preparation_status = 'pending';
    } else if (testData.category === 'incident') {
      insertData.incident_type = 'test';
      insertData.location = testData.location;
      insertData.status = 'pending';
    } else if (testData.category === 'internal_task') {
      insertData.task_type = 'test';
      insertData.location = testData.location;
      insertData.department = testData.service;
      insertData.due_date = new Date().toISOString().split('T')[0]; // Aujourd'hui
      insertData.status = 'pending';
    } else if (testData.category === 'follow_up') {
      insertData.location = testData.location;
      insertData.status = 'pending';
    }

    console.log('📊 Données finales pour insertion:', insertData);

    // 6. INSERTION EN BASE
    const { data: result, error: insertError } = await supabase
      .from(targetTable)
      .insert([insertData])
      .select()
      .single();

    if (insertError) {
      throw new Error(`Erreur insertion: ${insertError.message}`);
    }

    console.log('🎉 SUCCÈS! Tâche créée:', result);
    console.log('🆔 ID de la tâche:', result.id);
    
    return {
      success: true,
      taskId: result.id,
      table: targetTable,
      data: result
    };

  } catch (error) {
    console.error('❌ ERREUR TEST:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Fonction pour nettoyer les tests (optionnel)
export async function cleanupTestTasks() {
  const tables = ['incidents', 'client_requests', 'follow_ups', 'internal_tasks'];
  
  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .delete()
      .like('title', 'Test Task -%');
    
    if (error) {
      console.error(`Erreur nettoyage ${table}:`, error.message);
    } else {
      console.log(`✅ Nettoyage ${table} terminé`);
    }
  }
}
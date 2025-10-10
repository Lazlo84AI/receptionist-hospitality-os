import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 DIAGNOSTIC: View Reception Shifts - Pourquoi c\'est vide?\n');
console.log('='.repeat(80));

// Calculer la date d'il y a 3 jours
const threeDaysAgo = new Date();
threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

console.log(`📅 Date limite (3 jours): ${threeDaysAgo.toISOString()}\n`);

// 1. Vérifier TOUS les shifts
console.log('1️⃣  VÉRIFICATION: Tous les shifts en BDD');
console.log('-'.repeat(80));
const { data: allShifts, error: allShiftsError } = await supabase
  .from('shifts')
  .select('id, user_id, service, status, start_time, end_time, created_at')
  .order('created_at', { ascending: false });

if (allShiftsError) {
  console.error('❌ Erreur:', allShiftsError);
} else {
  console.log(`✅ Total shifts trouvés: ${allShifts?.length || 0}`);
  
  if (allShifts && allShifts.length > 0) {
    // Grouper par statut
    const byStatus = allShifts.reduce((acc, shift) => {
      acc[shift.status] = (acc[shift.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📊 Répartition par statut:');
    Object.entries(byStatus).forEach(([status, count]) => {
      console.log(`   - ${status}: ${count}`);
    });
    
    // Grouper par service
    const byService = allShifts.reduce((acc, shift) => {
      acc[shift.service || 'NULL'] = (acc[shift.service || 'NULL'] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📊 Répartition par service:');
    Object.entries(byService).forEach(([service, count]) => {
      console.log(`   - ${service}: ${count}`);
    });
    
    console.log('\n📋 Les 5 shifts les plus récents:');
    allShifts.slice(0, 5).forEach((shift, i) => {
      console.log(`\n   ${i + 1}. Shift ID: ${shift.id}`);
      console.log(`      Status: ${shift.status}`);
      console.log(`      Service: ${shift.service || 'NULL'}`);
      console.log(`      User ID: ${shift.user_id}`);
      console.log(`      Start: ${shift.start_time}`);
      console.log(`      End: ${shift.end_time || 'NULL'}`);
      console.log(`      Created: ${shift.created_at}`);
    });
  }
}

// 2. Vérifier les shifts COMPLETED uniquement
console.log('\n\n2️⃣  VÉRIFICATION: Shifts avec status = "completed"');
console.log('-'.repeat(80));
const { data: completedShifts, error: completedError } = await supabase
  .from('shifts')
  .select('id, user_id, service, status, start_time, end_time')
  .eq('status', 'completed')
  .order('end_time', { ascending: false });

if (completedError) {
  console.error('❌ Erreur:', completedError);
} else {
  console.log(`✅ Shifts "completed" trouvés: ${completedShifts?.length || 0}`);
  
  if (completedShifts && completedShifts.length > 0) {
    console.log('\n📋 Liste:');
    completedShifts.forEach((shift, i) => {
      console.log(`\n   ${i + 1}. Shift ID: ${shift.id}`);
      console.log(`      Service: ${shift.service}`);
      console.log(`      User ID: ${shift.user_id}`);
      console.log(`      End time: ${shift.end_time}`);
    });
  } else {
    console.log('⚠️  PROBLÈME IDENTIFIÉ: Aucun shift avec status "completed"');
    console.log('   → Les shifts doivent avoir status="completed" pour apparaître');
  }
}

// 3. Vérifier les shifts des 3 derniers jours
console.log('\n\n3️⃣  VÉRIFICATION: Shifts completed des 3 derniers jours');
console.log('-'.repeat(80));
const { data: recentCompleted, error: recentError } = await supabase
  .from('shifts')
  .select('id, user_id, service, status, end_time')
  .eq('status', 'completed')
  .gte('end_time', threeDaysAgo.toISOString())
  .order('end_time', { ascending: false });

if (recentError) {
  console.error('❌ Erreur:', recentError);
} else {
  console.log(`✅ Shifts completed récents (3 jours): ${recentCompleted?.length || 0}`);
  
  if (recentCompleted && recentCompleted.length > 0) {
    console.log('\n📋 Liste:');
    recentCompleted.forEach((shift, i) => {
      console.log(`   ${i + 1}. Shift ${shift.id} - Service: ${shift.service} - End: ${shift.end_time}`);
    });
  } else {
    console.log('⚠️  PROBLÈME IDENTIFIÉ: Aucun shift completed dans les 3 derniers jours');
  }
}

// 4. Vérifier staff_directory
console.log('\n\n4️⃣  VÉRIFICATION: Lien avec staff_directory');
console.log('-'.repeat(80));

// Récupérer tous les user_id des shifts
const shiftUserIds = [...new Set(allShifts?.map(s => s.user_id) || [])];
console.log(`📊 User IDs uniques dans shifts: ${shiftUserIds.length}`);

if (shiftUserIds.length > 0) {
  const { data: staffData, error: staffError } = await supabase
    .from('staff_directory')
    .select('id, first_name, last_name, service, department')
    .in('id', shiftUserIds);

  if (staffError) {
    console.error('❌ Erreur:', staffError);
  } else {
    console.log(`✅ Correspondances dans staff_directory: ${staffData?.length || 0}`);
    
    const staffIds = new Set(staffData?.map(s => s.id) || []);
    const missingIds = shiftUserIds.filter(id => !staffIds.has(id));
    
    if (missingIds.length > 0) {
      console.log(`\n⚠️  PROBLÈME IDENTIFIÉ: ${missingIds.length} user_id(s) manquant(s) dans staff_directory`);
      console.log('   User IDs manquants:', missingIds);
      console.log('   → Ces shifts ne peuvent PAS apparaître (INNER JOIN requis)');
    } else {
      console.log('✅ Tous les user_ids ont une correspondance dans staff_directory');
    }
    
    if (staffData && staffData.length > 0) {
      console.log('\n📋 Staff trouvé:');
      staffData.forEach(staff => {
        console.log(`   - ${staff.first_name} ${staff.last_name} (${staff.service}) - ID: ${staff.id}`);
      });
    }
  }
}

// 5. Vérifier shift_handovers
console.log('\n\n5️⃣  VÉRIFICATION: Lien avec shift_handovers');
console.log('-'.repeat(80));

if (completedShifts && completedShifts.length > 0) {
  const completedShiftIds = completedShifts.map(s => s.id);
  
  const { data: handovers, error: handoversError } = await supabase
    .from('shift_handovers')
    .select('id, from_shift_id, to_shift_id, handover_data, additional_notes')
    .in('from_shift_id', completedShiftIds);

  if (handoversError) {
    console.error('❌ Erreur:', handoversError);
  } else {
    console.log(`✅ Handovers trouvés: ${handovers?.length || 0}`);
    
    if (handovers && handovers.length > 0) {
      console.log('\n📋 Détails des handovers:');
      handovers.forEach((ho, i) => {
        console.log(`\n   ${i + 1}. Handover ID: ${ho.id}`);
        console.log(`      From shift: ${ho.from_shift_id}`);
        console.log(`      To shift: ${ho.to_shift_id || 'NULL'}`);
        console.log(`      Has handover_data: ${!!ho.handover_data}`);
        
        if (ho.handover_data) {
          const data = ho.handover_data;
          console.log(`      - all_tasks: ${data.all_tasks?.length || 0} tasks`);
          console.log(`      - total_tasks_count: ${data.total_tasks_count || 0}`);
        }
        
        console.log(`      Has additional_notes: ${!!ho.additional_notes}`);
      });
    } else {
      console.log('⚠️  Aucun handover lié aux shifts completed');
    }
  }
}

// 6. Simuler la requête exacte du hook
console.log('\n\n6️⃣  SIMULATION: Requête exacte du hook useTeamShifts');
console.log('-'.repeat(80));
console.log('Service recherché: reception');
console.log(`Date limite: ${threeDaysAgo.toISOString()}\n`);

const { data: hookSimulation, error: hookError } = await supabase
  .from('shifts')
  .select(`
    *,
    staff_directory!inner(
      first_name,
      last_name,
      department,
      service
    ),
    shift_handovers!shift_handovers_from_shift_id_fkey(
      handover_data,
      additional_notes
    )
  `)
  .eq('status', 'completed')
  .eq('service', 'reception')
  .gte('end_time', threeDaysAgo.toISOString())
  .order('end_time', { ascending: false });

if (hookError) {
  console.error('❌ Erreur de la requête:', hookError);
} else {
  console.log(`✅ Résultat de la requête: ${hookSimulation?.length || 0} shifts`);
  
  if (!hookSimulation || hookSimulation.length === 0) {
    console.log('\n❌ PROBLÈME CONFIRMÉ: La requête retourne 0 résultats');
    console.log('\n🔍 Raisons possibles:');
    console.log('   1. Aucun shift avec status="completed" ET service="reception"');
    console.log('   2. Aucun shift completed dans les 3 derniers jours');
    console.log('   3. User IDs des shifts manquent dans staff_directory (INNER JOIN échoue)');
    console.log('   4. Combinaison de plusieurs critères qui élimine tous les résultats');
  } else {
    console.log('\n✅ La requête fonctionne ! Détails:');
    hookSimulation.forEach((shift, i) => {
      console.log(`\n   ${i + 1}. Shift ${shift.id}`);
      console.log(`      User: ${shift.staff_directory?.first_name} ${shift.staff_directory?.last_name}`);
      console.log(`      Service: ${shift.service}`);
      console.log(`      End time: ${shift.end_time}`);
      console.log(`      Handovers: ${shift.shift_handovers?.length || 0}`);
    });
  }
}

// RÉSUMÉ
console.log('\n\n' + '='.repeat(80));
console.log('📊 RÉSUMÉ DU DIAGNOSTIC');
console.log('='.repeat(80));

console.log(`\n✅ Shifts total en BDD: ${allShifts?.length || 0}`);
console.log(`✅ Shifts "completed": ${completedShifts?.length || 0}`);
console.log(`✅ Shifts completed récents (3j): ${recentCompleted?.length || 0}`);
console.log(`✅ Résultat requête hook: ${hookSimulation?.length || 0}`);

console.log('\n💡 RECOMMANDATIONS:');
if (!hookSimulation || hookSimulation.length === 0) {
  console.log('   1. Vérifier que les shifts ont bien status="completed"');
  console.log('   2. Vérifier que les shifts ont un end_time récent (< 3 jours)');
  console.log('   3. Vérifier que tous les user_id existent dans staff_directory');
  console.log('   4. Vérifier que le service="reception" correspond bien');
  console.log('   5. Compléter un shift réel pour tester');
} else {
  console.log('   ✅ La requête fonctionne correctement !');
  console.log('   → Le problème est peut-être dans le frontend ou le rendu');
}

console.log('\n✅ Diagnostic terminé!\n');

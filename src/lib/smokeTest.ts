// Smoke test pour valider les actions Supabase
import getUserProfiles from '@/lib/actions/getUserProfiles';
import getTaskComments from '@/lib/actions/getTaskComments';
import getActivityLogs from '@/lib/actions/getActivityLogs';
import getReminders from '@/lib/actions/getReminders';

// Auto-run smoke test in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('🧪 Lancement du smoke test...');
  
  const runSmokeTest = async () => {
    try {
      // Test des actions de lecture
      console.log('📖 Test des actions de lecture...');
      
      const profiles = await getUserProfiles({ limit: 3 });
      console.log('✅ getUserProfiles:', profiles?.length || 0, 'profils trouvés');
      if (profiles?.[0]) {
        console.log('   Exemple:', { 
          id: profiles[0].id, 
          email: profiles[0].email, 
          full_name: profiles[0].full_name,
          role: profiles[0].role 
        });
      }
      
      const comments = await getTaskComments({ limit: 3 });
      console.log('✅ getTaskComments:', comments?.length || 0, 'commentaires trouvés');
      if (comments?.[0]) {
        console.log('   Exemple:', { 
          id: comments[0].id, 
          task_id: comments[0].task_id, 
          content: comments[0].content?.substring(0, 50) + '...',
          user_id: comments[0].user_id 
        });
      }
      
      const logs = await getActivityLogs({ limit: 3 });
      console.log('✅ getActivityLogs:', logs?.length || 0, 'logs trouvés');
      if (logs?.[0]) {
        console.log('   Exemple:', { 
          id: logs[0].id, 
          entity_type: logs[0].entity_type, 
          entity_id: logs[0].entity_id,
          action: logs[0].action 
        });
      }
      
      const reminders = await getReminders({ limit: 3 });
      console.log('✅ getReminders:', reminders?.length || 0, 'rappels trouvés');
      if (reminders?.[0]) {
        console.log('   Exemple:', { 
          id: reminders[0].id, 
          title: reminders[0].title, 
          task_type: reminders[0].task_type,
          remind_at: reminders[0].remind_at,
          frequency: reminders[0].frequency,
          priority: reminders[0].priority,
          status: reminders[0].status
        });
      }
      
      console.log('🎉 Smoke test des lectures terminé avec succès!');
      
      // Note: Les tests d'écriture nécessiteraient des actions d'écriture qui n'existent pas encore
      console.log('ℹ️  Tests d\'écriture : Actions upsertUserProfile/addTaskComment/addActivityLog/updateReminder à créer');
      
    } catch (error) {
      console.error('❌ Erreur dans le smoke test:', error);
    }
  };
  
  // Lancer le test après un délai pour éviter les conflits d'initialisation
  setTimeout(runSmokeTest, 1000);
  
  // Exposer la fonction pour test manuel
  (window as any).runSmokeTest = runSmokeTest;
  console.log('🔧 Smoke test configuré! Appel automatique dans 1s ou manuel via runSmokeTest()');
}
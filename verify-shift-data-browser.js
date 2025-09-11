// Script à exécuter dans la console du navigateur sur localhost:8080
// pour vérifier les données de shift enregistrées

// 1. Vérifier les shifts dans la table
console.log('🔍 Vérification des shifts enregistrés...');

// Utiliser le client Supabase déjà configuré dans l'app
const checkShifts = async () => {
  try {
    // Importer le client Supabase depuis l'application
    const { supabase } = await import('/src/integrations/supabase/client.js');
    
    console.log('✅ Client Supabase importé avec succès');
    
    // 1. Vérifier la table shifts (5 derniers)
    const { data: shifts, error: shiftsError } = await supabase
      .from('shifts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (shiftsError) {
      console.error('❌ Erreur table shifts:', shiftsError);
    } else {
      console.log(`📊 ${shifts.length} shifts trouvés (les 5 plus récents):`);
      console.table(shifts.map(shift => ({
        id: shift.id.substring(0, 8) + '...',
        user_id: shift.user_id?.substring(0, 8) + '...' || 'N/A',
        status: shift.status,
        end_time: shift.end_time || 'N/A',
        has_voice_url: shift.voice_note_url ? 'OUI' : 'NON',
        has_transcription: shift.voice_note_transcription ? 'OUI' : 'NON',
        created: new Date(shift.created_at).toLocaleString()
      })));
      
      // Afficher les détails du shift le plus récent
      if (shifts[0]) {
        console.log('\n🔍 Détails du shift le plus récent:');
        console.log('ID:', shifts[0].id);
        console.log('User ID:', shifts[0].user_id);
        console.log('Status:', shifts[0].status);
        console.log('End time:', shifts[0].end_time);
        console.log('Voice note URL:', shifts[0].voice_note_url || 'Aucun');
        console.log('Transcription:', shifts[0].voice_note_transcription || 'Aucun');
        console.log('Handover notes:', shifts[0].handover_notes || 'Aucun');
        console.log('Created:', shifts[0].created_at);
      }
    }
    
    // 2. Vérifier le storage shift-recordings
    console.log('\n🗂️ Vérification du storage shift-recordings...');
    const { data: files, error: storageError } = await supabase.storage
      .from('shift-recordings')
      .list('', {
        limit: 10,
        sortBy: { column: 'created_at', order: 'desc' }
      });
    
    if (storageError) {
      console.error('❌ Erreur storage:', storageError);
    } else {
      console.log(`✅ ${files.length} fichiers audio trouvés:`);
      if (files.length > 0) {
        console.table(files.map(file => ({
          name: file.name,
          size: file.metadata?.size ? `${Math.round(file.metadata.size / 1024)} KB` : 'N/A',
          created: file.created_at
        })));
      } else {
        console.log('📭 Aucun fichier audio trouvé dans le storage');
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
};

// Exécuter la vérification
checkShifts();
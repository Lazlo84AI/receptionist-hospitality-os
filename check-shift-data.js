// Script pour vérifier les enregistrements de shift dans Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ypxmzacmwqqvlciwahzw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlweG16YWNtd3FxdmxjaXdhaHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjIzNjU5OTIsImV4cCI6MjAzNzk0MTk5Mn0.lGO6zOQLzqY0oFd3xoA37e0TxT1PTjGUq8OUIzWqMGM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkShiftData() {
  console.log('🔍 Vérification des données de shift...\n');
  
  try {
    // 1. Vérifier la table shifts
    console.log('📊 Table shifts:');
    const { data: shifts, error: shiftsError } = await supabase
      .from('shifts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (shiftsError) {
      console.error('❌ Erreur table shifts:', shiftsError);
    } else {
      console.log(`✅ ${shifts.length} shifts trouvés (les 5 plus récents):`);
      shifts.forEach((shift, index) => {
        console.log(`  ${index + 1}. ID: ${shift.id}`);
        console.log(`     User: ${shift.user_id}`);
        console.log(`     Status: ${shift.status}`);
        console.log(`     End time: ${shift.end_time || 'N/A'}`);
        console.log(`     Voice note URL: ${shift.voice_note_url || 'Aucun'}`);
        console.log(`     Transcription: ${shift.voice_note_transcription ? 'Oui' : 'Non'}`);
        console.log(`     Created: ${shift.created_at}`);
        console.log('     ---');
      });
    }
    
    // 2. Vérifier le storage shift-recordings
    console.log('\n🗂️ Storage shift-recordings:');
    const { data: files, error: storageError } = await supabase.storage
      .from('shift-recordings')
      .list('', {
        limit: 10,
        sortBy: { column: 'created_at', order: 'desc' }
      });
    
    if (storageError) {
      console.error('❌ Erreur storage:', storageError);
    } else {
      console.log(`✅ ${files.length} fichiers trouvés:`);
      files.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file.name}`);
        console.log(`     Taille: ${file.metadata?.size || 'N/A'} bytes`);
        console.log(`     Créé: ${file.created_at}`);
        console.log('     ---');
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

checkShiftData();
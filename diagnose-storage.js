// Script pour diagnostiquer et corriger le problème de storage Supabase
// À exécuter dans la console du navigateur sur localhost:8080

const diagnoseAndFixStorage = async () => {
  try {
    const { supabase } = await import('/src/integrations/supabase/client.js');
    
    console.log('🔍 Diagnostic du Storage Supabase...\n');
    
    // 1. Vérifier si le bucket existe
    console.log('1. Vérification du bucket "shift-recordings"...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Erreur lors de la liste des buckets:', bucketsError);
      return;
    }
    
    console.log('📦 Buckets existants:', buckets.map(b => b.name));
    
    const shiftBucket = buckets.find(b => b.name === 'shift-recordings');
    if (!shiftBucket) {
      console.log('❌ Bucket "shift-recordings" n\'existe pas!');
      
      // Créer le bucket
      console.log('🔨 Création du bucket "shift-recordings"...');
      const { data: newBucket, error: createError } = await supabase.storage
        .createBucket('shift-recordings', {
          public: true,
          allowedMimeTypes: ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/ogg'],
          fileSizeLimit: 10485760 // 10MB
        });
      
      if (createError) {
        console.error('❌ Erreur création bucket:', createError);
      } else {
        console.log('✅ Bucket "shift-recordings" créé avec succès!');
      }
    } else {
      console.log('✅ Bucket "shift-recordings" existe déjà');
    }
    
    // 2. Tester l'upload d'un fichier de test
    console.log('\n2. Test d\'upload...');
    
    // Créer un fichier audio de test (silence de 1 seconde)
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const buffer = audioContext.createBuffer(1, 44100, 44100); // 1 seconde de silence
    
    // Convertir en Blob
    const testBlob = new Blob(['test audio data'], { type: 'audio/wav' });
    const testFileName = `test_${Date.now()}.wav`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('shift-recordings')
      .upload(testFileName, testBlob);
    
    if (uploadError) {
      console.error('❌ Erreur test upload:', uploadError);
      console.log('💡 Solutions possibles:');
      console.log('   - Vérifier les permissions RLS du bucket');
      console.log('   - Vérifier que l\'utilisateur est authentifié');
      console.log('   - Vérifier les policies de sécurité');
    } else {
      console.log('✅ Test upload réussi:', uploadData);
      
      // Nettoyer le fichier de test
      await supabase.storage.from('shift-recordings').remove([testFileName]);
      console.log('🧹 Fichier de test supprimé');
    }
    
    // 3. Vérifier l'authentification
    console.log('\n3. Vérification de l\'authentification...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ Problème d\'authentification:', userError);
    } else {
      console.log('✅ Utilisateur authentifié:', user.email);
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
};

// Exécuter le diagnostic
await diagnoseAndFixStorage();
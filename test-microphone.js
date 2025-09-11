// Test pour vérifier si l'enregistrement audio fonctionne
// À coller dans la console du navigateur sur localhost:8080

const testMicrophone = async () => {
  console.log('🎤 Test du microphone...');
  
  try {
    // 1. Tester l'accès au microphone
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log('✅ Accès au microphone accordé');
    
    // 2. Tester MediaRecorder
    const recorder = new MediaRecorder(stream);
    const audioChunks = [];
    
    recorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
      console.log('📊 Chunk audio reçu:', event.data.size, 'bytes');
    };
    
    recorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      console.log('🎵 Audio final créé:', audioBlob.size, 'bytes');
      
      // Créer un lecteur audio pour tester
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      console.log('🔊 Lecture du test...');
      audio.play();
      
      // Nettoyer
      stream.getTracks().forEach(track => track.stop());
    };
    
    // 3. Enregistrer 3 secondes
    console.log('🔴 Début enregistrement (3 secondes)...');
    recorder.start();
    
    setTimeout(() => {
      console.log('⏹️ Arrêt enregistrement');
      recorder.stop();
    }, 3000);
    
  } catch (error) {
    console.error('❌ Erreur microphone:', error);
    
    if (error.name === 'NotAllowedError') {
      console.log('🚫 Permission microphone refusée');
    } else if (error.name === 'NotFoundError') {
      console.log('🔍 Aucun microphone trouvé');
    } else {
      console.log('⚠️ Erreur inconnue:', error.message);
    }
  }
};

// Lancer le test
testMicrophone();
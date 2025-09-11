import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ShiftFacingCard } from '@/components/cards';
import { supabase } from '@/integrations/supabase/client';
import { 
  ChevronLeft, 
  ChevronRight, 
  Mic, 
  Check,
  Edit3,
  MicOff,
  Type,
  Send
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TaskFullEditView } from '@/components/modules/TaskFullEditView';
import { TaskItem } from '@/types/database';

interface ShiftCloseModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  onCardClick?: (task: TaskItem) => void;
}

export const ShiftCloseModal = ({ isOpen, onClose, tasks, onCardClick }: ShiftCloseModalProps) => {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  
  // États pour la note de fin de shift - VERSION AMÉLIORÉE
  const [noteMode, setNoteMode] = useState<'voice' | 'text'>('voice');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [textNote, setTextNote] = useState('');
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [microphoneReady, setMicrophoneReady] = useState(false);
  const [recordingLogs, setRecordingLogs] = useState<string[]>([]);

  const currentTask = tasks[currentTaskIndex];
  const totalTasks = tasks.length;

  const handlePrevious = () => {
    if (currentTaskIndex > 0) {
      setCurrentTaskIndex(currentTaskIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentTaskIndex < totalTasks - 1) {
      setCurrentTaskIndex(currentTaskIndex + 1);
    }
  };

  const handleCardEdit = () => {
    if (currentTask) {
      setEditingTask(currentTask);
      setIsEditModalOpen(true);
    }
  };

  const handleValidate = () => {
    // Passer à la carte suivante quand on valide, ou au dernier écran si on est à la fin
    if (currentTaskIndex < totalTasks - 1) {
      setCurrentTaskIndex(currentTaskIndex + 1);
    } else if (currentTaskIndex === totalTasks - 1) {
      // Passer au dernier écran (note vocale)
      setCurrentTaskIndex(totalTasks);
    }
  };

  const handleSaveTask = (updatedTask: TaskItem) => {
    // Ici vous pouvez gérer la sauvegarde de la tâche modifiée
    console.log('Task updated:', updatedTask);
    setIsEditModalOpen(false);
    setEditingTask(null);
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    setRecordingLogs(prev => [...prev, logEntry]);
    console.log(logEntry);
  };

  const initializeMicrophone = async () => {
    addLog('Demande d\'accès au microphone...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      
      addLog('✅ Accès microphone accordé');
      setAudioStream(stream);
      setMicrophoneReady(true);
      
      // Afficher les infos du microphone
      const tracks = stream.getAudioTracks();
      if (tracks.length > 0) {
        const track = tracks[0];
        addLog(`Microphone détecté: ${track.label || 'Dispositif audio'}`);
      }
      
    } catch (error: any) {
      addLog(`Erreur microphone: ${error.message}`);
      if (error.name === 'NotAllowedError') {
        alert('Permission microphone refusée. Veuillez autoriser l\'accès au microphone.');
      } else if (error.name === 'NotFoundError') {
        alert('Aucun microphone trouvé sur ce système.');
      }
    }
  };

  const startRecording = async () => {
    if (!audioStream) {
      await initializeMicrophone();
      return;
    }

    try {
      const audioChunks: Blob[] = [];
      const recorder = new MediaRecorder(audioStream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/wav'
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
          addLog(`Chunk reçu: ${event.data.size} bytes`);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        addLog(`Enregistrement terminé: ${audioBlob.size} bytes`);
        setRecordedAudio(audioBlob);
        setIsRecording(false);
        setMediaRecorder(null);
      };

      recorder.onerror = (event: any) => {
        addLog(`Erreur MediaRecorder: ${event.error}`);
      };

      recorder.start(1000); // Chunks de 1 seconde
      setMediaRecorder(recorder);
      setIsRecording(true);
      addLog('Enregistrement démarré...');
      
    } catch (error: any) {
      addLog(`Erreur lors du démarrage: ${error.message}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      addLog('Arrêt de l\'enregistrement...');
    }
  };

  const handleVoiceNote = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const submitShiftEnd = async () => {
    setIsSubmitting(true);
    
    console.log('=== DÉBUT TEST UPLOAD AUDIO ===');
    
    try {
      let voiceNoteUrl = null;
      
      if (recordedAudio) {
        console.log('Audio détecté:', {
          size: recordedAudio.size,
          type: recordedAudio.type
        });
        
        // Test ultra-simple d'upload
        const fileName = `test_${Date.now()}.wav`;
        console.log('Tentative upload fichier:', fileName);
        
        const { data, error } = await supabase.storage
          .from('shift-recordings')
          .upload(fileName, recordedAudio);
        
        console.log('Résultat upload:', { data, error });
        
        if (error) {
          console.error('ERREUR UPLOAD:', error);
          alert(`ERREUR UPLOAD: ${JSON.stringify(error)}`);
        } else {
          console.log('UPLOAD RÉUSSI!');
          const { data: { publicUrl } } = supabase.storage
            .from('shift-recordings')
            .getPublicUrl(fileName);
          voiceNoteUrl = publicUrl;
          console.log('URL générée:', voiceNoteUrl);
        }
      } else {
        console.log('Aucun audio enregistré');
      }
      
      // Sauvegarder le shift
      const { data: userData } = await supabase.auth.getUser();
      
      const shiftData = {
        user_id: userData.user?.id,
        end_time: new Date().toISOString(),
        status: 'completed',
        voice_note_url: voiceNoteUrl,
        handover_notes: voiceNoteUrl ? 'Audio enregistré' : 'Pas d\'audio'
      };
      
      console.log('Données shift à insérer:', shiftData);
      
      const { data: result, error: shiftError } = await supabase
        .from('shifts')
        .insert(shiftData);
      
      if (shiftError) {
        console.error('Erreur shift:', shiftError);
        throw shiftError;
      }
      
      console.log('=== FIN TEST - SUCCÈS ===');
      alert(voiceNoteUrl ? 'SUCCÈS AVEC AUDIO!' : 'Succès sans audio');
      onClose();
      
    } catch (error) {
      console.error('=== ERREUR GÉNÉRALE ===', error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Vérifier si c'est le dernier écran (note vocale pour collègue)
  const isLastScreen = currentTaskIndex === totalTasks;
  const isVoiceNoteScreen = isLastScreen;

  if (!currentTask && !isVoiceNoteScreen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] p-0 gap-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b bg-background">
            <h2 className="text-2xl font-playfair font-bold mb-2">
              {isVoiceNoteScreen 
                ? "Fin de shift - laissez une note vocale à votre collègue"
                : "Fin de shift - mettez à jour vos cartes"
              }
            </h2>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {isVoiceNoteScreen 
                  ? `Question ${totalTasks + 1} - expliquez à votre collègue ce qu'il doit savoir`
                  : `Question ${currentTaskIndex + 1} sur ${totalTasks}`
                }
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentTaskIndex === 0}
                  className="p-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                 <Button
                   variant="ghost"
                   size="sm"
                   onClick={handleNext}
                   disabled={currentTaskIndex === totalTasks}
                   className="p-2"
                 >
                   <ChevronRight className="h-4 w-4" />
                 </Button>
              </div>
            </div>
          </div>

          {/* Question ou Note Vocale */}
          {isVoiceNoteScreen ? (
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="max-w-2xl mx-auto space-y-6">
                {/* Choix du mode */}
                <div className="flex justify-center gap-4 mb-8">
                  <Button
                  variant={noteMode === 'voice' ? 'default' : 'outline'}
                  onClick={() => setNoteMode('voice')}
                  className="flex items-center gap-2 hotel-button-hover"
                  >
                  <Mic className="h-4 w-4" />
                  Note vocale
                  </Button>
                  <Button
                  variant={noteMode === 'text' ? 'default' : 'outline'}
                  onClick={() => setNoteMode('text')}
                  className="flex items-center gap-2 hotel-button-hover"
                  >
                    <Type className="h-4 w-4" />
                    Note écrite
                  </Button>
                </div>

                {/* Mode vocal AMÉLIORÉ */}
                {noteMode === 'voice' && (
                  <div className="space-y-6">
                    {/* Bouton d'initialisation du microphone */}
                    {!microphoneReady && (
                      <div className="text-center">
                        <Button
                          onClick={initializeMicrophone}
                          size="lg"
                          className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 text-lg font-medium"
                        >
                          <Mic className="h-6 w-6 mr-2" />
                          Activer le microphone
                        </Button>
                        <p className="text-sm text-muted-foreground mt-2">
                          Cliquez pour demander l'accès au microphone
                        </p>
                      </div>
                    )}
                    
                    {/* Interface d'enregistrement */}
                    {microphoneReady && (
                      <div className="text-center space-y-6">
                        <div className="flex justify-center gap-4">
                          <Button
                            onClick={handleVoiceNote}
                            size="lg"
                            className={cn(
                              "h-20 w-20 rounded-full shadow-lg text-lg font-medium transition-all",
                              isRecording 
                                ? "bg-red-500 hover:bg-red-600 text-white animate-pulse" 
                                : "bg-green-500 hover:bg-green-600 text-white"
                            )}
                          >
                            {isRecording ? (
                              <MicOff className="h-8 w-8" />
                            ) : (
                              <Mic className="h-8 w-8" />
                            )}
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-lg font-medium">
                            {isRecording 
                              ? "Enregistrement en cours... Cliquez pour arrêter" 
                              : "Cliquez pour commencer l'enregistrement"
                            }
                          </p>
                          
                          {recordedAudio && (
                            <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                              <p className="text-green-700 font-medium">
                                ✓ Enregistrement terminé ({Math.round(recordedAudio.size / 1024)} KB)
                              </p>
                              <audio 
                                controls 
                                className="w-full mt-2"
                                src={recordedAudio ? URL.createObjectURL(recordedAudio) : ''}
                              />
                            </div>
                          )}
                        </div>
                        
                        {/* Journal des logs */}
                        {recordingLogs.length > 0 && (
                          <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-32 overflow-y-auto text-left">
                            {recordingLogs.map((log, index) => (
                              <div key={index}>{log}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Mode texte */}
                {noteMode === 'text' && (
                  <div className="space-y-4">
                    <Label htmlFor="textNote" className="text-lg font-medium">
                      Message pour votre collègue
                    </Label>
                    <Textarea
                      id="textNote"
                      value={textNote}
                      onChange={(e) => setTextNote(e.target.value)}
                      placeholder="Expliquez à votre collègue ce qu'il doit savoir pour le prochain shift..."
                      className="min-h-[200px] text-base hotel-hover"
                    />
                    <p className="text-sm text-muted-foreground">
                      {textNote.length} caractères
                    </p>
                  </div>
                )}

                {/* Bouton Submit */}
                <div className="flex justify-center pt-8">
                  <Button
                    onClick={submitShiftEnd}
                    disabled={isSubmitting || (noteMode === 'voice' && !recordedAudio && !isRecording) || (noteMode === 'text' && !textNote.trim())}
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-white px-8 py-3 text-lg font-medium flex items-center gap-2 min-w-[200px]"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Envoi...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        Terminer le shift
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="p-6 bg-muted/30">
                <h3 className="text-lg font-medium">
                  La situation a-t-elle évoluée concernant : {currentTask?.title} ?
                </h3>
              </div>

              {/* Card Display - Utilisation du nouveau composant ShiftFacingCard */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="max-w-2xl mx-auto">
                  <ShiftFacingCard 
                    task={currentTask}
                    onClick={() => onCardClick?.(currentTask)}
                    className="hover:border-yellow-400 hover:shadow-lg"
                  />
                </div>
              </div>
            </>
          )}

          {/* Floating Buttons - seulement si ce n'est pas l'écran de note vocale */}
          {!isVoiceNoteScreen && (
            <div className="fixed bottom-8 right-8 flex flex-col gap-4">
              <Button
                onClick={handleValidate}
                size="lg"
                className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 shadow-lg"
              >
                <Check className="h-6 w-6" />
              </Button>
              <Button
                onClick={handleCardEdit}
                size="lg"
                className="h-12 w-12 rounded-full bg-muted hover:bg-muted/90 text-muted-foreground shadow-lg"
              >
                <Edit3 className="h-6 w-6" />
              </Button>
            </div>
          )}

          {/* TaskFullEditView - Full Editable Card */}
          {editingTask && (
            <TaskFullEditView
              isOpen={isEditModalOpen}
              onClose={() => {
                setIsEditModalOpen(false);
                setEditingTask(null);
              }}
              task={editingTask}
              onSave={handleSaveTask}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ShiftFacingCard } from '@/components/cards';
import { supabase } from '@/integrations/supabase/client';
import { saveShiftHandover } from '@/lib/shiftContinuityManager-v2';
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
    addLog('Requesting microphone access...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      
      addLog('✅ Microphone access granted');
      setAudioStream(stream);
      setMicrophoneReady(true);
      
      // Show microphone info
      const tracks = stream.getAudioTracks();
      if (tracks.length > 0) {
        const track = tracks[0];
        addLog(`Microphone detected: ${track.label || 'Audio device'}`);
      }
      
    } catch (error: any) {
      addLog(`Microphone error: ${error.message}`);
      if (error.name === 'NotAllowedError') {
        alert('Microphone permission denied. Please allow microphone access.');
      } else if (error.name === 'NotFoundError') {
        alert('No microphone found on this system.');
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
          addLog(`Chunk received: ${event.data.size} bytes`);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        addLog(`Recording completed: ${audioBlob.size} bytes`);
        setRecordedAudio(audioBlob);
        setIsRecording(false);
        setMediaRecorder(null);
      };

      recorder.onerror = (event: any) => {
        addLog(`MediaRecorder error: ${event.error}`);
      };

      recorder.start(1000); // 1 second chunks
      setMediaRecorder(recorder);
      setIsRecording(true);
      addLog('Recording started...');
      
    } catch (error: any) {
      addLog(`Error starting recording: ${error.message}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      addLog('Stopping recording...');
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
    addLog('Starting shift save...');
    
    try {
      // 1. Upload audio if present
      let voiceNoteUrl = null;
      if (recordedAudio) {
        addLog(`Uploading audio: ${recordedAudio.size} bytes`);
        const fileName = `shift_${Date.now()}.wav`;
        
        const { data, error } = await supabase.storage
          .from('shift-recordings')
          .upload(fileName, recordedAudio, {
            contentType: 'audio/wav'
          });
        
        if (error) {
          addLog(`Upload error: ${error.message}`);
          throw new Error(`Audio upload failed: ${error.message}`);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('shift-recordings')
            .getPublicUrl(fileName);
          voiceNoteUrl = publicUrl;
          addLog('Audio uploaded successfully');
        }
      }
      
      // 2. Create shift record
      const { data: userData } = await supabase.auth.getUser();
      const userDisplayName = userData.user?.user_metadata?.full_name || userData.user?.email?.split('@')[0] || 'Team Member';
      
      const shiftData = {
        user_id: userData.user?.id,
        end_time: new Date().toISOString(),
        status: 'completed',
        voice_note_url: voiceNoteUrl,
        voice_note_transcription: noteMode === 'text' ? textNote : null,
        handover_notes: noteMode === 'text' ? textNote : (recordedAudio ? 'Voice note recorded' : 'No handover notes'),
      };
      
      const { data: shiftResult, error: shiftError } = await supabase
        .from('shifts')
        .insert(shiftData)
        .select()
        .single();
      
      if (shiftError) throw shiftError;
      addLog(`Shift created: ${shiftResult.id}`);
      
      // 3. NEW: Use Shift Continuity Manager
      addLog('Applying intelligent transfer rules...');
      await saveShiftHandover(
        shiftResult.id,
        tasks, // All cards
        voiceNoteUrl,
        noteMode === 'text' ? textNote : null,
        'Shift handover with continuity rules applied'
      );
      
      addLog('Shift Continuity Manager: ALL cards archived');
      addLog('Transfer rules will be applied on next shift');
      
      // Count cards by category for summary
      const stats = {
        incidents: tasks.filter(t => t.type === 'incident').length,
        clientRequests: tasks.filter(t => t.type === 'client_request').length,
        followUps: tasks.filter(t => t.type === 'follow_up').length,
        internalTasks: tasks.filter(t => t.type === 'internal_task').length,
        resolved: tasks.filter(t => t.status === 'completed' || t.status === 'resolved').length
      };
      
      const message = `Thank you for your professionalism, ${userDisplayName}!

` +
        `• ${tasks.length} cards archived
` +
        `• ${stats.incidents} incidents (will be transferred)
` +
        `• ${stats.clientRequests} client requests (will be transferred)
` +
        `• ${stats.followUps} follow-ups (if assigned)
` +
        `• ${stats.internalTasks} internal tasks (if assigned)
` +
        `• ${stats.resolved} resolved cards (archived only)

` +
        `${voiceNoteUrl ? 'Audio note' : 'Text notes'} recorded for next team

` +
        `Your shift handover has been successfully registered in the system.`;
      
      addLog('Shift completed successfully!');
      alert(message);
      
      // Clean up audio stream
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
      
      onClose();
      
    } catch (error: any) {
      addLog(`General error: ${error.message}`);
      alert(`Error: ${error.message}`);
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
                ? "End of shift - leave a voice note for your colleague"
                : "End of shift - update your cards"
              }
            </h2>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {isVoiceNoteScreen 
                  ? (
                      <div style={{ color: '#BBA88A', fontSize: '1.25rem', fontWeight: '500', lineHeight: '1.3' }}>
                        <div>How did the shift go. And what needs attention.</div>
                        <div>Stay concise</div>
                      </div>
                    )
                  : `Question ${currentTaskIndex + 1} of ${totalTasks}`
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
                  Voice Note
                  </Button>
                  <Button
                  variant={noteMode === 'text' ? 'default' : 'outline'}
                  onClick={() => setNoteMode('text')}
                  className="flex items-center gap-2 hotel-button-hover"
                  >
                    <Type className="h-4 w-4" />
                    Written Note
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
                          className="px-8 py-4 text-lg font-medium text-white transition-all duration-200 bg-[#BBA88A] hover:bg-[#DEAE53] hover:text-[#1E1A37]"
                        >
                          <Mic className="h-6 w-6 mr-2" />
                          Enable Microphone
                        </Button>
                        <p className="text-sm text-muted-foreground mt-2">
                          Click to request microphone access
                        </p>
                      </div>
                    )}
                    
                    {/* Interface d'enregistrement */}
                    {microphoneReady && (
                      <div className="text-center space-y-6">
                        {!isRecording && !recordedAudio && (
                          <div className="mb-6">
                            <p className="text-lg font-medium text-[#BBA88A] mb-2">
                              Press the green button when you are ready!
                            </p>
                          </div>
                        )}
                        
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
                              ? "Recording in progress... Click to stop" 
                              : "Click to start recording"
                            }
                          </p>
                          
                          {recordedAudio && (
                            <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                              <p className="text-green-700 font-medium">
                                ✓ Recording completed ({Math.round(recordedAudio.size / 1024)} KB)
                              </p>
                              <audio 
                                controls 
                                className="w-full mt-2"
                                src={recordedAudio ? URL.createObjectURL(recordedAudio) : ''}
                              />
                            </div>
                          )}
                        </div>
                        
                        {/* Journal des logs - MASQUÉ EN PRODUCTION */}
                        {recordingLogs.length > 0 && false && (
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
                      Message for your colleague
                    </Label>
                    <Textarea
                      id="textNote"
                      value={textNote}
                      onChange={(e) => setTextNote(e.target.value)}
                      placeholder="Explain to your colleague what they need to know for the next shift..."
                      className="min-h-[200px] text-base hotel-hover"
                    />
                    <p className="text-sm text-muted-foreground">
                      {textNote.length} characters
                    </p>
                  </div>
                )}

                {/* Bouton Submit */}
                <div className="flex justify-center pt-8">
                  <Button
                    onClick={submitShiftEnd}
                    disabled={isSubmitting || (noteMode === 'voice' && !recordedAudio && !isRecording) || (noteMode === 'text' && !textNote.trim())}
                    size="lg"
                    className={(
                      (isSubmitting || (noteMode === 'voice' && !recordedAudio && !isRecording) || (noteMode === 'text' && !textNote.trim()))
                        ? "bg-[#F5F5DC] text-gray-400 cursor-not-allowed px-8 py-3 text-lg font-medium flex items-center gap-2 min-w-[200px]"
                        : "bg-[#1E1A37] hover:bg-[#DEAE53] hover:text-[#1E1A37] text-white px-8 py-3 text-lg font-medium flex items-center gap-2 min-w-[200px] transition-all duration-200"
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        Register Your End of Shift
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
                  Has the situation evolved regarding: {currentTask?.title}?
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
                className="h-12 px-6 bg-primary hover:bg-primary/90 shadow-lg text-white font-medium"
              >
                <Check className="h-4 w-4 mr-2" />
                Next
              </Button>
              <Button
                onClick={handleCardEdit}
                size="lg"
                className="h-12 px-6 bg-muted hover:bg-muted/90 text-muted-foreground shadow-lg font-medium"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Modify
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
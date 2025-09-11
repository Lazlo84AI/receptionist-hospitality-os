import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ShiftFacingCard } from '@/components/cards';
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
  
  // États pour la note de fin de shift
  const [noteMode, setNoteMode] = useState<'voice' | 'text'>('voice');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [textNote, setTextNote] = useState('');
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        setRecordedAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Erreur d\'accès au microphone:', error);
      alert('Impossible d\'accéder au microphone. Vérifiez les permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
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
    try {
      const shiftData = {
        shift_id: `shift_${Date.now()}`, // Générer un ID unique
        user_id: 'current_user', // Récupérer l'ID de l'utilisateur actuel
        shift_end_time: new Date().toISOString(),
        tasks_reviewed: tasks.map(task => task.id),
        voicenote_file: recordedAudio ? 'recorded_audio.wav' : null,
        voicenote_transcript: noteMode === 'text' ? textNote : null,
        note_type: noteMode,
        created_at: new Date().toISOString()
      };

      // Ici vous devriez envoyer les données à Supabase
      // await supabase.from('shifts').insert(shiftData);
      
      console.log('Données de fin de shift:', shiftData);
      
      // Si audio, on devrait aussi l'uploader vers Supabase Storage
      if (recordedAudio) {
        console.log('Audio à uploader:', recordedAudio);
        // await supabase.storage.from('shift-recordings').upload(`${shiftData.shift_id}.wav`, recordedAudio);
      }
      
      alert('Fin de shift enregistrée avec succès!');
      onClose();
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      alert('Erreur lors de l\'enregistrement de la fin de shift.');
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

                {/* Mode vocal */}
                {noteMode === 'voice' && (
                  <div className="text-center space-y-6">
                    <Button
                      onClick={handleVoiceNote}
                      size="lg"
                      className={cn(
                        "h-32 w-32 rounded-full shadow-lg text-lg font-medium transition-all",
                        isRecording 
                          ? "bg-red-500 hover:bg-red-600 text-white animate-pulse" 
                          : "bg-champagne-gold hover:bg-champagne-gold/90 text-palace-navy"
                      )}
                    >
                      {isRecording ? (
                        <MicOff className="h-12 w-12" />
                      ) : (
                        <Mic className="h-12 w-12" />
                      )}
                    </Button>
                    <div className="space-y-2">
                      <p className="text-muted-foreground">
                        {isRecording 
                          ? "🎙️ Enregistrement en cours... Cliquez pour arrêter" 
                          : "Appuyez pour enregistrer votre message"
                        }
                      </p>
                      {recordedAudio && (
                        <p className="text-green-600 font-medium">
                          ✓ Message vocal enregistré
                        </p>
                      )}
                    </div>
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
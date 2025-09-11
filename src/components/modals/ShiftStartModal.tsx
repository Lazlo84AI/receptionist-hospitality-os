import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { ShiftFacingCard } from '@/components/cards';
import { useShiftHandover } from '@/hooks/useShiftHandover';
import { supabase } from '@/integrations/supabase/client';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Play, 
  Pause, 
  SkipBack, 
  User, 
  MapPin, 
  Calendar,
  Check,
  Eye,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  CheckSquare,
  MoveUp,
  Paperclip,
  FileAudio,
  FileText,
  AlertTriangle, 
  Users, 
  Clock, 
  Wrench,
  RefreshCw,
  Archive,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TaskItem } from '@/types/database';
import { useLatestShiftHandover } from '@/hooks/useShiftData';

interface ShiftStartModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  onShiftStarted: () => void;
}

// Configuration pour le modal de détails (toujours nécessaire)
const getTypeConfigForDetails = (type: string) => {
  switch (type) {
    case 'incident':
      return { 
        icon: AlertTriangle, 
        color: 'bg-red-100 text-red-600',
        label: 'Incident' 
      };
    case 'client_request':
      return { 
        icon: Users, 
        color: 'bg-green-100 text-green-600',
        label: 'Client Request' 
      };
    case 'follow_up':
      return { 
        icon: Clock, 
        color: 'bg-gray-600 text-white',
        label: 'Follow-up' 
      };
    case 'internal_task':
      return { 
        icon: Wrench, 
        color: 'bg-yellow-100 text-yellow-600',
        label: 'Internal Task' 
      };
    default:
      return { 
        icon: Wrench, 
        color: 'bg-gray-100 text-gray-600',
        label: 'Task' 
      };
  }
};

const ShiftStartModal: React.FC<ShiftStartModalProps> = ({ 
  isOpen, 
  onClose, 
  tasks, 
  onShiftStarted 
}) => {
  const { shiftData, loading: shiftDataLoading, error: shiftDataError } = useLatestShiftHandover();
  
  // NOUVEAU: Récupération intelligente des cartes
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const { data: handoverData, loading: handoverLoading, acceptHandover, error: handoverError } = useShiftHandover(currentUserId);
  
  const [currentStep, setCurrentStep] = useState<'voice' | 'handover' | 'tasks'>('voice');
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [readTasks, setReadTasks] = useState<Set<string>>(new Set());
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [comment, setComment] = useState('');
  
  // Récupérer l'utilisateur actuel au montage
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    getCurrentUser();
  }, []);
  
  // Combiner les tâches actuelles avec les cartes transférées
  const combinedTasks = [
    ...(handoverData?.tasks || []), // Cartes du shift précédent
    ...tasks // Cartes actuelles
  ];
  
  const currentTask = combinedTasks[currentTaskIndex];
  const totalTasks = combinedTasks.length;
  const allTasksRead = readTasks.size === totalTasks;

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

  const handleMarkAsRead = () => {
    const newReadTasks = new Set(readTasks);
    newReadTasks.add(currentTask.id);
    setReadTasks(newReadTasks);
    
    // Auto-advance to next task if not the last one
    if (currentTaskIndex < totalTasks - 1) {
      setCurrentTaskIndex(currentTaskIndex + 1);
    }
  };

  const handleStartTasks = () => {
    if (handoverData && handoverData.tasks.length > 0) {
      setCurrentStep('handover'); // Montrer d'abord les cartes transférées
    } else {
      setCurrentStep('tasks'); // Pas de handover, aller directement aux tâches
    }
  };
  
  const handleAcceptHandover = async () => {
    if (!handoverData) return;
    
    try {
      // Créer un nouveau shift pour l'utilisateur actuel
      const { data: newShift, error } = await supabase
        .from('shifts')
        .insert({
          user_id: currentUserId,
          status: 'active'
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Finaliser le handover
      await acceptHandover(newShift.id);
      
      // Passer aux tâches
      setCurrentStep('tasks');
    } catch (error) {
      console.error('Erreur acceptation handover:', error);
      alert('Erreur lors de l\'acceptation du handover');
    }
  };

  const handleFinishShift = () => {
    onShiftStarted();
    onClose();
  };

  // Auto-close when all tasks are read
  React.useEffect(() => {
    if (allTasksRead && currentStep === 'tasks') {
      const timer = setTimeout(() => {
        handleFinishShift();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [allTasksRead, currentStep]);

  const toggleAudio = () => {
    setIsPlaying(!isPlaying);
  };

  const skipBack = () => {
    setAudioCurrentTime(Math.max(0, audioCurrentTime - 15));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0 overflow-hidden">
        <div className="flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="p-6 border-b bg-background">
          <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
          Shift Start: Please review the to-do list
          </h2>
          {/* Plus de bouton X manuel - le Dialog en a déjà un */}
          </div>
            
            {currentStep === 'tasks' && (
              <div className="mt-4 flex items-center gap-2">
                <div className="text-sm text-muted-foreground">
                  Card {currentTaskIndex + 1} of {totalTasks}
                </div>
                <div className="flex-1 bg-muted h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${((currentTaskIndex + 1) / totalTasks) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {currentStep === 'voice' ? (
              // Voice Note Section
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-lg font-semibold mb-2">
                    {shiftData ? 'Voice Note from Your Predecessor' : 'Shift Handover Information'}
                  </h3>
                  <p className="text-muted-foreground">
                    {shiftData 
                      ? `Key information from ${shiftData.previous_shift_user || 'the previous team'}` 
                      : 'No handover data available from previous shift'
                    }
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Audio Player - Left side */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileAudio className="h-4 w-4" />
                        Audio Player
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {shiftData?.voice_note_url ? (
                        <div className="space-y-4">
                          {/* Audio element */}
                          <audio 
                            controls 
                            className="w-full"
                            preload="metadata"
                          >
                            <source src={shiftData.voice_note_url} type="audio/mpeg" />
                            <source src={shiftData.voice_note_url} type="audio/wav" />
                            Your browser does not support the audio element.
                          </audio>
                          <p className="text-xs text-muted-foreground">
                            Left by {shiftData.previous_shift_user || 'Previous team member'}
                            {shiftData.previous_shift_end_time && (
                              <> • {new Date(shiftData.previous_shift_end_time).toLocaleString('fr-FR')}</>
                            )}
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <FileAudio className="h-12 w-12 text-muted-foreground mb-4" />
                          <p className="text-sm text-muted-foreground">
                            No voice note available from the previous shift
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Text Transcript or Handover Notes - Right side with scroll */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {shiftData?.voice_note_transcription ? 'Transcription of the Voice Note' : 'Handover Notes'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(shiftData?.voice_note_transcription || shiftData?.handover_notes) ? (
                        <div className="max-h-64 overflow-y-auto text-sm leading-relaxed space-y-3 pr-2">
                          {shiftData.voice_note_transcription && (
                            <div className="space-y-3">
                              {shiftData.voice_note_transcription.split('\n\n').map((paragraph, index) => (
                                <p key={index} className="text-foreground">
                                  {paragraph}
                                </p>
                              ))}
                            </div>
                          )}
                          {shiftData.handover_notes && !shiftData.voice_note_transcription && (
                            <div className="space-y-3">
                              {shiftData.handover_notes.split('\n').map((line, index) => (
                                <p key={index} className="text-foreground">
                                  {line}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                          <p className="text-sm text-muted-foreground mb-2">
                            No transcription or handover notes available
                          </p>
                          <p className="text-xs text-muted-foreground">
                            The previous shift didn't leave any written information
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-center mt-8">
                  <Button onClick={handleStartTasks} className="px-8">
                    Start Reviewing the Task Cards
                  </Button>
                </div>
              </div>
            ) : (
              // Tasks Review Section avec ShiftFacingCard
              <div className="space-y-6">
                {/* Task Card */}
                <div className="max-w-2xl mx-auto">
                  <ShiftFacingCard 
                    task={currentTask}
                    onClick={() => setShowTaskDetail(true)}
                    className="hover:border-blue-400 hover:shadow-lg"
                  />
                  
                  {/* Status de lecture */}
                  {readTasks.has(currentTask?.id || '') && (
                    <div className="mt-3 flex items-center justify-center gap-2 text-green-600">
                      <Check className="h-4 w-4" />
                      <span className="text-sm font-medium">Task Read</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {currentStep === 'tasks' && (
            <div className="p-6 border-t bg-background">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentTaskIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                <div className="flex items-center gap-4">
                  {!readTasks.has(currentTask?.id || '') && (
                    <>
                      <Button onClick={() => setShowTaskDetail(true)} variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      <Button onClick={handleMarkAsRead} variant="default">
                        <Check className="h-4 w-4 mr-1" />
                        Mark as Read
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
      
      {/* Modal de détails - même vue que dans le dashboard */}
      <Dialog open={showTaskDetail} onOpenChange={setShowTaskDetail}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-playfair text-xl text-palace-navy">
              Task Details
            </DialogTitle>
          </DialogHeader>
          {currentTask && (() => {
            const typeConfig = getTypeConfigForDetails(currentTask.type);
            const TypeIcon = typeConfig.icon;
            
            return (
            <div className="space-y-6">
              {/* Task Header */}
              <div className="flex items-start gap-3">
                <div className={cn("p-3 rounded-full", typeConfig.color)}>
                  <TypeIcon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <Badge variant="outline" className="mb-2">
                    {typeConfig.label}
                  </Badge>
                  <h3 className="text-xl font-semibold mb-2">{currentTask.title}</h3>
                  {currentTask.priority === 'urgent' && (
                    <Badge className="bg-red-500 text-white">
                      Urgent
                    </Badge>
                  )}
                </div>
              </div>

              {/* Description */}
              {currentTask.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {currentTask.description}
                  </p>
                </div>
              )}

              {/* Task Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentTask.guestName && (
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Client</p>
                      <p className="text-muted-foreground">{currentTask.guestName}</p>
                    </div>
                  </div>
                )}
                
                {currentTask.roomNumber && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Chambre</p>
                      <p className="text-muted-foreground">{currentTask.roomNumber}</p>
                    </div>
                  </div>
                )}
                
                {currentTask.location && !currentTask.roomNumber && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Localisation</p>
                      <p className="text-muted-foreground">{currentTask.location}</p>
                    </div>
                  </div>
                )}
                
                {currentTask.assignedTo && (
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Assigné à</p>
                      <p className="text-muted-foreground">{currentTask.assignedTo}</p>
                    </div>
                  </div>
                )}
                
                {currentTask.dueDate && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Échéance</p>
                      <p className="text-muted-foreground">
                        {new Date(currentTask.dueDate).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                )}

                {currentTask.recipient && (
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Destinataire</p>
                      <p className="text-muted-foreground">{currentTask.recipient}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Status */}
              <div>
                <h4 className="font-medium mb-2">Statut</h4>
                <Badge variant={currentTask.status === 'completed' ? 'default' : 'secondary'}>
                  {currentTask.status === 'pending' && 'En attente'}
                  {currentTask.status === 'in_progress' && 'En cours'}
                  {currentTask.status === 'completed' && 'Terminé'}
                </Badge>
              </div>

              {/* 💬 Bloc commentaires et activité */}
              <div className="border-t pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <MessageCircle className="h-5 w-5 text-muted-foreground" />
                  <h4 className="font-medium text-foreground">Commentaires et activité</h4>
                </div>
                
                {/* Zone commentaire (lecture seule) */}
                <div className="mb-4 p-3 bg-muted/30 rounded-lg border-2 border-dashed border-muted">
                  <p className="text-sm text-muted-foreground italic">
                    Zone de commentaire (consultation uniquement)
                  </p>
                </div>

                {/* Commentaires postés - TEMPORAIRE hardcodé */}
                <div className="space-y-3">
                  <div className="flex space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-medium">JD</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-foreground">Jean Dupont</span>
                        <span className="text-sm text-muted-foreground">il y a 4 heures</span>
                      </div>
                      <p className="text-foreground">Problème résolu, climatisation réparée</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ⏰ Bloc Reminder(s) configuré(s) */}
              <div className="border-t pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <h4 className="font-medium text-foreground">Reminder(s) configuré(s)</h4>
                </div>
                
                {/* TEMPORAIRE hardcodé */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-foreground mb-2">
                    Vérification tous les vendredis à 16h pour la maintenance préventive
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Configuré par Sophie Martin – 26/07/2025
                  </p>
                </div>
              </div>

              {/* 📜 Activités récentes (journal chronologique) */}
              <div className="border-t pt-6">
                <h4 className="font-medium text-foreground mb-4">Activités récentes</h4>
                
                {/* TEMPORAIRE hardcodé */}
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>JD a laissé un commentaire – il y a 4h</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Sophie Martin a programmé un reminder – il y a 48h</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    <span>Checklist initiale ajoutée par Sophie Martin – il y a 1j</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setShowTaskDetail(false)}>
                  Fermer
                </Button>
              </div>
            </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default ShiftStartModal;
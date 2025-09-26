import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ShiftFacingCard } from '@/components/cards/ShiftFacingCard';
import { supabase } from '@/integrations/supabase/client';
import { 
  ChevronLeft, 
  ChevronRight, 
  Check,
  Eye,
  FileAudio,
  FileText,
  AlertTriangle, 
  Users, 
  Clock, 
  Wrench,
  User,
  MapPin,
  Calendar,
  MessageCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TaskItem, Comment, Reminder, ActivityLog } from '@/types/database';
import { useLatestShiftHandover } from '@/hooks/useShiftData';

interface ShiftStartModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  onShiftStarted: () => void;
}

const ShiftStartModal: React.FC<ShiftStartModalProps> = ({ 
  isOpen, 
  onClose, 
  tasks, 
  onShiftStarted 
}) => {
  // Données du shift précédent pour le premier écran
  const { shiftData, loading: shiftDataLoading, error: shiftDataError } = useLatestShiftHandover();
  
  // currentTaskIndex : compteur simple (0 = premier écran, 1+ = cartes)
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [readTasks, setReadTasks] = useState<Set<string>>(new Set());
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  
  // États pour les vraies données du modal de détails
  const [taskComments, setTaskComments] = useState<Comment[]>([]);
  const [taskReminders, setTaskReminders] = useState<Reminder[]>([]);
  const [taskActivities, setTaskActivities] = useState<ActivityLog[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Total : premier écran + toutes les cartes
  const totalScreens = 1 + tasks.length; // écran 0 + les cartes
  const isFirstScreen = currentTaskIndex === 0;
  const currentTask = !isFirstScreen ? tasks[currentTaskIndex - 1] : null;

  // Navigation functions
  const handlePrevious = () => {
    if (currentTaskIndex > 1) {
      setCurrentTaskIndex(currentTaskIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentTaskIndex < tasks.length) {
      setCurrentTaskIndex(currentTaskIndex + 1);
    }
  };

  // Fonction pour valider et passer à la carte suivante
  const handleValidate = () => {
    if (!currentTask) return;
    
    const newReadTasks = new Set(readTasks);
    newReadTasks.add(currentTask.id);
    setReadTasks(newReadTasks);
    
    // Passer à la carte suivante si pas la dernière
    if (currentTaskIndex < tasks.length) {
      setCurrentTaskIndex(currentTaskIndex + 1);
    } else {
      // Toutes les cartes ont été vues, fermer et démarrer le shift
      onShiftStarted();
      onClose();
    }
  };

  // Configuration pour le modal de détails (lecture seule)
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

  // Fonction pour récupérer les données détaillées d'une tâche
  const fetchTaskDetails = async (task: TaskItem) => {
    setLoadingDetails(true);
    try {
      // Récupérer les commentaires
      const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:user_id (
            first_name,
            last_name
          )
        `)
        .eq('task_id', task.id)
        .order('created_at', { ascending: false });

      if (commentsError) {
        console.error('Erreur chargement commentaires:', commentsError);
      } else {
        setTaskComments(comments || []);
      }

      // Récupérer les reminders
      const { data: reminders, error: remindersError } = await supabase
        .from('reminders')
        .select(`
          *,
          profiles:created_by (
            first_name,
            last_name
          )
        `)
        .eq('task_id', task.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (remindersError) {
        console.error('Erreur chargement reminders:', remindersError);
      } else {
        setTaskReminders(reminders || []);
      }

      // Récupérer les activités
      const { data: activities, error: activitiesError } = await supabase
        .from('activity_log')
        .select(`
          *,
          profiles:user_id (
            first_name,
            last_name
          )
        `)
        .eq('task_id', task.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (activitiesError) {
        console.error('Erreur chargement activités:', activitiesError);
      } else {
        setTaskActivities(activities || []);
      }

    } catch (error) {
      console.error('Erreur générale lors du chargement des détails:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Fonction pour afficher les détails (lecture seule)
  const handleCardClick = (task: TaskItem) => {
    setShowTaskDetail(true);
    fetchTaskDetails(task);
  };

  // Fonction pour formater le temps relatif
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Il y a moins d'une minute";
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[70vh] max-h-[70vh] p-0 gap-0 overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b bg-background">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Shift Start: Please review the to-do list
              </h2>
            </div>
            
            {/* Progress bar seulement pour les cartes */}
            {!isFirstScreen && (
              <div className="mt-4 flex items-center gap-2">
                <div className="text-sm text-muted-foreground">
                  Card {currentTaskIndex} of {tasks.length}
                </div>
                <div className="flex-1 bg-muted h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${(currentTaskIndex / tasks.length) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isFirstScreen ? (
              // ÉCRAN 0 : Audio Player + Handover Notes (comme vos captures)
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

                  {/* Handover Notes - Right side */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Handover Notes
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

                {/* Bouton pour passer aux cartes */}
                <div className="flex justify-center mt-8">
                  <Button 
                    onClick={() => setCurrentTaskIndex(1)} 
                    className="px-8"
                  >
                    Start Reviewing the Task Cards
                  </Button>
                </div>
              </div>
            ) : (
              // ÉCRANS 1+ : Navigation des cartes
              <div className="space-y-6">
                <div className="max-w-2xl mx-auto">
                  {currentTask && (
                    <ShiftFacingCard 
                      task={currentTask}
                      onClick={() => handleCardClick(currentTask)}
                      className="hover:border-blue-400 hover:shadow-lg"
                    />
                  )}
                  
                  {/* Status de lecture */}
                  {currentTask && readTasks.has(currentTask.id) && (
                    <div className="mt-3 flex items-center justify-center gap-2 text-green-600">
                      <Check className="h-4 w-4" />
                      <span className="text-sm font-medium">Task Read</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer Navigation - seulement pour les cartes */}
          {!isFirstScreen && (
            <div className="p-6 border-t bg-background">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentTaskIndex <= 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                <div className="flex items-center gap-4">
                  <Button 
                    onClick={() => handleCardClick(currentTask)} 
                    variant="outline"
                    disabled={!currentTask}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                  
                  <Button
                    onClick={handleValidate}
                    className="bg-primary hover:bg-primary/90 text-white"
                    disabled={!currentTask}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
      
      {/* Modal de détails - Vue lecture seule */}
      <Dialog 
        open={showTaskDetail} 
        onOpenChange={(open) => {
          setShowTaskDetail(open);
          if (!open) {
            // Réinitialiser les données quand on ferme
            setTaskComments([]);
            setTaskReminders([]);
            setTaskActivities([]);
            setLoadingDetails(false);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-playfair text-xl text-palace-navy">
              Task Details - Read Only
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

              {/* Bloc commentaires et activité */}
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

                {/* Commentaires - Affichage des vraies données */}
                <div className="space-y-3">
                  {loadingDetails ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-sm text-muted-foreground">Chargement des commentaires...</span>
                    </div>
                  ) : taskComments.length > 0 ? (
                    taskComments.map((comment: any) => (
                      <div key={comment.id} className="flex space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-medium">
                              {comment.profiles?.first_name?.charAt(0) || 'U'}
                              {comment.profiles?.last_name?.charAt(0) || ''}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-foreground">
                              {comment.profiles?.first_name} {comment.profiles?.last_name || 'Utilisateur'}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {formatRelativeTime(comment.created_at)}
                            </span>
                          </div>
                          <p className="text-foreground">{comment.content}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">
                        Aucun commentaire pour cette tâche
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bloc Reminder(s) configuré(s) */}
              <div className="border-t pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <h4 className="font-medium text-foreground">Reminder(s) configuré(s)</h4>
                </div>
                
                {/* Affichage des reminders */}
                {loadingDetails ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">Chargement des reminders...</span>
                  </div>
                ) : taskReminders.length > 0 ? (
                  <div className="space-y-3">
                    {taskReminders.map((reminder: any) => (
                      <div key={reminder.id} className="bg-muted/30 rounded-lg p-4">
                        <p className="text-foreground mb-2">
                          {reminder.title}
                        </p>
                        {reminder.message && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {reminder.message}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            Configuré par {reminder.profiles?.first_name} {reminder.profiles?.last_name}
                          </span>
                          <span>
                            {new Date(reminder.reminder_time).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            {reminder.frequency === 'once' && 'Une fois'}
                            {reminder.frequency === 'daily' && 'Quotidien'}
                            {reminder.frequency === 'weekly' && 'Hebdomadaire'}
                            {reminder.frequency === 'monthly' && 'Mensuel'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      Aucun reminder configuré pour cette tâche
                    </p>
                  </div>
                )}
              </div>

              {/* Activités récentes (journal chronologique) */}
              <div className="border-t pt-6">
                <h4 className="font-medium text-foreground mb-4">Activités récentes</h4>
                
                {/* Affichage des activités */}
                {loadingDetails ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">Chargement des activités...</span>
                  </div>
                ) : taskActivities.length > 0 ? (
                  <div className="space-y-3 text-sm">
                    {taskActivities.map((activity: any, index) => (
                      <div key={activity.id} className="flex items-center gap-2 text-muted-foreground">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>
                          {activity.profiles?.first_name} {activity.profiles?.last_name} {activity.description} – {formatRelativeTime(activity.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      Aucune activité récente pour cette tâche
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowTaskDetail(false);
                    // Réinitialiser les données
                    setTaskComments([]);
                    setTaskReminders([]);
                    setTaskActivities([]);
                    setLoadingDetails(false);
                  }}
                >
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
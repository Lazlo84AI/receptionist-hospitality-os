import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
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
  AlertTriangle, 
  Users, 
  Clock, 
  Wrench,
  Check,
  Eye,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  CheckSquare,
  MoveUp,
  Paperclip
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskItem {
  id: string;
  title: string;
  type: 'incident' | 'client_request' | 'follow_up' | 'internal_task';
  priority: 'normal' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed';
  description?: string;
  assignedTo?: string;
  dueDate?: string;
  location?: string;
  guestName?: string;
  roomNumber?: string;
  recipient?: string;
}

interface ShiftStartModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  onShiftStarted: () => void;
}

const getTypeConfig = (type: string) => {
  switch (type) {
    case 'incident':
      return { 
        icon: AlertTriangle, 
        color: 'bg-urgence-red text-warm-cream',
        label: 'Incident' 
      };
    case 'client_request':
      return { 
        icon: Users, 
        color: 'bg-champagne-gold text-palace-navy',
        label: 'Demande client' 
      };
    case 'follow_up':
      return { 
        icon: Clock, 
        color: 'bg-palace-navy text-warm-cream',
        label: 'Relance' 
      };
    case 'internal_task':
      return { 
        icon: Wrench, 
        color: 'bg-muted text-muted-foreground',
        label: 'Tâche interne' 
      };
    default:
      return { 
        icon: Wrench, 
        color: 'bg-muted text-muted-foreground',
        label: 'Tâche' 
      };
  }
};

const ShiftStartModal: React.FC<ShiftStartModalProps> = ({ 
  isOpen, 
  onClose, 
  tasks, 
  onShiftStarted 
}) => {
  const [currentStep, setCurrentStep] = useState<'voice' | 'tasks'>('voice');
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [readTasks, setReadTasks] = useState<Set<string>>(new Set());
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(180); // 3 minutes example
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [showActivityDetails, setShowActivityDetails] = useState(false);
  const [comment, setComment] = useState('');

  const currentTask = tasks[currentTaskIndex];
  const totalTasks = tasks.length;
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
    setCurrentStep('tasks');
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

  const typeConfig = currentTask ? getTypeConfig(currentTask.type) : null;
  const TypeIcon = typeConfig?.icon;

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
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {currentStep === 'tasks' && (
              <div className="mt-4 flex items-center gap-2">
                <div className="text-sm text-muted-foreground">
                  Carte {currentTaskIndex + 1} sur {totalTasks}
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
                    Note vocale de votre prédécesseur
                  </h3>
                  <p className="text-muted-foreground">
                    Écoutez les informations importantes de l'équipe précédente
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Audio Player - Left side */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Lecteur audio</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{formatTime(audioCurrentTime)}</span>
                            <span>{formatTime(audioDuration)}</span>
                          </div>
                          <div className="w-full bg-muted h-2 rounded-full overflow-hidden cursor-pointer">
                            <div 
                              className="h-full bg-primary transition-all duration-300"
                              style={{ width: `${(audioCurrentTime / audioDuration) * 100}%` }}
                            />
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-center gap-4">
                          <Button variant="outline" size="icon" onClick={skipBack}>
                            <SkipBack className="h-4 w-4" />
                          </Button>
                          <Button size="icon" onClick={toggleAudio} className="h-12 w-12">
                            {isPlaying ? (
                              <Pause className="h-5 w-5" />
                            ) : (
                              <Play className="h-5 w-5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Text Transcript - Right side with scroll */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Transcription texte de la note vocale</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="max-h-64 overflow-y-auto text-sm leading-relaxed space-y-3 pr-2">
                        <p>
                          Bonjour à l'équipe du shift suivant. Voici les points importants à retenir pour votre service :
                        </p>
                        <p>
                          La climatisation de la Suite Présidentielle est toujours en panne. Le technicien doit passer ce matin vers 9h. 
                          Il faudra accompagner M. Anderson qui occupe la suite. Attention, c'est un client VIP très exigeant qui a déjà 
                          exprimé son mécontentement hier soir.
                        </p>
                        <p>
                          Pour la famille Dubois en chambre 305, le lit bébé a été installé mais ils ont demandé des produits 
                          hypoallergéniques supplémentaires pour leur enfant. Marie de l'équipe ménage a les coordonnées du 
                          fournisseur spécialisé.
                        </p>
                        <p>
                          Dr. Williams en Suite 102 a exprimé sa satisfaction pour l'aménagement bureau. Il souhaite prolonger 
                          son séjour de deux nuits supplémentaires. Sa réservation doit être modifiée et il faut vérifier la 
                          disponibilité avec la réservation.
                        </p>
                        <p>
                          L'équipe de ménage est en effectif réduit aujourd'hui. Priorisez les chambres VIP et les départs prévus. 
                          Attention, trois membres de l'équipe sont absents pour cause de maladie.
                        </p>
                        <p>
                          Le système de réservation a eu quelques bugs hier après-midi. Vérifiez bien toutes les réservations 
                          du jour et n'hésitez pas à appeler le service technique si quelque chose semble anormal.
                        </p>
                        <p>
                          Il y a également eu un problème avec l'ascenseur principal. Il a été réparé mais gardez un œil dessus 
                          et prévenez immédiatement la maintenance si vous entendez des bruits inhabituels.
                        </p>
                        <p>
                          N'oubliez pas que nous avons un groupe de 15 personnes qui arrive cet après-midi pour un événement 
                          d'entreprise. Ils ont des exigences spécifiques pour le cocktail de bienvenue.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-center mt-8">
                  <Button onClick={handleStartTasks} className="px-8">
                    Commencer la revue des cartes
                  </Button>
                </div>
              </div>
            ) : (
              // Tasks Review Section
              <div className="space-y-6">
                {/* Task Card */}
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {TypeIcon && (
                          <div className={cn("p-2 rounded-full", typeConfig.color)}>
                            <TypeIcon className="h-5 w-5" />
                          </div>
                        )}
                        <div>
                          <Badge variant="outline" className="mb-2">
                            {typeConfig?.label}
                          </Badge>
                          <CardTitle className="text-lg">
                            {currentTask?.title}
                          </CardTitle>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {currentTask?.priority === 'urgent' && (
                          <Badge className="bg-urgence-red text-warm-cream">
                            Urgent
                          </Badge>
                        )}
                        {readTasks.has(currentTask?.id || '') && (
                          <div className="flex items-center gap-1 text-green-600">
                            <Check className="h-4 w-4" />
                            <span className="text-xs">Lu</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {currentTask?.description && (
                      <p className="text-muted-foreground">
                        {currentTask.description}
                      </p>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      {currentTask?.guestName && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{currentTask.guestName}</span>
                        </div>
                      )}
                      
                      {currentTask?.roomNumber && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>Chambre {currentTask.roomNumber}</span>
                        </div>
                      )}
                      
                      {currentTask?.location && !currentTask?.roomNumber && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{currentTask.location}</span>
                        </div>
                      )}
                      
                      {currentTask?.assignedTo && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>Assigné à {currentTask.assignedTo}</span>
                        </div>
                      )}
                      
                      {currentTask?.dueDate && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{new Date(currentTask.dueDate).toLocaleDateString('fr-FR')}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
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
                  Précédent
                </Button>

                <div className="flex items-center gap-4">
                  {!readTasks.has(currentTask?.id || '') && (
                    <>
                      <Button onClick={() => setShowTaskDetail(true)} variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        Voir les détails
                      </Button>
                      <Button onClick={handleMarkAsRead} variant="default">
                        <Check className="h-4 w-4 mr-1" />
                        Marquer comme lu
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
              Détails de la tâche
            </DialogTitle>
          </DialogHeader>
          {currentTask && (
            <div className="space-y-6">
              {/* Task Header */}
              <div className="flex items-start gap-3">
                <div className={cn("p-3 rounded-full", typeConfig?.color)}>
                  {TypeIcon && <TypeIcon className="h-6 w-6" />}
                </div>
                <div className="flex-1">
                  <Badge variant="outline" className="mb-2">
                    {typeConfig?.label}
                  </Badge>
                  <h3 className="text-xl font-semibold mb-2">{currentTask.title}</h3>
                  {currentTask.priority === 'urgent' && (
                    <Badge className="bg-urgence-red text-warm-cream">
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

                {/* Commentaires postés */}
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
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Marie Dubois a complété une tâche de checklist – il y a 6h</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Une pièce jointe a été ajoutée par Pierre Leroy – il y a 8h</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>Pierre Leroy a escaladé par email – il y a 12h</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Carte assignée à {currentTask.assignedTo} par Sophie Martin – il y a 1j</span>
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
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default ShiftStartModal;
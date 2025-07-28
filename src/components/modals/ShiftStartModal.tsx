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
                Démarrage de shift : Veuillez passer en revue la to do
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

              {/* Barre d'outils */}
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-palace-navy" />
                  <span className="text-sm text-palace-navy">Reminder</span>
                </Button>
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <CheckSquare className="h-4 w-4 text-palace-navy" />
                  <span className="text-sm text-palace-navy">Checklist</span>
                </Button>
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-palace-navy" />
                  <span className="text-sm text-palace-navy">Membres</span>
                </Button>
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <MoveUp className="h-4 w-4 text-palace-navy" />
                  <span className="text-sm text-palace-navy">Escalade</span>
                </Button>
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <Paperclip className="h-4 w-4 text-palace-navy" />
                  <span className="text-sm text-palace-navy">Attachment</span>
                </Button>
              </div>

              {/* Commentaires et activité */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="h-5 w-5 text-palace-navy" />
                    <h4 className="font-semibold text-palace-navy">Commentaires et activité</h4>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowActivityDetails(!showActivityDetails)}
                    className="text-sm"
                  >
                    {showActivityDetails ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-1" />
                        Masquer les détails
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1" />
                        Afficher les détails
                      </>
                    )}
                  </Button>
                </div>

                {/* Zone de commentaire */}
                <div className="mb-4">
                  <Textarea
                    placeholder="Écrivez un commentaire…"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>

                {/* Historique d'activité */}
                {showActivityDetails && (
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-600 text-white text-xs">
                          JD
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-3">
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-palace-navy">Commentaire laissé</span>
                            <span className="text-xs text-soft-pewter">il y a 2 heures</span>
                          </div>
                          <p className="text-sm">Tâche en cours de traitement</p>
                        </div>

                        <div className="text-sm text-soft-pewter">
                          <span className="font-medium">Jean Dupont</span> a marqué cette carte comme en cours
                          <span className="text-xs ml-2">il y a 3 heures</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
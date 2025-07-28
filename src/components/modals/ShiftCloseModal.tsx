import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Mic, 
  Check,
  AlertTriangle,
  Users,
  Clock,
  Wrench,
  User,
  MapPin,
  Calendar,
  Edit3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EditTaskModal } from './EditTaskModal';

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

interface ShiftCloseModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  onCardClick?: (task: TaskItem) => void;
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

export const ShiftCloseModal = ({ isOpen, onClose, tasks, onCardClick }: ShiftCloseModalProps) => {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

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

  const handleVoiceNote = () => {
    // Logic for voice note
    console.log('Recording voice note for task:', currentTask?.id);
  };

  // Vérifier si c'est le dernier écran (note vocale pour collègue)
  const isLastScreen = currentTaskIndex === totalTasks;
  const isVoiceNoteScreen = isLastScreen;

  if (!currentTask && !isVoiceNoteScreen) return null;

  const typeConfig = currentTask ? getTypeConfig(currentTask.type) : null;
  const TypeIcon = typeConfig?.icon;

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
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <Button
                  onClick={handleVoiceNote}
                  size="lg"
                  className="h-32 w-32 rounded-full bg-champagne-gold hover:bg-champagne-gold/90 text-palace-navy shadow-lg text-lg font-medium"
                >
                  <Mic className="h-12 w-12" />
                </Button>
                <p className="mt-4 text-muted-foreground">
                  Appuyez pour enregistrer votre message
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-6 bg-muted/30">
                <h3 className="text-lg font-medium">
                  La situation a-t-elle évoluée concernant : {currentTask?.title} ?
                </h3>
              </div>

              {/* Card Display */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="max-w-2xl mx-auto">
                  <Card className="transition-all duration-200 hover:shadow-lg">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {typeConfig && TypeIcon && (
                            <>
                              <div className={cn("p-2 rounded-full", typeConfig.color)}>
                                <TypeIcon className="h-5 w-5" />
                              </div>
                              <Badge variant="outline" className="text-sm">
                                {typeConfig.label}
                              </Badge>
                            </>
                          )}
                        </div>
                        {currentTask?.priority === 'urgent' && (
                          <Badge className="bg-urgence-red text-warm-cream">
                            Urgent
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl font-medium leading-6">
                        {currentTask?.title}
                      </CardTitle>
                    </CardHeader>
                    
                     <CardContent className="space-y-4">
                       {currentTask?.description && (
                         <p className="text-base text-foreground leading-relaxed">
                           {currentTask.description}
                         </p>
                       )}
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {currentTask?.guestName && (
                           <div className="flex items-center gap-3 text-sm">
                             <User className="h-4 w-4 text-muted-foreground" />
                             <span>{currentTask.guestName}</span>
                           </div>
                         )}
                         
                         {currentTask?.roomNumber && (
                           <div className="flex items-center gap-3 text-sm">
                             <MapPin className="h-4 w-4 text-muted-foreground" />
                             <span>Chambre {currentTask.roomNumber}</span>
                           </div>
                         )}
                         
                         {currentTask?.location && !currentTask.roomNumber && (
                           <div className="flex items-center gap-3 text-sm">
                             <MapPin className="h-4 w-4 text-muted-foreground" />
                             <span>{currentTask.location}</span>
                           </div>
                         )}
                         
                         {currentTask?.dueDate && (
                           <div className="flex items-center gap-3 text-sm">
                             <Calendar className="h-4 w-4 text-muted-foreground" />
                             <span>{new Date(currentTask.dueDate).toLocaleDateString('fr-FR')}</span>
                           </div>
                         )}
                         
                         {currentTask?.recipient && (
                           <div className="flex items-center gap-3 text-sm">
                             <User className="h-4 w-4 text-muted-foreground" />
                             <span>→ {currentTask.recipient}</span>
                           </div>
                         )}
                         
                         {currentTask?.assignedTo && (
                           <div className="flex items-center gap-3 text-sm">
                             <User className="h-4 w-4 text-muted-foreground" />
                             <span>Assigné à: {currentTask.assignedTo}</span>
                           </div>
                         )}
                       </div>

                       <div className="pt-4 border-t">
                         <Badge 
                           variant={currentTask?.status === 'completed' ? 'default' : 'secondary'}
                           className="text-sm"
                         >
                           {currentTask?.status === 'pending' && 'À traiter'}
                           {currentTask?.status === 'in_progress' && 'En cours'}
                           {currentTask?.status === 'completed' && 'Résolu'}
                         </Badge>
                       </div>
                     </CardContent>
                  </Card>
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

          {/* Edit Task Modal */}
          {editingTask && (
            <EditTaskModal
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
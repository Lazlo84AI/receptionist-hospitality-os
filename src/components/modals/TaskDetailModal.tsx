import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  User, 
  MapPin, 
  Calendar, 
  AlertTriangle, 
  Users, 
  Clock, 
  Wrench
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

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskItem | null;
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

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ 
  isOpen, 
  onClose, 
  task 
}) => {
  if (!task) return null;

  const typeConfig = getTypeConfig(task.type);
  const TypeIcon = typeConfig.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              Détails de la tâche
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

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
              <h3 className="text-xl font-semibold mb-2">{task.title}</h3>
              {task.priority === 'urgent' && (
                <Badge className="bg-urgence-red text-warm-cream">
                  Urgent
                </Badge>
              )}
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-muted-foreground leading-relaxed">
                {task.description}
              </p>
            </div>
          )}

          {/* Task Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {task.guestName && (
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Client</p>
                  <p className="text-muted-foreground">{task.guestName}</p>
                </div>
              </div>
            )}
            
            {task.roomNumber && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Chambre</p>
                  <p className="text-muted-foreground">{task.roomNumber}</p>
                </div>
              </div>
            )}
            
            {task.location && !task.roomNumber && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Localisation</p>
                  <p className="text-muted-foreground">{task.location}</p>
                </div>
              </div>
            )}
            
            {task.assignedTo && (
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Assigné à</p>
                  <p className="text-muted-foreground">{task.assignedTo}</p>
                </div>
              </div>
            )}
            
            {task.dueDate && (
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Échéance</p>
                  <p className="text-muted-foreground">
                    {new Date(task.dueDate).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            )}

            {task.recipient && (
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Destinataire</p>
                  <p className="text-muted-foreground">{task.recipient}</p>
                </div>
              </div>
            )}
          </div>

          {/* Status */}
          <div>
            <h4 className="font-medium mb-2">Statut</h4>
            <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
              {task.status === 'pending' && 'En attente'}
              {task.status === 'in_progress' && 'En cours'}
              {task.status === 'completed' && 'Terminé'}
            </Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailModal;
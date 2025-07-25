import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle,
  Users,
  Clock,
  Wrench,
  Calendar,
  User,
  MapPin,
  FileText,
  Edit3,
  CheckCircle,
  Play,
  XCircle
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
  task: TaskItem | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (taskId: string, newStatus: string) => void;
}

const getTypeConfig = (type: string) => {
  switch (type) {
    case 'incident':
      return { 
        icon: AlertTriangle, 
        color: 'bg-urgence-red text-warm-cream',
        label: 'Incident en cours',
        description: 'Situation nécessitant une intervention immédiate'
      };
    case 'client_request':
      return { 
        icon: Users, 
        color: 'bg-champagne-gold text-palace-navy',
        label: 'Demande client',
        description: 'Requête spéciale d\'un client'
      };
    case 'follow_up':
      return { 
        icon: Clock, 
        color: 'bg-palace-navy text-warm-cream',
        label: 'Relance',
        description: 'Suivi d\'une action ou d\'une demande'
      };
    case 'internal_task':
      return { 
        icon: Wrench, 
        color: 'bg-muted text-muted-foreground',
        label: 'Tâche interne',
        description: 'Tâche opérationnelle interne'
      };
    default:
      return { 
        icon: Wrench, 
        color: 'bg-muted text-muted-foreground',
        label: 'Tâche',
        description: 'Tâche à effectuer'
      };
  }
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'pending':
      return {
        icon: Clock,
        color: 'bg-amber-100 text-amber-800 border-amber-200',
        label: 'À traiter',
        description: 'En attente de traitement'
      };
    case 'in_progress':
      return {
        icon: Play,
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        label: 'En cours',
        description: 'Traitement en cours'
      };
    case 'completed':
      return {
        icon: CheckCircle,
        color: 'bg-green-100 text-green-800 border-green-200',
        label: 'Résolu',
        description: 'Traitement terminé avec succès'
      };
    default:
      return {
        icon: XCircle,
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        label: 'Inconnu',
        description: 'Statut non défini'
      };
  }
};

export function TaskDetailModal({ task, isOpen, onClose, onStatusChange }: TaskDetailModalProps) {
  if (!task) return null;

  const typeConfig = getTypeConfig(task.type);
  const statusConfig = getStatusConfig(task.status);
  const TypeIcon = typeConfig.icon;
  const StatusIcon = statusConfig.icon;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={cn("p-2 rounded-full", typeConfig.color)}>
              <TypeIcon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-semibold text-left">
                {task.title}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {typeConfig.description}
              </p>
            </div>
            <Badge className={cn("border", statusConfig.color)}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Priority Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Statut</label>
              <div className="flex items-center gap-2">
                <StatusIcon className="h-4 w-4" />
                <span className="font-medium">{statusConfig.label}</span>
              </div>
              <p className="text-xs text-muted-foreground">{statusConfig.description}</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Priorité</label>
              <Badge 
                className={cn(
                  task.priority === 'urgent' 
                    ? "bg-urgence-red text-warm-cream" 
                    : "bg-muted text-muted-foreground"
                )}
              >
                {task.priority === 'urgent' ? 'Urgente' : 'Normale'}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Description */}
          {task.description && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Description
              </label>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm leading-relaxed">{task.description}</p>
              </div>
            </div>
          )}

          {/* Details Section */}
          <div className="space-y-4">
            <label className="text-sm font-medium text-muted-foreground">Détails</label>
            <div className="grid grid-cols-1 gap-3">
              
              {task.guestName && (
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Client</p>
                    <p className="text-sm text-muted-foreground">{task.guestName}</p>
                  </div>
                </div>
              )}
              
              {task.roomNumber && (
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Chambre</p>
                    <p className="text-sm text-muted-foreground">N° {task.roomNumber}</p>
                  </div>
                </div>
              )}
              
              {task.location && !task.roomNumber && (
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Localisation</p>
                    <p className="text-sm text-muted-foreground">{task.location}</p>
                  </div>
                </div>
              )}
              
              {task.recipient && (
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Destinataire</p>
                    <p className="text-sm text-muted-foreground">{task.recipient}</p>
                  </div>
                </div>
              )}
              
              {task.dueDate && (
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Échéance</p>
                    <p className="text-sm text-muted-foreground">{formatDate(task.dueDate)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex gap-3">
            {task.status === 'pending' && (
              <Button 
                onClick={() => onStatusChange(task.id, 'in_progress')}
                className="flex-1"
              >
                <Play className="h-4 w-4 mr-2" />
                Démarrer la tâche
              </Button>
            )}
            
            {task.status === 'in_progress' && (
              <Button 
                onClick={() => onStatusChange(task.id, 'completed')}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Marquer comme terminé
              </Button>
            )}
            
            {task.status === 'completed' && (
              <Button 
                onClick={() => onStatusChange(task.id, 'in_progress')}
                variant="outline"
                className="flex-1"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Rouvrir la tâche
              </Button>
            )}
            
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
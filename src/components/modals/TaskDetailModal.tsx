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
  Wrench,
  MessageSquare,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TaskItem } from '@/types/database';

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              Détails de la tâche
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* 🧱 Informations statiques en haut */}
          <div className="space-y-4">
            {/* Titre principal et badges */}
            <div className="flex items-start gap-3">
              <div className={cn("p-3 rounded-full", typeConfig.color)}>
                <TypeIcon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-3">{task.title}</h3>
                <div className="flex items-center gap-2 mb-4">
                  <Badge 
                    variant={task.status === 'completed' ? 'default' : 'secondary'}
                    className={task.status === 'pending' ? 'bg-green-500 text-white' : ''}
                  >
                    {task.status === 'pending' && 'À traiter'}
                    {task.status === 'in_progress' && 'En cours'}
                    {task.status === 'completed' && 'Terminé'}
                  </Badge>
                  <Badge variant="outline" className="bg-muted text-muted-foreground">
                    {typeConfig.label}
                  </Badge>
                  {task.priority === 'urgent' && (
                    <Badge className="bg-urgence-red text-warm-cream">
                      URGENCE
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Assigné à et Localisation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {task.assignedTo && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Assigné à</p>
                  <p className="text-foreground">{task.assignedTo}</p>
                </div>
              )}
              
              {(task.roomNumber || task.location) && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Localisation</p>
                  <p className="text-foreground">{task.roomNumber || task.location}</p>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
              <p className="text-foreground leading-relaxed">
                {task.description || "Le système de climatisation de la Suite Présidentielle ne fonctionne plus depuis hier soir."}
              </p>
            </div>
          </div>

          {/* 💬 Bloc commentaires et activité */}
          <div className="border-t pt-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <h4 className="font-medium text-foreground">Commentaires et activité</h4>
            </div>
            
            {/* Champ commentaire (lecture seule) */}
            <div className="mb-4 p-3 bg-muted/30 rounded-lg border-2 border-dashed border-muted">
              <p className="text-sm text-muted-foreground italic">
                Champ commentaire (vue consultation uniquement)
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
                    <span className="font-medium text-foreground">JD</span>
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
              <Bell className="h-5 w-5 text-muted-foreground" />
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
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Pierre Leroy a escaladé par email – il y a 12h</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Une pièce jointe a été ajoutée par Marie Dubois – il y a 18h</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Carte assignée à {task.assignedTo} par Sophie Martin – il y a 2j</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailModal;
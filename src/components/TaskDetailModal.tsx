import { useState } from 'react';
import { X, User, MapPin, MessageSquare, Bell, AlertTriangle, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: {
    id: number;
    title: string;
    location: string;
    client: string;
    statut: string;
    priority: string | null;
    assignedTo: string;
    hoursElapsed: number;
    overdue: boolean;
    description?: string;
    type?: string;
  };
}

export function TaskDetailModal({ isOpen, onClose, task }: TaskDetailModalProps) {
  if (!task) return null;

  const getStatusColor = (statut: string) => {
    if (statut === 'À traiter') return 'bg-green-500 text-white';
    if (statut === 'En cours') return 'bg-palace-navy text-white';
    return 'bg-muted text-muted-foreground';
  };

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'incident':
        return { icon: AlertTriangle, color: 'bg-urgence-red text-warm-cream', label: 'Incident' };
      case 'client_request':
        return { icon: Users, color: 'bg-champagne-gold text-palace-navy', label: 'Demande client' };
      default:
        return { icon: Users, color: 'bg-champagne-gold text-palace-navy', label: 'Demande client' };
    }
  };

  const typeConfig = getTypeIcon(task.type);
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
            {/* Type et titre */}
            <div className="flex items-start gap-3">
              <div className={cn("p-3 rounded-full", typeConfig.color)}>
                <TypeIcon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <Badge variant="outline" className="mb-3">
                  {typeConfig.label}
                </Badge>
                <h3 className="text-xl font-semibold mb-3">{task.title}</h3>
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
              <p className="text-foreground leading-relaxed">
                {task.description || "Client mécontent de la qualité du service au petit-déjeuner."}
              </p>
            </div>

            {/* Localisation et Assigné à */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Localisation</p>
                  <p className="text-foreground">{task.location}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Assigné à</p>
                  <p className="text-foreground">{task.assignedTo}</p>
                </div>
              </div>
            </div>

            {/* Statut */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Statut</p>
              <Badge className={getStatusColor(task.statut)}>
                {task.statut}
              </Badge>
            </div>
          </div>

          {/* 💬 Bloc commentaires et activité */}
          <div className="border-t pt-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
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
                    <span className="text-white text-xs font-medium">SM</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground">Sophie Martin</span>
                    <span className="text-sm text-muted-foreground">il y a 2 heures</span>
                  </div>
                  <p className="text-foreground">Problème résolu avec le client, service amélioré</p>
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
                Vérification qualité service petit-déjeuner tous les matins à 7h30
              </p>
              <p className="text-sm text-muted-foreground">
                Configuré par Sophie Martin – 27/07/2025
              </p>
            </div>
          </div>

          {/* 📜 Activités récentes (journal chronologique) */}
          <div className="border-t pt-6">
            <h4 className="font-medium text-foreground mb-4">Activités récentes</h4>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Sophie Martin a laissé un commentaire – il y a 2h</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Sophie Martin a programmé un reminder – il y a 4h</span>
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
                <span>Pierre Leroy a escaladé par email – il y a 10h</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Carte assignée à {task.assignedTo} par Sophie Martin – il y a 1j</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                <span>Checklist initiale ajoutée par Sophie Martin – il y a 1j</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
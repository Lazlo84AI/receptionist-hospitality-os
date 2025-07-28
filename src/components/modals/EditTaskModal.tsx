import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  X, 
  Users, 
  MapPin, 
  Clock, 
  AlertTriangle,
  CheckSquare,
  Edit3,
  Check
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

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskItem;
  onSave: (updatedTask: TaskItem) => void;
}

export const EditTaskModal = ({ isOpen, onClose, task, onSave }: EditTaskModalProps) => {
  const [editedTask, setEditedTask] = useState<TaskItem>(task);
  const [hasChanges, setHasChanges] = useState(false);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    setEditedTask(task);
    setHasChanges(false);
  }, [task]);

  const handleFieldChange = (field: keyof TaskItem, value: any) => {
    setEditedTask(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(editedTask);
    setHasChanges(false);
    onClose();
  };

  const handleCancel = () => {
    setEditedTask(task);
    setHasChanges(false);
    onClose();
  };

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'incident':
        return { color: 'bg-urgence-red text-warm-cream', label: 'Incident' };
      case 'client_request':
        return { color: 'bg-champagne-gold text-palace-navy', label: 'Demande client' };
      case 'follow_up':
        return { color: 'bg-palace-navy text-warm-cream', label: 'Relance' };
      case 'internal_task':
        return { color: 'bg-muted text-muted-foreground', label: 'Tâche interne' };
      default:
        return { color: 'bg-muted text-muted-foreground', label: 'Tâche' };
    }
  };

  const typeConfig = getTypeConfig(editedTask.type);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] p-0 gap-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b bg-background flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-playfair font-bold">
                Modifier la carte
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Tous les champs sont modifiables – N'oubliez pas de sauvegarder
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="p-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto space-y-6">
              
              {/* Titre */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium flex items-center gap-2">
                  Titre de la carte
                  {hasChanges && <Check className="h-3 w-3 text-green-500" />}
                </Label>
                <Input
                  id="title"
                  value={editedTask.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  className="text-lg"
                />
              </div>

              {/* Catégorie et Priorité */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Catégorie</Label>
                  <div className="flex flex-wrap gap-2">
                    {(['incident', 'client_request', 'follow_up', 'internal_task'] as const).map((type) => {
                      const config = getTypeConfig(type);
                      return (
                        <Button
                          key={type}
                          variant={editedTask.type === type ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleFieldChange('type', type)}
                          className={cn(
                            editedTask.type === type && config.color
                          )}
                        >
                          {config.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Niveau de priorité</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={editedTask.priority === 'normal' ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFieldChange('priority', 'normal')}
                    >
                      Normale
                    </Button>
                    <Button
                      variant={editedTask.priority === 'urgent' ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFieldChange('priority', 'urgent')}
                      className={cn(
                        editedTask.priority === 'urgent' && "bg-urgence-red text-warm-cream"
                      )}
                    >
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Urgence
                    </Button>
                  </div>
                </div>
              </div>

              {/* Statut */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Statut</Label>
                <div className="flex gap-2">
                  {(['pending', 'in_progress', 'completed'] as const).map((status) => (
                    <Button
                      key={status}
                      variant={editedTask.status === status ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFieldChange('status', status)}
                    >
                      {status === 'pending' && 'À traiter'}
                      {status === 'in_progress' && 'En cours'}
                      {status === 'completed' && 'Résolu'}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Assignation */}
              <div className="space-y-2">
                <Label htmlFor="assignedTo" className="text-sm font-medium">
                  <Users className="h-4 w-4 inline mr-1" />
                  Membre assigné
                </Label>
                <Input
                  id="assignedTo"
                  value={editedTask.assignedTo || ''}
                  onChange={(e) => handleFieldChange('assignedTo', e.target.value)}
                  placeholder="Nom du membre assigné"
                />
              </div>

              {/* Localisation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {editedTask.roomNumber && (
                  <div className="space-y-2">
                    <Label htmlFor="roomNumber" className="text-sm font-medium">
                      <MapPin className="h-4 w-4 inline mr-1" />
                      Numéro de chambre
                    </Label>
                    <Input
                      id="roomNumber"
                      value={editedTask.roomNumber}
                      onChange={(e) => handleFieldChange('roomNumber', e.target.value)}
                    />
                  </div>
                )}

                {editedTask.location && (
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-sm font-medium">
                      <MapPin className="h-4 w-4 inline mr-1" />
                      Localisation
                    </Label>
                    <Input
                      id="location"
                      value={editedTask.location}
                      onChange={(e) => handleFieldChange('location', e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Client/Destinataire */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {editedTask.guestName && (
                  <div className="space-y-2">
                    <Label htmlFor="guestName" className="text-sm font-medium">
                      Nom du client
                    </Label>
                    <Input
                      id="guestName"
                      value={editedTask.guestName}
                      onChange={(e) => handleFieldChange('guestName', e.target.value)}
                    />
                  </div>
                )}

                {editedTask.recipient && (
                  <div className="space-y-2">
                    <Label htmlFor="recipient" className="text-sm font-medium">
                      Destinataire
                    </Label>
                    <Input
                      id="recipient"
                      value={editedTask.recipient}
                      onChange={(e) => handleFieldChange('recipient', e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Date d'échéance */}
              {editedTask.dueDate && (
                <div className="space-y-2">
                  <Label htmlFor="dueDate" className="text-sm font-medium">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Date d'échéance
                  </Label>
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    value={editedTask.dueDate ? new Date(editedTask.dueDate).toISOString().slice(0, 16) : ''}
                    onChange={(e) => handleFieldChange('dueDate', e.target.value)}
                  />
                </div>
              )}

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description personnalisée
                </Label>
                <Textarea
                  id="description"
                  value={editedTask.description || ''}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  rows={4}
                  placeholder="Décrivez les détails de la tâche..."
                />
              </div>

              <Separator />

              {/* Section Commentaires */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Commentaires et activité</h3>
                
                {/* Nouveau commentaire */}
                <div className="space-y-2">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Écrivez un commentaire..."
                    rows={3}
                  />
                  {newComment && (
                    <Button size="sm" onClick={() => setNewComment('')}>
                      Ajouter commentaire
                    </Button>
                  )}
                </div>

                {/* Activité système */}
                <Card className="bg-muted/30">
                  <CardContent className="p-3">
                    <p className="text-sm text-muted-foreground">
                      Carte créée il y a 2h • Dernière modification il y a 30min
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t bg-background flex justify-between">
            <Button
              variant="outline"
              onClick={handleCancel}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges}
              className="bg-primary hover:bg-primary/90"
            >
              Sauvegarder
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
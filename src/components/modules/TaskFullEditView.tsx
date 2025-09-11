import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Check, X, Users, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TaskItem } from '@/types/database';
import { useProfiles, useLocations } from '@/hooks/useSupabaseData';
import { useToast } from '@/hooks/use-toast';

// Import de la configuration
import {
  TASK_FULL_EDIT_CONFIG,
  PriorityOption,
  StatusOption,
  TaskEnhancementButton,
  EditableField
} from '@/config/taskEditConfig';

// Import des modals existants
import { ReminderModal } from '@/components/modals/ReminderModal';
import { ChecklistModal } from '@/components/modals/ChecklistModal';
import { MembersModal } from '@/components/modals/MembersModal';
import { EscalationModal } from '@/components/modals/EscalationModal';
import { AttachmentModal } from '@/components/modals/AttachmentModal';
import { ChecklistComponent } from '@/components/ChecklistComponent';

interface TaskFullEditViewProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskItem;
  onSave: (updatedTask: TaskItem) => void;
}

export const TaskFullEditView = ({ isOpen, onClose, task, onSave }: TaskFullEditViewProps) => {
  const [editedTask, setEditedTask] = useState<TaskItem>(task);
  const [hasChanges, setHasChanges] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [originalTask] = useState<TaskItem>(task);
  const [newLocation, setNewLocation] = useState<string>('');
  
  // States pour tous les modals des Task Enhancement
  const [modalsState, setModalsState] = useState({
    reminder: false,
    checklist: false,
    members: false,
    escalation: false,
    attachment: false
  });

  // States pour les composants créés
  const [showChecklist, setShowChecklist] = useState(false);
  const [checklistTitle, setChecklistTitle] = useState('Checklist');
  
  const { profiles } = useProfiles();
  const { locations } = useLocations();
  const { toast } = useToast();

  useEffect(() => {
    setEditedTask(task);
    setHasChanges(false);
  }, [task]);

  const handleFieldChange = (field: keyof TaskItem, value: any) => {
    setEditedTask(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const confirmLocationChange = () => {
    if (newLocation) {
      handleFieldChange('location', newLocation);
      setNewLocation('');
    }
  };

  // Handler générique pour ouvrir les modals
  const handleEnhancementAction = (action: string) => {
    const modalKey = action.replace('open', '').replace('Modal', '').toLowerCase();
    setModalsState(prev => ({ ...prev, [modalKey]: true }));
  };

  // Handler pour fermer les modals
  const closeModal = (modalKey: string) => {
    setModalsState(prev => ({ ...prev, [modalKey]: false }));
  };

  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  const handleSave = () => {
    if (hasChanges) {
      setShowSaveConfirm(true);
    }
  };

  const confirmSave = async () => {
    try {
      onSave(editedTask);
      toast({
        title: "Task Updated",
        description: "Task has been updated successfully",
      });
      setHasChanges(false);
      setShowSaveConfirm(false);
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
      toast({
        title: "Update Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setEditedTask(task);
    setHasChanges(false);
    onClose();
  };

  const handleAddChecklist = (title: string) => {
    setChecklistTitle(title);
    setShowChecklist(true);
    closeModal('checklist');
  };

  // Rendu des boutons de priorité
  const renderPriorityButtons = () => (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{TASK_FULL_EDIT_CONFIG.messages.priorityLevel}</Label>
      <div className="flex gap-2 flex-wrap">
        {TASK_FULL_EDIT_CONFIG.priorities.map((priority: PriorityOption) => {
          const isSelected = editedTask.priority === priority.value;
          const IconComponent = priority.icon;
          
          return (
            <Button
              key={priority.value}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => handleFieldChange('priority', priority.value)}
              className={cn(
                isSelected && priority.className
              )}
            >
              {IconComponent && <IconComponent className="h-4 w-4 mr-1" />}
              {priority.label}
            </Button>
          );
        })}
      </div>
    </div>
  );

  // Rendu des boutons de statut
  const renderStatusButtons = () => (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Status</Label>
      <div className="flex gap-2 flex-wrap">
        {TASK_FULL_EDIT_CONFIG.statuses.map((status: StatusOption) => (
          <Button
            key={status.value}
            variant={editedTask.status === status.value ? "default" : "outline"}
            size="sm"
            onClick={() => handleFieldChange('status', status.value)}
            className={cn(
              editedTask.status === status.value && status.className
            )}
          >
            {status.label}
          </Button>
        ))}
      </div>
    </div>
  );

  // Rendu des boutons Task Enhancement
  const renderTaskEnhancementButtons = () => (
    <div className="border rounded-lg p-4 bg-muted/30">
      <div className="flex flex-wrap gap-2">
        {TASK_FULL_EDIT_CONFIG.enhancements.map((enhancement: TaskEnhancementButton) => {
          const IconComponent = enhancement.icon;
          return (
            <Button 
              key={enhancement.key}
              variant="outline" 
              size="sm" 
              className={enhancement.className}
              onClick={() => handleEnhancementAction(enhancement.action)}
            >
              <IconComponent className="h-4 w-4 text-palace-navy" />
              <span className="text-sm text-palace-navy">{enhancement.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );

  // Rendu d'un champ éditable générique
  const renderEditableField = (field: EditableField) => {
    const value = editedTask[field.key as keyof TaskItem];
    const IconComponent = field.icon;

    switch (field.type) {
      case 'textarea':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key} className="text-sm font-medium">
              {IconComponent && <IconComponent className="h-4 w-4 inline mr-1" />}
              {field.label}
            </Label>
            <Textarea
              id={field.key}
              value={value || ''}
              onChange={(e) => handleFieldChange(field.key as keyof TaskItem, e.target.value)}
              placeholder={field.placeholder}
              rows={4}
            />
          </div>
        );

      case 'datetime':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key} className="text-sm font-medium">
              {IconComponent && <IconComponent className="h-4 w-4 inline mr-1" />}
              {field.label}
            </Label>
            <Input
              id={field.key}
              type="datetime-local"
              value={value ? new Date(value).toISOString().slice(0, 16) : ''}
              onChange={(e) => handleFieldChange(field.key as keyof TaskItem, e.target.value)}
            />
          </div>
        );

      case 'location':
        return (
          <div key={field.key} className="space-y-2">
            <Label className="text-sm font-medium">
              {IconComponent && <IconComponent className="h-4 w-4 inline mr-1" />}
              {field.label}
            </Label>
            <div className="flex gap-2 items-center">
              <div className="flex-1 p-2 bg-muted/50 rounded border">
                <span className="text-sm">{value || 'No location'}</span>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    Modifier
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{TASK_FULL_EDIT_CONFIG.messages.locationChangeConfirm.title}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {TASK_FULL_EDIT_CONFIG.messages.locationChangeConfirm.description}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="py-4">
                    <Label className="text-sm font-medium">Location *</Label>
                    <div className="mt-2 space-y-4">
                      {/* Rooms */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-4 h-4 bg-blue-500 rounded"></div>
                          <span className="text-sm font-medium">Rooms</span>
                        </div>
                        <Select onValueChange={(value) => setNewLocation(value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a room" />
                          </SelectTrigger>
                          <SelectContent>
                            {locations
                              .filter(loc => loc.type === 'room')
                              .map(location => (
                                <SelectItem key={location.id} value={location.name}>
                                  {location.name}
                                </SelectItem>
                              ))
                            }
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Common Areas */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                          <span className="text-sm font-medium">Common Areas</span>
                        </div>
                        <Select onValueChange={(value) => setNewLocation(value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a common area" />
                          </SelectTrigger>
                          <SelectContent>
                            {locations
                              .filter(loc => loc.type === 'common_area')
                              .map(location => (
                                <SelectItem key={location.id} value={location.name}>
                                  {location.name}
                                </SelectItem>
                              ))
                            }
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={confirmLocationChange}
                      disabled={!newLocation}
                    >
                      {TASK_FULL_EDIT_CONFIG.messages.locationChangeConfirm.confirm}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        );

      default: // text input
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key} className="text-sm font-medium">
              {IconComponent && <IconComponent className="h-4 w-4 inline mr-1" />}
              {field.label}
              {hasChanges && field.key === 'title' && <Check className="h-3 w-3 text-green-500 inline ml-1" />}
            </Label>
            <div className="flex gap-2">
              <Input
                id={field.key}
                value={value || ''}
                onChange={(e) => handleFieldChange(field.key as keyof TaskItem, e.target.value)}
                placeholder={field.placeholder}
                readOnly={field.key === 'assignedTo'}
                className={cn(
                  field.key === 'assignedTo' && "bg-muted/50 cursor-not-allowed",
                  field.key === 'title' && "text-lg"
                )}
              />
              {field.key === 'assignedTo' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center space-x-2 px-3 py-2"
                  onClick={() => handleEnhancementAction('openMembersModal')}
                >
                  <Users className="h-4 w-4" />
                  <span className="text-sm">Members</span>
                </Button>
              )}
            </div>
            {field.description && (
              <p className="text-xs text-muted-foreground">
                {field.description}
              </p>
            )}
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0 overflow-hidden">
        <div className="flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="p-6 border-b bg-background">
            <div>
              <h2 className="text-2xl font-playfair font-bold">
                {TASK_FULL_EDIT_CONFIG.messages.title}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {TASK_FULL_EDIT_CONFIG.messages.subtitle}
              </p>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              <div className="max-w-3xl mx-auto space-y-6">
              
                {/* Titre - Champ spécial avec rollover jaune */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium flex items-center gap-2">
                    Card Title
                    {hasChanges && <Check className="h-3 w-3 text-green-500" />}
                  </Label>
                  <Input
                    id="title"
                    value={editedTask.title}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                    className="text-lg hotel-hover"
                  />
                </div>

                {/* Priorité */}
                {renderPriorityButtons()}

                {/* Statut */}
                {renderStatusButtons()}

                {/* Task Enhancement */}
                {renderTaskEnhancementButtons()}

                {/* Assigned Members - Séparé et en pleine largeur */}
                <div className="space-y-2">
                  <Label htmlFor="assignedTo" className="text-sm font-medium">
                    <Users className="h-4 w-4 inline mr-1" />
                    Assigned Members
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="assignedTo"
                      value={editedTask.assignedTo || 'Not assigned'}
                      readOnly
                      className="flex-1 bg-muted/50 cursor-not-allowed"
                      placeholder="No member assigned"
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center space-x-2 px-3 py-2"
                      onClick={() => handleEnhancementAction('openMembersModal')}
                    >
                      <Users className="h-4 w-4" />
                      <span className="text-sm">Members</span>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use the "Members" button to add members with the same function
                  </p>
                </div>

                {/* Location - Séparée et en pleine largeur */}
                {editedTask.location && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      <MapPin className="h-4 w-4 inline mr-1" />
                      Location
                    </Label>
                    <div className="flex gap-2 items-center">
                      <div className="flex-1 p-2 bg-muted/50 rounded border">
                        <span className="text-sm">{editedTask.location}</span>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            Modify
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{TASK_FULL_EDIT_CONFIG.messages.locationChangeConfirm.title}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {TASK_FULL_EDIT_CONFIG.messages.locationChangeConfirm.description}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="py-4">
                            <Label className="text-sm font-medium">Location *</Label>
                            <div className="mt-2 space-y-4">
                              {/* Rooms */}
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                                  <span className="text-sm font-medium">Rooms</span>
                                </div>
                                <Select onValueChange={(value) => setNewLocation(value)}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a room" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {locations
                                      .filter(loc => loc.type === 'room')
                                      .map(location => (
                                        <SelectItem key={location.id} value={location.name}>
                                          {location.name}
                                        </SelectItem>
                                      ))
                                    }
                                  </SelectContent>
                                </Select>
                              </div>
                              {/* Common Areas */}
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                                  <span className="text-sm font-medium">Common Areas</span>
                                </div>
                                <Select onValueChange={(value) => setNewLocation(value)}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a common area" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {locations
                                      .filter(loc => loc.type === 'common_area')
                                      .map(location => (
                                        <SelectItem key={location.id} value={location.name}>
                                          {location.name}
                                        </SelectItem>
                                      ))
                                    }
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={confirmLocationChange}
                              disabled={!newLocation}
                            >
                              {TASK_FULL_EDIT_CONFIG.messages.locationChangeConfirm.confirm}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                )}

                {/* Autres champs dynamiques en grille */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {TASK_FULL_EDIT_CONFIG.fields
                    .filter(field => !['title', 'description', 'assignedTo', 'location'].includes(field.key))
                    .filter(field => editedTask[field.key as keyof TaskItem] !== undefined)
                    .map(field => renderEditableField(field))
                  }
                </div>

                {/* Affichage de la checklist si créée */}
                {showChecklist && (
                  <ChecklistComponent
                    title={checklistTitle}
                    onDelete={() => setShowChecklist(false)}
                  />
                )}

                {/* Description - Champ spécial en pleine largeur avec rollover jaune */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Custom Description
                  </Label>
                  <Textarea
                    id="description"
                    value={editedTask.description || ''}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    rows={4}
                    placeholder="Describe the task details..."
                    className="hotel-hover"
                  />
                </div>

                <Separator />

                {/* Section Commentaires */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{TASK_FULL_EDIT_CONFIG.messages.comments.title}</h3>
                  
                  {/* Nouveau commentaire avec rollover jaune */}
                  <div className="space-y-2">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={TASK_FULL_EDIT_CONFIG.messages.comments.placeholder}
                      rows={3}
                      className="hotel-hover"
                    />
                    {newComment && (
                      <Button size="sm" onClick={() => setNewComment('')}>
                        {TASK_FULL_EDIT_CONFIG.messages.comments.addButton}
                      </Button>
                    )}
                  </div>

                  {/* Activité système */}
                  <Card className="bg-muted/30">
                    <CardContent className="p-3">
                      <p className="text-sm text-muted-foreground">
                        {TASK_FULL_EDIT_CONFIG.messages.activity.created} 2h • {TASK_FULL_EDIT_CONFIG.messages.activity.modified} 30min
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t bg-background flex justify-between">
            <Button
              variant="outline"
              onClick={handleCancel}
            >
              {TASK_FULL_EDIT_CONFIG.messages.cancelButton}
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges}
              className={TASK_FULL_EDIT_CONFIG.theme.colors.primary}
            >
              {TASK_FULL_EDIT_CONFIG.messages.saveButton}
            </Button>
          </div>
        </div>
      </DialogContent>
      
      {/* Confirmation de sauvegarde */}
      <AlertDialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{TASK_FULL_EDIT_CONFIG.messages.saveConfirm.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {TASK_FULL_EDIT_CONFIG.messages.saveConfirm.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSave}>
              {TASK_FULL_EDIT_CONFIG.messages.saveConfirm.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Tous les modals des Task Enhancement */}
      <ReminderModal
        isOpen={modalsState.reminder}
        onClose={() => closeModal('reminder')}
      />
      
      <ChecklistModal
        isOpen={modalsState.checklist}
        onClose={() => closeModal('checklist')}
        onAdd={handleAddChecklist}
      />
      
      <MembersModal
        isOpen={modalsState.members}
        onClose={() => closeModal('members')}
        task={editedTask}
        onUpdate={() => {/* Handle member update */}}
      />
      
      <EscalationModal
        isOpen={modalsState.escalation}
        onClose={() => closeModal('escalation')}
        task={editedTask}
        onUpdate={() => {/* Handle escalation update */}}
      />
      
      <AttachmentModal
        isOpen={modalsState.attachment}
        onClose={() => closeModal('attachment')}
        task={editedTask}
        onUpdate={() => {/* Handle attachment update */}}
      />
    </Dialog>
  );
};
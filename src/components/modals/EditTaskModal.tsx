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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ReminderModal } from '@/components/modals/ReminderModal';
import { ChecklistComponent } from '@/components/ChecklistComponent';
import { 
  X, 
  Users, 
  MapPin, 
  Clock, 
  AlertTriangle,
  CheckSquare,
  Edit3,
  Check,
  MoveUp,
  Paperclip
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TaskItem } from '@/types/database';
import { sendTaskUpdatedEvent } from '@/lib/webhookService';
import { useProfiles, useLocations } from '@/hooks/useSupabaseData';
import { useToast } from '@/hooks/use-toast';

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
  const [originalTask] = useState<TaskItem>(task);
  const [newLocation, setNewLocation] = useState<string>('');
  
  // States for modals
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [checklistTitle, setChecklistTitle] = useState('Checklist');
  const [showChecklistDialog, setShowChecklistDialog] = useState(false);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [showEscaladeDialog, setShowEscaladeDialog] = useState(false);
  const [showAttachmentDialog, setShowAttachmentDialog] = useState(false);
  const [escaladeMethod, setEscaladeMethod] = useState('email');
  const [selectedEscaladeMember, setSelectedEscaladeMember] = useState('');
  
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

  const handleSave = async () => {
    try {
      // Send webhook event for task update
      const webhookResult = await sendTaskUpdatedEvent(
        task.id,
        originalTask,
        editedTask,
        profiles,
        locations
      );

      if (!webhookResult.success) {
        toast({
          title: "Webhook Error",
          description: webhookResult.error || "Failed to send update notification",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Task Updated",
          description: "Task has been updated and notification sent successfully",
        });
      }

      onSave(editedTask);
    } catch (error) {
      console.error('Error sending webhook:', error);
      toast({
        title: "Update Error",
        description: "Failed to send update notification",
        variant: "destructive",
      });
    }

    setHasChanges(false);
    onClose();
  };

  const handleCancel = () => {
    setEditedTask(task);
    setHasChanges(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0 overflow-hidden">
        <div className="flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="p-6 border-b bg-background">
            <div>
              <h2 className="text-2xl font-playfair font-bold">
                Edit Card
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Tous les champs sont modifiables – N'oubliez pas de sauvegarder
              </p>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
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

              {/* Priorité */}
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

              {/* Statut */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Status</Label>
                <div className="flex gap-2">
                  {(['pending', 'in_progress', 'completed', 'cancelled'] as const).map((status) => (
                    <Button
                      key={status}
                      variant={editedTask.status === status ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFieldChange('status', status)}
                    >
                      {status === 'pending' && 'To Process'}
                      {status === 'in_progress' && 'In Progress'}
                      {status === 'completed' && 'Resolved'}
                      {status === 'cancelled' && 'Cancelled'}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Barre d'outils Task Enhancement */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <h3 className="text-sm font-medium mb-3">Task Enhancement</h3>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center space-x-2 px-3 py-2 border border-border rounded-md bg-background hover:bg-muted"
                    onClick={() => setShowReminderModal(true)}
                  >
                    <Clock className="h-4 w-4 text-palace-navy" />
                    <span className="text-sm text-palace-navy">Reminder</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center space-x-2 px-3 py-2 border border-border rounded-md bg-background hover:bg-muted"
                    onClick={() => setShowChecklistDialog(true)}
                  >
                    <CheckSquare className="h-4 w-4 text-palace-navy" />
                    <span className="text-sm text-palace-navy">Checklist</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center space-x-2 px-3 py-2 border border-border rounded-md bg-background hover:bg-muted"
                    onClick={() => setShowMembersDialog(true)}
                  >
                    <Users className="h-4 w-4 text-palace-navy" />
                    <span className="text-sm text-palace-navy">Members</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center space-x-2 px-3 py-2 border border-border rounded-md bg-background hover:bg-muted"
                    onClick={() => setShowEscaladeDialog(true)}
                  >
                    <MoveUp className="h-4 w-4 text-palace-navy" />
                    <span className="text-sm text-palace-navy">Escalation</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center space-x-2 px-3 py-2 border border-border rounded-md bg-background hover:bg-muted"
                    onClick={() => setShowAttachmentDialog(true)}
                  >
                    <Paperclip className="h-4 w-4 text-palace-navy" />
                    <span className="text-sm text-palace-navy">Attachment</span>
                  </Button>
                </div>
              </div>

              {/* Assignation - Lecture seule + Bouton Members */}
              <div className="space-y-2">
                <Label htmlFor="assignedTo" className="text-sm font-medium">
                  <Users className="h-4 w-4 inline mr-1" />
                  Assigned Member
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="assignedTo"
                    value={editedTask.assignedTo || 'Non assigné'}
                    readOnly
                    className="flex-1 bg-muted/50 cursor-not-allowed"
                    placeholder="Aucun membre assigné"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center space-x-2 px-3 py-2"
                  >
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Members</span>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Utilisez le bouton "Members" pour ajouter des membres ayant la même fonction
                </p>
              </div>

              {/* Localisation - Sélecteur avec double validation */}
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
                    <Label className="text-sm font-medium">
                      <MapPin className="h-4 w-4 inline mr-1" />
                      Localisation
                    </Label>
                    <div className="flex gap-2 items-center">
                      <div className="flex-1 p-2 bg-muted/50 rounded border">
                        <span className="text-sm">{editedTask.location}</span>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            Modifier
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Modifier la localisation</AlertDialogTitle>
                            <AlertDialogDescription>
                              Êtes-vous sûr de vouloir modifier la localisation ? Cette action changera l'emplacement de la tâche.
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
                              Confirmer la modification
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
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
                    Due Date
                  </Label>
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    value={editedTask.dueDate ? new Date(editedTask.dueDate).toISOString().slice(0, 16) : ''}
                    onChange={(e) => handleFieldChange('dueDate', e.target.value)}
                  />
                </div>
              )}

              {/* Affichage de la checklist si créée */}
              {showChecklist && (
                <ChecklistComponent
                  title={checklistTitle}
                  onDelete={() => setShowChecklist(false)}
                />
              )}

              {/* Description */}
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
                    placeholder="Write a comment..."
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
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t bg-background flex justify-between">
            <Button
              variant="outline"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges}
              className="bg-primary hover:bg-primary/90"
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
      
      {/* Reminder Modal */}
      <ReminderModal
        isOpen={showReminderModal}
        onClose={() => setShowReminderModal(false)}
      />
      
      {/* Dialog Checklist */}
      <Dialog open={showChecklistDialog} onOpenChange={setShowChecklistDialog}>
        <DialogContent className="max-w-md">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Add a Checklist</h2>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Title</Label>
                <Input
                  value={checklistTitle}
                  onChange={(e) => setChecklistTitle(e.target.value)}
                  placeholder="Checklist"
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowChecklistDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setShowChecklist(true);
                    setShowChecklistDialog(false);
                  }}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Dialog Membres */}
      <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
        <DialogContent className="max-w-md">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Attribution de membres</h2>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Rechercher des membres</Label>
                <Input
                  placeholder="Rechercher des membres..."
                  className="mt-1"
                />
              </div>
              
              <div>
                <h5 className="text-sm font-medium mb-3">Membres de l'annuaire de l'hôtel</h5>
                <div className="space-y-2">
                  {profiles.slice(0, 4).map((profile) => (
                    <div key={profile.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-medium">
                          {profile.first_name?.[0]}{profile.last_name?.[0]}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">{profile.first_name} {profile.last_name}</span>
                        <p className="text-xs text-muted-foreground">{profile.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button
                  onClick={() => setShowMembersDialog(false)}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  Assigner
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Dialog Escalade */}
      <Dialog open={showEscaladeDialog} onOpenChange={setShowEscaladeDialog}>
        <DialogContent className="max-w-md">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Choix du canal</h2>
            <div className="space-y-6">
              <div>
                <Label className="text-sm font-medium mb-3 block">Canal de communication</Label>
                <RadioGroup value={escaladeMethod} onValueChange={setEscaladeMethod} className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="email" id="email" />
                    <Label htmlFor="email" className="text-sm">Envoi d'un email</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="whatsapp" id="whatsapp" />
                    <Label htmlFor="whatsapp" className="text-sm">Envoi d'un message WhatsApp</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div>
                <Label className="text-sm font-medium mb-3 block">Destinataire</Label>
                <Input
                  placeholder="Rechercher des membres..."
                  className="mb-3"
                />
                
                <div className="space-y-2">
                  {profiles.slice(0, 3).map((profile) => (
                    <div 
                      key={profile.id} 
                      className={`flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors ${
                        selectedEscaladeMember === profile.id ? 'bg-blue-100 border border-blue-300' : ''
                      }`}
                      onClick={() => setSelectedEscaladeMember(profile.id)}
                    >
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-medium">
                          {profile.first_name?.[0]}{profile.last_name?.[0]}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">{profile.first_name} {profile.last_name}</span>
                        <p className="text-xs text-muted-foreground">{profile.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    console.log(`Escalade via ${escaladeMethod} vers ${selectedEscaladeMember}`);
                    setShowEscaladeDialog(false);
                  }}
                  disabled={!selectedEscaladeMember}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  Envoyer
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Dialog Attachment */}
      <Dialog open={showAttachmentDialog} onOpenChange={setShowAttachmentDialog}>
        <DialogContent className="max-w-md">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Paperclip className="h-5 w-5" />
              Add attachment
            </h2>
            <div className="space-y-6">
              <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                <div className="w-12 h-12 mx-auto mb-4 text-muted-foreground">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7,10 12,15 17,10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </div>
                <p className="text-sm font-medium mb-1">Drag and drop your files here</p>
                <p className="text-xs text-muted-foreground mb-4">or click to browse</p>
              </div>
              
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-3">OR</p>
                <p className="text-sm font-medium mb-2">PASTE A LINK TO THIS DOCUMENT</p>
                <p className="text-xs text-muted-foreground mb-3">Internet URL, company drive link, etc.</p>
                <Input
                  placeholder="https://exemple.com/document or drive.co..."
                  className="mb-3"
                />
                <Button size="sm" variant="outline">
                  Add Link
                </Button>
              </div>
              
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setShowAttachmentDialog(false)}
                >
                  Cancel
                </Button>
                <Button className="bg-blue-600 text-white hover:bg-blue-700">
                  Add
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};
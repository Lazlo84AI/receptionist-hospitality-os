import { useState, useEffect } from 'react';
import { 
  FileText, 
  Edit3, 
  Mic,
  X,
  AlertTriangle,
  Users,
  Clock,
  Wrench,
  MapPin,
  User,
  Calendar,
  CheckSquare,
  Bell,
  Paperclip,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChecklistModal } from '@/components/modals/ChecklistModal';
import { ChecklistComponent } from '@/components/ChecklistComponent';
import { ReminderModal } from '@/components/modals/ReminderModal';
import { useToast } from '@/hooks/use-toast';
import { useProfiles, useLocations } from '@/hooks/useSupabaseData';
import { cn } from '@/lib/utils';

const categories = [
  { id: 'incident', label: 'Ongoing Incident', icon: AlertTriangle, color: 'bg-urgence-red text-warm-cream' },
  { id: 'client_request', label: 'Client Request', icon: Users, color: 'bg-champagne-gold text-palace-navy' },
  { id: 'follow_up', label: 'Follow-up', icon: Clock, color: 'bg-palace-navy text-warm-cream' },
  { id: 'internal_task', label: 'Internal Task', icon: Wrench, color: 'bg-muted text-muted-foreground' },
];

const originTypes = [
  { id: 'maintenance', label: 'Maintenance' },
  { id: 'team', label: 'Team' },
  { id: 'client', label: 'Client' },
  { id: 'staff', label: 'Staff' },
];

const priorityLevels = [
  { id: 'normal', label: 'Normal', color: 'bg-muted text-muted-foreground' },
  { id: 'urgent', label: 'Urgent', color: 'bg-urgence-red text-warm-cream' },
];

const services = [
  { id: 'housekeeping', label: 'Housekeeping' },
  { id: 'reception', label: 'Reception' },
  { id: 'maintenance', label: 'Maintenance' },
];

export function VoiceCommandButton() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creationMode, setCreationMode] = useState<'edit' | 'voice' | null>(null);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
  const [checklists, setChecklists] = useState<Array<{ id: string; title: string }>>([]);
  const [attachments, setAttachments] = useState<Array<{ id: string; name: string; size: number }>>([]);
  
  // Fetch real-time data from database
  const { profiles: hotelMembers, loading: profilesLoading } = useProfiles();
  const { locations, loading: locationsLoading } = useLocations();
  
  // Derived location data from database
  const rooms = locations
    .filter(location => location.type === 'room')
    .map(location => location.name)
    .sort((a, b) => {
      // Try to sort by number if both have numbers, otherwise alphabetically
      const numA = parseInt(a.match(/\d+/)?.[0] || '0');
      const numB = parseInt(b.match(/\d+/)?.[0] || '0');
      if (numA && numB) return numA - numB;
      return a.localeCompare(b);
    });
    
  const commonAreas = locations
    .filter(location => location.type === 'common_area')
    .map(location => location.name)
    .sort();
    
  const corridors = locations
    .filter(location => location.type === 'corridor')
    .map(location => location.name)
    .sort();
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    originType: '',
    priority: 'normal',
    service: '',
    assignedMember: '',
    location: '',
    description: '',
    guestName: '', // For special requests
    roomNumber: '', // For special requests
    recipient: '', // For follow-ups
    dueDate: null as Date | null,
  });
  const { toast } = useToast();

  const handleMainButtonClick = () => {
    console.log('CLIC PRINCIPAL DÉTECTÉ!');
    // Ouvrir directement la modal de création
    setCreationMode('edit'); // Mode par défaut
    setShowCreateModal(true);
  };

  const handleVoiceModeClick = () => {
    console.log('🎤 DÉBUT - Basculer vers mode vocal');
    console.log('🎤 État actuel:', { showCreateModal, creationMode });
    
    // Simplement basculer vers le mode vocal sans fermer la modal
    setCreationMode('voice');
  };

  const resetForm = () => {
    setFormData({
      title: '',
      category: '',
      originType: '',
      priority: 'normal',
      service: '',
      assignedMember: '',
      location: '',
      description: '',
      guestName: '',
      roomNumber: '',
      recipient: '',
      dueDate: null,
    });
    setChecklists([]);
  };

  const handleAddChecklist = (title: string) => {
    const newChecklist = {
      id: Date.now().toString(),
      title: title,
    };
    setChecklists(prev => [...prev, newChecklist]);
  };

  const handleDeleteChecklist = (checklistId: string) => {
    setChecklists(prev => prev.filter(checklist => checklist.id !== checklistId));
  };

  const handleCreateCard = async () => {
    try {
      // Create proper payload based on task category
      let taskData: any = {};

      switch (formData.category) {
        case 'client_request':
          taskData = {
            guest_name: formData.guestName || '',
            room_number: formData.roomNumber || '',
            request_type: formData.service || 'General Request',
            request_details: formData.description,
            arrival_date: formData.dueDate?.toISOString().split('T')[0] || null,
            priority: formData.priority || 'medium',
            assigned_to: formData.assignedMember || null,
          };
          break;

        case 'incident':
          taskData = {
            title: formData.title || 'New Incident',
            description: formData.description,
            incident_type: formData.service || 'General Incident',
            location: formData.location,
            priority: formData.priority || 'medium',
            assigned_to: formData.assignedMember || null,
          };
          break;

        case 'follow_up':
          taskData = {
            title: formData.title || 'New Follow-up',
            follow_up_type: formData.service || 'General Follow-up',
            recipient: formData.recipient || formData.guestName || '',
            notes: formData.description,
            due_date: formData.dueDate?.toISOString().split('T')[0] || null,
            priority: formData.priority || 'medium',
            assigned_to: formData.assignedMember || null,
          };
          break;

        case 'internal_task':
        default:
          taskData = {
            title: formData.title || 'New Internal Task',
            description: formData.description,
            task_type: formData.service || 'General Task',
            department: null, // You can map this from form if needed
            location: formData.location,
            due_date: formData.dueDate?.toISOString().split('T')[0] || null,
            priority: formData.priority || 'medium',
            assigned_to: formData.assignedMember || null,
          };
          break;
      }

      // Add task category for webhook processing
      taskData.task_category = formData.category;

      // Send webhook event for task creation
      const { sendTaskCreatedEvent } = await import('@/lib/webhookService');
      const result = await sendTaskCreatedEvent(taskData, hotelMembers, locations);
      
      if (result.success) {
        toast({
          title: "Succès",
          description: "La carte a été créée avec succès !",
          variant: "default",
        });
        setShowCreateModal(false);
        resetForm();
      } else {
        toast({
          title: "Erreur",
          description: result.error || "Échec de la création de la carte. Veuillez réessayer.",
          variant: "destructive",
        });
      }
      
    } catch (error) {
      console.error('Error creating card:', error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la création de la carte.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      {/* Backdrop when expanded */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Creation Button System */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-4">
        {/* Voice Mode Button - États 2, 3 et 4 */}
        {showCreateModal && (
          <div className="relative">
            <Button
              onClick={() => {
                console.log('Clic sur bouton Vocal - Basculer vers mode vocal');
                handleVoiceModeClick();
              }}
              className={cn(
                "h-16 w-16 rounded-full transition-all duration-500 pointer-events-auto cursor-pointer",
                "bg-champagne-gold hover:bg-champagne-gold/90 border-2 border-palace-navy",
                "shadow-lg mb-20"
              )}
            >
              <Mic className="h-6 w-6 text-palace-navy" />
            </Button>
            
            {/* Onde pour le bouton micro - seulement en mode vocal (États 3 et 4) */}
            {creationMode === 'voice' && (
              <div className="absolute bottom-0 right-0 h-16 w-16 rounded-full border-2 border-champagne-gold/20 animate-ping pointer-events-none" />
            )}
          </div>
        )}

        {/* Main Note Button */}
        <Button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('CLIC DÉTECTÉ sur le bouton principal!');
            // Ne fonctionne que si on n'est pas en mode vocal
            if (creationMode !== 'voice') {
              handleMainButtonClick();
            }
          }}
          className={cn(
            "h-16 w-16 rounded-full transition-all duration-500 pointer-events-auto cursor-pointer",
            "bg-palace-navy hover:bg-palace-navy/90 border-2 border-champagne-gold/50 hover:border-champagne-gold",
            "shadow-lg",
            // Inactif en mode vocal (États 3 et 4)
            creationMode === 'voice' ? "opacity-75 cursor-not-allowed" : ""
          )}
          style={{ pointerEvents: 'auto' }}
        >
          <FileText className="h-6 w-6 text-champagne-gold" />
        </Button>

        {/* Onde pour le bouton principal - États 1 et 2 seulement */}
        {(!showCreateModal || (showCreateModal && creationMode === 'edit')) && (
          <div className="absolute bottom-0 right-0 h-16 w-16 rounded-full border-2 border-champagne-gold/20 animate-ping pointer-events-none" />
        )}
      </div>

      {/* Create Card Modal */}
      <Dialog open={showCreateModal} onOpenChange={(open) => {
        setShowCreateModal(open);
        if (!open) {
          // Reset to initial state when closing modal
          setCreationMode(null);
          resetForm();
        }
      }}>
        <DialogContent className={cn(
          "max-w-4xl max-h-[90vh] overflow-y-auto",
          creationMode === 'voice' ? "bg-palace-navy text-warm-cream border-champagne-gold/20" : "bg-background"
        )}>
          <DialogHeader>
            <DialogTitle className={cn(
              "flex items-center gap-2 text-lg font-semibold",
              creationMode === 'voice' ? "text-champagne-gold" : "text-foreground"
            )}>
              {creationMode === 'voice' ? (
                <Mic className="h-5 w-5 text-champagne-gold" />
              ) : (
                <Edit3 className="h-5 w-5" />
              )}
              Create New Card - {creationMode === 'voice' ? 'Voice' : 'Edit'} Mode
            </DialogTitle>
          </DialogHeader>
          
          <div className={cn(
            "space-y-6",
            creationMode === 'voice' ? "text-warm-cream" : "text-foreground"
          )}>
            {creationMode === 'voice' && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-champagne-gold/10 border border-champagne-gold/20">
                <span className="text-champagne-gold">💡</span>
                <span className="text-sm text-champagne-gold">
                  Describe precisely for better understanding
                </span>
              </div>
            )}
            {/* Title Field */}
            <div className="space-y-3">
              <label className={cn(
                "text-sm font-medium",
                creationMode === 'voice' ? "text-champagne-gold" : "text-foreground"
              )}>
                Card Title
              </label>
              <Input 
                placeholder="Descriptive card title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className={cn(
                  creationMode === 'voice' ? "bg-palace-navy/50 border-champagne-gold/30 text-warm-cream placeholder:text-warm-cream/60" : ""
                )}
              />
            </div>

            {/* Category Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Card Category</label>
              <div className="grid grid-cols-2 gap-3">
                {categories.map((category) => (
                  <Card 
                    key={category.id}
                    className={cn(
                      "cursor-pointer transition-all duration-200 hover:scale-105",
                      formData.category === category.id ? "ring-2 ring-champagne-gold" : "",
                      creationMode === 'voice' ? "bg-gray-800 border-gray-600" : ""
                    )}
                    onClick={() => setFormData(prev => ({ ...prev, category: category.id }))}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={cn("p-2 rounded-full", category.color)}>
                        <category.icon className="h-5 w-5" />
                      </div>
                      <span className={cn(
                        "font-medium",
                        creationMode === 'voice' ? "text-white" : ""
                      )}>{category.label}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>


            {/* Conditional Fields for Client Requests */}
            {formData.category === 'client_request' && (
              <div className="space-y-3">
                <label className="text-sm font-medium">Client Name</label>
                <Input 
                  placeholder="Client name"
                  value={formData.guestName}
                  onChange={(e) => setFormData(prev => ({ ...prev, guestName: e.target.value }))}
                />
              </div>
            )}

            {/* Conditional Fields for Follow-ups */}
            {formData.category === 'follow_up' && (
              <div className="space-y-3">
                <label className="text-sm font-medium">Follow-up Recipient</label>
                <Input 
                  placeholder="Recipient name"
                  value={formData.recipient}
                  onChange={(e) => setFormData(prev => ({ ...prev, recipient: e.target.value }))}
                />
              </div>
            )}

            {/* Origin Type */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Origin Type</label>
              <Select value={formData.originType} onValueChange={(value) => setFormData(prev => ({ ...prev, originType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select origin type" />
                </SelectTrigger>
                <SelectContent>
                  {originTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority Level (only for incidents and tasks) */}
            {(formData.category === 'incident' || formData.category === 'internal_task') && (
              <div className="space-y-3">
                <label className="text-sm font-medium">Priority Level</label>
                <div className="flex gap-3">
                  {priorityLevels.map((priority) => (
                    <Button
                      key={priority.id}
                      variant={formData.priority === priority.id ? "default" : "outline"}
                      onClick={() => setFormData(prev => ({ ...prev, priority: priority.id }))}
                      className={cn(
                        formData.priority === priority.id ? priority.color : "",
                        creationMode === 'voice' ? "bg-gray-800 border-gray-600 text-white hover:bg-gray-700" : ""
                      )}
                    >
                      {priority.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Assignment */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-sm font-medium">Service</label>
                <Select 
                  value={formData.service} 
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    service: value,
                    assignedMember: '' // Reset member when service changes
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>{service.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium">Assigned Members</label>
                {formData.service ? (
                  <Select 
                    value={formData.assignedMember} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, assignedMember: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a member" />
                    </SelectTrigger>
                    <SelectContent>
                      {hotelMembers
                        .filter(member => {
                          if (!formData.service) return false;
                          // Map service selection to department/role values
                          switch (formData.service) {
                            case 'housekeeping':
                              return member.department === 'housekeeping' || member.role === 'housekeeping';
                            case 'reception':
                              return member.department === 'reception' || member.role === 'staff';
                            case 'maintenance':
                              return member.department === 'maintenance' || member.role === 'maintenance';
                            default:
                              return false;
                          }
                        })
                        .map((member) => (
                          <SelectItem key={member.id} value={`${member.first_name} ${member.last_name}`}>
                            {member.first_name} {member.last_name} - {member.role}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="h-10 flex items-center px-3 py-2 border border-input bg-muted text-muted-foreground rounded-md text-sm">
                    Select a service first
                  </div>
                )}
              </div>
            </div>

            {/* Location Module for all card types requiring location */}
            {(['client_request', 'incident', 'follow_up', 'internal_task'].includes(formData.category)) && (
              <div className="space-y-3">
                <label className="text-sm font-medium">Location</label>
                <div className="grid grid-cols-2 gap-4 h-48">
                  {/* Rooms */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Rooms</h4>
                    <div className="grid grid-cols-3 gap-2 max-h-44 overflow-y-auto">
                      {rooms.map((room) => (
                        <Button
                          key={room}
                          variant={formData.location === room ? "default" : "outline"}
                          className="h-8 text-xs px-1"
                          onClick={() => setFormData(prev => ({ ...prev, location: room }))}
                        >
                          {room}
                        </Button>
                      ))}
                    </div>
                  </div>
                  {/* Common Areas and Corridors */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Common Areas</h4>
                    <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto">
                      {commonAreas.map((area) => (
                        <Button
                          key={area}
                          variant={formData.location === area ? "default" : "outline"}
                          className="text-xs h-8"
                          onClick={() => setFormData(prev => ({ ...prev, location: area }))}
                        >
                          {area}
                        </Button>
                      ))}
                      {corridors.map((corridor) => (
                        <Button
                          key={corridor}
                          variant={formData.location === corridor ? "default" : "outline"}
                          className="text-xs h-8"
                          onClick={() => setFormData(prev => ({ ...prev, location: corridor }))}
                        >
                          {corridor}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Due Date for Follow-ups and Tasks */}
            {(formData.category === 'follow_up' || formData.category === 'internal_task') && (
              <div className="space-y-3">
                <label className="text-sm font-medium">Due Date</label>
                <Input 
                  type="datetime-local"
                  value={formData.dueDate ? formData.dueDate.toISOString().slice(0, 16) : ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    dueDate: e.target.value ? new Date(e.target.value) : null 
                  }))}
                />
              </div>
            )}

            {/* Description */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Custom Description</label>
                <span className="text-xs text-muted-foreground">
                  💡 Describe precisely for better understanding
                </span>
              </div>
              <Textarea 
                placeholder="Describe precisely the situation or request..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
              />
              {/* Texte informatif pour les demandes client */}
              {formData.category === 'client_request' && (
                <p className="text-sm text-muted-foreground italic mt-2">
                  (with client name, context of the need and any personal information to be more friendly)
                </p>
              )}
            </div>

            {/* Additional Features */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setIsChecklistModalOpen(true)}
                className="flex items-center gap-2"
              >
                <CheckSquare className="h-4 w-4" />
                Add checklist
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsReminderModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Bell className="h-4 w-4" />
                Set up reminder
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsAttachmentModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Paperclip className="h-4 w-4" />
                Attachment
              </Button>
            </div>

            {/* Display Added Checklists */}
            {checklists.length > 0 && (
              <div className="space-y-4">
                <div className="text-sm font-medium text-muted-foreground">Added Checklists</div>
                {checklists.map((checklist) => (
                  <ChecklistComponent
                    key={checklist.id}
                    title={checklist.title}
                    onDelete={() => handleDeleteChecklist(checklist.id)}
                  />
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateCard}
                disabled={
                  !formData.category || 
                  !formData.description || 
                  (formData.category === 'client_request' && (!formData.guestName || !formData.location)) ||
                  (formData.category === 'follow_up' && !formData.recipient)
                }
                className="bg-champagne-gold text-palace-navy hover:bg-champagne-gold/90"
              >
                Create Card
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Checklist Modal */}
      <ChecklistModal
        isOpen={isChecklistModalOpen}
        onClose={() => setIsChecklistModalOpen(false)}
        onAdd={handleAddChecklist}
      />

      {/* Reminder Modal */}
      <ReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        taskTitle={formData.title}
      />

      {/* Attachment Modal */}
      <Dialog open={isAttachmentModalOpen} onOpenChange={setIsAttachmentModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Paperclip className="h-5 w-5" />
              Add attachment
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Drag and Drop Zone */}
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center space-y-4 hover:border-primary/50 transition-colors">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
              <div className="space-y-2">
                <p className="text-sm font-medium">Drag and drop your files here</p>
                <p className="text-xs text-muted-foreground">or click to browse</p>
              </div>
              <Input
                type="file"
                className="hidden"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  files.forEach(file => {
                    const newAttachment = {
                      id: Date.now().toString() + Math.random(),
                      name: file.name,
                      size: file.size
                    };
                    setAttachments(prev => [...prev, newAttachment]);
                  });
                }}
              />
            </div>

            {/* File List */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Selected files:</p>
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                    <div className="flex items-center gap-2">
                      <Paperclip className="h-4 w-4" />
                      <span className="text-sm">{attachment.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(attachment.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAttachments(prev => prev.filter(a => a.id !== attachment.id))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setIsAttachmentModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  setIsAttachmentModalOpen(false);
                  if (attachments.length > 0) {
                    toast({
                      title: "Attachments added",
                      description: `${attachments.length} file(s) added to the card.`,
                    });
                  }
                }}
              >
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
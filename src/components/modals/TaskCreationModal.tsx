import { useState } from 'react';
import { Edit3, AlertTriangle, Heart, Clock, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useProfiles, useLocations } from '@/hooks/useSupabaseData';
import { LocationSection } from '@/components/LocationSection';
import { ChecklistModal } from '@/components/modals/ChecklistModal';
import { ChecklistComponent } from '@/components/ChecklistComponent';
import { ReminderModal } from '@/components/modals/ReminderModal';
import { AttachmentModal } from '@/components/modals/AttachmentModal';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const categories = [
  { id: 'incident', label: 'Ongoing Incident', icon: AlertTriangle, cssClass: 'category-incident' },
  { id: 'client_request', label: 'Client Request', icon: Heart, cssClass: 'category-client-request' },
  { id: 'follow_up', label: 'Follow-up', icon: Clock, cssClass: 'category-follow-up' },
  { id: 'internal_task', label: 'Internal Task', icon: Check, cssClass: 'category-internal-task' },
];

const originTypes = [
  { id: 'client', label: 'Client' },
  { id: 'team', label: 'Team' },
  { id: 'maintenance', label: 'Maintenance' },
];

const priorityLevels = [
  { id: 'normal', label: 'Normal' },
  { id: 'urgent', label: 'Urgent' },
];

const services = [
  { id: 'reception', label: 'Reception', enumRole: 'receptionist' },
  { id: 'housekeeping', label: 'Housekeeping', enumRole: 'Housekeeping Supervisor' },
  { id: 'maintenance', label: 'Maintenance', enumRole: 'tech maintenance team' },
];

interface TaskCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated?: () => void; // ← Nouveau callback pour refresh
}

export function TaskCreationModal({ isOpen, onClose, onTaskCreated }: TaskCreationModalProps) {
  const { profiles: hotelMembers } = useProfiles();
  const { locations } = useLocations();
  const { toast } = useToast();
  
  // Modal states
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
  
  // Data states
  const [checklists, setChecklists] = useState<Array<{ id: string; title: string; items: any[] }>>([]);
  const [reminders, setReminders] = useState<Array<{ id: string; subject: string; scheduleType: string; date?: Date; time?: string; shifts?: string[]; frequency?: string; endDate?: Date }>>([]);
  const [attachments, setAttachments] = useState<Array<{ id: string; name: string; size: number; type?: 'file' | 'link'; url?: string }>>([]);
  const [editingReminder, setEditingReminder] = useState<any>(null);
  
  const [formData, setFormData] = useState({
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
    dueDate: null as Date | null,
  });

  // Handlers
  const handleAddChecklist = (title: string) => {
    const newChecklist = {
      id: Date.now().toString(),
      title: title,
      items: [],
    };
    setChecklists(prev => [...prev, newChecklist]);
  };

  const handleDeleteChecklist = (checklistId: string) => {
    setChecklists(prev => prev.filter(checklist => checklist.id !== checklistId));
  };

  const handleUpdateChecklistItems = (checklistId: string, items: any[]) => {
    setChecklists(prev => 
      prev.map(checklist => 
        checklist.id === checklistId 
          ? { ...checklist, items }
          : checklist
      )
    );
  };

  const handleAddReminder = (reminderData: any) => {
    const newReminder = {
      id: Date.now().toString(),
      subject: reminderData.title || reminderData.subject,        // Mapper title → subject
      scheduleType: reminderData.schedule_type || reminderData.scheduleType,  // Mapper schedule_type → scheduleType
      date: reminderData.start_date ? new Date(reminderData.start_date) : reminderData.date,  // Convertir start_date → date
      time: reminderData.start_time || reminderData.time,         // Mapper start_time → time
      shifts: reminderData.shifts,
      frequency: reminderData.frequency,
      endDate: reminderData.recurrence_end_date ? new Date(reminderData.recurrence_end_date) : reminderData.endDate,
    };
    setReminders(prev => [...prev, newReminder]);
  };

  const handleUpdateReminder = (reminderId: string, reminderData: any) => {
    const updatedReminder = {
      id: reminderId,
      subject: reminderData.title || reminderData.subject,        // Mapper title → subject
      scheduleType: reminderData.schedule_type || reminderData.scheduleType,  // Mapper schedule_type → scheduleType
      date: reminderData.start_date ? new Date(reminderData.start_date) : reminderData.date,  // Convertir start_date → date
      time: reminderData.start_time || reminderData.time,         // Mapper start_time → time
      shifts: reminderData.shifts,
      frequency: reminderData.frequency,
      endDate: reminderData.recurrence_end_date ? new Date(reminderData.recurrence_end_date) : reminderData.endDate,
    };
    
    setReminders(prev => 
      prev.map(reminder => 
        reminder.id === reminderId ? updatedReminder : reminder
      )
    );
  };

  const handleDeleteReminder = (reminderId: string) => {
    setReminders(prev => prev.filter(reminder => reminder.id !== reminderId));
  };

  const handleAddAttachment = (attachmentData: any) => {
    setAttachments(prev => [...prev, attachmentData]);
  };

  const handleDeleteAttachment = (attachmentId: string) => {
    setAttachments(prev => prev.filter(attachment => attachment.id !== attachmentId));
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
    setReminders([]);
    setAttachments([]);
  };



  const handleClose = () => {
    onClose();
    resetForm();
  };

  const handleCreateCard = async () => {
    
    try {
      // Validation des champs obligatoires
      if (!formData.title.trim()) {
        throw new Error('Titre obligatoire');
      }
      if (!formData.category) {
        throw new Error('Catégorie obligatoire');
      }

      // 0. RÉCUPÉRER USER ACTUEL
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not authenticated');

      // 1. RÉCUPÉRER LE SHIFT ACTIF DE L'UTILISATEUR
      const { data: shifts, error: shiftError } = await supabase
        .from('shifts')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (shiftError) {
        console.error('Shift query error:', shiftError);
        throw new Error('Error checking active shift. Please try again.');
      }

      if (!shifts || shifts.length === 0) {
        throw new Error('No active shift found. Please start a shift before creating tasks.');
      }

      const activeShift = shifts[0];
      console.log('✅ Active shift found:', activeShift.id);


      // 2. VÉRIFICATION MEMBRE ASSIGNÉ OBLIGATOIRE
      if (!formData.assignedMember) {
        throw new Error('Please assign this task to a team member before creating it.');
      }

      // 3. RÉCUPÉRER L'ID DU MEMBRE ASSIGNÉ
      const { data: memberData, error: memberError } = await supabase
        .from('staff_directory')
        .select('id')
        .or(`full_name.eq.${formData.assignedMember},first_name.eq.${formData.assignedMember.split(' ')[0]}`)
        .single();
      
      if (memberError || !memberData) {
        throw new Error('Could not find the assigned member. Please select a valid team member.');
      }
      
      const assignedMemberId = memberData.id;


      // 4. DONNÉES DU FORMULAIRE ADAPTÉES AU FORMAT TABLE TASK UNIFIÉE
      const taskData = {
        title: formData.title,                    // ✅ VRAIES DONNÉES
        description: formData.description || null, // ✅ VRAIES DONNÉES
        category: formData.category,               // ✅ VRAIES DONNÉES
        priority: formData.priority || 'normal',   // ✅ VRAIES DONNÉES
        service: formData.service || 'reception', // ✅ VRAIES DONNÉES
        origin_type: formData.originType || 'team', // ✅ VRAIES DONNÉES
        assigned_to: assignedMemberId ? [assignedMemberId] : null, // ✅ VRAIES DONNÉES
        location: formData.location || null,      // ✅ VRAIES DONNÉES
        status: 'pending',
        shift_id: activeShift.id,                 // ✅ LIEN VERS LE SHIFT ACTIF
        created_by: user.id,
        updated_by: user.id,
        // Champs spécifiques selon la catégorie
        ...(formData.category === 'client_request' && {
          guest_name: formData.guestName || null,
          // room_number supprimé - utilise location déjà défini plus haut
        }),
        // recipient supprimé - utilise assigned_to déjà défini plus haut

        // Ajouter les checklists si présentes
        checklist_items: checklists.length > 0 ? checklists : null
      };


      // 5. INSERTION DIRECTE DANS TABLE TASK
      const { data: result, error: insertError } = await supabase
        .from('task')
        .insert([taskData])
        .select()
        .single();

      if (insertError) {
        console.error('Détails erreur insertion:', insertError);
        throw new Error(`Erreur insertion: ${insertError.message}`);
      }


      // 6. AJOUTER LES REMINDERS DANS LA TABLE SÉPARÉE SI NÉCESSAIRE
      if (reminders.length > 0) {
        const reminderInserts = reminders.map(reminder => {
          
          let reminderTime;
          if (reminder.scheduleType === 'datetime' && reminder.date && reminder.time) {
            // Construction correcte en timezone locale (Lisbonne)
            const localDateTime = new Date(reminder.date);
            const [hours, minutes] = reminder.time.split(':');
            localDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            reminderTime = localDateTime.toISOString();
          } else {
            // Valeur par défaut: maintenant + 1 heure
            reminderTime = new Date(Date.now() + 3600000).toISOString();
          }

          
          return {
            task_id: result.id,
            title: reminder.subject,
            message: reminder.subject,
            schedule_type: reminder.scheduleType || 'datetime',
            reminder_time: reminderTime,
            frequency: reminder.frequency || 'once',
            is_active: true,
            created_by: user.id
          };
        });

        const { error: reminderError } = await supabase
          .from('reminders')
          .insert(reminderInserts);

        if (reminderError) {
          console.warn('⚠️ Erreur ajout reminders:', reminderError);
        }
      }

      // 7. AJOUTER LES ATTACHMENTS DANS LA TABLE SÉPARÉE SI NÉCESSAIRE
      if (attachments.length > 0) {

        const attachmentInserts = attachments.map(attachment => ({
          task_id: result.id,
          filename: attachment.name,
          file_url: attachment.type === 'link' ? attachment.url : null,
          file_size: attachment.type === 'file' ? attachment.size : null,
          mime_type: attachment.type === 'file' ? attachment.fileType : null,
          attachment_type: attachment.type === 'link' ? 'other' : 'document', // ✅ Corrigé : 'other' pour liens, 'document' pour fichiers
          uploaded_by: user.id
        }));


        const { error: attachmentError } = await supabase
          .from('attachments')
          .insert(attachmentInserts);

        if (attachmentError) {
          console.warn('⚠️ Erreur ajout attachments:', attachmentError);
        }
      }

      toast({
        title: "Merci, ta carte a bien été enregistrée 🌟",
        description: `"${result.title}" a été ajoutée avec succès.`,
      });
      
      onClose();
      resetForm();
      
      // ✅ REFRESH DES DONNÉES
      if (onTaskCreated) {
        onTaskCreated(); // Callback pour rafraîchir les données
      }
      
    } catch (error) {
      toast({
        title: "Erreur de création",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <Edit3 className="h-5 w-5" />
            Create New Card / New task - Edit Mode
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          {/* Card Title */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">
              Card Title *
            </label>
            <Input 
              placeholder="Descriptive card title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="transition-all duration-200 hover:border-hotel-yellow focus:border-hotel-yellow focus:ring-2 focus:ring-hotel-yellow/20"
            />
          </div>

          {/* Card Category Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">
              Card Category *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((category) => {
                const IconComponent = category.icon;
                const isSelected = formData.category === category.id;
                
                return (
                  <Card 
                    key={category.id}
                    className={cn(
                      "cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md",
                      isSelected 
                        ? "ring-2 ring-hotel-yellow border-hotel-yellow" 
                        : "hover:border-hotel-yellow/50"
                    )}
                    onClick={() => setFormData(prev => ({ 
                      ...prev, 
                      category: category.id,
                      originType: category.id === 'client_request' ? 'client' : 
                                  category.id === 'internal_task' ? 'team' : prev.originType
                    }))}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-full",
                        category.cssClass
                      )}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <span className={cn(
                        "font-medium",
                        isSelected ? "text-foreground font-medium" : "text-foreground"
                      )}>
                        {category.label}
                      </span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Conditional Fields for Client Requests */}
          {formData.category === 'client_request' && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Client Name</label>
              <Input 
                placeholder="Client name"
                value={formData.guestName}
                onChange={(e) => setFormData(prev => ({ ...prev, guestName: e.target.value }))}
                className="transition-all duration-200 hover:border-hotel-yellow focus:border-hotel-yellow focus:ring-2 focus:ring-hotel-yellow/20"
              />
            </div>
          )}

          {/* Origin Type - Auto-filled or Dropdown */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">
              Origin Type *
            </label>
            {(formData.category === 'client_request' || formData.category === 'internal_task') ? (
              <div className="h-10 flex items-center px-3 py-2 border border-input bg-muted/50 rounded-md text-sm text-muted-foreground">
                {formData.category === 'client_request' ? 'Client' : 'Team'} (auto-selected)
              </div>
            ) : (
              <Select 
                value={formData.originType} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, originType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select origin type" />
                </SelectTrigger>
                <SelectContent>
                  {originTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Priority Level */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">
              Priority Level *
            </label>
            <div className="flex gap-3">
              {priorityLevels.map((priority) => (
                <Button
                  key={priority.id}
                  variant={formData.priority === priority.id ? "default" : "outline"}
                  onClick={() => setFormData(prev => ({ ...prev, priority: priority.id }))}
                  className={cn(
                    "transition-all duration-200",
                    formData.priority === priority.id 
                      ? "bg-hotel-yellow text-white border-hotel-yellow" 
                      : "hover:border-hotel-yellow/50"
                  )}
                >
                  {priority.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Service and Assigned Members */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Service *
              </label>
              <Select 
                value={formData.service} 
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  service: value,
                  assignedMember: ''
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
              <label className="text-sm font-medium text-foreground">
                Assigned Members *
              </label>
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
                        switch (formData.service) {
                          case 'housekeeping':
                            return member.department === 'Housekeeping';
                          case 'reception':
                            return member.department === 'Reception';
                          case 'maintenance':
                            return member.department === 'Maintenance';
                          default:
                            return false;
                        }
                      })
                      .map((member) => (
                        <SelectItem key={member.id} value={member.full_name || `${member.first_name} ${member.last_name}`}>
                          {member.full_name || `${member.first_name} ${member.last_name}`} - {member.job_title || member.role}
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

          {/* Location Section */}
          <LocationSection
            formData={formData}
            setFormData={setFormData}
            locations={locations}
          />



          {/* Custom Description */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Custom Description</label>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                💡 Describe precisely for better understanding
              </span>
            </div>
            <Textarea 
              placeholder="Describe precisely the situation or request..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="transition-all duration-200 hover:border-hotel-yellow focus:border-hotel-yellow focus:ring-2 focus:ring-hotel-yellow/20"
            />
            {formData.category === 'client_request' && (
              <p className="text-sm text-muted-foreground italic">
                (with client name, context of the need and any personal information to be more friendly)
              </p>
            )}
          </div>

          {/* Task Enhancement Buttons */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setIsChecklistModalOpen(true)}
            >
              <span className="text-sm">✅</span>
              Add checklist
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setIsReminderModalOpen(true)}
            >
              <span className="text-sm">⏰</span>
              Set up reminder / due date
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setIsAttachmentModalOpen(true)}
            >
              <span className="text-sm">📎</span>
              Attachment
            </Button>
          </div>

          {/* Display Added Attachments */}
          {attachments.length > 0 && (
            <div className="space-y-4">
              <div className="text-sm font-medium text-muted-foreground">Added Attachments</div>
              {attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-sm">📎</span>
                    <div>
                      <p className="text-sm font-medium">
                        {attachment.type === 'link' ? 'Link: ' : ''}{attachment.name}
                      </p>
                      {attachment.type === 'link' ? (
                        <p className="text-xs text-muted-foreground">{attachment.url}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {(attachment.size / 1024).toFixed(1)} KB
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteAttachment(attachment.id)}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Display Added Reminders */}
          {reminders.length > 0 && (
            <div className="space-y-4">
              <div className="text-sm font-medium text-muted-foreground">Added Reminders</div>
              {reminders.map((reminder) => (
                <div 
                  key={reminder.id} 
                  className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80"
                  onClick={() => {
                    setEditingReminder(reminder);
                    setIsReminderModalOpen(true);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm">⏰</span>
                    <div>
                      <p className="text-sm font-medium">{reminder.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {reminder.scheduleType === 'datetime' && reminder.date && reminder.time
                          ? `${reminder.date.toLocaleDateString()} at ${reminder.time}`
                          : reminder.scheduleType === 'shifts' && reminder.shifts
                          ? `During ${reminder.shifts.join(', ')} shifts`
                          : 'Custom schedule'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteReminder(reminder.id);
                    }}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Display Added Checklists */}
          {checklists.length > 0 && (
            <div className="space-y-4">
              <div className="text-sm font-medium text-muted-foreground">Added Checklists</div>
              {checklists.map((checklist) => (
                <ChecklistComponent
                  key={checklist.id}
                  title={checklist.title}
                  onDelete={() => handleDeleteChecklist(checklist.id)}
                  onItemsChange={(items) => handleUpdateChecklistItems(checklist.id, items)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-center gap-3 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button 
            variant="outline" 
            onClick={handleCreateCard}
            className="px-8 py-3 min-w-[180px] text-[#BBA57A] bg-[#1E1A37] border-[#BBA57A] hover:bg-[#DEAE35] hover:text-[#1E1A37] hover:border-[#DEAE35] transition-all duration-300 font-medium"
          >
            Create Card
          </Button>

        </div>
      </DialogContent>

      {/* Sub-Modals */}
      <ReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => {
          setIsReminderModalOpen(false);
          setEditingReminder(null);
        }}
        taskTitle={formData.title}
        editingReminder={editingReminder}
        onSave={(reminderData) => {
          if (editingReminder) {
            handleUpdateReminder(editingReminder.id, reminderData);
          } else {
            handleAddReminder(reminderData);
          }
        }}
      />

      <ChecklistModal
        isOpen={isChecklistModalOpen}
        onClose={() => setIsChecklistModalOpen(false)}
        onAdd={handleAddChecklist}
      />

      <AttachmentModal
        isOpen={isAttachmentModalOpen}
        onClose={() => setIsAttachmentModalOpen(false)}
        onSave={(attachmentData) => setAttachments(attachmentData)}
        onUpdate={() => {}}
      />
    </Dialog>
  );
}
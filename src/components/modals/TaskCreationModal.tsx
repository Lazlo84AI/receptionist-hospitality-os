import { useState } from 'react';
import { Edit3, AlertTriangle, Users, Clock, Wrench } from 'lucide-react';
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

const categories = [
  { id: 'incident', label: 'Ongoing Incident', icon: AlertTriangle },
  { id: 'client_request', label: 'Client Request', icon: Users },
  { id: 'follow_up', label: 'Follow-up', icon: Clock },
  { id: 'internal_task', label: 'Internal Task', icon: Wrench },
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
  { id: 'reception', label: 'Reception' },
  { id: 'housekeeping', label: 'Housekeeping' },
  { id: 'maintenance', label: 'Maintenance' },
];

interface TaskCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TaskCreationModal({ isOpen, onClose }: TaskCreationModalProps) {
  const { profiles: hotelMembers } = useProfiles();
  const { locations } = useLocations();
  
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
      subject: reminderData.subject,
      scheduleType: reminderData.scheduleType,
      date: reminderData.date,
      time: reminderData.time,
      shifts: reminderData.shifts,
      frequency: reminderData.frequency,
      endDate: reminderData.endDate,
    };
    setReminders(prev => [...prev, newReminder]);
  };

  const handleUpdateReminder = (reminderId: string, reminderData: any) => {
    const updatedReminder = {
      id: reminderId,
      subject: reminderData.subject,
      scheduleType: reminderData.scheduleType,
      date: reminderData.date,
      time: reminderData.time,
      shifts: reminderData.shifts,
      frequency: reminderData.frequency,
      endDate: reminderData.endDate,
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

  const handleCreateCard = async () => {
    try {
      // TODO: Implement task creation logic
      console.log('Creating task:', formData);
      console.log('Checklists:', checklists);
      console.log('Reminders:', reminders);
      console.log('Attachments:', attachments);
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleClose = () => {
    onClose();
    resetForm();
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
                        isSelected 
                          ? "bg-hotel-yellow text-white" 
                          : "bg-muted text-muted-foreground"
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

          {/* Due Date for Internal Tasks */}
          {formData.category === 'internal_task' && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Due Date *
              </label>
              <Input 
                type="date"
                value={formData.dueDate ? formData.dueDate.toISOString().slice(0, 10) : ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  dueDate: e.target.value ? new Date(e.target.value) : null 
                }))}
                className="transition-all duration-200 hover:border-hotel-yellow focus:border-hotel-yellow focus:ring-2 focus:ring-hotel-yellow/20"
              />
            </div>
          )}

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
              Set up reminder
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
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateCard}
            disabled={!formData.title.trim() || !formData.category}
            className="bg-primary hover:bg-primary/90"
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
        onUpdate={() => {}}
      />
    </Dialog>
  );
}
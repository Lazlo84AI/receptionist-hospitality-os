import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Clock, MapPin, AlertCircle, Mic, Phone, Mail, MessageSquare, ClipboardList } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserProfile {
  id: string;
  full_name: string;
  role: string;
  shift_type: string;
}

export function CreateTaskModal({ isOpen, onClose }: CreateTaskModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    task_type: '',
    priority: '',
    location: '',
    due_date: undefined as Date | undefined,
    reminder_date: undefined as Date | undefined,
    requires_validation: false,
    voice_note_url: '',
    escalation_channel: '',
    assigned_to: '',
    created_by: ''
  });

  const [maintenanceUsers, setMaintenanceUsers] = useState<UserProfile[]>([]);
  const [currentReceptionist, setCurrentReceptionist] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      // Fetch maintenance users
      const { data: maintenanceData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('role', 'maintenance')
        .eq('is_active', true);

      if (maintenanceData) {
        setMaintenanceUsers(maintenanceData);
      }

      // Determine current shift and fetch receptionist
      const currentHour = new Date().getHours();
      let shiftType = 'morning';
      if (currentHour >= 14 && currentHour < 22) {
        shiftType = 'afternoon';
      } else if (currentHour >= 22 || currentHour < 6) {
        shiftType = 'night';
      }

      const { data: receptionistData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('role', 'receptionist')
        .eq('shift_type', shiftType)
        .eq('is_active', true)
        .limit(1);

      if (receptionistData && receptionistData.length > 0) {
        setCurrentReceptionist(receptionistData[0]);
        setFormData(prev => ({ ...prev, created_by: receptionistData[0].id }));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.task_type || !formData.priority) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        task_type: formData.task_type,
        priority: formData.priority,
        status: 'pending',
        location: formData.location.trim() || null,
        due_date: formData.due_date?.toISOString() || null,
        reminder_date: formData.reminder_date?.toISOString() || null,
        requires_validation: formData.requires_validation,
        voice_note_url: formData.voice_note_url.trim() || null,
        escalation_channel: formData.escalation_channel || null,
        assigned_to: formData.assigned_to || null,
        created_by: formData.created_by,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const response = await fetch('http://localhost:5678/webhook-test/get_data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Task created successfully",
        });
        
        // Reset form
        setFormData({
          title: '',
          description: '',
          task_type: '',
          priority: '',
          location: '',
          due_date: undefined,
          reminder_date: undefined,
          requires_validation: false,
          voice_note_url: '',
          escalation_channel: '',
          assigned_to: '',
          created_by: currentReceptionist?.id || ''
        });
        
        onClose();
      } else {
        throw new Error('Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-accent" />
            Create New Task
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium flex items-center gap-1">
              Task Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Enter task title..."
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">Description</Label>
            <Textarea
              id="description"
              placeholder="Provide task details..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full min-h-[80px]"
            />
          </div>

          {/* Task Type and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1">
                Task Type <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.task_type} onValueChange={(value) => setFormData(prev => ({ ...prev, task_type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client_request">Client Request</SelectItem>
                  <SelectItem value="team_task">Team Task</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="administrative">Administrative</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1">
                Priority <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">🔴 Critical</SelectItem>
                  <SelectItem value="urgent">🟡 Urgent</SelectItem>
                  <SelectItem value="normal">🟢 Normal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm font-medium flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              Location
            </Label>
            <Input
              id="location"
              placeholder="Room number, area, or department..."
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                Due Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.due_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.due_date ? format(formData.due_date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.due_date}
                    onSelect={(date) => setFormData(prev => ({ ...prev, due_date: date }))}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Reminder Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.reminder_date && "text-muted-foreground"
                    )}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    {formData.reminder_date ? format(formData.reminder_date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.reminder_date}
                    onSelect={(date) => setFormData(prev => ({ ...prev, reminder_date: date }))}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Assigned To */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Assign to Maintenance Staff</Label>
            <Select value={formData.assigned_to} onValueChange={(value) => setFormData(prev => ({ ...prev, assigned_to: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select maintenance staff member" />
              </SelectTrigger>
              <SelectContent>
                {maintenanceUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name} ({user.shift_type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Created By (Read-only) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Created By</Label>
            <Input
              value={currentReceptionist?.full_name || 'Loading...'}
              readOnly
              className="bg-muted"
            />
          </div>

          {/* Voice Note URL */}
          <div className="space-y-2">
            <Label htmlFor="voice_note" className="text-sm font-medium flex items-center gap-1">
              <Mic className="h-4 w-4" />
              Voice Note URL (Optional)
            </Label>
            <Input
              id="voice_note"
              placeholder="https://example.com/voice-note.mp3"
              value={formData.voice_note_url}
              onChange={(e) => setFormData(prev => ({ ...prev, voice_note_url: e.target.value }))}
            />
          </div>

          {/* Escalation Channel */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              Escalation Channel (Optional)
            </Label>
            <Select value={formData.escalation_channel} onValueChange={(value) => setFormData(prev => ({ ...prev, escalation_channel: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select escalation method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="whatsapp">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    WhatsApp
                  </div>
                </SelectItem>
                <SelectItem value="email">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </div>
                </SelectItem>
                <SelectItem value="sms">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    SMS
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Requires Validation */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="validation"
              checked={formData.requires_validation}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requires_validation: checked as boolean }))}
            />
            <Label htmlFor="validation" className="text-sm font-medium">
              Requires cross-department validation
            </Label>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
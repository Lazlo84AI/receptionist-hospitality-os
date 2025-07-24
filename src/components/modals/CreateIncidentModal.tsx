import { useState, useEffect } from 'react';
import { AlertTriangle, MapPin, Users, Calendar, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CreateIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserProfile {
  id: string;
  full_name: string;
  role: string;
  department: string;
}

interface Location {
  id: string;
  display_name: string;
  location_type: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
}

export function CreateIncidentModal({ isOpen, onClose }: CreateIncidentModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    incident_type: '',
    priority: 'normal',
    assigned_to: '',
    affected_departments: [] as string[],
    location_id: '',
    related_task_ids: [] as string[]
  });

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [currentReceptionist, setCurrentReceptionist] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      // Fetch all users
      const { data: usersData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('is_active', true);

      if (usersData) {
        setUsers(usersData);
        // Extract unique departments
        const uniqueDepartments = [...new Set(usersData.map(user => user.department).filter(Boolean))];
        setDepartments(uniqueDepartments);
      }

      // Fetch locations
      const { data: locationsData } = await supabase
        .from('locations')
        .select('*')
        .eq('is_active', true);

      if (locationsData) {
        setLocations(locationsData);
      }

      // Fetch active tasks
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('id, title, status')
        .neq('status', 'completed');

      if (tasksData) {
        setTasks(tasksData);
      }

      // Get current receptionist
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
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load form data",
        variant: "destructive"
      });
    }
  };

  const handleDepartmentChange = (department: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      affected_departments: checked
        ? [...prev.affected_departments, department]
        : prev.affected_departments.filter(d => d !== department)
    }));
  };

  const handleTaskChange = (taskId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      related_task_ids: checked
        ? [...prev.related_task_ids, taskId]
        : prev.related_task_ids.filter(id => id !== taskId)
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.incident_type) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const incidentData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        incident_type: formData.incident_type,
        priority: formData.priority,
        status: 'open',
        assigned_to: formData.assigned_to || null,
        created_by: currentReceptionist?.id || null,
        affected_departments: formData.affected_departments.length > 0 ? formData.affected_departments : null,
        location_id: formData.location_id || null,
        related_task_ids: formData.related_task_ids.length > 0 ? formData.related_task_ids : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const response = await fetch('http://localhost:5678/webhook-test/get_data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(incidentData)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Incident created successfully",
        });
        
        // Reset form
        setFormData({
          title: '',
          description: '',
          incident_type: '',
          priority: 'normal',
          assigned_to: '',
          affected_departments: [],
          location_id: '',
          related_task_ids: []
        });
        
        onClose();
      } else {
        throw new Error('Failed to create incident');
      }
    } catch (error) {
      console.error('Error creating incident:', error);
      toast({
        title: "Error",
        description: "Failed to create incident",
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
            <AlertTriangle className="h-5 w-5 text-accent" />
            Create New Incident
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium flex items-center gap-1">
              Incident Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Enter incident title..."
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
              placeholder="Describe the incident in detail..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full min-h-[80px]"
            />
          </div>

          {/* Incident Type and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1">
                Incident Type <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.incident_type} onValueChange={(value) => setFormData(prev => ({ ...prev, incident_type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="team">Team Issue</SelectItem>
                  <SelectItem value="client">Client Issue</SelectItem>
                  <SelectItem value="maintenance">Maintenance Issue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">🔴 Urgent</SelectItem>
                  <SelectItem value="normal">🟢 Normal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assigned To */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Assign To</Label>
            <Select value={formData.assigned_to} onValueChange={(value) => setFormData(prev => ({ ...prev, assigned_to: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name} ({user.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              Location
            </Label>
            <Select value={formData.location_id} onValueChange={(value) => setFormData(prev => ({ ...prev, location_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.display_name} ({location.location_type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Affected Departments */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              <Users className="h-4 w-4" />
              Affected Departments
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {departments.map((department) => (
                <div key={department} className="flex items-center space-x-2">
                  <Checkbox
                    id={`dept-${department}`}
                    checked={formData.affected_departments.includes(department)}
                    onCheckedChange={(checked) => handleDepartmentChange(department, checked as boolean)}
                  />
                  <Label htmlFor={`dept-${department}`} className="text-sm capitalize">
                    {department.replace('_', ' ')}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Related Tasks */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Related Tasks (Optional)</Label>
            <div className="max-h-32 overflow-y-auto space-y-2 border rounded p-2">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`task-${task.id}`}
                    checked={formData.related_task_ids.includes(task.id)}
                    onCheckedChange={(checked) => handleTaskChange(task.id, checked as boolean)}
                  />
                  <Label htmlFor={`task-${task.id}`} className="text-sm">
                    {task.title} ({task.status})
                  </Label>
                </div>
              ))}
            </div>
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

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Creating...' : 'Create Incident'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
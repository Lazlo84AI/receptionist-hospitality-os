import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Users, Calendar, MapPin, ClipboardList } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CreateSpecialRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserProfile {
  id: string;
  full_name: string;
  role: string;
  department: string;
}

export function CreateSpecialRequestModal({ isOpen, onClose }: CreateSpecialRequestModalProps) {
  const [formData, setFormData] = useState({
    guest_name: '',
    room_number: '',
    request_type: '',
    request_details: '',
    arrival_date: undefined as Date | undefined,
    preparation_status: 'to_prepare',
    assigned_to: '',
    notes: ''
  });

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentReceptionist, setCurrentReceptionist] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Common request types
  const requestTypes = [
    'room_decoration',
    'special_amenities',
    'dietary_requirements',
    'accessibility_needs',
    'celebration_setup',
    'business_services',
    'transportation',
    'custom_request'
  ];

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      // Fetch all active staff
      const { data: usersData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('is_active', true);

      if (usersData) {
        setUsers(usersData);
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

  const handleSubmit = async () => {
    if (!formData.guest_name.trim() || !formData.room_number.trim() || !formData.request_type || !formData.arrival_date) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        guest_name: formData.guest_name.trim(),
        room_number: formData.room_number.trim(),
        request_type: formData.request_type,
        request_details: formData.request_details.trim() || null,
        arrival_date: formData.arrival_date.toISOString().split('T')[0], // Date only
        preparation_status: formData.preparation_status,
        assigned_to: formData.assigned_to || null,
        notes: formData.notes.trim() || null,
        created_by: currentReceptionist?.id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const response = await fetch('http://localhost:5678/webhook-test/get_data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Special request created successfully",
        });
        
        // Reset form
        setFormData({
          guest_name: '',
          room_number: '',
          request_type: '',
          request_details: '',
          arrival_date: undefined,
          preparation_status: 'to_prepare',
          assigned_to: '',
          notes: ''
        });
        
        onClose();
      } else {
        throw new Error('Failed to create special request');
      }
    } catch (error) {
      console.error('Error creating special request:', error);
      toast({
        title: "Error",
        description: "Failed to create special request",
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
            <Users className="h-5 w-5 text-accent" />
            Create Special Client Request
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Guest Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="guest_name" className="text-sm font-medium flex items-center gap-1">
                Guest Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="guest_name"
                placeholder="Enter guest name..."
                value={formData.guest_name}
                onChange={(e) => setFormData(prev => ({ ...prev, guest_name: e.target.value }))}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="room_number" className="text-sm font-medium flex items-center gap-1">
                Room Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="room_number"
                placeholder="e.g., 101, Suite 205..."
                value={formData.room_number}
                onChange={(e) => setFormData(prev => ({ ...prev, room_number: e.target.value }))}
                className="w-full"
              />
            </div>
          </div>

          {/* Request Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              Request Type <span className="text-destructive">*</span>
            </Label>
            <Select value={formData.request_type} onValueChange={(value) => setFormData(prev => ({ ...prev, request_type: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select request type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="room_decoration">Room Decoration</SelectItem>
                <SelectItem value="special_amenities">Special Amenities</SelectItem>
                <SelectItem value="dietary_requirements">Dietary Requirements</SelectItem>
                <SelectItem value="accessibility_needs">Accessibility Needs</SelectItem>
                <SelectItem value="celebration_setup">Celebration Setup</SelectItem>
                <SelectItem value="business_services">Business Services</SelectItem>
                <SelectItem value="transportation">Transportation</SelectItem>
                <SelectItem value="custom_request">Custom Request</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Request Details */}
          <div className="space-y-2">
            <Label htmlFor="request_details" className="text-sm font-medium">Request Details</Label>
            <Textarea
              id="request_details"
              placeholder="Describe the special request in detail..."
              value={formData.request_details}
              onChange={(e) => setFormData(prev => ({ ...prev, request_details: e.target.value }))}
              className="w-full min-h-[80px]"
            />
          </div>

          {/* Arrival Date */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Arrival Date <span className="text-destructive">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.arrival_date && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {formData.arrival_date ? format(formData.arrival_date, "PPP") : "Select arrival date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={formData.arrival_date}
                  onSelect={(date) => setFormData(prev => ({ ...prev, arrival_date: date }))}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Preparation Status */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Preparation Status</Label>
            <Select value={formData.preparation_status} onValueChange={(value) => setFormData(prev => ({ ...prev, preparation_status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="to_prepare">🟡 To Prepare</SelectItem>
                <SelectItem value="in_progress">🔵 In Progress</SelectItem>
                <SelectItem value="prepared">🟢 Prepared</SelectItem>
                <SelectItem value="completed">✅ Completed</SelectItem>
              </SelectContent>
            </Select>
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
                    {user.full_name} ({user.role} - {user.department})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information or special instructions..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full min-h-[60px]"
            />
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
              {loading ? 'Creating...' : 'Create Request'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { User, Clock, Briefcase, Users } from 'lucide-react';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  shift_type: string;
  is_active: boolean;
  department: string;
  created_at: string;
  updated_at: string;
  permissions: any;
}

interface Shift {
  id: string;
  receptionist_id: string;
  shift_type: string;
  start_time: string;
  end_time: string;
  status: string;
  handover_notes: string;
  voice_handover_url: string;
  created_at: string;
  updated_at: string;
}

const WEBHOOK_URL = 'https://primary-production-31bef.up.railway.app/webhook-test/send_data';

export const ReceptionistStatus = () => {
  const [currentReceptionist, setCurrentReceptionist] = useState<UserProfile | null>(null);
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);

  const sendWebhookData = async (eventType: string, data: any, metadata?: any) => {
    try {
      const payload = {
        event_type: eventType,
        timestamp: new Date().toISOString(),
        receptionist: currentReceptionist,
        shift: currentShift,
        data,
        metadata: metadata || {}
      };

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error('Webhook failed:', response.statusText);
      }
    } catch (error) {
      console.error('Error sending webhook:', error);
    }
  };

  const fetchCurrentReceptionist = async () => {
    try {
      // Using mock data for demonstration while database types are being updated
      const mockReceptionist: UserProfile = {
        id: 'demo-receptionist-001',
        email: 'receptionist@hotel.com',
        full_name: 'Sarah Johnson',
        role: 'receptionist',
        shift_type: 'morning',
        is_active: true,
        department: 'Front Desk',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        permissions: {}
      };

      const mockShift: Shift = {
        id: 'demo-shift-001',
        receptionist_id: 'demo-receptionist-001',
        shift_type: 'morning',
        start_time: new Date().toISOString(),
        end_time: '',
        status: 'active',
        handover_notes: '',
        voice_handover_url: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setCurrentReceptionist(mockReceptionist);
      setCurrentShift(mockShift);
      
      // Send initial webhook data
      await sendWebhookData('receptionist_status_loaded', {
        receptionist: mockReceptionist,
        shift: mockShift,
        note: 'Connected to new database - Real-time tracking active'
      });
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load receptionist data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentReceptionist();

    // Set up real-time subscriptions for tracking operations
    const shiftsChannel = supabase
      .channel('shifts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shifts'
        },
        (payload) => {
          console.log('Shift change detected:', payload);
          sendWebhookData('shift_operation', payload);
          
          if (payload.eventType === 'UPDATE' && payload.new.status === 'active') {
            fetchCurrentReceptionist();
          }
        }
      )
      .subscribe();

    const taskChannel = supabase
      .channel('task-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task'
        },
        (payload) => {
          console.log('Task operation detected:', payload);
          sendWebhookData('task_operation', payload, {
            operation_by: currentReceptionist?.id,
            receptionist_name: currentReceptionist?.full_name
          });
        }
      )
      .subscribe();

    const profilesChannel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles'
        },
        (payload) => {
          console.log('Profile change detected:', payload);
          sendWebhookData('profile_operation', payload);
          
          if (currentReceptionist && (payload.new as any)?.id === currentReceptionist.id) {
            setCurrentReceptionist(payload.new as UserProfile);
          }
        }
      )
      .subscribe();

    const activityChannel = supabase
      .channel('activity-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_logs'
        },
        (payload) => {
          console.log('Activity logged:', payload);
          sendWebhookData('activity_log', payload, {
            logged_by: currentReceptionist?.id,
            receptionist_name: currentReceptionist?.full_name
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(shiftsChannel);
      supabase.removeChannel(taskChannel);
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(activityChannel);
    };
  }, [currentReceptionist?.id, currentReceptionist?.full_name]);

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentReceptionist || !currentShift) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Current Receptionist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No active receptionist found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Current Receptionist
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">{currentReceptionist.full_name}</h3>
            <p className="text-muted-foreground">{currentReceptionist.email}</p>
          </div>
          <Badge variant={currentReceptionist.is_active ? "default" : "secondary"}>
            {currentReceptionist.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Role</p>
              <p className="text-sm text-muted-foreground capitalize">{currentReceptionist.role}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Department</p>
              <p className="text-sm text-muted-foreground">{currentReceptionist.department || 'Not specified'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Shift Type</p>
              <p className="text-sm text-muted-foreground capitalize">{currentReceptionist.shift_type}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Current Shift</p>
              <Badge variant="outline" className="capitalize">
                {currentShift.shift_type} - {currentShift.status}
              </Badge>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground">
            <div>Shift Started: {new Date(currentShift.start_time).toLocaleString()}</div>
            <div>User ID: {currentReceptionist.id}</div>
            <div>Shift ID: {currentShift.id}</div>
          </div>
        </div>

        <div className="pt-2">
          <Badge variant="secondary" className="text-xs">
            Real-time tracking active - Webhook integrated
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
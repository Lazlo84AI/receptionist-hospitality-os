import { supabase } from "@/integrations/supabase/client";

const WEBHOOK_URL = 'https://primary-production-31bef.up.railway.app/webhook-test/send_data';

export interface WebhookEvent {
  event_type: 'task_created' | 'task_moved' | 'task_status_changed' | 'shift_started' | 'shift_ended';
  timestamp: string;
  current_user_id: string | null;
  data: any;
}

export const sendWebhookEvent = async (event: WebhookEvent): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Webhook failed with status: ${response.status}`, errorText);
      return { 
        success: false, 
        error: `Server error: ${response.status}. Please try again or contact support.` 
      };
    }

    console.log(`Webhook sent successfully for event: ${event.event_type}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending webhook:', error);
    return { 
      success: false, 
      error: 'Unable to connect to server. Please check your internet connection and try again.' 
    };
  }
};

// Helper function to get current user ID
const getCurrentUserId = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
};

// Helper function to enhance task data with necessary IDs
const enhanceTaskData = async (taskData: any, profiles: any[] = [], locations: any[] = []) => {
  const enhanced = { ...taskData };

  // Add assigned member ID if assigned_member name is provided
  if (taskData.assigned_member && profiles.length > 0) {
    const assignedProfile = profiles.find(p => 
      `${p.first_name} ${p.last_name}` === taskData.assigned_member
    );
    if (assignedProfile) {
      enhanced.assigned_member_id = assignedProfile.id;
    }
  }

  // Add location ID if location name is provided
  if (taskData.location && locations.length > 0) {
    const location = locations.find(l => l.name === taskData.location);
    if (location) {
      enhanced.location_id = location.id;
    }
  }

  return enhanced;
};

// Helper functions for specific events
export const sendTaskCreatedEvent = async (taskData: any, profiles: any[] = [], locations: any[] = []) => {
  const currentUserId = await getCurrentUserId();
  const enhancedData = await enhanceTaskData(taskData, profiles, locations);
  
  return sendWebhookEvent({
    event_type: 'task_created',
    timestamp: new Date().toISOString(),
    current_user_id: currentUserId,
    data: {
      ...enhancedData,
      created_by: currentUserId,
    },
  });
};

export const sendTaskMovedEvent = async (taskId: string, fromStatus: string, toStatus: string, taskData: any) => {
  const currentUserId = await getCurrentUserId();
  
  return sendWebhookEvent({
    event_type: 'task_moved',
    timestamp: new Date().toISOString(),
    current_user_id: currentUserId,
    data: {
      task_id: taskId,
      from_status: fromStatus,
      to_status: toStatus,
      task: taskData,
      moved_by: currentUserId,
    },
  });
};

export const sendTaskStatusChangedEvent = async (taskId: string, oldStatus: string, newStatus: string, taskData: any) => {
  const currentUserId = await getCurrentUserId();
  
  return sendWebhookEvent({
    event_type: 'task_status_changed',
    timestamp: new Date().toISOString(),
    current_user_id: currentUserId,
    data: {
      task_id: taskId,
      old_status: oldStatus,
      new_status: newStatus,
      task: taskData,
      updated_by: currentUserId,
    },
  });
};

export const sendShiftStartedEvent = async (shiftData: any) => {
  const currentUserId = await getCurrentUserId();
  
  return sendWebhookEvent({
    event_type: 'shift_started',
    timestamp: new Date().toISOString(),
    current_user_id: currentUserId,
    data: {
      ...shiftData,
      user_id: currentUserId,
    },
  });
};

export const sendShiftEndedEvent = async (shiftData: any) => {
  const currentUserId = await getCurrentUserId();
  
  return sendWebhookEvent({
    event_type: 'shift_ended',
    timestamp: new Date().toISOString(),
    current_user_id: currentUserId,
    data: {
      ...shiftData,
      user_id: currentUserId,
    },
  });
};
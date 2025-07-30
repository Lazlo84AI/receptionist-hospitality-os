const WEBHOOK_URL = 'https://primary-production-31bef.up.railway.app/webhook-test/send_data';

export interface WebhookEvent {
  event_type: 'task_created' | 'task_moved' | 'task_status_changed' | 'shift_started' | 'shift_ended';
  timestamp: string;
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

// Helper functions for specific events
export const sendTaskCreatedEvent = async (taskData: any) => {
  return sendWebhookEvent({
    event_type: 'task_created',
    timestamp: new Date().toISOString(),
    data: taskData,
  });
};

export const sendTaskMovedEvent = async (taskId: string, fromStatus: string, toStatus: string, taskData: any) => {
  return sendWebhookEvent({
    event_type: 'task_moved',
    timestamp: new Date().toISOString(),
    data: {
      task_id: taskId,
      from_status: fromStatus,
      to_status: toStatus,
      task: taskData,
    },
  });
};

export const sendTaskStatusChangedEvent = async (taskId: string, oldStatus: string, newStatus: string, taskData: any) => {
  return sendWebhookEvent({
    event_type: 'task_status_changed',
    timestamp: new Date().toISOString(),
    data: {
      task_id: taskId,
      old_status: oldStatus,
      new_status: newStatus,
      task: taskData,
    },
  });
};

export const sendShiftStartedEvent = async (shiftData: any) => {
  return sendWebhookEvent({
    event_type: 'shift_started',
    timestamp: new Date().toISOString(),
    data: shiftData,
  });
};

export const sendShiftEndedEvent = async (shiftData: any) => {
  return sendWebhookEvent({
    event_type: 'shift_ended',
    timestamp: new Date().toISOString(),
    data: shiftData,
  });
};
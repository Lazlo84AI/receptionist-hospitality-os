// Comprehensive payload examples showing all possible fields users can enter

// ====================
// CLIENT REQUEST PAYLOAD
// ====================
export const ClientRequestPayloadExample = {
  // Required database fields
  guest_name: "Marie Dubois",
  room_number: "207",
  request_type: "Room Service",
  
  // Optional database fields
  request_details: "Guest requests extra towels, late checkout until 2 PM, and dinner reservation for 2 people at 8 PM. Also needs assistance with luggage storage.",
  arrival_date: "2025-07-30", // ISO date format
  priority: "medium", // low, medium, high, urgent, normal
  assigned_to: "Thomas Anderson",
  
  // Fields for ID mapping (handled by webhook service)
  task_category: "client_request",
  assigned_member: "Thomas Anderson", // For ID mapping
  location: "Room 207", // For ID mapping
};

// ====================
// INCIDENT PAYLOAD
// ====================
export const IncidentPayloadExample = {
  // Required database fields
  title: "Elevator Malfunction on Floor 3",
  incident_type: "Equipment Failure",
  
  // Optional database fields
  description: "Elevator is making unusual noises and stopped between floors 2 and 3. Guests are trapped inside. Emergency maintenance required immediately. Fire department has been notified.",
  location: "Elevator Bank - Floor 3",
  priority: "urgent", // low, medium, high, urgent, normal
  assigned_to: "Maintenance Team Lead",
  
  // Fields for ID mapping (handled by webhook service)
  task_category: "incident",
  assigned_member: "Jean Martin", // For ID mapping
  incident_location: "Elevator Bank - Floor 3", // For ID mapping
};

// ====================
// FOLLOW-UP PAYLOAD
// ====================
export const FollowUpPayloadExample = {
  // Required database fields
  title: "Guest Satisfaction Follow-up - VIP Client",
  follow_up_type: "Guest Satisfaction",
  recipient: "Sarah Johnson",
  
  // Optional database fields
  notes: "VIP guest mentioned minor issues with room temperature during check-in. Follow up to ensure satisfaction and offer complimentary services if needed. Guest is celebrating anniversary.",
  due_date: "2025-08-01", // ISO date format
  priority: "high", // low, medium, high, urgent, normal
  assigned_to: "Customer Relations Manager",
  
  // Fields for ID mapping (handled by webhook service)
  task_category: "follow_up",
  assigned_member: "Marie Dubois", // For ID mapping
  location: "Front Desk", // For ID mapping
};

// ====================
// INTERNAL TASK PAYLOAD
// ====================
export const InternalTaskPayloadExample = {
  // Required database fields
  title: "Weekly Staff Training - Customer Service Excellence",
  task_type: "Training",
  
  // Optional database fields
  description: "Conduct mandatory training session for all front desk staff on new customer service protocols. Include role-playing exercises and guest complaint handling procedures.",
  department: "Human Resources",
  location: "Conference Room B",
  due_date: "2025-08-05", // ISO date format
  priority: "medium", // low, medium, high, urgent, normal
  assigned_to: "HR Training Coordinator",
  
  // Fields for ID mapping (handled by webhook service)
  task_category: "internal_task",
  assigned_member: "Sophie Bernard", // For ID mapping
  task_location: "Conference Room B", // For ID mapping
};

// ====================
// COMPREHENSIVE FORM DATA EXAMPLE
// ====================
export const ComprehensiveFormDataExample = {
  // Basic fields available in all task types
  title: "Complete Task with All Fields",
  description: "This is a comprehensive example showing all possible fields that can be filled in the task creation form.",
  category: "client_request", // incident, client_request, follow_up, internal_task
  priority: "high", // low, medium, high, urgent, normal
  
  // Assignment fields
  assignedMember: "Thomas Anderson", // Selected from dropdown
  
  // Location fields
  location: "Presidential Suite", // Selected from dropdown or entered manually
  
  // Date fields
  dueDate: new Date("2025-08-01T14:30:00Z"), // Date object from date picker
  
  // Category-specific fields
  guestName: "Elizabeth Windsor", // For client requests
  roomNumber: "1001", // For client requests
  recipient: "Hotel Manager", // For follow-ups
  service: "Luxury Concierge Service", // Service type dropdown
  originType: "Guest Request", // Origin classification
  
  // Additional metadata that could be captured
  urgency: "High Priority", // Urgency level
  estimatedDuration: "2 hours", // How long task might take
  specialInstructions: "Handle with utmost care - VIP guest with special dietary requirements",
};

// ====================
// PAYLOAD WITH ALL POSSIBLE METADATA
// ====================
export const FullMetadataPayloadExample = {
  // Core task data
  title: "VIP Guest Special Arrangement",
  description: "Arrange special welcome amenities and room setup for anniversary celebration",
  task_category: "client_request",
  
  // Guest information
  guest_name: "Robert & Catherine Smith",
  room_number: "Presidential Suite 1001",
  request_type: "VIP Special Arrangement",
  request_details: "Anniversary celebration - 25th wedding anniversary. Arrange champagne, flowers, chocolate strawberries. Setup romantic lighting. Ensure privacy and quiet environment.",
  
  // Timing
  arrival_date: "2025-07-30",
  due_date: "2025-07-30",
  
  // Assignment
  priority: "high",
  assigned_to: "Concierge Manager",
  assigned_member: "Marie Dubois",
  
  // Location
  location: "Presidential Suite 1001",
  
  // Additional context
  special_requirements: [
    "Champagne selection preference: Dom Pérignon",
    "Flower arrangement: Red roses and white lilies",
    "Dietary restrictions: No nuts",
    "Check-in time: 3 PM",
    "Privacy level: Maximum"
  ],
  
  // Estimated details
  estimated_duration: "3 hours preparation",
  complexity_level: "High",
  requires_coordination: true,
  
  // Service categories
  services_involved: [
    "Housekeeping",
    "Food & Beverage",
    "Concierge",
    "Front Desk"
  ]
};

// ====================
// BULK OPERATION PAYLOADS
// ====================
export const BulkOperationExamples = {
  // Multiple client requests
  bulkClientRequests: [
    {
      guest_name: "John Doe",
      room_number: "201",
      request_type: "Extra Towels",
      priority: "low",
      task_category: "client_request"
    },
    {
      guest_name: "Jane Smith",
      room_number: "202",
      request_type: "Late Checkout",
      priority: "medium",
      task_category: "client_request"
    },
    {
      guest_name: "Mike Johnson",
      room_number: "203",
      request_type: "Room Service",
      request_details: "Breakfast for 2, room 203, 8 AM delivery",
      priority: "medium",
      task_category: "client_request"
    }
  ],
  
  // Multiple incidents
  bulkIncidents: [
    {
      title: "HVAC System Issue - Floor 2",
      incident_type: "Equipment Malfunction",
      location: "Floor 2 - East Wing",
      priority: "high",
      description: "Air conditioning not working in multiple rooms",
      task_category: "incident"
    },
    {
      title: "WiFi Outage - Conference Room",
      incident_type: "Technical Issue",
      location: "Conference Room A",
      priority: "medium",
      description: "Internet connectivity issues during business meeting",
      task_category: "incident"
    }
  ]
};

// Export types for use in components
export type TaskCategory = 'incident' | 'client_request' | 'follow_up' | 'internal_task';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent' | 'normal';

// Helper function to generate task-specific payload
export const generateTaskPayload = (
  category: TaskCategory,
  formData: any,
  additionalData?: any
) => {
  const basePayload = {
    task_category: category,
    assigned_member: formData.assignedMember,
    location: formData.location,
    priority: formData.priority || 'medium',
    ...additionalData
  };

  switch (category) {
    case 'client_request':
      return {
        ...basePayload,
        guest_name: formData.guestName || '',
        room_number: formData.roomNumber || '',
        request_type: formData.service || 'General Request',
        request_details: formData.description,
        arrival_date: formData.dueDate?.toISOString().split('T')[0] || null,
        assigned_to: formData.assignedMember || null,
      };
    
    case 'incident':
      return {
        ...basePayload,
        title: formData.title || 'New Incident',
        description: formData.description,
        incident_type: formData.service || 'General Incident',
        location: formData.location,
        assigned_to: formData.assignedMember || null,
      };
    
    case 'follow_up':
      return {
        ...basePayload,
        title: formData.title || 'New Follow-up',
        follow_up_type: formData.service || 'General Follow-up',
        recipient: formData.recipient || formData.guestName || '',
        notes: formData.description,
        due_date: formData.dueDate?.toISOString().split('T')[0] || null,
        assigned_to: formData.assignedMember || null,
      };
    
    case 'internal_task':
      return {
        ...basePayload,
        title: formData.title || 'New Internal Task',
        description: formData.description,
        task_type: formData.service || 'General Task',
        department: formData.department || null,
        location: formData.location,
        due_date: formData.dueDate?.toISOString().split('T')[0] || null,
        assigned_to: formData.assignedMember || null,
      };
    
    default:
      return basePayload;
  }
};
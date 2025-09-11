// taskEditConfig.ts - Configuration pour le module TaskFullEditView
// Fini le hardcoding ! Tout est paramétrable ici

import { 
  Clock, 
  CheckSquare, 
  Users, 
  TrendingUp, 
  Paperclip,
  AlertTriangle,
  MapPin
} from 'lucide-react';

// Types pour la configuration
export interface PriorityOption {
  value: 'low' | 'normal' | 'medium' | 'high' | 'urgent';
  label: string;
  className: string;
  icon?: any;
}

export interface StatusOption {
  value: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  label: string;
  className: string;
}

export interface TaskEnhancementButton {
  key: string;
  label: string;
  icon: any;
  className: string;
  action: string;
}

// Configuration des niveaux de priorité
export const PRIORITY_OPTIONS: PriorityOption[] = [
  {
    value: 'normal',
    label: 'Normal',
    className: 'priority-button'
  },
  {
    value: 'urgent',
    label: 'Urgence',
    className: 'priority-button bg-red-500 text-white hover:bg-red-600',
    icon: AlertTriangle
  }
];

// Configuration des statuts
export const STATUS_OPTIONS: StatusOption[] = [
  {
    value: 'pending',
    label: 'To Process',
    className: 'priority-button'
  },
  {
    value: 'in_progress',
    label: 'In Progress',
    className: 'priority-button bg-gray-700 text-white hover:bg-gray-800'
  },
  {
    value: 'completed',
    label: 'Resolved',
    className: 'priority-button bg-green-500 text-white hover:bg-green-600'
  },
  {
    value: 'cancelled',
    label: 'Cancelled',
    className: 'priority-button bg-gray-400 text-white hover:bg-gray-500'
  }
];

// Configuration des boutons Task Enhancement
export const TASK_ENHANCEMENT_BUTTONS: TaskEnhancementButton[] = [
  {
    key: 'reminder',
    label: 'Reminder',
    icon: Clock,
    className: 'flex items-center space-x-2 px-3 py-2 border border-border rounded-md bg-background hotel-accent-hover',
    action: 'openReminderModal'
  },
  {
    key: 'checklist',
    label: 'Checklist',
    icon: CheckSquare,
    className: 'flex items-center space-x-2 px-3 py-2 border border-border rounded-md bg-background hotel-accent-hover',
    action: 'openChecklistModal'
  },
  {
    key: 'members',
    label: 'Members',
    icon: Users,
    className: 'flex items-center space-x-2 px-3 py-2 border border-border rounded-md bg-background hotel-accent-hover',
    action: 'openMembersModal'
  },
  {
    key: 'escalation',
    label: 'Escalation',
    icon: TrendingUp,
    className: 'flex items-center space-x-2 px-3 py-2 border border-border rounded-md bg-background hotel-accent-hover',
    action: 'openEscalationModal'
  },
  {
    key: 'attachment',
    label: 'Attachment',
    icon: Paperclip,
    className: 'flex items-center space-x-2 px-3 py-2 border border-border rounded-md bg-background hotel-accent-hover',
    action: 'openAttachmentModal'
  }
];

// Configuration des champs éditables
export interface EditableField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'datetime' | 'location';
  required?: boolean;
  placeholder?: string;
  icon?: any;
  description?: string;
}

export const EDITABLE_FIELDS: EditableField[] = [
  {
    key: 'title',
    label: 'Card Title',
    type: 'text',
    required: true,
    placeholder: 'Enter task title'
  },
  {
    key: 'description',
    label: 'Custom Description',
    type: 'textarea',
    placeholder: 'Describe the task details...'
  },
  {
    key: 'assignedTo',
    label: 'Assigned Members',
    type: 'text',
    icon: Users,
    description: 'Use the "Members" button to add members with the same function'
  },
  {
    key: 'location',
    label: 'Location',
    type: 'location',
    icon: MapPin
  },
  {
    key: 'roomNumber',
    label: 'Room Number',
    type: 'text',
    icon: MapPin
  },
  {
    key: 'guestName',
    label: 'Guest Name',
    type: 'text'
  },
  {
    key: 'recipient',
    label: 'Recipient',
    type: 'text'
  }
];

// Configuration des couleurs et thème
export const TASK_EDIT_THEME = {
  colors: {
    primary: 'bg-primary hover:bg-hotel-yellow hover:text-hotel-navy',
    secondary: 'bg-muted hover:bg-hotel-yellow hover:text-hotel-navy',
    success: 'bg-green-600 hover:bg-green-700',
    warning: 'bg-yellow-500 hover:bg-yellow-600',
    danger: 'bg-red-500 hover:bg-red-600',
    info: 'bg-blue-500 hover:bg-blue-600'
  },
  text: {
    primary: 'text-hotel-navy',
    secondary: 'text-muted-foreground',
    muted: 'text-hotel-navy/60'
  },
  borders: {
    default: 'border-border',
    hover: 'hotel-hover',
    focus: 'focus:border-hotel-yellow focus:ring-hotel-yellow'
  },
  shadows: {
    hover: 'hover:shadow-lg hover:shadow-hotel-yellow/20',
    focus: 'focus:shadow-sm focus:shadow-hotel-yellow/10'
  }
};

// Configuration des messages
export const MESSAGES = {
  title: 'Full Editable Card',
  subtitle: 'All fields are editable – Don\'t forget to save',
  saveButton: 'Save',
  cancelButton: 'Cancel',
  hasChangesIndicator: '✓',
  priorityLevel: 'Priority Level',
  locationChangeConfirm: {
    title: 'Modify Location',
    description: 'Are you sure you want to modify the location? This action will change the task location.',
    confirm: 'Confirm Modification'
  },
  comments: {
    title: 'Comments & Activity',
    placeholder: 'Write a comment...',
    addButton: 'Add Comment'
  },
  activity: {
    created: 'Card created',
    modified: 'Last modified'
  },
  saveConfirm: {
    title: 'Save Changes',
    description: 'Are you sure you want to save these changes?',
    confirm: 'Yes, Save Changes'
  }
};

// Configuration de validation
export const VALIDATION_RULES = {
  title: {
    required: true,
    minLength: 3,
    maxLength: 100
  },
  description: {
    maxLength: 1000
  },
  comment: {
    minLength: 1,
    maxLength: 500
  }
};

// Export par défaut de la configuration complète
export const TASK_FULL_EDIT_CONFIG = {
  priorities: PRIORITY_OPTIONS,
  statuses: STATUS_OPTIONS,
  enhancements: TASK_ENHANCEMENT_BUTTONS,
  fields: EDITABLE_FIELDS,
  theme: TASK_EDIT_THEME,
  messages: MESSAGES,
  validation: VALIDATION_RULES
};

export default TASK_FULL_EDIT_CONFIG;
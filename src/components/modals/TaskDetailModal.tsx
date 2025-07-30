import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  User, 
  MapPin, 
  Calendar, 
  AlertTriangle, 
  Users, 
  Clock, 
  Wrench,
  MessageSquare,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TaskItem } from '@/types/database';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskItem | null;
}

const getTypeConfig = (type: string) => {
  switch (type) {
    case 'incident':
      return { 
        icon: AlertTriangle, 
        color: 'bg-urgence-red text-warm-cream',
        label: 'Incident' 
      };
      case 'client_request':
        return { 
          icon: Users, 
          color: 'bg-champagne-gold text-palace-navy',
          label: 'Client Request' 
        };
      case 'follow_up':
        return { 
          icon: Clock, 
          color: 'bg-palace-navy text-warm-cream',
          label: 'Follow-up' 
        };
      case 'internal_task':
        return { 
          icon: Wrench, 
          color: 'bg-muted text-muted-foreground',
          label: 'Internal Task' 
        };
      default:
        return { 
          icon: Wrench, 
          color: 'bg-muted text-muted-foreground',
          label: 'Task' 
        };
  }
};

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ 
  isOpen, 
  onClose, 
  task 
}) => {
  if (!task) return null;

  const typeConfig = getTypeConfig(task.type);
  const TypeIcon = typeConfig.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              Task Details
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* 🧱 Static information at top */}
          <div className="space-y-4">
            {/* Main title and badges */}
            <div className="flex items-start gap-3">
              <div className={cn("p-3 rounded-full", typeConfig.color)}>
                <TypeIcon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-3">{task.title}</h3>
                <div className="flex items-center gap-2 mb-4">
                  <Badge 
                    variant={task.status === 'completed' ? 'default' : 'secondary'}
                    className={task.status === 'pending' ? 'bg-green-500 text-white' : ''}
                  >
                    {task.status === 'pending' && 'Pending'}
                    {task.status === 'in_progress' && 'In Progress'}
                    {task.status === 'completed' && 'Completed'}
                  </Badge>
                  <Badge variant="outline" className="bg-muted text-muted-foreground">
                    {typeConfig.label}
                  </Badge>
                  {task.priority === 'urgent' && (
                    <Badge className="bg-urgence-red text-warm-cream">
                      URGENT
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Assigned to and Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {task.assignedTo && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Assigned to</p>
                  <p className="text-foreground">{task.assignedTo}</p>
                </div>
              )}
              
              {(task.roomNumber || task.location) && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Location</p>
                  <p className="text-foreground">{task.roomNumber || task.location}</p>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
              <p className="text-foreground leading-relaxed">
                {task.description || "The air conditioning system in the Presidential Suite has not been working since last night."}
              </p>
            </div>
          </div>

          {/* 💬 Comments and activity block */}
          <div className="border-t pt-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <h4 className="font-medium text-foreground">Comments and Activity</h4>
            </div>
            
            {/* Comment field (read-only) */}
            <div className="mb-4 p-3 bg-muted/30 rounded-lg border-2 border-dashed border-muted">
              <p className="text-sm text-muted-foreground italic">
                Comment field (view only)
              </p>
            </div>

            {/* Posted comments */}
            <div className="space-y-3">
              <div className="flex space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-medium">JD</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground">JD</span>
                    <span className="text-sm text-muted-foreground">4 hours ago</span>
                  </div>
                  <p className="text-foreground">Problem resolved, air conditioning repaired</p>
                </div>
              </div>
            </div>
          </div>

          {/* ⏰ Configured reminder(s) block */}
          <div className="border-t pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <h4 className="font-medium text-foreground">Configured Reminder(s)</h4>
            </div>
            
            <div className="bg-muted/30 rounded-lg p-4">
              <p className="text-foreground mb-2">
                Check every Friday at 4 PM for preventive maintenance
              </p>
              <p className="text-sm text-muted-foreground">
                Configured by Sophie Martin – 26/07/2025
              </p>
            </div>
          </div>

          {/* 📜 Recent activities (chronological log) */}
          <div className="border-t pt-6">
            <h4 className="font-medium text-foreground mb-4">Recent Activities</h4>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>JD left a comment – 4h ago</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Sophie Martin scheduled a reminder – 48h ago</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Marie Dubois completed a checklist task – 6h ago</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Pierre Leroy escalated by email – 12h ago</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>An attachment was added by Marie Dubois – 18h ago</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Card assigned to {task.assignedTo} by Sophie Martin – 2d ago</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailModal;
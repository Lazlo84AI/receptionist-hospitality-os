import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
  Bell,
  CheckSquare,
  Paperclip,
  TrendingUp,
  Plus,
  Edit3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReminderModal } from './ReminderModal';
import { ChecklistModal } from './ChecklistModal';
import { MembersModal } from './MembersModal';
import { EscalationModal } from './EscalationModal';
import { AttachmentModal } from './AttachmentModal';
import { ChecklistComponent } from '@/components/ChecklistComponent';
import { TaskItem } from '@/types/database';

interface EnhancedTaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskItem | null;
  onUpdateTask?: (task: TaskItem) => void;
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

const EnhancedTaskDetailModal: React.FC<EnhancedTaskDetailModalProps> = ({ 
  isOpen, 
  onClose, 
  task,
  onUpdateTask
}) => {
  const [newComment, setNewComment] = useState('');
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [isEscalationOpen, setIsEscalationOpen] = useState(false);
  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false);
  const [checklists, setChecklists] = useState<{ id: string; title: string; tasks: { id: string; text: string; completed: boolean }[] }[]>([]);
  const [reminders, setReminders] = useState<{ id: string; title: string; date: string; description: string }[]>([
    {
      id: '1',
      title: 'Preventive maintenance check',
      date: '2025-01-31T16:00',
      description: 'Check every Friday at 4 PM for preventive maintenance'
    }
  ]);
  const [attachments, setAttachments] = useState<{ id: string; name: string; type: string; size: string }[]>([]);

  if (!task) return null;

  const typeConfig = getTypeConfig(task.type);
  const TypeIcon = typeConfig.icon;

  const handleAddComment = () => {
    if (newComment.trim()) {
      // Here you would normally save the comment
      console.log('Adding comment:', newComment);
      setNewComment('');
    }
  };

  const handleAddReminder = () => {
    // The ReminderModal will handle the logic internally
    console.log('Reminder added');
  };

  const handleAddChecklist = (title: string) => {
    const newChecklist = {
      id: Date.now().toString(),
      title,
      tasks: []
    };
    setChecklists([...checklists, newChecklist]);
  };

  const handleAddAttachment = () => {
    // The AttachmentModal will handle the logic internally
    console.log('Attachment added');
  };

  const handleEscalation = () => {
    // The EscalationModal will handle the logic internally
    console.log('Escalation sent');
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
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
            {/* Static Information */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className={cn("p-3 rounded-full", typeConfig.color)}>
                  <TypeIcon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-3">{task.title}</h3>
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <Badge 
                      variant={task.status === 'completed' ? 'default' : 'secondary'}
                      className={task.status === 'pending' ? 'bg-green-500 text-white' : ''}
                    >
                      {task.status === 'pending' && 'To Process'}
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {task.assignedTo && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Assigned to</p>
                    <p className="text-foreground">{task.assignedTo}</p>
                  </div>
                )}
                
                {(task.roomNumber || task.location) && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Location</p>
                    <p className="text-foreground">
                      {task.roomNumber ? `Room ${task.roomNumber}` : task.location}
                    </p>
                  </div>
                )}

                {task.guestName && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Guest</p>
                    <p className="text-foreground">{task.guestName}</p>
                  </div>
                )}
              </div>

              {task.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                  <p className="text-foreground leading-relaxed">{task.description}</p>
                </div>
              )}
            </div>

            {/* Enhancement Actions */}
            <div className="border-t pt-6">
              <h4 className="font-medium text-foreground mb-4">Task Enhancement</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsReminderOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Bell className="h-4 w-4" />
                  Reminder
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsChecklistOpen(true)}
                  className="flex items-center gap-2"
                >
                  <CheckSquare className="h-4 w-4" />
                  Checklist
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMembersOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Members
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEscalationOpen(true)}
                  className="flex items-center gap-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  Escalation
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAttachmentOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Paperclip className="h-4 w-4" />
                  Attachment
                </Button>
              </div>
            </div>

            {/* Checklists */}
            {checklists.length > 0 && (
              <div className="border-t pt-6">
                <h4 className="font-medium text-foreground mb-4">Checklists</h4>
                <div className="space-y-4">
                  {checklists.map((checklist) => (
                    <Card key={checklist.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{checklist.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ChecklistComponent 
                          title={checklist.title}
                          onDelete={() => setChecklists(checklists.filter(c => c.id !== checklist.id))}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Reminders */}
            {reminders.length > 0 && (
              <div className="border-t pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <h4 className="font-medium text-foreground">Configured Reminders</h4>
                </div>
                
                <div className="space-y-3">
                  {reminders.map((reminder) => (
                    <div key={reminder.id} className="bg-muted/30 rounded-lg p-4">
                      <p className="text-foreground mb-2 font-medium">{reminder.title}</p>
                      <p className="text-sm text-muted-foreground mb-1">{reminder.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Scheduled for {new Date(reminder.date).toLocaleString('en-US')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="border-t pt-6">
                <h4 className="font-medium text-foreground mb-4">Attachments</h4>
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{attachment.name}</p>
                        <p className="text-xs text-muted-foreground">{attachment.size}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            <div className="border-t pt-6">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                <h4 className="font-medium text-foreground">Comments & Activity</h4>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      size="sm"
                    >
                      Add Comment
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-medium">JD</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-foreground">Jean Dupont</span>
                        <span className="text-sm text-muted-foreground">4 hours ago</span>
                      </div>
                      <p className="text-foreground">Problem resolved, air conditioning repaired</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="border-t pt-6">
              <h4 className="font-medium text-foreground mb-4">Recent Activity</h4>
              
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
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>An attachment was added by Pierre Leroy – 8h ago</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>Pierre Leroy escalated via email – 12h ago</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Task assigned to {task.assignedTo} by Sophie Martin – 1d ago</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sub-modals */}
      <ReminderModal 
        isOpen={isReminderOpen}
        onClose={() => setIsReminderOpen(false)}
        taskTitle={task.title}
      />
      
      <ChecklistModal 
        isOpen={isChecklistOpen}
        onClose={() => setIsChecklistOpen(false)}
        onAdd={handleAddChecklist}
      />
      
      <MembersModal 
        isOpen={isMembersOpen}
        onClose={() => setIsMembersOpen(false)}
      />
      
      <EscalationModal 
        isOpen={isEscalationOpen}
        onClose={() => setIsEscalationOpen(false)}
      />
      
      <AttachmentModal 
        isOpen={isAttachmentOpen}
        onClose={() => setIsAttachmentOpen(false)}
      />
    </>
  );
};

export default EnhancedTaskDetailModal;
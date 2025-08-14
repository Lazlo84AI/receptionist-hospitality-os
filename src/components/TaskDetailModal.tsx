import { useState } from 'react';
import { X, User, MapPin, MessageSquare, Bell, AlertTriangle, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: {
    id: string | number;
    title: string;
    location: string;
    client: string;
    statut: string;
    priority: string | null;
    assignedTo: string;
    hoursElapsed: number;
    overdue: boolean;
    description?: string;
    type?: string;
  };
}

export function TaskDetailModal({ isOpen, onClose, task }: TaskDetailModalProps) {
  const [newComment, setNewComment] = useState('');
  const [isCommentLoading, setIsCommentLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  if (!task) return null;

  const getStatusColor = (statut: string) => {
    if (statut === 'À traiter') return 'bg-green-500 text-white';
    if (statut === 'En cours') return 'bg-palace-navy text-white';
    return 'bg-muted text-muted-foreground';
  };

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'incident':
        return { icon: AlertTriangle, color: 'bg-urgence-red text-warm-cream', label: 'Incident' };
      case 'client_request':
        return { icon: Users, color: 'bg-champagne-gold text-palace-navy', label: 'Client Request' };
      default:
        return { icon: Users, color: 'bg-champagne-gold text-palace-navy', label: 'Client Request' };
    }
  };

  const typeConfig = getTypeIcon(task.type);
  const TypeIcon = typeConfig.icon;

  const handleAddComment = async () => {
    if (!newComment.trim() || !task || !user?.id || isCommentLoading) return;
    
    setIsCommentLoading(true);
    
    try {
      const { default: addTaskComment } = await import('@/lib/actions/addTaskComment');
      
      // Add to database
      await addTaskComment({
        taskId: task.id.toString(),
        userId: user.id,
        content: newComment.trim()
      });
      
      toast({
        title: "Comment Added",
        description: "Your comment has been posted successfully",
      });
      
      // Clear the input
      setNewComment('');
      
      // Scroll to bottom of comments
      setTimeout(() => {
        const commentsContainer = document.querySelector('[data-comments-container]');
        if (commentsContainer) {
          commentsContainer.scrollTop = commentsContainer.scrollHeight;
        }
      }, 100);
      
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Comment Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCommentLoading(false);
    }
  };

  const handleCommentKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

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
            {/* Type and title */}
            <div className="flex items-start gap-3">
              <div className={cn("p-3 rounded-full", typeConfig.color)}>
                <TypeIcon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <Badge variant="outline" className="mb-3">
                  {typeConfig.label}
                </Badge>
                <h3 className="text-xl font-semibold mb-3">{task.title}</h3>
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
              <p className="text-foreground leading-relaxed">
                {task.description || "The air conditioning system in the Presidential Suite has not been working since last night."}
              </p>
            </div>

            {/* Location and Assigned to */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Location</p>
                  <p className="text-foreground">{task.location}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Assigned to</p>
                  <p className="text-foreground">{task.assignedTo}</p>
                </div>
              </div>
            </div>

            {/* Status */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Status</p>
              <Badge className={getStatusColor(task.statut)}>
                {task.statut}
              </Badge>
            </div>
          </div>

          {/* 💬 Comments and activity block */}
          <div className="border-t pt-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <h4 className="font-medium text-foreground">Comments and Activity</h4>
            </div>
            
            {/* Comment input */}
            <div className="space-y-2 mb-4">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={handleCommentKeyDown}
                className="min-h-[80px]"
                disabled={isCommentLoading}
              />
              <div className="flex justify-end">
                <Button 
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || isCommentLoading}
                  size="sm"
                >
                  {isCommentLoading ? 'Adding...' : 'Add Comment'}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Posted comments */}
            <div className="space-y-3" data-comments-container>
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
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>An attachment was added by Pierre Leroy – 8h ago</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Pierre Leroy escalated by email – 12h ago</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Card assigned to {task.assignedTo} by Sophie Martin – 1d ago</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                <span>Initial checklist added by Sophie Martin – 1d ago</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
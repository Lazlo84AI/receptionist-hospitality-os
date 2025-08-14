import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import addTaskComment from '@/lib/actions/addTaskComment';
import getTaskComments from '@/lib/actions/getTaskComments';
import { format } from 'date-fns';

interface Comment {
  id: string;
  author: {
    initials: string;
    firstName: string;
    lastName: string;
  };
  content: string;
  createdAt: string;
}

interface Activity {
  id: string;
  actor: {
    initials: string;
    firstName: string;
    lastName: string;
  };
  action: string;
  timestamp: string;
  color: string;
}

interface CommentsActivitySectionProps {
  taskId: string;
  taskType: string;
  comments?: Comment[];
  activities?: Activity[];
  onCommentAdded?: (comment: Comment) => void;
  onActivityAdded?: (activity: Activity) => void;
}

export function CommentsActivitySection({ 
  taskId, 
  taskType,
  comments = [], 
  activities = [],
  onCommentAdded,
  onActivityAdded
}: CommentsActivitySectionProps) {
  const [newComment, setNewComment] = useState('');
  const [isCommentLoading, setIsCommentLoading] = useState(false);
  const [localComments, setLocalComments] = useState<Comment[]>(comments);
  const [localActivities, setLocalActivities] = useState<Activity[]>(activities);
  const commentsContainerRef = useRef<HTMLDivElement>(null);

  // Update local state when props change
  useEffect(() => {
    setLocalComments(comments);
  }, [comments]);

  useEffect(() => {
    setLocalActivities(activities);
  }, [activities]);

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || isCommentLoading) return;

    const tempComment: Comment = {
      id: `temp-${Date.now()}`,
      author: {
        initials: 'JD',
        firstName: 'Jean',
        lastName: 'Dupont'
      },
      content: newComment.trim(),
      createdAt: new Date().toISOString()
    };

    // Optimistic update
    setLocalComments(prev => [tempComment, ...prev]);
    setNewComment('');
    setIsCommentLoading(true);

    try {
      // Call the API
      const result = await addTaskComment({
        task_id: taskId,
        content: newComment.trim()
      });

      // Replace temp comment with real one
      const realComment: Comment = {
        id: result.id,
        author: tempComment.author,
        content: result.content,
        createdAt: result.created_at
      };

      setLocalComments(prev => prev.map(c => 
        c.id === tempComment.id ? realComment : c
      ));

      // Add activity
      const newActivity: Activity = {
        id: `activity-${Date.now()}`,
        actor: tempComment.author,
        action: 'left a comment',
        timestamp: realComment.createdAt,
        color: 'bg-blue-500'
      };

      setLocalActivities(prev => [newActivity, ...prev]);

      onCommentAdded?.(realComment);
      onActivityAdded?.(newActivity);

      toast.success('Comment added');

      // Refetch comments to ensure synchronization
      try {
        await getTaskComments();
      } catch (fetchError) {
        console.warn('Failed to refetch comments:', fetchError);
      }

    } catch (error) {
      console.error('Error adding comment:', error);
      
      // Remove failed comment from optimistic update
      setLocalComments(prev => prev.filter(c => c.id !== tempComment.id));
      
      toast.error('Failed to add comment');
    } finally {
      setIsCommentLoading(false);
    }
  };

  const handleCommentKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleAddComment();
    }
  };

  return (
    <div className="border-t pt-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5 text-muted-foreground" />
        <h4 className="font-medium text-foreground">Comments & Activity</h4>
      </div>
      
      {/* Comment input */}
      <div className="mb-4">
        <div className="flex flex-col md:flex-row gap-2">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={handleCommentKeyDown}
            className="min-h-[80px] flex-1"
            disabled={isCommentLoading}
            aria-label="Add a comment"
          />
          <Button 
            onClick={handleAddComment}
            disabled={!newComment.trim() || isCommentLoading}
            className="md:self-start md:mt-0"
            aria-label="Add Comment"
          >
            {isCommentLoading ? 'Adding...' : 'Add Comment'}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Posted comments */}
      <div className="space-y-3 mt-4" ref={commentsContainerRef}>
        {localComments.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No comments yet</p>
        ) : (
          localComments.map((comment) => (
            <div key={comment.id} className="flex space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-medium">{comment.author.initials}</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-foreground">
                    {comment.author.firstName} {comment.author.lastName}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {getRelativeTime(comment.createdAt)}
                  </span>
                </div>
                <p className="text-foreground">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Recent Activity */}
      {localActivities.length > 0 && (
        <div className="border-t pt-6 mt-6">
          <h4 className="font-medium text-foreground mb-4">Recent Activity</h4>
          
          <div className="space-y-3 text-sm">
            {localActivities.map((activity) => (
              <div key={activity.id} className="flex items-center gap-2 text-muted-foreground">
                <div className={`w-2 h-2 ${activity.color} rounded-full`}></div>
                <span>
                  {activity.actor.initials} {activity.action} – {getRelativeTime(activity.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
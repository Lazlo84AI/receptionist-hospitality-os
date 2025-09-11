import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { CardFaceModal } from '@/components/shared/CardFaceModal';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useFollowUps } from '@/hooks/useSupabaseData';
import { FollowUp } from '@/types/database';
import { formatTimeElapsed } from '@/utils/timeUtils';
import EnhancedTaskDetailModal from '@/components/modals/EnhancedTaskDetailModal';
import { TaskItem } from '@/types/database';



// Transform FollowUp to TaskItem format for EnhancedTaskDetailModal
const transformFollowUpToTask = (followUp: FollowUp): TaskItem => ({
  id: followUp.id,
  title: followUp.title,
  description: followUp.notes,
  type: 'follow_up',
  status: followUp.status,
  priority: followUp.priority,
  assignedTo: followUp.assigned_to,
  roomNumber: null,
  location: null,
  guestName: followUp.recipient,
  created_at: followUp.created_at,
  updated_at: followUp.updated_at,
  due_date: followUp.due_date,
  user_id: followUp.user_id,
  assigned_to: followUp.assigned_to
});

// Transform database FollowUp to UI format for TaskCard
const transformFollowUpForCard = (followUp: FollowUp) => ({
  id: followUp.id,
  title: followUp.title,
  location: followUp.recipient || 'No recipient', // Client/recipient comme location
  clientName: undefined, // Pas de double affichage
  status: followUp.status === 'pending' ? 'To Process' as const : 
          followUp.status === 'in_progress' ? 'In Progress' as const : 
          followUp.status === 'completed' ? 'Completed' as const : 'Cancelled' as const,
  priority: followUp.priority === 'urgent' ? 'URGENCE' as const : 'NORMAL' as const,
  assignedTo: followUp.assigned_to || 'Unassigned',
  timeElapsed: formatTimeElapsed(followUp.created_at),
  originalFollowUp: followUp
});

export function FollowUpsCard() {
  const { followUps: rawFollowUps, loading, error, refetch } = useFollowUps();
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Transform raw follow-ups to UI format
  const followUps = rawFollowUps.map(transformFollowUpForCard);

  // Navigation configuration
  const itemsPerPage = 2; // Afficher 2 cartes à la fois
  const maxIndex = Math.max(0, followUps.length - itemsPerPage);
  const canGoLeft = currentIndex > 0;
  const canGoRight = currentIndex < maxIndex;
  
  // Get visible items for current page
  const visibleFollowUps = followUps.slice(currentIndex, currentIndex + itemsPerPage);
  
  const handleTaskClick = (followUpItem: ReturnType<typeof transformFollowUpForCard>) => {
    // Convert the follow-up item to TaskItem format for the modal
    const taskItem = transformFollowUpToTask(followUpItem.originalFollowUp);
    setSelectedTask(taskItem);
    setIsModalOpen(true);
  };

  const handleTaskUpdate = (updatedTask: TaskItem) => {
    // Refetch data when task is updated
    refetch();
  };

  // Navigation functions
  const goLeft = () => {
    setCurrentIndex(Math.max(currentIndex - 1, 0));
  };

  const goRight = () => {
    setCurrentIndex(Math.min(currentIndex + 1, maxIndex));
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg border shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Follow-ups and Tasks</h2>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-lg border shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Follow-ups and Tasks</h2>
        </div>
        <div className="text-center text-muted-foreground">
          Error loading follow-ups: {error.message}
        </div>
      </div>
    );
  }

  // Calculate counts for ALL follow-ups (not just visible ones)
  const toProcessCount = followUps.filter(f => f.status === 'To Process').length;
  const inProgressCount = followUps.filter(f => f.status === 'In Progress').length;
  const completedCount = followUps.filter(f => f.status === 'Completed').length;

  return (
    <>
      <div className="luxury-card p-6 col-span-full lg:col-span-2">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-xl font-playfair font-semibold text-hotel-navy">
                Follow-ups and Tasks
              </h2>
              <p className="text-sm text-hotel-navy/60">
                Reminders and personal tasks
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-hotel-navy/60 font-medium">
              {followUps.length} requests
            </span>
            {/* Navigation Chevrons */}
            <div className="flex items-center space-x-1">
              {canGoLeft && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goLeft}
                  className="h-8 w-8 text-hotel-navy/60 hover:text-hotel-navy"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              {canGoRight && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goRight}
                  className="h-8 w-8 text-hotel-navy/60 hover:text-hotel-navy"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {followUps.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No follow-ups scheduled</p>
            <p className="text-xs mt-1">All caught up!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {visibleFollowUps.map((followUp) => (
              <CardFaceModal
                key={followUp.id}
                id={followUp.id}
                title={followUp.title}
                location={followUp.location}
                clientName={undefined} // Pas de nom client pour les follow-ups
                status={followUp.status}
                priority={followUp.priority}
                assignedTo={followUp.assignedTo}
                timeElapsed={followUp.timeElapsed}
                onClick={() => handleTaskClick(followUp)}
              />
            ))}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-hotel-navy/20">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <span className="text-hotel-navy/60">Today's Status:</span>
              {/* Pagination indicator */}
              {followUps.length > itemsPerPage && (
                <div className="flex items-center space-x-1 text-xs text-hotel-navy/60">
                  <span>Page {Math.floor(currentIndex / itemsPerPage) + 1} of {Math.ceil(followUps.length / itemsPerPage)}</span>
                </div>
              )}
            </div>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 rounded-full bg-green-600" />
                <span className="text-xs">{toProcessCount} to process</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 rounded-full bg-gray-300" />
                <span className="text-xs">{inProgressCount} in progress</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 rounded-full bg-white border border-gray-200" />
                <span className="text-xs">{completedCount} completed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Task Detail Modal */}
      <EnhancedTaskDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        task={selectedTask}
        onUpdateTask={handleTaskUpdate}
      />
    </>
  );
}
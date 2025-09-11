import { Heart } from 'lucide-react';
import { CardFaceModal } from '@/components/shared/CardFaceModal';
import EnhancedTaskDetailModal from '@/components/modals/EnhancedTaskDetailModal';
import { useState } from 'react';
import { ReminderModal } from './modals/ReminderModal';
import { useTasks, useProfiles } from '@/hooks/useSupabaseData';
import { TaskItem } from '@/types/database';
import { formatTimeElapsed } from '@/utils/timeUtils';

// Transform database TaskItem (client request) to UI format
const transformClientRequest = (request: TaskItem) => ({
  id: request.id,
  clientName: request.guestName || 'Unknown Guest',
  room: request.roomNumber || 'Unknown Room',
  request: request.title,
  occasion: request.description || '',
  status: request.status === 'pending' ? 'To Process' : 
          request.status === 'in_progress' ? 'In Progress' : 
          request.status === 'completed' ? 'Completed' : 'Cancelled',
  gouvernante: request.assignedTo || 'Unassigned',
  avatar: request.assignedTo ? request.assignedTo.split(' ').map(n => n[0]).join('') : 'UN',
  timeElapsed: formatTimeElapsed(request.created_at),
  priority: request.priority === 'urgent' ? 'URGENCE' : 'NORMAL',
  created_at: request.created_at,
  updated_at: request.updated_at
});

export function ClientRequestsCard() {
  const { tasks, loading, error, refetch } = useTasks();
  const { profiles } = useProfiles();
  
  // Filter client requests from all tasks
  const clientRequests = tasks
    .filter(task => task.type === 'client_request')
    .map(transformClientRequest); // Show all client requests - no hardcoded limit

  // State pour la modale - EXACTEMENT COMME INCIDENTS CARD
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  
  // Handler de click - EXACTEMENT COMME INCIDENTS CARD
  const handleClientRequestClick = (clientRequestItem: ReturnType<typeof transformClientRequest>) => {
    // Retrouver la TaskItem originale
    const originalTask = tasks.find(task => task.id === clientRequestItem.id);
    if (originalTask) {
      setSelectedTask(originalTask);
      setIsTaskDetailOpen(true);
    }
  };

  // États pour l'ancienne modale (à supprimer plus tard)
  const [showReminderModal, setShowReminderModal] = useState(false);

  if (loading) {
    return (
      <div className="bg-card rounded-lg border shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Client Requests</h2>
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
          <h2 className="text-xl font-semibold text-foreground">Client Requests</h2>
        </div>
        <div className="text-center text-muted-foreground">
          Error loading client requests: {error}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="luxury-card p-6 col-span-full lg:col-span-2">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Heart className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <h2 className="text-xl font-playfair font-semibold text-hotel-navy">
                Client Requests
              </h2>
              <p className="text-sm text-hotel-navy/60">
                Special occasions & preparations
              </p>
            </div>
          </div>
          <span className="text-sm text-hotel-navy/60 font-medium">
            {clientRequests.length} requests
          </span>
        </div>

        {clientRequests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No client requests found
          </div>
        ) : (
          <div className="space-y-4">
            {clientRequests.map((clientRequest) => (
              <CardFaceModal
                key={clientRequest.id}
                id={clientRequest.id}
                title={clientRequest.clientName}
                location={clientRequest.room}
                clientName={undefined} // Pas de double affichage du nom client
                status={clientRequest.status as any}
                priority={clientRequest.priority as any}
                assignedTo={clientRequest.gouvernante}
                timeElapsed={clientRequest.timeElapsed}
                onClick={() => handleClientRequestClick(clientRequest)}
              />
            ))}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-hotel-navy/20">
          <div className="flex items-center justify-between text-sm">
            <span className="text-hotel-navy/60">Today's Status:</span>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 rounded-full bg-hotel-gold-dark" />
                <span className="text-xs">{clientRequests.filter(r => r.status === 'To Process').length} to process</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 rounded-full bg-gray-300" />
                <span className="text-xs">{clientRequests.filter(r => r.status === 'In Progress').length} in progress</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 rounded-full bg-white border border-gray-200" />
                <span className="text-xs">{clientRequests.filter(r => r.status === 'Completed').length} completed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Task Detail Modal - EXACTEMENT COMME INCIDENTS CARD */}
      <EnhancedTaskDetailModal
        task={selectedTask}
        isOpen={isTaskDetailOpen}
        onClose={() => {
          setIsTaskDetailOpen(false);
          setSelectedTask(null);
        }}
        onUpdateTask={(updatedTask) => {
          refetch();
        }}
      />

      {/* Reminder Modal */}
      <ReminderModal
        isOpen={showReminderModal}
        onClose={() => setShowReminderModal(false)}
      />
    </>
  );
}
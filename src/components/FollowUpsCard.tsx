import { AlertCircle, Building2, CreditCard, Clock, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { TaskDetailModal } from './TaskDetailModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useFollowUps } from '@/hooks/useSupabaseData';
import { FollowUp } from '@/types/database';

// Helper function to calculate hours elapsed
const getHoursElapsed = (createdAt: string): number => {
  const now = new Date();
  const created = new Date(createdAt);
  return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
};

// Helper function to determine if a task is overdue
const isOverdue = (createdAt: string, dueDate?: string | null): boolean => {
  if (dueDate) {
    return new Date() > new Date(dueDate);
  }
  // Consider tasks overdue if they're over 24 hours old and not completed
  const hoursElapsed = getHoursElapsed(createdAt);
  return hoursElapsed > 24;
};

// Transform database FollowUp to UI format
const transformFollowUp = (followUp: FollowUp) => ({
  id: followUp.id,
  title: followUp.title,
  location: '', // This could be extracted from notes or a separate field
  client: followUp.recipient,
  statut: followUp.status === 'pending' ? 'To Process' : 
          followUp.status === 'in_progress' ? 'In Progress' : 
          followUp.status === 'completed' ? 'Completed' : 'Cancelled',
  priority: followUp.priority === 'urgent' ? 'urgence' : null,
  assignedTo: followUp.assigned_to || 'Unassigned',
  hoursElapsed: getHoursElapsed(followUp.created_at),
  overdue: isOverdue(followUp.created_at, followUp.due_date),
  description: followUp.notes,
  type: 'Relance',
  dueDate: followUp.due_date
});

export function FollowUpsCard() {
  const { followUps: rawFollowUps, loading, error } = useFollowUps();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedTask, setSelectedTask] = useState<ReturnType<typeof transformFollowUp> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Transform raw follow-ups to UI format
  const followUps = rawFollowUps.map(transformFollowUp);
  
  const itemsPerPage = 2;
  const maxIndex = Math.max(0, followUps.length - itemsPerPage);

  const getStatusColor = (statut: string) => {
    if (statut === 'To Process') return 'bg-green-500 text-white';
    if (statut === 'In Progress') return 'bg-palace-navy text-white';
    return 'bg-muted text-soft-pewter border-border';
  };

  const formatElapsedTime = (hours: number) => {
    if (hours < 24) {
      return `${hours}h ago`;
    } else {
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    }
  };

  const overdueCount = followUps.filter(item => item.overdue).length;
  const visibleItems = followUps.slice(currentIndex, currentIndex + itemsPerPage);

  const nextSlide = () => {
    setCurrentIndex(Math.min(currentIndex + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex(Math.max(currentIndex - 1, 0));
  };

  const handleTaskClick = (task: ReturnType<typeof transformFollowUp>) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  // Loading state
  if (loading) {
    return (
      <div className="luxury-card p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-palace-navy mx-auto mb-4"></div>
            <p className="text-soft-pewter">Loading follow-ups...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="luxury-card p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <p className="text-red-500">Error loading follow-ups: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="luxury-card p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <AlertCircle className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <h2 className="text-xl font-playfair font-semibold text-palace-navy">
              Follow-ups and Tasks
            </h2>
            <p className="text-sm text-soft-pewter">
              Critical deadline tracking
            </p>
          </div>
        </div>
        <span className="text-sm text-soft-pewter font-medium">
          {overdueCount} overdue
        </span>
      </div>

      {/* Carousel Navigation */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={prevSlide}
          disabled={currentIndex === 0}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <span className="text-sm text-soft-pewter">
          {currentIndex + 1}-{Math.min(currentIndex + itemsPerPage, followUps.length)} of {followUps.length}
        </span>
        
        <Button
          variant="outline"
          size="sm"
          onClick={nextSlide}
          disabled={currentIndex >= maxIndex}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Cards with new UI structure */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {visibleItems.map((item) => (
          <div
            key={item.id}
            className="p-6 rounded-lg border bg-background hover-luxury transition-all duration-300 cursor-pointer"
          >
            {/* Ligne 1: Titre + icône œil */}
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-bold text-foreground text-base flex-1">
                {item.title}
              </h3>
              <Eye 
                className="h-4 w-4 text-soft-pewter hover:text-palace-navy cursor-pointer" 
                onClick={() => handleTaskClick(item)}
              />
            </div>

            {/* Ligne 2: Informations de localisation */}
            <div className="mb-3">
              <span className="text-sm font-medium text-foreground">{item.location}</span>
              {item.client && <span className="text-sm text-soft-pewter ml-2">{item.client}</span>}
            </div>

            {/* Ligne 3: Badges de statut et priorité */}
            <div className="flex items-center space-x-2 mb-4">
              <Badge className={getStatusColor(item.statut)}>
                {item.statut}
              </Badge>
              {item.priority === 'urgence' && (
                <Badge className="bg-urgence-red text-white">
                  URGENCE
                </Badge>
              )}
            </div>

            {/* Dernière ligne: Assignation à gauche, horloge à droite */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-soft-pewter">Assigned to: </span>
                <span className="text-sm font-medium text-palace-navy">
                  {item.assignedTo}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className={cn(
                  "h-4 w-4",
                  item.overdue ? "text-urgence-red" : "text-soft-pewter"
                )} />
                <span className={cn(
                  "text-sm font-medium",
                  item.overdue ? "text-urgence-red" : "text-soft-pewter"
                )}>
                  {formatElapsedTime(item.hoursElapsed)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-border/20">
        <div className="flex flex-col items-center text-sm space-y-3">
          <span className="text-soft-pewter">Today's Status:</span>
          <div className="flex space-x-4">
            <div className="flex items-center space-x-1">
              <div className="h-2 w-2 rounded-full bg-urgence-red" />
              <span className="text-xs">{overdueCount} overdue</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-xs">{followUps.filter(item => item.statut === 'To Process').length} to process</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="h-2 w-2 rounded-full bg-palace-navy" />
              <span className="text-xs">{followUps.filter(item => item.statut === 'In Progress').length} in progress</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de détails */}
      {selectedTask && (
        <TaskDetailModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTask(null);
          }}
          task={selectedTask}
        />
      )}
    </div>
  );
}
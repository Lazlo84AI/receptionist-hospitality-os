import { AlertCircle, Building2, CreditCard, Clock, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { TaskDetailModal } from './TaskDetailModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useUsers } from '@/hooks/useUsers';

// Mock data removed - now using real Supabase data

export function FollowUpsCard() {
  const { tasks: allTasks, loading, error } = useTasks();
  const { users } = useUsers();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const itemsPerPage = 2;
  
  // Filter and format tasks as follow-ups
  const followUps = allTasks.map(task => {
    const hoursElapsed = Math.floor((new Date().getTime() - new Date(task.created_at).getTime()) / (1000 * 60 * 60));
    const isOverdue = hoursElapsed > 24 && task.status === 'pending';
    
    return {
      id: task.id,
      title: task.title,
      location: task.location || 'Non spécifié',
      client: '',
      statut: task.status === 'pending' ? 'À traiter' : 'En cours',
      priority: task.priority === 'critical' ? 'urgence' : null,
      assignedTo: `${task.task_type === 'maintenance' ? 'Service Provider' : task.task_type === 'client_request' ? 'Reception' : 'Housekeeping'} : ${users.find(u => u.id === task.assigned_to)?.full_name || task.assigned_to || 'Unassigned'}`,
      hoursElapsed,
      overdue: isOverdue
    };
  });
  
  const maxIndex = Math.max(0, followUps.length - itemsPerPage);

  const getStatusColor = (statut: string) => {
    if (statut === 'À traiter') return 'bg-green-500 text-white';
    if (statut === 'En cours') return 'bg-palace-navy text-white';
    return 'bg-muted text-soft-pewter border-border';
  };

  const formatElapsedTime = (hours: number) => {
    if (hours < 24) {
      return `Depuis ${hours}h`;
    } else {
      const days = Math.floor(hours / 24);
      return `Depuis ${days}j`;
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

  const handleTaskClick = (task: any) => {
    // Find the original task from allTasks to get the full data
    const originalTask = allTasks.find(t => t.id === task.id);
    setSelectedTask({
      ...task,
      description: originalTask?.description || 'Detailed description of the task to be performed.',
      type: 'Follow-up'
    });
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="luxury-card p-8">
        <div className="flex items-center justify-center h-48">
          <div className="text-soft-pewter">Loading follow-ups...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="luxury-card p-8">
        <div className="flex items-center justify-center h-48">
          <div className="text-red-500">Erreur: {error}</div>
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
              Follow-ups and tasks to do
            </h2>
            <p className="text-sm text-soft-pewter">
              Suivi des échéances critiques
            </p>
          </div>
        </div>
        <span className="text-sm text-soft-pewter font-medium">
          {overdueCount} en retard
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
                <span className="text-sm text-soft-pewter">Assigné à : </span>
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
          <span className="text-soft-pewter">Statuts aujourd'hui:</span>
          <div className="flex space-x-4">
            <div className="flex items-center space-x-1">
              <div className="h-2 w-2 rounded-full bg-urgence-red" />
              <span className="text-xs">{overdueCount} en retard</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-xs">{followUps.filter(item => item.statut === 'À traiter').length} à traiter</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="h-2 w-2 rounded-full bg-palace-navy" />
              <span className="text-xs">{followUps.filter(item => item.statut === 'En cours').length} en cours</span>
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
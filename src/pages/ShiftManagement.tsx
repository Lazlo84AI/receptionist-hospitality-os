import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { VoiceCommandButton } from '@/components/VoiceCommandButton';
import EnhancedTaskDetailModal from '@/components/modals/EnhancedTaskDetailModal';
import { CardFaceModal } from '@/components/shared/CardFaceModal';
import { ShiftCloseModal } from '@/components/modals/ShiftCloseModal';
import ShiftStartModal from '@/components/modals/ShiftStartModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  PlayCircle, 
  Target, 
  StopCircle,
  AlertTriangle,
  Users,
  Clock,
  Wrench,
  GripVertical,
  Heart,
  UserCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useTasks } from '@/hooks/useSupabaseData';
import { formatTimeElapsed } from '@/utils/timeUtils';
import { supabase } from '@/integrations/supabase/client';
import { sendTaskMovedEvent } from '@/lib/webhookService';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskItem } from '@/types/database';

const getTypeConfig = (type: string) => {
  switch (type) {
    case 'incident':
      return { 
        icon: AlertTriangle, 
        color: 'bg-red-100 text-red-600',
        label: 'Incident' 
      };
    case 'client_request':
      return { 
        icon: Heart, 
        color: 'bg-green-100 text-green-600',
        label: 'Client Request' 
      };
    case 'follow_up':
      return { 
        icon: Clock, 
        color: 'bg-gray-600 text-white',
        label: 'Follow-up' 
      };
    case 'internal_task':
    case 'personal_task':
      return { 
        icon: UserCircle, 
        color: 'bg-yellow-100 text-yellow-600',
        label: 'Personal Task' 
      };
    default:
      return { 
        icon: UserCircle, 
        color: 'bg-yellow-100 text-yellow-600',
        label: 'Task' 
      };
  }
};

// Transform TaskItem to CardFaceModal format
const transformTaskForCard = (task: TaskItem) => {
  const getStatus = (status: string) => {
    switch (status) {
      case 'pending': return 'To Process' as const;
      case 'in_progress': return 'In Progress' as const;
      case 'completed': return 'Completed' as const;
      default: return 'Cancelled' as const;
    }
  };

  return {
    id: task.id,
    title: task.title,
    location: task.roomNumber ? `Room ${task.roomNumber}` : (task.location || 'No location'),
    clientName: task.guestName,
    status: getStatus(task.status),
    priority: task.priority === 'urgent' ? 'URGENCE' as const : 'NORMAL' as const,
    assignedTo: task.assignedTo || 'Unassigned',
    timeElapsed: formatTimeElapsed(task.created_at)
  };
};

const SortableCardFace = ({ 
  task, 
  onCardClick 
}: { 
  task: TaskItem; 
  onCardClick: (task: TaskItem) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const transformedTask = transformTaskForCard(task);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative transition-all duration-300 w-full",
        isDragging ? "opacity-30 scale-105 rotate-2 z-50" : "opacity-100"
      )}
    >
      {/* Zone de drag alignée horizontalement avec les badges status/priorité - fond blanc simple */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-20 right-3 w-8 h-8 cursor-grab active:cursor-grabbing z-10 flex items-center justify-center bg-white hover:bg-gray-50 transition-all duration-200"
      >
        <GripVertical className="h-5 w-5 text-gray-600" />
      </div>
      
      <CardFaceModal
        id={transformedTask.id}
        title={transformedTask.title}
        location={transformedTask.location}
        clientName={transformedTask.clientName}
        status={transformedTask.status}
        priority={transformedTask.priority}
        assignedTo={transformedTask.assignedTo}
        timeElapsed={transformedTask.timeElapsed}
        onClick={() => onCardClick(task)}
      />
    </div>
  );
};

const KanbanColumn = ({ 
  title, 
  tasks, 
  status, 
  onStatusChange,
  onCardClick,
  draggedTask,
  draggedFromColumn
}: { 
  title: string; 
  tasks: TaskItem[]; 
  status: string;
  onStatusChange: (taskId: string, newStatus: string) => void;
  onCardClick: (task: TaskItem) => void;
  draggedTask: TaskItem | null;
  draggedFromColumn: string | null;
}) => {
  const filteredTasks = tasks.filter(task => task.status === status);
  const isDraggedFromThisColumn = draggedFromColumn === status;
  const isTargetColumn = draggedTask && draggedTask.status !== status;

  const { setNodeRef, isOver } = useDroppable({
    id: `column-${status}`,
  });

  return (
    <div className="flex-1">
      <div className="bg-muted/50 rounded-lg p-4 h-full min-h-[600px]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">{title}</h3>
          <Badge variant="secondary" className="text-sm">
            {filteredTasks.length}
          </Badge>
        </div>
        
        {/* Zone de drop avec feedback visuel intelligent */}
        <div
          ref={setNodeRef}
          className={cn(
            "min-h-[520px] rounded-lg transition-all duration-300 p-4 border-2",
            // Ne colorer que si c'est la colonne cible ET qu'on survole
            isOver && isTargetColumn
              ? "bg-green-50 border-green-300 border-dashed shadow-inner" 
              : "bg-transparent border-transparent hover:border-gray-200"
          )}
        >
          {/* Plus de SortableContext local - utilisé globalement */}
          <div className="space-y-5 max-h-[calc(100vh-300px)] overflow-y-auto">
            {filteredTasks.map((task, index) => {
              const isDraggedCard = draggedTask && task.id === draggedTask.id;
              
              return (
                <div key={task.id} className={cn(
                  "transition-all duration-200",
                  // Écartement uniquement dans la colonne cible pendant le hover
                  isOver && isTargetColumn && "transform translate-y-1",
                  // Masquer la carte en cours de drag tout en gardant l'espace (placeholder)
                  isDraggedCard && isDraggedFromThisColumn && "opacity-30"
                )}>
                  {isDraggedCard && isDraggedFromThisColumn ? (
                    // Placeholder : garde l'espace mais invisible
                    <div className="w-full h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-sm">
                      Drop elsewhere to move
                    </div>
                  ) : (
                    <SortableCardFace 
                      task={task} 
                      onCardClick={onCardClick}
                    />
                  )}
                </div>
              );
            })}
            
            {filteredTasks.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <div className={cn(
                  "border-2 border-dashed rounded-lg p-8 transition-all duration-300",
                  isOver && isTargetColumn ? "border-green-400 bg-green-50" : "border-muted"
                )}>
                  <p className="text-sm">No tasks</p>
                  <p className="text-xs mt-1">Drag a card here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ShiftManagement = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { tasks, loading, error, refetch } = useTasks();
  const [shiftStatus, setShiftStatus] = useState<'not_started' | 'active' | 'closed'>('not_started'); // CHANGÉ POUR TESTER BEGIN SHIFT
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [isShiftCloseOpen, setIsShiftCloseOpen] = useState(false);
  const [isShiftStartOpen, setIsShiftStartOpen] = useState(false);
  const [shiftActive, setShiftActive] = useState(false);
  const [draggedTask, setDraggedTask] = useState<TaskItem | null>(null);
  const [draggedFromColumn, setDraggedFromColumn] = useState<string | null>(null);
  const { toast } = useToast();

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleCardClick = (task: TaskItem) => {
    setSelectedTask(task);
    setIsTaskDetailOpen(true);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    if (task) {
      setDraggedTask(task);
      setDraggedFromColumn(task.status); // Mémoriser la colonne d'origine
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedTask(null);
    setDraggedFromColumn(null);
    
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    
    const activeTask = tasks.find(t => t.id === activeId);
    if (!activeTask) return;

    let newStatus: string;
    let targetPosition: number = -1;

    // Determine the target status and position
    if (overId.startsWith('column-')) {
      // Dropped on column header/empty area - put at end
      newStatus = overId.replace('column-', '');
      const columnTasks = tasks.filter(t => t.status === newStatus);
      targetPosition = columnTasks.length;
    } else {
      // Dropped on/near another task
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) {
        newStatus = overTask.status;
        const columnTasks = tasks
          .filter(t => t.status === newStatus)
          .sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
        targetPosition = columnTasks.findIndex(t => t.id === overId);
      } else {
        return;
      }
    }

    // If no status change and same position, do nothing
    if (activeTask.status === newStatus) {
      const activeColumnTasks = tasks.filter(t => t.status === activeTask.status);
      const currentPosition = activeColumnTasks.findIndex(t => t.id === activeId);
      if (targetPosition === currentPosition) {
        return;
      }
    }

    try {
      // Get all tasks in the target column (excluding the dragged task if same column)
      const columnTasks = tasks
        .filter(t => t.status === newStatus && t.id !== activeId)
        .sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
      
      // Create array with the dragged task inserted at target position
      const newTaskArray = [...columnTasks];
      newTaskArray.splice(targetPosition, 0, activeTask);
      
      // Calculate new timestamps based on positions (espacés d'1 seconde)
      const baseTime = Date.now();
      const updates = newTaskArray.map((task, index) => ({
        id: task.id,
        newTimestamp: new Date(baseTime + (index * 1000)).toISOString()
      }));
      
      // If status changed, update the dragged task's status first
      if (activeTask.status !== newStatus) {
        // Get current user for audit trail
        const { data: { user } } = await supabase.auth.getUser();
        
        const statusUpdate = await supabase
          .from('task')
          .update({ 
            status: newStatus,
            updated_by: user?.id  // Explicit user ID for audit trail
          })
          .eq('id', activeId);
        
        if (statusUpdate.error) {
          throw statusUpdate.error;
        }
      }
      
      // Update positions for all tasks in the column
      for (const update of updates) {
        const positionUpdate = await supabase
          .from('task')
          .update({ updated_at: update.newTimestamp })
          .eq('id', update.id);
        
        if (positionUpdate.error) {
          throw positionUpdate.error;
        }
      }

      // Refresh data
      await refetch();

      // Send webhook in background
      sendTaskMovedEvent(activeId, activeTask.status, newStatus, activeTask).then(result => {
        if (!result.success) {
          console.warn('Webhook failed but task was updated successfully:', result.error);
        }
      }).catch(error => {
        console.warn('Webhook error (task was still updated):', error);
      });
      
      toast({
        title: "Success",
        description: `Task moved to ${newStatus.replace('_', ' ')} at position ${targetPosition + 1}`,
        variant: "default",
      });
      
    } catch (error) {
      console.error('Error updating task:', error);
      refetch();
      toast({
        title: "Error", 
        description: "Failed to move task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      
      const oldStatus = task.status;

      // Send webhook event for task status change
      const { sendTaskStatusChangedEvent } = await import('@/lib/webhookService');
      const result = await sendTaskStatusChangedEvent(taskId, oldStatus, newStatus, task);

      if (result.success) {
        // Refetch data after successful webhook
        refetch();
        toast({
          title: "Success",
          description: "Status updated successfully",
          variant: "default",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update status. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShiftAction = (action: 'start' | 'improve' | 'close') => {
    switch (action) {
      case 'start':
        setIsShiftStartOpen(true);
        break;
      case 'improve':
        window.location.href = '/connaissances';
        break;
      case 'close':
        setIsShiftCloseOpen(true);
        break;
    }
  };

  const handleShiftStarted = async () => {
    // Send webhook event for shift started
    const { sendShiftStartedEvent } = await import('@/lib/webhookService');
    const result = await sendShiftStartedEvent({
      timestamp: new Date().toISOString(),
      status: 'active',
      tasks_count: tasks.length,
    });

    if (result.success) {
      setShiftStatus('active');
      setIsShiftStartOpen(false); // Close the modal
      toast({
        title: "Shift Started",
        description: "Your shift has been marked as active",
        variant: "default",
      });
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to start shift. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header onMenuToggle={() => setSidebarOpen(true)} />
      
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main Content */}
      <main className="p-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-playfair font-bold text-foreground mb-2">
              Shift Management
            </h1>
            <p className="text-muted-foreground">
              Manage your tasks and activities during your shift
            </p>
          </div>

          {/* Shift Action Buttons */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <Button
              onClick={() => handleShiftAction('start')}
              disabled={shiftStatus === 'active'}
              className="h-12 text-base"
              variant={shiftStatus === 'active' ? 'secondary' : 'default'}
            >
              <PlayCircle className="h-5 w-5 mr-2" />
              {shiftStatus === 'active' ? 'Active Shift' : 'Start Shift'}
            </Button>
            
            <Button
              onClick={() => handleShiftAction('improve')}
              variant="outline"
              className="h-12 text-base"
            >
              <Target className="h-5 w-5 mr-2" />
              Work Improvement
            </Button>
            
            <Button
              onClick={() => handleShiftAction('close')}
              disabled={shiftStatus !== 'active'}
              className="h-12 text-base end-shift-button"
            >
              <StopCircle className="h-5 w-5 mr-2" />
              End Shift
            </Button>
          </div>

          {/* Kanban Board avec SortableContext global */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {/* Global SortableContext pour toutes les tâches */}
            <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
              <div className="grid grid-cols-3 gap-6">
                <KanbanColumn
                  title="To Process"
                  tasks={tasks}
                  status="pending"
                  onStatusChange={handleStatusChange}
                  onCardClick={handleCardClick}
                  draggedTask={draggedTask}
                  draggedFromColumn={draggedFromColumn}
                />
                
                <KanbanColumn
                  title="In Progress"
                  tasks={tasks}
                  status="in_progress"
                  onStatusChange={handleStatusChange}
                  onCardClick={handleCardClick}
                  draggedTask={draggedTask}
                  draggedFromColumn={draggedFromColumn}
                />
                
                <KanbanColumn
                  title="Resolved"
                  tasks={tasks}
                  status="completed"
                  onStatusChange={handleStatusChange}
                  onCardClick={handleCardClick}
                  draggedTask={draggedTask}
                  draggedFromColumn={draggedFromColumn}
                />
              </div>
            </SortableContext>

            <DragOverlay>
              {draggedTask ? (
                <div className="rotate-3 scale-105 opacity-80 shadow-xl">
                  <SortableCardFace
                    task={draggedTask}
                    onCardClick={() => {}}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

        </div>
      </main>
      
      {/* Enhanced Task Detail Modal */}
      <EnhancedTaskDetailModal
        task={selectedTask}
        isOpen={isTaskDetailOpen}
        onClose={() => {
          setIsTaskDetailOpen(false);
          setSelectedTask(null);
        }}
        onUpdateTask={(updatedTask) => {
          // Refetch data after task update to trigger webhooks
          refetch();
        }}
      />
      
      {/* Shift Start Modal */}
      <ShiftStartModal
        isOpen={isShiftStartOpen}
        onClose={() => setIsShiftStartOpen(false)}
        tasks={tasks}
        onShiftStarted={handleShiftStarted}
      />
      
      {/* Shift Close Modal */}
      <ShiftCloseModal
        isOpen={isShiftCloseOpen}
        onClose={async () => {
          setIsShiftCloseOpen(false);
          
          // Send webhook event for shift ended
          const { sendShiftEndedEvent } = await import('@/lib/webhookService');
          const result = await sendShiftEndedEvent({
            timestamp: new Date().toISOString(),
            status: 'closed',
            tasks_count: tasks.length,
            completed_tasks: tasks.filter(task => task.status === 'completed').length,
          });
          
          if (result.success) {
            setShiftStatus('closed');
            toast({
              title: "Shift Ended",
              description: "Your shift has been ended successfully",
              variant: "default",
            });
          } else {
            toast({
              title: "Error",
              description: result.error || "Failed to end shift. Please try again.",
              variant: "destructive",
            });
          }
        }}
        tasks={tasks}
        onCardClick={handleCardClick}
      />
      
      {/* Floating Voice Command Button - masqué si modal ouverte */}
      {!isShiftCloseOpen && !isShiftStartOpen && <VoiceCommandButton />}
    </div>
  );
};

export default ShiftManagement;
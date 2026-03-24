import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { VoiceCommandButton } from '@/components/VoiceCommandButton';
import EnhancedTaskDetailModal from '@/components/modals/EnhancedTaskDetailModal';
import { CardFaceModal } from '@/components/shared/CardFaceModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  PlayCircle, 
  Target, 
  StopCircle,
  AlertTriangle,
  Users,
  Clock,
  GripVertical,
  Heart,
  UserCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useTasks, useProfiles } from '@/hooks/useSupabaseData';
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

// Service Control specific modals
import ServiceShiftStartModal from '@/components/modals/ServiceShiftStartModal';
import ServiceShiftCloseModal from '@/components/modals/ServiceShiftCloseModal';

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
      case 'completed': return 'Resolved' as const;
      case 'verified': return 'Verified' as const;
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
        
        <div
          ref={setNodeRef}
          className={cn(
            "min-h-[520px] rounded-lg transition-all duration-300 p-4 border-2",
            isOver && isTargetColumn
              ? "bg-green-50 border-green-300 border-dashed shadow-inner" 
              : "bg-transparent border-transparent hover:border-gray-200"
          )}
        >
          <div className="space-y-5 max-h-[calc(100vh-300px)] overflow-y-auto">
            {filteredTasks.map((task, index) => {
              const isDraggedCard = draggedTask && task.id === draggedTask.id;
              
              return (
                <div key={task.id} className={cn(
                  "transition-all duration-200",
                  isOver && isTargetColumn && "transform translate-y-1",
                  isDraggedCard && isDraggedFromThisColumn && "opacity-30"
                )}>
                  {isDraggedCard && isDraggedFromThisColumn ? (
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

const ServiceControl = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { tasks, loading, error, refetch } = useTasks();
  const [shiftStatus, setShiftStatus] = useState<'not_started' | 'active' | 'closed'>('not_started');
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [isShiftCloseOpen, setIsShiftCloseOpen] = useState(false);
  const [isShiftStartOpen, setIsShiftStartOpen] = useState(false);
  const [draggedTask, setDraggedTask] = useState<TaskItem | null>(null);
  const [draggedFromColumn, setDraggedFromColumn] = useState<string | null>(null);
  const [currentColumnIndex, setCurrentColumnIndex] = useState(0);
  const { toast } = useToast();

  // Colonnes: 4 au lieu de 3
  const columns = [
    { title: "To Process", status: "pending" },
    { title: "In Progress", status: "in_progress" },
    { title: "Resolved", status: "completed" },
    { title: "Verified", status: "verified" }
  ];

  const columnsPerView = 3; // Affiche 3 colonnes, scroll pour voir la 4ème
  const visibleColumns = columns.slice(currentColumnIndex, currentColumnIndex + columnsPerView);
  const canScrollLeft = currentColumnIndex > 0;
  const canScrollRight = currentColumnIndex + columnsPerView < columns.length;

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

  const scrollLeft = () => {
    if (canScrollLeft) {
      setCurrentColumnIndex(currentColumnIndex - 1);
    }
  };

  const scrollRight = () => {
    if (canScrollRight) {
      setCurrentColumnIndex(currentColumnIndex + 1);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    if (task) {
      setDraggedTask(task);
      setDraggedFromColumn(task.status);
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
    let insertPosition: number = -1;

    if (overId.startsWith('column-')) {
      newStatus = overId.replace('column-', '');
      insertPosition = -1;
    } else {
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) {
        newStatus = overTask.status;
        const columnTasks = tasks.filter(t => t.status === newStatus).sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        insertPosition = columnTasks.findIndex(t => t.id === overId);
      } else {
        return;
      }
    }

    if (activeTask.status === newStatus) {
      const activeColumnTasks = tasks.filter(t => t.status === activeTask.status);
      const currentPosition = activeColumnTasks.findIndex(t => t.id === activeId);
      if (insertPosition === currentPosition || (insertPosition === -1 && currentPosition === activeColumnTasks.length - 1)) {
        return;
      }
    }

    try {
      const targetColumnTasks = tasks
        .filter(t => t.status === newStatus && t.id !== activeId)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      let newTimestamp: string;
      
      if (insertPosition === -1 || insertPosition >= targetColumnTasks.length) {
        const lastTask = targetColumnTasks[targetColumnTasks.length - 1];
        newTimestamp = lastTask ? 
          new Date(new Date(lastTask.created_at).getTime() + 1000).toISOString() :
          new Date().toISOString();
      } else if (insertPosition === 0) {
        const firstTask = targetColumnTasks[0];
        newTimestamp = new Date(new Date(firstTask.created_at).getTime() - 1000).toISOString();
      } else {
        const beforeTask = targetColumnTasks[insertPosition - 1];
        const afterTask = targetColumnTasks[insertPosition];
        const beforeTime = new Date(beforeTask.created_at).getTime();
        const afterTime = new Date(afterTask.created_at).getTime();
        newTimestamp = new Date((beforeTime + afterTime) / 2).toISOString();
      }

      // ✅ FIX: Write to the unified 'task' table (migration from multi-table architecture)
      const updateResult = await supabase
        .from('task')
        .update({
          status: newStatus,
          updated_at: newTimestamp
        })
        .eq('id', activeId);

      if (updateResult?.error) {
        throw updateResult.error;
      }

      await refetch();

      sendTaskMovedEvent(activeId, activeTask.status, newStatus, activeTask).then(result => {
        if (!result.success) {
          console.warn('Webhook failed but task was updated successfully:', result.error);
        }
      }).catch(error => {
        console.warn('Webhook error (task was still updated):', error);
      });
      
      toast({
        title: "Success",
        description: `Task moved to ${newStatus.replace('_', ' ')}`,
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

      const { sendTaskStatusChangedEvent } = await import('@/lib/webhookService');
      const result = await sendTaskStatusChangedEvent(taskId, oldStatus, newStatus, task);

      if (result.success) {
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
    const { sendShiftStartedEvent } = await import('@/lib/webhookService');
    const result = await sendShiftStartedEvent({
      timestamp: new Date().toISOString(),
      status: 'active',
      tasks_count: tasks.length,
    });

    if (result.success) {
      setShiftStatus('active');
      setIsShiftStartOpen(false);
      toast({
        title: "Service Shift Started",
        description: "Your service shift has been marked as active",
        variant: "default",
      });
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to start service shift. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuToggle={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="p-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Page Title avec Status */}
          <div className="mb-8">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-playfair font-bold text-foreground">
                Service Control
              </h1>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  shiftStatus === 'active' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                )} />
                <span className={cn(
                  "text-xl font-playfair font-bold",
                  shiftStatus === 'active' ? 'text-green-600' : 'text-red-600'
                )}>
                  Status: {shiftStatus === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <p className="text-muted-foreground mt-2">
              Manage your service tasks and housekeeping activities during your shift
            </p>
          </div>

          {/* Service Action Buttons */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <Button
              onClick={() => handleShiftAction('start')}
              disabled={shiftStatus === 'active'}
              className="h-12 text-base"
              variant={shiftStatus === 'active' ? 'secondary' : 'default'}
            >
              <PlayCircle className="h-5 w-5 mr-2" />
              {shiftStatus === 'active' ? 'Active Shift' : 'Begin Shift'}
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
              variant="destructive"
              className="h-12 text-base"
            >
              <StopCircle className="h-5 w-5 mr-2" />
              End Shift
            </Button>
          </div>

          {/* Navigation pour les 4 colonnes */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={scrollLeft}
                disabled={!canScrollLeft}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Colonnes {currentColumnIndex + 1}-{Math.min(currentColumnIndex + columnsPerView, columns.length)} / {columns.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={scrollRight}
                disabled={!canScrollRight}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Kanban Board avec 4 colonnes (3 visibles) */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
              <div className="grid grid-cols-3 gap-6">
                {visibleColumns.map(column => (
                  <KanbanColumn
                    key={column.status}
                    title={column.title}
                    tasks={tasks}
                    status={column.status}
                    onStatusChange={handleStatusChange}
                    onCardClick={handleCardClick}
                    draggedTask={draggedTask}
                    draggedFromColumn={draggedFromColumn}
                  />
                ))}
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
      
      <ServiceShiftStartModal
        isOpen={isShiftStartOpen}
        onClose={() => setIsShiftStartOpen(false)}
        tasks={tasks}
        onShiftStarted={handleShiftStarted}
      />
      
      <ServiceShiftCloseModal
        isOpen={isShiftCloseOpen}
        onClose={async () => {
          setIsShiftCloseOpen(false);
          
          // ✅ ARCHIVER toutes les tâches 'completed' et 'verified' avant de fermer le shift
          const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'verified');
          
          if (completedTasks.length > 0) {
            console.log(`Archiving ${completedTasks.length} completed/verified tasks...`);
            
            // Archiver chaque type de tâche
            for (const task of completedTasks) {
              try {
                switch (task.type) {
                  case 'incident':
                    await supabase
                      .from('incidents')
                      .update({ status: 'archived' })
                      .eq('id', task.id);
                    break;
                  case 'client_request':
                    await supabase
                      .from('client_requests')
                      .update({ preparation_status: 'archived' })
                      .eq('id', task.id);
                    break;
                  case 'follow_up':
                    await supabase
                      .from('follow_ups')
                      .update({ status: 'archived' })
                      .eq('id', task.id);
                    break;
                  case 'internal_task':
                  case 'personal_task':
                    await supabase
                      .from('internal_tasks')
                      .update({ status: 'archived' })
                      .eq('id', task.id);
                    break;
                }
              } catch (error) {
                console.error(`Error archiving task ${task.id}:`, error);
              }
            }
            
            console.log('✅ All completed/verified tasks archived');
          }
          
          const { sendShiftEndedEvent } = await import('@/lib/webhookService');
          const result = await sendShiftEndedEvent({
            timestamp: new Date().toISOString(),
            status: 'closed',
            tasks_count: tasks.length,
            completed_tasks: completedTasks.length,
          });
          
          if (result.success) {
            setShiftStatus('closed');
            
            // Refetch pour retirer les tâches archivées du kanban
            await refetch();
            
            toast({
              title: "Service Shift Ended",
              description: `Your service shift has been ended successfully. ${completedTasks.length} task(s) archived.`,
              variant: "default",
            });
          } else {
            toast({
              title: "Error",
              description: result.error || "Failed to end service shift. Please try again.",
              variant: "destructive",
            });
          }
        }}
        tasks={tasks}
        onCardClick={handleCardClick}
      />
      
      {!isShiftCloseOpen && !isShiftStartOpen && <VoiceCommandButton />}
    </div>
  );
};

export default ServiceControl;
import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { VoiceCommandButton } from '@/components/VoiceCommandButton';
import EnhancedTaskDetailModal from '@/components/modals/EnhancedTaskDetailModal';
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
  Calendar,
  User,
  MapPin,
  GripVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useTasks } from '@/hooks/useSupabaseData';
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

const SortableTaskCard = ({ 
  task, 
  onStatusChange, 
  onCardClick 
}: { 
  task: TaskItem; 
  onStatusChange: (taskId: string, newStatus: string) => void;
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

  const typeConfig = getTypeConfig(task.type);
  const TypeIcon = typeConfig.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "mb-4 transition-all duration-200",
        isDragging ? "opacity-50" : "opacity-100"
      )}
    >
      <Card className="transition-all duration-200 hover:shadow-md cursor-pointer group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 flex-1" onClick={() => onCardClick(task)}>
              <div className={cn("p-1.5 rounded-full", typeConfig.color)}>
                <TypeIcon className="h-4 w-4" />
              </div>
              <Badge variant="outline" className="text-xs">
                {typeConfig.label}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {task.priority === 'urgent' && (
                <Badge className="bg-urgence-red text-warm-cream">
                  Urgent
                </Badge>
              )}
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
          <CardTitle 
            className="text-sm font-medium leading-5 cursor-pointer"
            onClick={() => onCardClick(task)}
          >
            {task.title}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pt-0">
          {task.description && (
            <p 
              className="text-sm text-muted-foreground mb-3 line-clamp-2 cursor-pointer"
              onClick={() => onCardClick(task)}
            >
              {task.description}
            </p>
          )}
          
          <div className="space-y-2" onClick={() => onCardClick(task)}>
            {task.guestName && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                <span>{task.guestName}</span>
              </div>
            )}
            
            {task.roomNumber && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>Room {task.roomNumber}</span>
              </div>
            )}
            
            {task.location && !task.roomNumber && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{task.location}</span>
              </div>
            )}
            
            {task.dueDate && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{new Date(task.dueDate).toLocaleDateString('en-US')}</span>
              </div>
            )}
            
            {task.recipient && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                <span>→ {task.recipient}</span>
              </div>
            )}
          </div>

        </CardContent>
      </Card>
    </div>
  );
};

const KanbanColumn = ({ 
  title, 
  tasks, 
  status, 
  onStatusChange,
  onCardClick
}: { 
  title: string; 
  tasks: TaskItem[]; 
  status: string;
  onStatusChange: (taskId: string, newStatus: string) => void;
  onCardClick: (task: TaskItem) => void;
}) => {
  const filteredTasks = tasks.filter(task => task.status === status);
  const taskIds = filteredTasks.map(task => task.id);

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
            "min-h-[500px] rounded-lg transition-colors duration-200",
            isOver && "bg-muted/80"
          )}
        >
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
              {filteredTasks.map(task => (
                <SortableTaskCard 
                  key={task.id} 
                  task={task} 
                  onStatusChange={onStatusChange}
                  onCardClick={onCardClick}
                />
              ))}
              
              {filteredTasks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No tasks</p>
                  <p className="text-xs mt-1">Drag a card here</p>
                </div>
              )}
            </div>
          </SortableContext>
        </div>
      </div>
    </div>
  );
};

const ShiftManagement = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { tasks, loading, error, refetch } = useTasks();
  const [shiftStatus, setShiftStatus] = useState<'not_started' | 'active' | 'closed'>('not_started');
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [isShiftCloseOpen, setIsShiftCloseOpen] = useState(false);
  const [isShiftStartOpen, setIsShiftStartOpen] = useState(false);
  const [shiftActive, setShiftActive] = useState(false);
  const [draggedTask, setDraggedTask] = useState<TaskItem | null>(null);
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
    setDraggedTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedTask(null);
    
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;
    
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    let newStatus: string;

    // Check if dropped on a column
    if (overId.startsWith('column-')) {
      newStatus = overId.replace('column-', '');
    } else {
      // If dropped on another task, get the status of that task's column
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) {
        newStatus = overTask.status;
      } else {
        return;
      }
    }

    if (task.status !== newStatus) {
      // Send specific webhook event for task movement (drag and drop)
      const { sendTaskMovedEvent } = await import('@/lib/webhookService');
      const result = await sendTaskMovedEvent(taskId, task.status, newStatus, task);
      
      if (result.success) {
        // Refetch data after successful webhook
        refetch();
        toast({
          title: "Success",
          description: "Task moved successfully",
          variant: "default",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to move task. Please try again.",
          variant: "destructive",
        });
      }
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
              variant="destructive"
              className="h-12 text-base"
            >
              <StopCircle className="h-5 w-5 mr-2" />
              End Shift
            </Button>
          </div>

          {/* Kanban Board */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-3 gap-6">
              <KanbanColumn
                title="To Process"
                tasks={tasks}
                status="pending"
                onStatusChange={handleStatusChange}
                onCardClick={handleCardClick}
              />
              
              <KanbanColumn
                title="In Progress"
                tasks={tasks}
                status="in_progress"
                onStatusChange={handleStatusChange}
                onCardClick={handleCardClick}
              />
              
              <KanbanColumn
                title="Resolved"
                tasks={tasks}
                status="completed"
                onStatusChange={handleStatusChange}
                onCardClick={handleCardClick}
              />
            </div>

            <DragOverlay>
              {draggedTask ? (
                <div className="rotate-3 scale-105">
                  <SortableTaskCard
                    task={draggedTask}
                    onStatusChange={() => {}}
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
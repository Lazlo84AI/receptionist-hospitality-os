import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { VoiceCommandButton } from '@/components/VoiceCommandButton';
import EnhancedTaskDetailModal from '@/components/modals/EnhancedTaskDetailModal';
import { TaskFullEditView } from '@/components/modules/TaskFullEditView'; // NOUVEAU: Import TaskFullEditView
import { CardFaceModal } from '@/components/shared/CardFaceModal';
import { ShiftCloseModal } from '@/components/modals/ShiftCloseModal';
import ShiftStartModal from '@/components/modals/ShiftStartModal';
import ShiftActionSelector from '@/components/shift/ShiftActionSelector';
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
import { useStartShift } from '@/hooks/useShiftData';
import { getShiftHandover, linkTasksToShift } from '@/lib/shiftContinuityManager-v2';
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
    <div className="flex-1 min-w-[70vw] md:min-w-0 snap-center">
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
                  <p className="text-sm">No cards to show</p>
                  {/* Message removed - empty column is normal during active shift */}
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
  const { startShift, loading: startingShift } = useStartShift();
  const [shiftStatus, setShiftStatus] = useState<'not_started' | 'active' | 'closed'>('not_started'); // LOGIQUE CORRECTE: End Shift s'active après Begin Shift
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [isTaskFullEditOpen, setIsTaskFullEditOpen] = useState(false); // NOUVEAU: État pour TaskFullEditView
  const [taskToEdit, setTaskToEdit] = useState<TaskItem | null>(null); // NOUVEAU: Tâche à éditer
  const [isShiftCloseOpen, setIsShiftCloseOpen] = useState(false);
  const [isShiftStartOpen, setIsShiftStartOpen] = useState(false);
  const [shiftActive, setShiftActive] = useState(false);
  const [draggedTask, setDraggedTask] = useState<TaskItem | null>(null);
  const [draggedFromColumn, setDraggedFromColumn] = useState<string | null>(null);
  const { toast } = useToast();

  // Check for active shift on mount
  useEffect(() => {
    const checkActiveShift = async () => {
      const { data: activeShift } = await supabase
        .from('shifts')
        .select('id')
        .eq('status', 'active')
        .single();
      
      if (activeShift) {
        setShiftStatus('active');
        console.log('✅ Active shift detected:', activeShift.id);
      } else {
        setShiftStatus('not_started');
      }
    };
    
    checkActiveShift();
  }, []);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Auto-scroll during drag - SNAP to next column
  useEffect(() => {
    if (!draggedTask) return;

    let scrollTimeout: NodeJS.Timeout;
    let lastScrollTime = 0;
    const scrollCooldown = 800; // 800ms entre chaque snap

    const handleDragMove = (e: MouseEvent | TouchEvent) => {
      const now = Date.now();
      if (now - lastScrollTime < scrollCooldown) return; // Cooldown actif

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const viewportWidth = window.innerWidth;
      const edgeZone = 80; // Zone de 80px sur les bords

      const kanbanContainer = document.querySelector('.flex.md\\:grid') as HTMLElement;
      if (!kanbanContainer) return;

      const currentScroll = kanbanContainer.scrollLeft;
      const columnWidth = viewportWidth * 0.7; // 70vw comme défini

      // Bord droit - snap vers la colonne suivante
      if (clientX > viewportWidth - edgeZone) {
        const nextColumnScroll = Math.ceil(currentScroll / columnWidth) * columnWidth;
        if (nextColumnScroll > currentScroll) {
          kanbanContainer.scrollTo({ left: nextColumnScroll, behavior: 'smooth' });
          lastScrollTime = now;
        }
      }
      // Bord gauche - snap vers la colonne précédente
      else if (clientX < edgeZone) {
        const prevColumnScroll = Math.floor(currentScroll / columnWidth) * columnWidth - columnWidth;
        if (prevColumnScroll >= 0 && prevColumnScroll < currentScroll) {
          kanbanContainer.scrollTo({ left: Math.max(0, prevColumnScroll), behavior: 'smooth' });
          lastScrollTime = now;
        }
      }
    };

    document.addEventListener('mousemove', handleDragMove, { passive: true });
    document.addEventListener('touchmove', handleDragMove, { passive: true });

    return () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('touchmove', handleDragMove);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, [draggedTask]);

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
    try {
      console.log('🚀 Starting shift...');
      
      // 1. Get current user and their service
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('service')
        .eq('id', user.id)
        .single();
      
      if (!profile?.service) {
        throw new Error('User service not found');
      }
      
      const userService = profile.service;
      console.log(`👤 User service: ${userService}`);
      
      // 2. Create shift in database
      const shiftResult = await startShift();
      
      if (!shiftResult.success || !shiftResult.shift_id) {
        throw new Error('Failed to create shift in database');
      }
      
      const newShiftId = shiftResult.shift_id;
      console.log(`✅ Shift created: ${newShiftId}`);
      
      // 3. Get filtered tasks from last shift
      const { tasks: transferredTasks, stats } = await getShiftHandover(userService);
      console.log(`📦 ${transferredTasks.length} tasks to transfer`);
      
      // 4. Link tasks to the new shift
      if (transferredTasks.length > 0) {
        const taskIds = transferredTasks.map(t => t.id);
        await linkTasksToShift(taskIds, newShiftId);
        console.log(`🔗 Tasks linked to shift ${newShiftId}`);
      }
      
      // 5. Send webhook event
      const { sendShiftStartedEvent } = await import('@/lib/webhookService');
      const webhookResult = await sendShiftStartedEvent({
        shift_id: newShiftId,
        timestamp: new Date().toISOString(),
        status: 'active',
        tasks_count: transferredTasks.length,
      });
      
      if (!webhookResult.success) {
        console.warn('Webhook failed but shift was created:', webhookResult.error);
      }
      
      // 6. Update UI state
      setShiftStatus('active');
      setIsShiftStartOpen(false);
      
      // 7. Reload tasks to show transferred ones
      await refetch();
      
      // 8. Show success message
      toast({
        title: "Shift Started Successfully",
        description: `${transferredTasks.length} tasks transferred from previous shift`,
        variant: "default",
      });
      
      console.log('✅ Shift start complete!');
    } catch (error) {
      console.error('❌ Error starting shift:', error);
      toast({
        title: "Error Starting Shift",
        description: error instanceof Error ? error.message : "Failed to start shift. Please try again.",
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

          {/* Shift Action Selector - Responsive */}
          <ShiftActionSelector 
            shiftStatus={shiftStatus}
            onShiftAction={handleShiftAction}
          />

          {/* Kanban Board */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
              {/* Global SortableContext pour toutes les tâches */}
              <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                <div className="flex md:grid md:grid-cols-3 gap-6 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory md:snap-none -mx-8 px-8 md:mx-0 md:px-0">
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
        onClose={() => {
          // JUSTE fermer le modal, rien d'autre
          setIsShiftCloseOpen(false);
        }}
        onShiftEnded={async () => {
          // Appelé SEULEMENT après validation complète du shift
          setShiftStatus('closed');
          setIsShiftCloseOpen(false);
          
          // Refetch pour vider le kanban (plus de shift actif)
          await refetch();
          
          toast({
            title: "Shift Ended",
            description: "Your shift has been ended successfully",
            variant: "default",
          });
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
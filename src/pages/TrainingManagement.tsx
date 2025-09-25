import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { VoiceCommandButton } from '@/components/VoiceCommandButton';
import EnhancedTaskDetailModal from '@/components/modals/EnhancedTaskDetailModal';
import TrainingTaskCreationModal from '@/components/modals/TrainingTaskCreationModal';
import PdfViewerModal from '@/components/modals/PdfViewerModal';
import QuizzModal from '@/components/modals/QuizzModal';
import { CardFaceModal } from '@/components/shared/CardFaceModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Target, 
  Award,
  BookOpen,
  Users,
  Clock,
  GripVertical,
  Brain,
  Trophy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useTrainingTasks } from '@/hooks/useTrainingTasks';
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
    case 'training':
      return { 
        icon: BookOpen, 
        color: 'bg-blue-100 text-blue-600',
        label: 'Training' 
      };
    default:
      return { 
        icon: Brain, 
        color: 'bg-purple-100 text-purple-600',
        label: 'Learning' 
      };
  }
};

// Transform TaskItem to CardFaceModal format for training
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
    location: task.location || 'Online Training',
    clientName: undefined, // N/A pour les trainings
    status: getStatus(task.status),
    priority: task.priority === 'urgent' ? 'URGENCE' as const : 'NORMAL' as const,
    assignedTo: task.assignedTo || 'Self-paced',
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
      {/* Zone de drag */}
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
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">No training tasks</p>
                  <p className="text-xs mt-1">Drag a training card here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const TrainingManagement = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { trainingTasks, loading, error, refetch } = useTrainingTasks();
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [draggedTask, setDraggedTask] = useState<TaskItem | null>(null);
  const [draggedFromColumn, setDraggedFromColumn] = useState<string | null>(null);
  const [isTrainingCreationOpen, setIsTrainingCreationOpen] = useState(false);
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);
  const [isQuizzOpen, setIsQuizzOpen] = useState(false);
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
    const task = trainingTasks.find(t => t.id === active.id);
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
    
    const activeTask = trainingTasks.find(t => t.id === activeId);
    if (!activeTask) return;

    let newStatus: string;
    let targetPosition: number = -1;

    if (overId.startsWith('column-')) {
      newStatus = overId.replace('column-', '');
      const columnTasks = trainingTasks.filter(t => t.status === newStatus);
      targetPosition = columnTasks.length;
    } else {
      const overTask = trainingTasks.find(t => t.id === overId);
      if (overTask) {
        newStatus = overTask.status;
        const columnTasks = trainingTasks
          .filter(t => t.status === newStatus)
          .sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
        targetPosition = columnTasks.findIndex(t => t.id === overId);
      } else {
        return;
      }
    }

    if (activeTask.status === newStatus) {
      const activeColumnTasks = trainingTasks.filter(t => t.status === activeTask.status);
      const currentPosition = activeColumnTasks.findIndex(t => t.id === activeId);
      if (targetPosition === currentPosition) {
        return;
      }
    }

    try {
      const columnTasks = trainingTasks
        .filter(t => t.status === newStatus && t.id !== activeId)
        .sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
      
      const newTaskArray = [...columnTasks];
      newTaskArray.splice(targetPosition, 0, activeTask);
      
      const baseTime = Date.now();
      const updates = newTaskArray.map((task, index) => ({
        id: task.id,
        newTimestamp: new Date(baseTime + (index * 1000)).toISOString()
      }));
      
      if (activeTask.status !== newStatus) {
        const { data: { user } } = await supabase.auth.getUser();
        
        const statusUpdate = await supabase
          .from('task')
          .update({ 
            status: newStatus,
            updated_by: user?.id
          })
          .eq('id', activeId);
        
        if (statusUpdate.error) {
          throw statusUpdate.error;
        }
      }
      
      for (const update of updates) {
        const positionUpdate = await supabase
          .from('task')
          .update({ updated_at: update.newTimestamp })
          .eq('id', update.id);
        
        if (positionUpdate.error) {
          throw positionUpdate.error;
        }
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
        description: `Training task moved to ${newStatus.replace('_', ' ')} at position ${targetPosition + 1}`,
        variant: "default",
      });
      
    } catch (error) {
      console.error('Error updating training task:', error);
      refetch();
      toast({
        title: "Error", 
        description: "Failed to move training task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const task = trainingTasks.find(t => t.id === taskId);
      if (!task) return;
      
      const oldStatus = task.status;

      const { sendTaskStatusChangedEvent } = await import('@/lib/webhookService');
      const result = await sendTaskStatusChangedEvent(taskId, oldStatus, newStatus, task);

      if (result.success) {
        refetch();
        toast({
          title: "Success",
          description: "Training status updated successfully",
          variant: "default",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update training status. Please try again.",
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

  // Training-specific actions
  const handleLearnANewKnowledge = () => {
    setIsPdfViewerOpen(true);
    console.log("🎓 Opening PDF training viewer...");
  };

  const handleMyProgress = () => {
    toast({
      title: "My Progress",
      description: "Loading your training progress...",
      variant: "default",
    });
    // TODO: Show progress modal/page
    console.log("📊 Showing training progress...");
  };

  const handleMakeYourQuizz = () => {
    setIsQuizzOpen(true);
    console.log("🧠 Opening training quiz...");
  };

  const handleTestLearn = () => {
    setIsPdfViewerOpen(false);
    setIsQuizzOpen(true);
    toast({
      title: "Quiz Started",
      description: "Test your knowledge with this assessment",
      variant: "default",
    });
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
              Manage Your Training
            </h1>
            <p className="text-muted-foreground">
              Improve every day on the job
            </p>
          </div>

          {/* Training Action Buttons */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <Button
              onClick={handleLearnANewKnowledge}
              className="h-12 text-base text-white transition-all duration-200"
              style={{ 
                backgroundColor: '#1E1A37',  /* WARM RAL Pantone 5255C */
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#DEAE35'; /* Yellow hover */
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1E1A37'; /* Back to WARM */
              }}
            >
              <Play className="h-5 w-5 mr-2" />
              Start Training
            </Button>
            
            <Button
              onClick={handleMyProgress}
              className="h-12 text-base text-gray-800 transition-all duration-200"
              style={{ 
                backgroundColor: '#E0D3B4',  /* Sand RAL Pantone 7500C */
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#DEAE35'; /* Yellow hover */
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#E0D3B4'; /* Back to Sand */
              }}
            >
              <Target className="h-5 w-5 mr-2" />
              My Progress
            </Button>
            
            <Button
              onClick={handleMakeYourQuizz}
              className="h-12 text-base text-white transition-all duration-200"
              style={{ 
                backgroundColor: '#BBA57A',  /* Gold RAL Pantone 4006C */
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#DEAE35'; /* Yellow hover */
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#BBA57A'; /* Back to Gold */
              }}
            >
              <Award className="h-5 w-5 mr-2" />
              Complete Quizz
            </Button>
          </div>

          {/* Training Tasks Counter */}
          <div className="mb-6">
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-sm">
                <BookOpen className="h-4 w-4 mr-1" />
                {trainingTasks.length} Training Tasks
              </Badge>
              <Badge variant="outline" className="text-sm">
                <Trophy className="h-4 w-4 mr-1" />
                {trainingTasks.filter(t => t.status === 'completed').length} Completed
              </Badge>
            </div>
          </div>

          {/* Kanban Board */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={trainingTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
              <div className="grid grid-cols-3 gap-6">
                <KanbanColumn
                  title="To Process"
                  tasks={trainingTasks}
                  status="pending"
                  onStatusChange={handleStatusChange}
                  onCardClick={handleCardClick}
                  draggedTask={draggedTask}
                  draggedFromColumn={draggedFromColumn}
                />
                
                <KanbanColumn
                  title="In Progress"
                  tasks={trainingTasks}
                  status="in_progress"
                  onStatusChange={handleStatusChange}
                  onCardClick={handleCardClick}
                  draggedTask={draggedTask}
                  draggedFromColumn={draggedFromColumn}
                />
                
                <KanbanColumn
                  title="Completed"
                  tasks={trainingTasks}
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
      
      {/* Training Task Detail Modal */}
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
      
      {/* Training Task Creation Modal */}
      <TrainingTaskCreationModal
        isOpen={isTrainingCreationOpen}
        onClose={() => setIsTrainingCreationOpen(false)}
        onTaskCreated={() => {
          refetch();
          toast({
            title: "Training Created",
            description: "New training task has been added to your board",
            variant: "default",
          });
        }}
      />
      
      {/* PDF Viewer Modal */}
      <PdfViewerModal
        isOpen={isPdfViewerOpen}
        onClose={() => setIsPdfViewerOpen(false)}
        title="Hotel Reception Training Manual"
        onTestLearn={handleTestLearn}
      />
      
      {/* Quiz Assessment Modal */}
      <QuizzModal
        isOpen={isQuizzOpen}
        onClose={() => setIsQuizzOpen(false)}
        title="Training Assessment"
      />
      
      {/* Floating Voice Command Button */}
      <VoiceCommandButton />
    </div>
  );
};

export default TrainingManagement;
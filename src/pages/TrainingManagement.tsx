import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { DocumentViewerModal } from '@/components/modals/DocumentViewerModal';
import TrainingTaskCreationModal from '@/components/modals/TrainingTaskCreationModal';
import PdfViewerModal from '@/components/modals/PdfViewerModal';
import QuizzModal from '@/components/modals/QuizzModal';
import { CardFaceModal } from '@/components/shared/CardFaceModal';
import TrainingActionSelector from '@/components/training/TrainingActionSelector';
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
import { useMyAssignedQueries } from '@/hooks/useMyAssignedFormations';
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
import { KnowledgeQuery } from '@/hooks/useKnowledgeQueries';

const getTypeConfig = (formation_steps: string) => {
  switch (formation_steps) {
    case 'qcm':
      return { 
        icon: Brain,
        color: 'bg-[#DEAE35] text-white',
        label: 'QCM' 
      };
    case 'training':
      return { 
        icon: BookOpen,
        color: 'bg-[#BBA57A] text-white',
        label: 'Training' 
      };
    default: // formation
      return { 
        icon: BookOpen,
        color: 'bg-blue-100 text-blue-600',
        label: 'Formation' 
      };
  }
};

// Transform KnowledgeQuery to CardFaceModal format for training
const transformTaskForCard = (task: any) => {
  return {
    id: task.id,
    title: task.document_title,  // Nom du document
    location: task.topic,        // Thématique
    clientName: undefined,
    status: task.kanban_status === 'to_process' ? 'To Process' : 
           task.kanban_status === 'in_progress' ? 'In Progress' : 'Completed',
    priority: 'NORMAL',
    assignedTo: task.formation_steps === 'formation' ? 'Formation' :
               task.formation_steps === 'qcm' ? 'QCM' :
               task.formation_steps === 'training' ? 'Training' : 'Content',
    timeElapsed: formatTimeElapsed(task.created_at)
  };
};

const SortableCardFace = ({ 
  task, 
  onCardClick 
}: { 
  task: KnowledgeQuery; 
  onCardClick: (task: KnowledgeQuery) => void;
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
  tasks: KnowledgeQuery[]; 
  status: string;
  onStatusChange: (taskId: string, newStatus: string) => void;
  onCardClick: (task: KnowledgeQuery) => void;
  draggedTask: KnowledgeQuery | null;
  draggedFromColumn: string | null;
}) => {
  const filteredTasks = tasks.filter(task => {
    // Mapper kanban_status vers les statuts des colonnes
    const mappedStatus = task.kanban_status === 'to_process' ? 'pending' :
                        task.kanban_status === 'in_progress' ? 'in_progress' : 'completed';
    return mappedStatus === status;
  });
  const isDraggedFromThisColumn = draggedFromColumn === status;
  const mappedDraggedStatus = draggedTask ? 
    (draggedTask.kanban_status === 'to_process' ? 'pending' :
     draggedTask.kanban_status === 'in_progress' ? 'in_progress' : 'completed') : null;
  const isTargetColumn = draggedTask && mappedDraggedStatus !== status;

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
  const { data: knowledgeQueries, isLoading: loading, error, refetch } = useMyAssignedQueries();
  const trainingTasks = knowledgeQueries || [];
  const [selectedTask, setSelectedTask] = useState<KnowledgeQuery | null>(null);
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false);
  const [draggedTask, setDraggedTask] = useState<KnowledgeQuery | null>(null);
  const [draggedFromColumn, setDraggedFromColumn] = useState<string | null>(null);
  const [isTrainingCreationOpen, setIsTrainingCreationOpen] = useState(false);
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);
  const [isQuizzOpen, setIsQuizzOpen] = useState(false);
  const { toast } = useToast();
  const location = useLocation();

  // ── Notification deep-link : ouvrir le premier doc du programme assigné ──
  // Dépendance [location.key] : se déclenche à chaque navigation vers /training,
  // même si le composant est déjà monté (user déjà sur la page).
  useEffect(() => {
    const assignmentId = (location.state as any)?.openTrainingAssignmentId;
    if (!assignmentId) return;
    // Nettoyer le state de navigation pour éviter la réouverture au refresh
    window.history.replaceState({}, document.title);

    const fetchAndOpen = async () => {
      // 1. Récupérer l'assignation pour avoir la liste ordonnée des contenus
      const { data: assignment, error: aErr } = await supabase
        .from('training_assignments')
        .select('knowledge_item_ids')
        .eq('id', assignmentId)
        .single();

      if (aErr || !assignment?.knowledge_item_ids?.length) {
        console.warn('📚 Notification training: assignation introuvable ou vide', aErr);
        return;
      }

      // 2. Récupérer TOUS les documents du programme dans l'ordre défini
      const { data: docs, error: dErr } = await supabase
        .from('knowledge_queries')
        .select('id, document_title, document_name, document_url, thematic, formation_steps, kanban_status, created_at, updated_at')
        .in('id', assignment.knowledge_item_ids);

      if (dErr || !docs?.length) {
        console.warn('📚 Notification training: documents introuvables', dErr);
        return;
      }

      // 3. Respecter l'ordre de knowledge_item_ids et prendre le 1er qui n'est pas un QCM
      const orderedDocs = assignment.knowledge_item_ids
        .map((itemId: string) => docs.find((d: any) => d.id === itemId))
        .filter(Boolean) as any[];

      const firstFormation = orderedDocs.find((d: any) => d.formation_steps !== 'qcm')
        ?? orderedDocs[0]; // fallback sur le 1er si tout est QCM

      if (!firstFormation) return;

      // 4. Normaliser : 'thematic' en DB → 'topic' attendu par KnowledgeQuery
      const normalizedDoc = { ...firstFormation, topic: firstFormation.thematic };
      setSelectedTask(normalizedDoc as any);

      if (firstFormation.formation_steps === 'qcm') {
        setIsQuizzOpen(true);
      } else {
        setIsDocumentViewerOpen(true);
      }
    };

    // Petit délai pour laisser la page se monter
    setTimeout(fetchAndOpen, 300);
  }, [location.key]); // location.key change à chaque navigate(), même vers la même route

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Auto-scroll during drag - SNAP to next column (identique à Shift Management)
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

  const handleCardClick = (task: KnowledgeQuery) => {
    setSelectedTask(task);
    
    if (task.formation_steps === 'qcm') {
      // Ouvrir QuizzModal avec les données depuis training_questions
      setIsQuizzOpen(true);
    } else {
      // Ouvrir DocumentViewerModal (modal de la page connaissances)
      setIsDocumentViewerOpen(true);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = trainingTasks.find(t => t.id === active.id);
    if (task) {
      setDraggedTask(task);
      const mappedStatus = task.kanban_status === 'to_process' ? 'pending' :
                           task.kanban_status === 'in_progress' ? 'in_progress' : 'completed';
      setDraggedFromColumn(mappedStatus);
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
      // Map column status to kanban_status
      const columnStatus = overId.replace('column-', '');
      const kanbanStatus = columnStatus === 'pending' ? 'to_process' :
                          columnStatus === 'in_progress' ? 'in_progress' : 'completed';
      newStatus = kanbanStatus;
      const columnTasks = trainingTasks.filter(t => t.kanban_status === kanbanStatus);
      targetPosition = columnTasks.length;
    } else {
      const overTask = trainingTasks.find(t => t.id === overId);
      if (overTask) {
        newStatus = overTask.kanban_status;
        const columnTasks = trainingTasks
          .filter(t => t.kanban_status === newStatus)
          .sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
        targetPosition = columnTasks.findIndex(t => t.id === overId);
      } else {
        return;
      }
    }

    if (activeTask.kanban_status === newStatus) {
      const activeColumnTasks = trainingTasks.filter(t => t.kanban_status === activeTask.kanban_status);
      const currentPosition = activeColumnTasks.findIndex(t => t.id === activeId);
      if (targetPosition === currentPosition) {
        return;
      }
    }

    try {
      const columnTasks = trainingTasks
        .filter(t => t.kanban_status === newStatus && t.id !== activeId)
        .sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
      
      const newTaskArray = [...columnTasks];
      newTaskArray.splice(targetPosition, 0, activeTask);
      
      const baseTime = Date.now();
      const updates = newTaskArray.map((task, index) => ({
        id: task.id,
        newTimestamp: new Date(baseTime + (index * 1000)).toISOString()
      }));
      
      if (activeTask.kanban_status !== newStatus) {
        const statusUpdate = await supabase
          .from('knowledge_queries')
          .update({ 
            kanban_status: newStatus
          })
          .eq('id', activeId);
        
        if (statusUpdate.error) {
          throw statusUpdate.error;
        }
      }
      
      for (const update of updates) {
        const positionUpdate = await supabase
          .from('knowledge_queries')
          .update({ updated_at: update.newTimestamp })
          .eq('id', update.id);
        
        if (positionUpdate.error) {
          throw positionUpdate.error;
        }
      }

      await refetch();

      // 🎯 RÈGLES AUTOMATIQUES DU KANBAN
      // Détecter les transitions spécifiques et ouvrir automatiquement les cartes
      if (activeTask.kanban_status === 'to_process' && newStatus === 'in_progress') {
        // Transition To Process → In Progress : Ouvrir pour complétion
        console.log('🚀 Auto-opening card for completion (To Process → In Progress)');
        setSelectedTask(activeTask);
        if (activeTask.formation_steps === 'qcm') {
          setIsQuizzOpen(true);
        } else {
          setIsDocumentViewerOpen(true);
        }
      } else if (activeTask.kanban_status === 'in_progress' && newStatus === 'completed') {
        // Transition In Progress → Completed : Ouvrir pour validation finale
        console.log('🏁 Auto-opening card for final validation (In Progress → Completed)');
        setSelectedTask(activeTask);
        if (activeTask.formation_steps === 'qcm') {
          setIsQuizzOpen(true);
        } else {
          setIsDocumentViewerOpen(true);
        }
      }

      sendTaskMovedEvent(activeId, activeTask.kanban_status, newStatus, activeTask).then(result => {
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
      
      const oldStatus = task.kanban_status;

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
  const handleStartTraining = () => {
    // 🎯 LOGIQUE SMART START TRAINING - SEULEMENT LES FORMATIONS (PAS LES QCM)
    console.log('🚀 Smart Start Training: Searching for FORMATION documents only...');
    
    // 1. Chercher la première FORMATION "In Progress" (exclure les QCM)
    const inProgressFormations = trainingTasks.filter(task => 
      task.kanban_status === 'in_progress' && task.formation_steps !== 'qcm'
    );
    let nextTask = null;
    
    if (inProgressFormations.length > 0) {
      // Prendre la première formation "In Progress" (triée par date de création)
      nextTask = inProgressFormations.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];
      console.log('🟡 Found In Progress FORMATION:', nextTask.document_title);
    } else {
      // 2. Si aucune formation "In Progress", prendre la première formation "To Process" (exclure les QCM)
      const toProcessFormations = trainingTasks.filter(task => 
        task.kanban_status === 'to_process' && task.formation_steps !== 'qcm'
      );
      if (toProcessFormations.length > 0) {
        nextTask = toProcessFormations.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];
        console.log('🔴 Found To Process FORMATION:', nextTask.document_title);
      }
    }
    
    if (nextTask) {
      // 3. Ouvrir automatiquement la FORMATION trouvée (TOUJOURS DocumentViewerModal)
      console.log('📚 Auto-opening FORMATION:', nextTask.document_title, 'Type:', nextTask.formation_steps);
      setSelectedTask(nextTask);
      setIsDocumentViewerOpen(true); // TOUJOURS DocumentViewerModal pour les formations
    } else {
      // Aucune formation disponible
      toast({
        title: "No formation available",
        description: "All formations have been completed! 🎉",
        variant: "default",
      });
    }
  };

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
    // 🎯 LOGIQUE SMART COMPLETE QUIZZ - OUVRIR LE PROCHAIN QCM
    console.log('🧠 Smart Complete Quizz: Searching for QCM...');
    
    // 1. Chercher un QCM "In Progress"
    const inProgressQCMs = trainingTasks.filter(task => 
      task.kanban_status === 'in_progress' && task.formation_steps === 'qcm'
    );
    let nextQCM = null;
    
    if (inProgressQCMs.length > 0) {
      // Prendre le premier QCM "In Progress" (trié par date de création)
      nextQCM = inProgressQCMs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];
      console.log('🟡 Found In Progress QCM:', nextQCM.document_title);
    } else {
      // 2. Si aucun QCM "In Progress", prendre le premier QCM "To Process"
      const toProcessQCMs = trainingTasks.filter(task => 
        task.kanban_status === 'to_process' && task.formation_steps === 'qcm'
      );
      if (toProcessQCMs.length > 0) {
        nextQCM = toProcessQCMs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];
        console.log('🔴 Found To Process QCM:', nextQCM.document_title);
      }
    }
    
    if (nextQCM) {
      // 3. Ouvrir automatiquement le QCM trouvé
      console.log('📝 Auto-opening QCM:', nextQCM.document_title);
      setSelectedTask(nextQCM);
      setIsQuizzOpen(true);
    } else {
      // Aucun QCM disponible
      toast({
        title: "No QCM available",
        description: "All QCMs have been completed! 🎉",
        variant: "default",
      });
    }
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
              Manage your training
            </h1>
            <p className="text-muted-foreground">
              Improve every day on the job
            </p>
          </div>

          {/* Training Action Selector - Responsive */}
          <TrainingActionSelector
            onStartTraining={handleStartTraining}
            onMyProgress={handleMyProgress}
            onCompleteQuizz={handleMakeYourQuizz}
          />

          {/* Kanban Board avec navigation horizontale mobile */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={trainingTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
              <div className="flex md:grid md:grid-cols-3 gap-6 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory md:snap-none -mx-8 px-8 md:mx-0 md:px-0">
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
      
      {/* Document Viewer Modal for Formation Tasks */}
      <DocumentViewerModal
        isOpen={isDocumentViewerOpen}
        onClose={() => {
          setIsDocumentViewerOpen(false);
          setSelectedTask(null);
        }}
        document={selectedTask ? {
          id: selectedTask.id,
          document_title: selectedTask.document_title,
          document_name: selectedTask.document_name,
          document_url: selectedTask.document_url,
          topic: selectedTask.topic,
          formation_steps: selectedTask.formation_steps,
          created_at: selectedTask.created_at
        } : null}
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
        onClose={() => {
          setIsQuizzOpen(false);
          setSelectedTask(null);
        }}
        title={selectedTask?.formation_steps === 'qcm' ? `Quiz: ${selectedTask.topic}` : "Training Assessment"}
        selectedTask={selectedTask}
        onQuizCompleted={async (score: number) => {
          // 🏆 QCM TERMINÉ - MARQUER COMPLETED ET SAUVEGARDER LE SCORE
          if (selectedTask && score >= 70) {
            console.log('🎆 Quiz passed! Marking as completed:', selectedTask.document_title, 'Score:', score);
            try {
              const { error } = await supabase
                .from('knowledge_queries')
                .update({ 
                  kanban_status: 'completed',
                  last_score: score
                })
                .eq('id', selectedTask.id);
                
              if (error) throw error;
              
              await refetch(); // Rafraîchir les données
              
              toast({
                title: "Formation completed! 🎉",
                description: `${selectedTask.document_title} has been marked as completed with ${score}%.`,
                variant: "default",
              });
            } catch (error) {
              console.error('Error marking formation as completed:', error);
              toast({
                title: "Error",
                description: "Failed to update formation status.",
                variant: "destructive",
              });
            }
          }
        }}
      />
      
    </div>
  );
};

export default TrainingManagement;
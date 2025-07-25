import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { VoiceCommandButton } from '@/components/VoiceCommandButton';
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
  MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TaskItem {
  id: string;
  title: string;
  type: 'incident' | 'client_request' | 'follow_up' | 'internal_task';
  priority: 'normal' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed';
  description?: string;
  assignedTo?: string;
  dueDate?: string;
  location?: string;
  guestName?: string;
  roomNumber?: string;
  recipient?: string;
}

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
        label: 'Demande client' 
      };
    case 'follow_up':
      return { 
        icon: Clock, 
        color: 'bg-palace-navy text-warm-cream',
        label: 'Relance' 
      };
    case 'internal_task':
      return { 
        icon: Wrench, 
        color: 'bg-muted text-muted-foreground',
        label: 'Tâche interne' 
      };
    default:
      return { 
        icon: Wrench, 
        color: 'bg-muted text-muted-foreground',
        label: 'Tâche' 
      };
  }
};

const TaskCard = ({ task, onStatusChange }: { task: TaskItem; onStatusChange: (taskId: string, newStatus: string) => void }) => {
  const typeConfig = getTypeConfig(task.type);
  const TypeIcon = typeConfig.icon;

  return (
    <Card className="mb-4 transition-all duration-200 hover:shadow-md cursor-grab">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("p-1.5 rounded-full", typeConfig.color)}>
              <TypeIcon className="h-4 w-4" />
            </div>
            <Badge variant="outline" className="text-xs">
              {typeConfig.label}
            </Badge>
          </div>
          {task.priority === 'urgent' && (
            <Badge className="bg-urgence-red text-warm-cream">
              Urgent
            </Badge>
          )}
        </div>
        <CardTitle className="text-sm font-medium leading-5">
          {task.title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        {task.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {task.description}
          </p>
        )}
        
        <div className="space-y-2">
          {task.guestName && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span>{task.guestName}</span>
            </div>
          )}
          
          {task.roomNumber && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>Chambre {task.roomNumber}</span>
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
              <span>{new Date(task.dueDate).toLocaleDateString('fr-FR')}</span>
            </div>
          )}
          
          {task.recipient && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span>→ {task.recipient}</span>
            </div>
          )}
        </div>

        {/* Status change buttons */}
        <div className="flex gap-2 mt-4">
          {task.status === 'pending' && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onStatusChange(task.id, 'in_progress')}
              className="flex-1 text-xs"
            >
              Démarrer
            </Button>
          )}
          {task.status === 'in_progress' && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onStatusChange(task.id, 'completed')}
              className="flex-1 text-xs"
            >
              Terminer
            </Button>
          )}
          {task.status === 'completed' && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onStatusChange(task.id, 'in_progress')}
              className="flex-1 text-xs"
            >
              Rouvrir
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const KanbanColumn = ({ 
  title, 
  tasks, 
  status, 
  onStatusChange 
}: { 
  title: string; 
  tasks: TaskItem[]; 
  status: string;
  onStatusChange: (taskId: string, newStatus: string) => void;
}) => {
  const filteredTasks = tasks.filter(task => task.status === status);

  return (
    <div className="flex-1">
      <div className="bg-muted/50 rounded-lg p-4 h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">{title}</h3>
          <Badge variant="secondary" className="text-sm">
            {filteredTasks.length}
          </Badge>
        </div>
        
        <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
          {filteredTasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onStatusChange={onStatusChange}
            />
          ))}
          
          {filteredTasks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Aucune tâche</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ShiftManagement = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [shiftStatus, setShiftStatus] = useState<'not_started' | 'active' | 'closed'>('not_started');
  const { toast } = useToast();

  // Load tasks from Supabase
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      // Load incidents
      const { data: incidents } = await supabase
        .from('incidents')
        .select('*')
        .eq('status', 'open');

      // Load special requests  
      const { data: requests } = await supabase
        .from('special_requests')
        .select('*')
        .neq('preparation_status', 'completed');

      // Load follow ups
      const { data: followUps } = await supabase
        .from('follow_ups')
        .select('*')
        .eq('status', 'pending');

      // Load tasks
      const { data: internalTasks } = await supabase
        .from('tasks')
        .select('*')
        .neq('status', 'completed');

      const allTasks: TaskItem[] = [
        ...(incidents || []).map(incident => ({
          id: incident.id,
          title: incident.title,
          type: 'incident' as const,
          priority: (incident.priority as 'normal' | 'urgent') || 'normal',
          status: (incident.status === 'open' ? 'pending' : 
                  incident.status === 'in_progress' ? 'in_progress' : 'completed') as 'pending' | 'in_progress' | 'completed',
          description: incident.description,
        })),
        ...(requests || []).map(request => ({
          id: request.id,
          title: `Demande - ${request.guest_name}`,
          type: 'client_request' as const,
          priority: 'normal' as const,
          status: (request.preparation_status === 'to_prepare' ? 'pending' : 
                  request.preparation_status === 'in_progress' ? 'in_progress' : 'completed') as 'pending' | 'in_progress' | 'completed',
          description: request.request_details,
          guestName: request.guest_name,
          roomNumber: request.room_number,
        })),
        ...(followUps || []).map(followUp => ({
          id: followUp.id,
          title: followUp.title,
          type: 'follow_up' as const,
          priority: 'normal' as const,
          status: 'pending' as const,
          description: followUp.notes,
          recipient: followUp.recipient,
          dueDate: followUp.due_date,
        })),
        ...(internalTasks || []).map(task => ({
          id: task.id,
          title: task.title,
          type: 'internal_task' as const,
          priority: (task.priority as 'normal' | 'urgent') || 'normal',
          status: (task.status === 'pending' ? 'pending' : 
                  task.status === 'in_progress' ? 'in_progress' : 'completed') as 'pending' | 'in_progress' | 'completed',
          description: task.description,
          location: task.location,
          dueDate: task.due_date,
        }))
      ];

      setTasks(allTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les tâches",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      // Update in Supabase based on task type
      switch (task.type) {
        case 'incident':
          await supabase
            .from('incidents')
            .update({ status: newStatus === 'completed' ? 'resolved' : newStatus })
            .eq('id', taskId);
          break;
        case 'client_request':
          await supabase
            .from('special_requests')
            .update({ 
              preparation_status: newStatus === 'pending' ? 'to_prepare' :
                                newStatus === 'in_progress' ? 'in_progress' : 'completed'
            })
            .eq('id', taskId);
          break;
        case 'follow_up':
          await supabase
            .from('follow_ups')
            .update({ status: newStatus })
            .eq('id', taskId);
          break;
        case 'internal_task':
          await supabase
            .from('tasks')
            .update({ status: newStatus })
            .eq('id', taskId);
          break;
      }

      // Update local state
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, status: newStatus as any } : t
      ));

      toast({
        title: "Succès",
        description: "Statut mis à jour",
        variant: "default",
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    }
  };

  const handleShiftAction = (action: 'start' | 'improve' | 'close') => {
    switch (action) {
      case 'start':
        setShiftStatus('active');
        toast({
          title: "Shift démarré",
          description: "Votre shift a été démarré avec succès",
          variant: "default",
        });
        break;
      case 'improve':
        toast({
          title: "Amélioration",
          description: "Fonctionnalité d'amélioration en cours de développement",
          variant: "default",
        });
        break;
      case 'close':
        setShiftStatus('closed');
        toast({
          title: "Shift clôturé",
          description: "Votre shift a été clôturé avec succès",
          variant: "default",
        });
        break;
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
              Gestion de votre shift
            </h1>
            <p className="text-muted-foreground">
              Gérez vos tâches et activités durant votre shift
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
              {shiftStatus === 'active' ? 'Shift actif' : 'Démarrage de shift'}
            </Button>
            
            <Button
              onClick={() => handleShiftAction('improve')}
              variant="outline"
              className="h-12 text-base"
            >
              <Target className="h-5 w-5 mr-2" />
              Amélioration de votre travail
            </Button>
            
            <Button
              onClick={() => handleShiftAction('close')}
              disabled={shiftStatus !== 'active'}
              variant="destructive"
              className="h-12 text-base"
            >
              <StopCircle className="h-5 w-5 mr-2" />
              Clôture de shift
            </Button>
          </div>

          {/* Kanban Board */}
          <div className="grid grid-cols-3 gap-6">
            <KanbanColumn
              title="À traiter"
              tasks={tasks}
              status="pending"
              onStatusChange={handleStatusChange}
            />
            
            <KanbanColumn
              title="En cours"
              tasks={tasks}
              status="in_progress"
              onStatusChange={handleStatusChange}
            />
            
            <KanbanColumn
              title="Résolu"
              tasks={tasks}
              status="completed"
              onStatusChange={handleStatusChange}
            />
          </div>

        </div>
      </main>
      
      {/* Floating Voice Command Button */}
      <VoiceCommandButton />
    </div>
  );
};

export default ShiftManagement;
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { 
  StopCircle, 
  CheckCircle,
  Clock,
  AlertTriangle,
  Users,
  TrendingUp
} from 'lucide-react';
import { TaskItem } from '@/types/database';
import { CardFaceModal } from '@/components/shared/CardFaceModal';
import { formatTimeElapsed } from '@/utils/timeUtils';

interface ServiceShiftCloseModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  onCardClick: (task: TaskItem) => void;
}

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

const ServiceShiftCloseModal = ({
  isOpen,
  onClose,
  tasks,
  onCardClick
}: ServiceShiftCloseModalProps) => {
  
  // Calculer les statistiques du shift
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    verified: tasks.filter(t => t.status === 'verified').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    pending: tasks.filter(t => t.status === 'pending').length
  };

  const completionRate = stats.total > 0 ? Math.round(((stats.completed + stats.verified) / stats.total) * 100) : 0;
  
  // Tâches non terminées
  const unfinishedTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-3">
            <StopCircle className="w-6 h-6 text-red-600" />
            End Service Shift - Summary
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6">
          {/* Statistiques du shift */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-2xl font-bold text-green-600">
                    {stats.verified}
                  </span>
                </div>
                <p className="text-sm text-green-700">Verified</p>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <span className="text-2xl font-bold text-blue-600">
                    {stats.completed}
                  </span>
                </div>
                <p className="text-sm text-blue-700">Resolved</p>
              </CardContent>
            </Card>

            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <span className="text-2xl font-bold text-yellow-600">
                    {stats.inProgress}
                  </span>
                </div>
                <p className="text-sm text-yellow-700">In Progress</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-gray-600" />
                  <span className="text-2xl font-bold text-gray-600">
                    {stats.pending}
                  </span>
                </div>
                <p className="text-sm text-gray-700">To Process</p>
              </CardContent>
            </Card>
          </div>

          {/* Résumé de performance */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                  <div>
                    <h3 className="font-semibold">Service Shift Performance</h3>
                    <p className="text-sm text-muted-foreground">
                      {stats.total} tâches totales • {completionRate}% completion rate
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{completionRate}%</div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tâches non terminées */}
          {unfinishedTasks.length > 0 && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <h3 className="font-semibold">Tâches non terminées ({unfinishedTasks.length})</h3>
                </div>
                
                <ScrollArea className="max-h-64">
                  <div className="space-y-3">
                    {unfinishedTasks.map(task => {
                      const transformedTask = transformTaskForCard(task);
                      return (
                        <div key={task.id} className="border rounded-lg p-2">
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
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Message de fin de shift */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-blue-900 mb-2">
                Service Shift Ready to Close
              </h3>
              <p className="text-sm text-blue-700">
                {unfinishedTasks.length === 0 
                  ? "Toutes les tâches ont été terminées avec succès !" 
                  : `${unfinishedTasks.length} tâche(s) seront transférées au prochain shift.`
                }
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="border-t p-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            Service shift summary • {completionRate}% completion
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose}>
              Continue Working
            </Button>
            <Button onClick={onClose} variant="destructive">
              <StopCircle className="w-4 h-4 mr-2" />
              End Service Shift
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceShiftCloseModal;
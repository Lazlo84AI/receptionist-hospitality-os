import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { CardFaceModal } from '@/components/shared/CardFaceModal';
import { useTasks } from '@/hooks/useSupabaseData';
import { TaskItem } from '@/types/database';
import { formatTimeElapsed, getTimeElapsedColor } from '@/utils/timeUtils';
import EnhancedTaskDetailModal from '@/components/modals/EnhancedTaskDetailModal';

// Transform database TaskItem (incident) to UI format - MÊME STRUCTURE QUE CLIENT REQUESTS
const transformIncident = (incident: TaskItem) => ({
  id: incident.id,
  clientName: incident.title, // Le titre devient le "nom client"
  room: incident.location || 'Unknown Location',
  request: incident.description || incident.title,
  occasion: incident.description || '',
  status: incident.status === 'pending' ? 'To Process' : 
          incident.status === 'in_progress' ? 'In Progress' : 
          incident.status === 'completed' ? 'Completed' : 'Cancelled',
  gouvernante: incident.assignedTo || 'Unassigned',
  avatar: incident.assignedTo ? incident.assignedTo.split(' ').map(n => n[0]).join('') : 'UN',
  timeElapsed: formatTimeElapsed(incident.created_at),
  priority: incident.priority === 'urgent' ? 'URGENCE' : 'NORMAL',
  created_at: incident.created_at,
  updated_at: incident.updated_at,
  originalTask: incident // Keep reference to original TaskItem
});

export function IncidentsCard() {
  const { tasks, loading, error, refetch } = useTasks();
  
  // Filter incidents from all tasks
  const incidents = tasks
    .filter(task => task.type === 'incident')
    .map(transformIncident);

  // State pour la modale - EXACTEMENT COMME SHIFT MANAGEMENT
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);

  // Handler de click - EXACTEMENT COMME SHIFT MANAGEMENT
  const handleIncidentClick = (incidentItem: ReturnType<typeof transformIncident>) => {
    setSelectedTask(incidentItem.originalTask);
    setIsTaskDetailOpen(true);
  };



  if (loading) {
    return (
      <div className="bg-card rounded-lg border shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Ongoing Incidents</h2>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-lg border shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Ongoing Incidents</h2>
        </div>
        <div className="text-center text-muted-foreground">
          Error loading incidents: {error}
        </div>
      </div>
    );
  }

  const urgentCount = incidents.filter(incident => incident.priority === 'URGENCE').length;
  const inProgressCount = incidents.filter(incident => incident.status === 'In Progress').length;
  const toProcessCount = incidents.filter(incident => incident.status === 'To Process').length;
  const completedCount = incidents.filter(incident => incident.status === 'Completed').length;

  return (
    <>
      <div className="luxury-card p-6 col-span-full lg:col-span-2">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-playfair font-semibold text-hotel-navy">
                Ongoing Incidents
              </h2>
              <p className="text-sm text-hotel-navy/60">
                Technical issues and maintenance
              </p>
            </div>
          </div>
          <span className="text-sm text-hotel-navy/60 font-medium">
            {incidents.length} requests
          </span>
        </div>

        {incidents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No ongoing incidents</p>
            <p className="text-xs mt-1">All incidents have been resolved!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {incidents.map((incident) => (
              <CardFaceModal
                key={incident.id}
                id={incident.id}
                title={incident.clientName}
                location={incident.room}
                clientName={undefined} // Pas de nom client pour les incidents
                status={incident.status as any}
                priority={incident.priority as any}
                assignedTo={incident.gouvernante}
                timeElapsed={incident.timeElapsed}
                onClick={() => handleIncidentClick(incident)}
              />
            ))}

          </div>
        )}

        <div className="mt-6 pt-4 border-t border-hotel-navy/20">
          <div className="flex items-center justify-between text-sm">
            <span className="text-hotel-navy/60">Today's Status:</span>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 rounded-full bg-hotel-gold-dark" />
                <span className="text-xs">{toProcessCount} to process</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 rounded-full bg-gray-300" />
                <span className="text-xs">{inProgressCount} in progress</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 rounded-full bg-white border border-gray-200" />
                <span className="text-xs">{completedCount} completed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Task Detail Modal - EXACTEMENT COMME SHIFT MANAGEMENT */}
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
    </>
  );
}
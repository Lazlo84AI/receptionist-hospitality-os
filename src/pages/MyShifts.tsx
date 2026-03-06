import { useState } from 'react';
import { FileText, Mic, ChevronDown, ChevronRight, Loader2, AlertCircle, AlertTriangle, Heart, Clock, UserCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { ShiftFacingCard } from '@/components/cards/ShiftFacingCard';
import EnhancedTaskDetailModal from '@/components/modals/EnhancedTaskDetailModal';
import { useTeamShifts } from '@/hooks/useTeamShifts';
import { format } from 'date-fns';
import { TaskItem } from '@/types/database';

const MyShifts = () => {
  const [expandedShift, setExpandedShift] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const { shifts, loading, error, userService, staffMap } = useTeamShifts();

  // Transformer une task du handover_data en TaskItem
  const transformToTaskItem = (task: any): TaskItem => {
    return {
      id: task.id,
      title: task.title || task.data?.title || 'Untitled',
      description: task.description || task.data?.description,
      status: task.status || task.data?.status || 'pending',
      priority: task.priority || task.data?.priority || 'normal',
      type: task.data?.category || task.category || task.type || task.data?.type || 'internal_task',
      roomNumber: task.location || task.data?.location,
      location: task.location || task.data?.location,
      guestName: task.guestName || task.data?.guestName,
      assignedTo: (() => {
        const creatorId = task.created_by || task.data?.created_by;
        const assignedIds: string[] = task.assigned_to || task.data?.assigned_to || [];
        const creatorName = creatorId ? (staffMap[creatorId] || creatorId) : '';
        const assignedNames = assignedIds.map((id: string) => staffMap[id] || id).join(', ');
        if (creatorName && assignedNames) return `${creatorName} \u2192 ${assignedNames}`;
        if (creatorName) return creatorName;
        if (assignedNames) return assignedNames;
        return 'Unassigned';
      })(),
      created_at: task.created_at || task.data?.created_at || new Date().toISOString(),
      updated_at: task.updated_at || task.data?.updated_at || new Date().toISOString(),
      created_by: task.created_by || task.data?.created_by || '',
      service: 'reception'
    };
  };

  // Trier les tasks : completed → in_progress → pending
  const sortTasks = (tasks: any[]) => {
    // Créer une copie pour ne pas modifier l'original
    const tasksCopy = [...tasks];
    const statusOrder = { 'completed': 0, 'in_progress': 1, 'pending': 2 };
    
    return tasksCopy.sort((a, b) => {
      // Récupérer le statut en gérant les deux structures possibles
      const statusA = (a.status || a.data?.status || 'pending').toLowerCase();
      const statusB = (b.status || b.data?.status || 'pending').toLowerCase();
      
      // Obtenir l'ordre (défaut 3 pour les statuts inconnus)
      const orderA = statusOrder[statusA as keyof typeof statusOrder] ?? 3;
      const orderB = statusOrder[statusB as keyof typeof statusOrder] ?? 3;
      
      return orderA - orderB;
    });
  };

  // Obtenir les types uniques de cartes dans un shift et leurs configs
  const getUniqueTaskTypes = (tasks: any[]) => {
    const types = new Set<string>();
    tasks.forEach(task => {
      const type = task.data?.category || task.category || task.type || task.data?.type || 'internal_task';
      types.add(type);
    });
    return Array.from(types);
  };

  // Configuration des types avec icônes
  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'incident':
        return { 
          Icon: AlertTriangle, 
          color: 'text-red-500',
          label: 'incident'
        };
      case 'client_request':
        return { 
          Icon: Heart, 
          color: 'text-green-500',
          label: 'client request'
        };
      case 'follow_up':
        return { 
          Icon: Clock, 
          color: 'text-gray-500',
          label: 'follow up'
        };
      case 'internal_task':
      case 'personal_task':
        return { 
          Icon: UserCircle, 
          color: 'text-yellow-500',
          label: 'internal task'
        };
      default:
        return { 
          Icon: FileText, 
          color: 'text-gray-400',
          label: 'task'
        };
    }
  };

  const handleCardClick = (task: any) => {
    const taskItem = transformToTaskItem(task);
    setSelectedTask(taskItem);
    setIsTaskModalOpen(true);
  };

  const formatShiftDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'EEEE, MMMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  const formatShiftTime = (startTime: string, endTime: string) => {
    try {
      const start = format(new Date(startTime), 'HH:mm');
      const end = format(new Date(endTime), 'HH:mm');
      return `${start} - ${end}`;
    } catch {
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        
        <div className="bg-white border-b border-champagne-gold/20">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <h1 className="text-2xl font-playfair font-semibold text-palace-navy">
              View {userService} shifts
            </h1>
            <p className="text-palace-navy/70 text-sm mt-1">
              Team shifts from {userService} service - Last 3 days
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6 flex items-center justify-center">
          <div className="flex items-center gap-3 text-palace-navy">
            <Loader2 className="h-6 w-6 animate-spin text-champagne-gold" />
            <span>Loading shifts...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        
        <div className="bg-white border-b border-champagne-gold/20">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <h1 className="text-2xl font-playfair font-semibold text-palace-navy">
              My Shifts
            </h1>
            <p className="text-palace-navy/70 text-sm mt-1">
              History of your recent shifts
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load shifts: {error}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* Title Section with white background */}
      <div className="bg-white border-b border-champagne-gold/20">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-playfair font-semibold text-palace-navy">
            View {userService} shifts
          </h1>
          <p className="text-palace-navy/70 text-sm mt-1">
            Team shifts from {userService} service - Last 3 days
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {shifts.length === 0 ? (
          <Card className="bg-palace-navy/95 border border-champagne-gold/20">
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-champagne-gold mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-warm-cream mb-2">
                No shifts found
              </h3>
              <p className="text-soft-pewter">
                No completed shifts in the last 3 days.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {shifts.map((shift) => (
              <Card key={shift.id} className="bg-palace-navy/95 border border-champagne-gold/20">
                <Collapsible 
                  open={expandedShift === shift.id}
                  onOpenChange={() => setExpandedShift(expandedShift === shift.id ? null : shift.id)}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-palace-navy/80 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-warm-cream flex items-center gap-3">
                            <FileText className="h-5 w-5 text-champagne-gold" />
                            Shift on {formatShiftDate(shift.end_time)}
                          </CardTitle>
                          <p className="text-soft-pewter text-sm mt-1">
                            {formatShiftTime(shift.start_time, shift.end_time)}
                          </p>
                          <p className="text-champagne-gold text-sm mt-1">
                            {shift.full_name}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" className="text-champagne-gold hover:text-warm-cream">
                          {expandedShift === shift.id ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="space-y-6 bg-palace-navy">
                      {/* Voice note section */}
                      {(shift.voice_note_url || shift.voice_note_transcription || shift.handover_notes) && (
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold text-warm-cream flex items-center gap-2">
                            <Mic className="h-4 w-4 text-champagne-gold" />
                            Voice note & Handover
                          </h3>
                          <div className="bg-palace-navy/50 border border-champagne-gold/20 rounded-lg p-4">
                            {shift.voice_note_url && (
                              <div className="mb-3">
                                <Badge variant="outline" className="border-champagne-gold/30 text-champagne-gold mb-2">
                                  Audio Recording
                                </Badge>
                                <audio controls className="w-full mt-2">
                                  <source src={shift.voice_note_url} type="audio/wav" />
                                  Your browser does not support the audio element.
                                </audio>
                              </div>
                            )}
                            {shift.voice_note_transcription && (
                              <div className="mb-3">
                                <p className="text-warm-cream text-sm font-medium mb-1">Transcription:</p>
                                <p className="text-warm-cream">{shift.voice_note_transcription}</p>
                              </div>
                            )}
                            {shift.handover_notes && shift.handover_notes !== 'No handover notes' && (
                              <div>
                                <p className="text-warm-cream text-sm font-medium mb-1">Notes:</p>
                                <p className="text-warm-cream">{shift.handover_notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Cards of the shift */}
                      {shift.handover_data?.all_tasks && shift.handover_data.all_tasks.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-warm-cream flex items-center gap-2">
                              <FileText className="h-4 w-4 text-champagne-gold" />
                              Cards of the shift
                            </h3>
                            <span className="text-sm italic font-normal text-warm-cream/70 flex items-center gap-1">
                              (
                              {getUniqueTaskTypes(shift.handover_data.all_tasks).map((type, index, array) => {
                                const config = getTypeConfig(type);
                                const IconComponent = config.Icon;
                                return (
                                  <span key={type} className="inline-flex items-center gap-1">
                                    <IconComponent className={`h-3.5 w-3.5 ${config.color}`} />
                                    <span>{config.label}</span>
                                    {index < array.length - 1 && <span className="mr-1">,</span>}
                                  </span>
                                );
                              })}
                              )
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {sortTasks(shift.handover_data.all_tasks).map((task: any) => {
                              const taskItem = transformToTaskItem(task);
                              return (
                                <ShiftFacingCard
                                  key={taskItem.id}
                                  task={taskItem}
                                  onClick={() => handleCardClick(task)}
                                />
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Summary statistics */}
                      {shift.handover_data?.total_tasks_count && (
                        <div className="bg-palace-navy/50 border border-champagne-gold/20 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-warm-cream font-medium">Total Tasks</span>
                            <Badge variant="outline" className="border-champagne-gold/30 text-champagne-gold">
                              {shift.handover_data.total_tasks_count}
                            </Badge>
                          </div>
                          {shift.handover_data.tasks_by_status && (
                            <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                              {shift.handover_data.tasks_by_status.completed && (
                                <div className="text-center">
                                  <div className="text-green-400 font-semibold">
                                    {shift.handover_data.tasks_by_status.completed.length}
                                  </div>
                                  <div className="text-soft-pewter text-xs">Completed</div>
                                </div>
                              )}
                              {shift.handover_data.tasks_by_status.in_progress && (
                                <div className="text-center">
                                  <div className="text-yellow-400 font-semibold">
                                    {shift.handover_data.tasks_by_status.in_progress.length}
                                  </div>
                                  <div className="text-soft-pewter text-xs">In Progress</div>
                                </div>
                              )}
                              {shift.handover_data.tasks_by_status.pending && (
                                <div className="text-center">
                                  <div className="text-blue-400 font-semibold">
                                    {shift.handover_data.tasks_by_status.pending.length}
                                  </div>
                                  <div className="text-soft-pewter text-xs">Pending</div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      <EnhancedTaskDetailModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        forceDetailView={true}
      />
    </div>
  );
};

export default MyShifts;

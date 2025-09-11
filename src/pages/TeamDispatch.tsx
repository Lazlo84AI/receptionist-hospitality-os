import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { CardFaceModal } from '@/components/shared/CardFaceModal';
import EnhancedTaskDetailModal from '@/components/modals/EnhancedTaskDetailModal';
import { useTasks, useProfiles } from '@/hooks/useSupabaseData';
import { formatTimeElapsed } from '@/utils/timeUtils';
import { 
  Users, 
  User, 
  Utensils, 
  Shield,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import type { TaskItem, Profile } from '@/types/database';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  icon: React.ElementType;
  color: string;
  status: 'active' | 'break' | 'offline';
  profile?: Profile;
}

const TeamDispatch = () => {
  // TOUS LES HOOKS EN PREMIER
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentColumnIndex, setCurrentColumnIndex] = useState(0);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  
  // Hooks de données
  const { tasks, loading: tasksLoading, error: tasksError, refetch } = useTasks();
  const { profiles, loading: profilesLoading, error: profilesError } = useProfiles();
  
  // Configuration des colonnes avec nouvelles couleurs
  const teamMemberConfig = [
    { role: "femme_de_chambre", icon: User, color: "bg-hotel-sand/30 border-hotel-sand" },
    { role: "femme_de_chambre", icon: User, color: "bg-hotel-sand/40 border-hotel-sand" },
    { role: "femme_de_chambre", icon: User, color: "bg-hotel-sand/50 border-hotel-sand" },
    { role: "femme_de_chambre", icon: User, color: "bg-hotel-sand/60 border-hotel-sand" },
    { role: "restauration", icon: Utensils, color: "bg-hotel-yellow/20 border-hotel-yellow/50" },
    { role: "security", icon: Shield, color: "bg-hotel-navy/10 border-hotel-navy/30" }
  ];

  // Memoized team members avec nouvelles couleurs
  const teamMembers = useMemo((): TeamMember[] => {
    if (!profiles) return [];
    
    return profiles.map((profile, index) => ({
      id: profile.id,
      name: profile.full_name || profile.email || 'Unknown',
      role: profile.role || 'staff',
      icon: teamMemberConfig[index % teamMemberConfig.length]?.icon || User,
      color: teamMemberConfig[index % teamMemberConfig.length]?.color || "bg-hotel-sand/30 border-hotel-sand",
      status: 'active' as const,
      profile
    }));
  }, [profiles]);

  // Memoized task assignments
  const taskAssignments = useMemo(() => {
    const assignments: Record<string, TaskItem[]> = {};
    
    // Initialize empty arrays for all team members
    teamMembers.forEach(member => {
      assignments[member.id] = [];
    });
    
    // Add unassigned column
    assignments['unassigned'] = [];
    
    // Group tasks by assignee
    tasks.forEach(task => {
      if (task.assignedToUserId && assignments[task.assignedToUserId]) {
        assignments[task.assignedToUserId].push(task);
      } else {
        assignments['unassigned'].push(task);
      }
    });
    
    return assignments;
  }, [tasks, teamMembers]);

  const handleTaskClick = (task: TaskItem) => {
    setSelectedTask(task);
    setIsTaskDetailOpen(true);
  };

  // Pagination pour colonnes
  const COLUMNS_PER_PAGE = 4;
  const totalColumns = teamMembers.length + 1; // +1 for unassigned
  const maxPage = Math.max(0, Math.ceil(totalColumns / COLUMNS_PER_PAGE) - 1);

  const nextPage = () => {
    setCurrentColumnIndex(prev => Math.min(prev + COLUMNS_PER_PAGE, maxPage * COLUMNS_PER_PAGE));
  };

  const prevPage = () => {
    setCurrentColumnIndex(prev => Math.max(prev - COLUMNS_PER_PAGE, 0));
  };

  const visibleColumns = [
    ...teamMembers.slice(currentColumnIndex, currentColumnIndex + COLUMNS_PER_PAGE),
    ...(currentColumnIndex + COLUMNS_PER_PAGE > teamMembers.length ? [{ 
      id: 'unassigned', 
      name: 'Non Assigné', 
      role: 'unassigned', 
      icon: Users, 
      color: 'bg-gray-50 border-gray-200', 
      status: 'active' as const 
    }] : [])
  ].slice(0, COLUMNS_PER_PAGE);

  if (tasksLoading || profilesLoading) {
    return (
      <div className="min-h-screen bg-hotel-white">
        <Header onMenuToggle={() => setSidebarOpen(true)} />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-hotel-yellow" />
              <span className="ml-2 text-hotel-navy">Loading team dispatch...</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hotel-white">
      <Header onMenuToggle={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-hotel-navy mb-2">
                Team Dispatch
              </h1>
              <p className="text-hotel-navy/70 text-lg">
                Task assignment and team coordination
              </p>
            </div>
            
            {/* Navigation Controls */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={prevPage}
                disabled={currentColumnIndex === 0}
                className="border-hotel-yellow text-hotel-navy hotel-hover"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-hotel-navy/70">
                {Math.floor(currentColumnIndex / COLUMNS_PER_PAGE) + 1} / {maxPage + 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={nextPage}
                disabled={currentColumnIndex >= maxPage * COLUMNS_PER_PAGE}
                className="border-hotel-yellow text-hotel-navy hotel-hover"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Error States */}
          {(tasksError || profilesError) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">
                Error loading data: {tasksError || profilesError}
              </p>
            </div>
          )}

          {/* Team Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="hotel-column">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-hotel-navy/70">Total Tasks</p>
                  <p className="text-2xl font-bold text-hotel-navy">{tasks.length}</p>
                </div>
                <Users className="h-8 w-8 text-hotel-yellow" />
              </div>
            </div>

            <div className="hotel-column">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-hotel-navy/70">Team Members</p>
                  <p className="text-2xl font-bold text-hotel-navy">{teamMembers.length}</p>
                </div>
                <User className="h-8 w-8 text-hotel-yellow" />
              </div>
            </div>

            <div className="hotel-column">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-hotel-navy/70">Pending</p>
                  <p className="text-2xl font-bold text-hotel-navy">
                    {tasks.filter(t => t.status === 'pending').length}
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-hotel-yellow/20 flex items-center justify-center">
                  <div className="h-4 w-4 rounded-full bg-hotel-yellow"></div>
                </div>
              </div>
            </div>

            <div className="hotel-column">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-hotel-navy/70">Urgent</p>
                  <p className="text-2xl font-bold text-hotel-navy">
                    {tasks.filter(t => t.priority === 'urgent').length}
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                  <div className="h-4 w-4 rounded-full bg-red-500"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Team Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {visibleColumns.map((member) => {
              const memberTasks = member.id === 'unassigned' 
                ? taskAssignments['unassigned'] || []
                : taskAssignments[member.id] || [];
              
              const Icon = member.icon;
              
              return (
                <div key={member.id} className="hotel-column h-fit">
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={cn("p-2 rounded-lg", member.color)}>
                        <Icon className="h-5 w-5 text-hotel-navy" />
                      </div>
                      <div>
                        <h3 className="font-medium text-hotel-navy">
                          {member.name}
                        </h3>
                        <p className="text-sm text-hotel-navy/60 capitalize">
                          {member.role.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-hotel-sand/50 text-hotel-navy">
                      {memberTasks.length}
                    </Badge>
                  </div>

                  {/* Tasks List */}
                  <ScrollArea className="max-h-96">
                    <div className="space-y-3">
                      {memberTasks.length === 0 ? (
                        <div className="text-center py-8 text-hotel-navy/50">
                          <p className="text-sm">No assigned tasks</p>
                        </div>
                      ) : (
                        memberTasks.map((task) => (
                          <div
                            key={task.id}
                            onClick={() => handleTaskClick(task)}
                            className="bg-white rounded-lg border p-4 hotel-hover cursor-pointer transition-all duration-200"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium text-hotel-navy text-sm">
                                {task.title}
                              </h4>
                              {task.priority === 'urgent' && (
                                <Badge variant="destructive" className="text-xs">
                                  URGENT
                                </Badge>
                              )}
                            </div>
                            
                            {task.location && (
                              <p className="text-xs text-hotel-navy/60 mb-2">
                                📍 {task.location}
                              </p>
                            )}
                            
                            <div className="flex items-center justify-between text-xs">
                              <span className={cn(
                                "px-2 py-1 rounded",
                                task.status === 'pending' && "bg-hotel-yellow/20 text-hotel-navy",
                                task.status === 'in_progress' && "bg-blue-100 text-blue-800",
                                task.status === 'completed' && "bg-green-100 text-green-800"
                              )}>
                                {task.status.replace('_', ' ')}
                              </span>
                              <span className="text-hotel-navy/60">
                                {formatTimeElapsed(task.created_at)}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Enhanced Task Detail Modal */}
      {selectedTask && (
        <EnhancedTaskDetailModal
          isOpen={isTaskDetailOpen}
          onClose={() => {
            setIsTaskDetailOpen(false);
            setSelectedTask(null);
          }}
          task={selectedTask}
          onTaskUpdate={() => {
            refetch();
          }}
        />
      )}
    </div>
  );
};

export default TeamDispatch;

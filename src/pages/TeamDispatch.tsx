import React, { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { CardFaceModal } from '@/components/shared/CardFaceModal';
import EnhancedTaskDetailModal from '@/components/modals/EnhancedTaskDetailModal';
import { VoiceCommandButton } from '@/components/VoiceCommandButton';
import { useTasks, useProfiles } from '@/hooks/useSupabaseData';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatTimeElapsed } from '@/utils/timeUtils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Users,
  User,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  X,
  Edit,
  Wrench,
  Key,
  Bed,
  Utensils,
  Shield,
  ClipboardList,
  SprayCan
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
  columnIndex?: number;
  isEmpty?: boolean;
}

const TeamDispatch = () => {
  // TOUS LES HOOKS EN PREMIER
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentColumnIndex, setCurrentColumnIndex] = useState(0);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  
  // Récupération du user connecté
  const { user } = useAuth();
  
  // Nouveaux états pour la gestion des colonnes
  // Persistance Supabase : hydratation depuis user_view_configurations au montage
  const [selectedColumns, setSelectedColumns] = useState<(string | null)[]>([null]);
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);
  const [isSelectingMember, setIsSelectingMember] = useState(false);
  const [editingColumnIndex, setEditingColumnIndex] = useState<number | null>(null);
  // État pour le bandeau mobile collapsible
  const [isMobileStatsExpanded, setIsMobileStatsExpanded] = useState(false);

  // 1. Chargement initial des colonnes depuis Supabase (au montage / changement user)
  //    Avec migration douce : si Supabase vide mais localStorage contient une config, on l'hydrate.
  useEffect(() => {
    if (!user) return;

    const loadConfig = async () => {
      const { data, error } = await supabase
        .from('user_view_configurations')
        .select('team_dispatch_columns')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading view config:', error);
        setIsConfigLoaded(true);
        return;
      }

      if (data?.team_dispatch_columns) {
        // Config Supabase existante -> on l'utilise comme source de vérité
        setSelectedColumns(data.team_dispatch_columns as (string | null)[]);
      } else {
        // Pas de config Supabase -> fallback migration douce depuis localStorage
        try {
          const legacy = localStorage.getItem('teamDispatch_columns');
          if (legacy) {
            const parsed = JSON.parse(legacy);
            setSelectedColumns(parsed);
            // On pousse immédiatement vers Supabase pour les futurs devices
            await supabase.from('user_view_configurations').upsert({
              user_id: user.id,
              team_dispatch_columns: parsed,
            }, { onConflict: 'user_id' });
          }
        } catch {
          // localStorage indisponible, on reste sur [null]
        }
      }

      setIsConfigLoaded(true);
    };

    loadConfig();
  }, [user]);

  // 2. Sauvegarde automatique vers Supabase à chaque changement (après hydratation)
  useEffect(() => {
    if (!user || !isConfigLoaded) return;

    const saveConfig = async () => {
      const { error } = await supabase
        .from('user_view_configurations')
        .upsert({
          user_id: user.id,
          team_dispatch_columns: selectedColumns,
        }, { onConflict: 'user_id' });

      if (error) console.error('Error saving view config:', error);
    };

    saveConfig();
  }, [selectedColumns, user, isConfigLoaded]);
  
  // Hooks de données
  const { tasks, loading: tasksLoading, error: tasksError, refetch } = useTasks();
  const { profiles, loading: profilesLoading, error: profilesError } = useProfiles();
  
  // Configuration des colonnes avec nouvelles couleurs
  const teamMemberConfig = [
    { role: "femme_de_chambre", icon: User, color: "bg-[#E0D3B4]/30 border-[#E0D3B4]" },
    { role: "femme_de_chambre", icon: User, color: "bg-[#E0D3B4]/40 border-[#E0D3B4]" },
    { role: "femme_de_chambre", icon: User, color: "bg-[#E0D3B4]/50 border-[#E0D3B4]" },
    { role: "femme_de_chambre", icon: User, color: "bg-[#E0D3B4]/60 border-[#E0D3B4]" },
    { role: "restauration", icon: Utensils, color: "bg-[#DEAE53]/20 border-[#DEAE53]/50" },
    { role: "security", icon: Shield, color: "bg-[#1E1A37]/10 border-[#1E1A37]/30" }
  ];

  // Memoized team members avec nouvelles couleurs
  const teamMembers = useMemo((): TeamMember[] => {
    if (!profiles) return [];
    
    return profiles.map((profile, index) => ({
      id: profile.id,
      name: profile.full_name || profile.email || 'Unknown',
      role: profile.role || 'staff',
      icon: teamMemberConfig[index % teamMemberConfig.length]?.icon || User,
      color: teamMemberConfig[index % teamMemberConfig.length]?.color || "bg-[#E0D3B4]/30 border-[#E0D3B4]",
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
    
    // Group tasks by assignee (supports multiple assignees per task)
    tasks.forEach(task => {
      const userIds = task.assignedToUserIds || [];
      if (userIds.length > 0) {
        let assigned = false;
        userIds.forEach(userId => {
          if (assignments[userId] !== undefined) {
            assignments[userId].push(task);
            assigned = true;
          }
        });
        if (!assigned) assignments['unassigned'].push(task);
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

  // Fonctions de gestion des colonnes
  const handleSelectMember = (profileId: string) => {
    if (editingColumnIndex !== null) {
      const newColumns = [...selectedColumns];
      newColumns[editingColumnIndex] = profileId;
      setSelectedColumns(newColumns);
      setIsSelectingMember(false);
      setEditingColumnIndex(null);
    }
  };

  const handleOpenMemberSelector = (columnIndex: number) => {
    setEditingColumnIndex(columnIndex);
    setIsSelectingMember(true);
  };

  const handleAddColumn = () => {
    setSelectedColumns([...selectedColumns, null]);
  };

  const handleRemoveColumn = (columnIndex: number) => {
    const newColumns = selectedColumns.filter((_, index) => index !== columnIndex);
    // Garder au moins 1 colonne
    if (newColumns.length === 0) {
      newColumns.push(null);
    }
    setSelectedColumns(newColumns);
  };

  // Filtrer les profiles déjà sélectionnés
  const availableProfiles = profiles?.filter(
    profile => !selectedColumns.includes(profile.id)
  ) || [];

  // Pagination pour colonnes
  const COLUMNS_PER_PAGE = 4;
  const totalColumns = selectedColumns.length;
  const maxPage = Math.max(0, Math.ceil(totalColumns / COLUMNS_PER_PAGE) - 1);

  const nextPage = () => {
    setCurrentColumnIndex(prev => Math.min(prev + COLUMNS_PER_PAGE, maxPage * COLUMNS_PER_PAGE));
  };

  const prevPage = () => {
    setCurrentColumnIndex(prev => Math.max(prev - COLUMNS_PER_PAGE, 0));
  };

  // Construire les colonnes visibles basées sur selectedColumns
  const visibleColumns = selectedColumns
    .slice(currentColumnIndex, currentColumnIndex + COLUMNS_PER_PAGE)
    .map((profileId, localIndex) => {
      const globalIndex = currentColumnIndex + localIndex;
      
      if (!profileId) {
        return {
          id: `empty-${globalIndex}`,
          name: 'Add Staff Member',
          role: 'Click to assign',
          icon: HelpCircle,
          color: 'bg-[#E0D3B4]/30 border-[#E0D3B4]',
          status: 'active' as const,
          columnIndex: globalIndex,
          isEmpty: true
        };
      }
      
      const profile = profiles?.find(p => p.id === profileId);
      if (!profile) {
        return {
          id: `error-${globalIndex}`,
          name: 'Error',
          role: 'Unknown',
          icon: User,
          color: 'bg-[#E0D3B4]/30 border-[#E0D3B4]',
          status: 'active' as const,
          columnIndex: globalIndex,
          isEmpty: true
        };
      }
      
      // Déterminer l'icône et la couleur selon le département
      let DepartmentIcon = Key; // Par défaut Reception
      let columnColor = 'bg-[#E0D3B4]/30 border-[#E0D3B4]';
      
      const dept = (profile.department || '').toLowerCase();
      
      if (dept.includes('reception') || dept.includes('réception')) {
        DepartmentIcon = Key;
        columnColor = 'bg-[#E0D3B4]/30 border-[#E0D3B4]';
      } else if (dept.includes('housekeeping') || dept.includes('femme') || dept.includes('chambre')) {
        DepartmentIcon = Bed;
        columnColor = 'bg-[#BBA88A]/30 border-[#BBA88A]';
      } else if (dept.includes('maintenance') || dept.includes('technique')) {
        DepartmentIcon = Wrench;
        columnColor = 'bg-[#DEAE53]/20 border-[#DEAE53]';
      } else if (dept.includes('restaurat') || dept.includes('cuisine') || dept.includes('food')) {
        DepartmentIcon = Utensils;
        columnColor = 'bg-[#DEAE53]/20 border-[#DEAE53]';
      } else if (dept.includes('ai') || dept.includes('engineer') || dept.includes('tech')) {
        DepartmentIcon = Shield;
        columnColor = 'bg-[#1E1A37]/10 border-[#1E1A37]';
      }
      
      return {
        id: profile.id,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'Unknown',
        role: profile.department || 'Staff',
        icon: DepartmentIcon,
        color: columnColor,
        status: 'active' as const,
        profile,
        columnIndex: globalIndex,
        isEmpty: false
      };
    });

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
            
            {/* Navigation Controls - Identique à Service Control */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={prevPage}
                disabled={currentColumnIndex === 0}
                className="h-8 w-8 p-0 border-hotel-yellow text-hotel-navy hotel-hover"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-hotel-navy/70">
                Colonnes {currentColumnIndex + 1}-{Math.min(currentColumnIndex + COLUMNS_PER_PAGE, totalColumns)} / {totalColumns}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={nextPage}
                disabled={currentColumnIndex >= maxPage * COLUMNS_PER_PAGE}
                className="h-8 w-8 p-0 border-hotel-yellow text-hotel-navy hotel-hover"
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
          
          {/* Version Mobile : Bandeau collapsible */}
          <div className="md:hidden mb-8">
            {/* Bandeau compact - cliquable pour déplier */}
            <div 
              className="rounded-lg p-4 cursor-pointer transition-all duration-300"
              style={{ backgroundColor: '#BBA57A' }}
              onClick={() => setIsMobileStatsExpanded(!isMobileStatsExpanded)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-white" />
                  <div>
                    <h3 className="text-white font-semibold">Team Dispatch Overview</h3>
                    <p className="text-white/80 text-sm">
                      {selectedColumns.filter(id => id !== null).length} members • {tasks.length} tasks
                    </p>
                  </div>
                </div>
                <div className="text-white">
                  {isMobileStatsExpanded ? '↑' : '↓'}
                </div>
              </div>
              
              {/* Section dépliable */}
              {isMobileStatsExpanded && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white/90">Team Members</span>
                      <span className="text-white font-bold">
                        {selectedColumns.filter(id => id !== null).length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/90">Total Tasks</span>
                      <span className="text-white font-bold">{tasks.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/90">Pending</span>
                      <span className="text-white font-bold">
                        {tasks.filter(t => t.status === 'pending').length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/90">Urgent</span>
                      <span className="text-white font-bold">
                        {tasks.filter(t => t.priority === 'urgent').length}
                      </span>
                    </div>
                  </div>
                  
                  {/* Bouton Filtres dans la section dépliée */}
                  <div className="mt-4 pt-3 border-t border-white/20">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsSelectingMember(true);
                      }}
                      className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
                      variant="outline"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Manage Team Members
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Version Desktop : Cartes séparées (ordre reorganisé) */}
          <div className="hidden md:grid grid-cols-4 gap-6 mb-8">
            {/* 1. Team Members d'abord */}
            <div className="hotel-column">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#1E1A37]/70">Team Members</p>
                  <p className="text-2xl font-bold text-[#1E1A37]">
                    {selectedColumns.filter(id => id !== null).length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-[#DEAE53]" />
              </div>
            </div>

            {/* 2. Total Tasks */}
            <div className="hotel-column">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#1E1A37]/70">Total Tasks</p>
                  <p className="text-2xl font-bold text-[#1E1A37]">{tasks.length}</p>
                </div>
                <ClipboardList className="h-8 w-8 text-[#DEAE53]" />
              </div>
            </div>

            {/* 3. Pending */}
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

            {/* 4. Urgent */}
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

          {/* Team Columns avec navigation horizontale mobile comme Service Control */}
          <div className="flex md:grid md:grid-cols-3 gap-6 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory md:snap-none -mx-8 px-8 md:mx-0 md:px-0">
            {visibleColumns.map((member: any) => {
              const memberTasks = taskAssignments[member.id] || [];
              // Ne filtrer que pending et in_progress
              const activeTasks = memberTasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
              
              const Icon = member.icon;
              
              return (
                <div key={`${member.id}-${member.columnIndex}`} className="flex-1 min-w-[70vw] md:min-w-0 snap-center">
                  <div className="hotel-column h-fit">
                    {/* Column Header avec boutons */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className={cn("p-2 rounded-lg", member.color)}>
                          <Icon className="h-5 w-5 text-[#1E1A37]" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-[#1E1A37]">
                              {member.name}
                            </h3>
                            {member.isEmpty && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenMemberSelector(member.columnIndex)}
                                className="h-6 w-6 p-0 text-[#1E1A37] hover:text-[#1E1A37] hover:bg-[#1E1A37]/10"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          <p className="text-sm text-[#1E1A37]/60 capitalize">
                            {member.role.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-[#E0D3B4]/50 text-[#1E1A37]">
                          {activeTasks.length}
                        </Badge>
                        {!member.isEmpty && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenMemberSelector(member.columnIndex)}
                            className="h-6 w-6 p-0 text-[#1E1A37] hover:text-[#1E1A37] hover:bg-[#1E1A37]/10"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                        {selectedColumns.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveColumn(member.columnIndex)}
                            className="h-6 w-6 p-0 text-[#1E1A37]/60 hover:text-[#1E1A37] hover:bg-[#1E1A37]/10"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Tasks List */}
                    <ScrollArea className="h-[50vh] md:h-[calc(100vh-420px)]">
                      <div className="space-y-3">
                        {activeTasks.length === 0 ? (
                          <div className="text-center py-8 text-[#1E1A37]/50">
                            <p className="text-sm">No cards to show</p>
                            <p className="text-xs mt-2">Begin the shift in Team Dispatch</p>
                          </div>
                        ) : (
                          activeTasks.map((task) => (
                            <div
                              key={task.id}
                              onClick={() => handleTaskClick(task)}
                              className="bg-white rounded-lg border p-4 hotel-hover cursor-pointer transition-all duration-200"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium text-[#1E1A37] text-sm">
                                  {task.title}
                                </h4>
                                {task.priority === 'urgent' && (
                                  <Badge variant="destructive" className="text-xs">
                                    URGENT
                                  </Badge>
                                )}
                              </div>
                              
                              {task.location && (
                                <p className="text-xs text-[#1E1A37]/60 mb-2">
                                  📍 {task.location}
                                </p>
                              )}
                              
                              <div className="flex items-center justify-between text-xs">
                                <span className={cn(
                                  "px-2 py-1 rounded",
                                  task.status === 'pending' && "bg-[#DEAE53]/20 text-[#1E1A37]",
                                  task.status === 'in_progress' && "bg-blue-100 text-blue-800",
                                  task.status === 'completed' && "bg-green-100 text-green-800"
                                )}>
                                  {task.status.replace('_', ' ')}
                                </span>
                                <span className="text-[#1E1A37]/60">
                                  {formatTimeElapsed(task.created_at)}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              );
            })}
            
            {/* Bouton + pour ajouter une colonne - à droite de la dernière colonne */}
            <div className="flex-shrink-0 flex items-start">
              <Button
                variant="outline"
                onClick={handleAddColumn}
                className="h-fit p-3 border-[#DEAE53] text-[#1E1A37] hover:bg-[#DEAE53]/20"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
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

      {/* Member Selection Modal */}
      <Dialog open={isSelectingMember} onOpenChange={setIsSelectingMember}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1E1A37]">Select Team Member</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-2">
              {availableProfiles.map((profile) => {
                // Déterminer l'icône selon le département
                let DepartmentIcon = Key; // Par défaut Reception
                let iconColor = "text-[#1E1A37]";
                
                const dept = (profile.department || '').toLowerCase();
                
                if (dept.includes('reception') || dept.includes('réception')) {
                  DepartmentIcon = Key;
                  iconColor = "text-[#1E1A37]";
                } else if (dept.includes('housekeeping') || dept.includes('femme') || dept.includes('chambre')) {
                  DepartmentIcon = Bed;
                  iconColor = "text-[#BBA88A]";
                } else if (dept.includes('maintenance') || dept.includes('technique')) {
                  DepartmentIcon = Wrench;
                  iconColor = "text-[#DEAE53]";
                } else if (dept.includes('restaurat') || dept.includes('cuisine') || dept.includes('food')) {
                  DepartmentIcon = Utensils;
                  iconColor = "text-[#DEAE53]";
                } else if (dept.includes('ai') || dept.includes('engineer') || dept.includes('tech')) {
                  DepartmentIcon = Shield;
                  iconColor = "text-[#1E1A37]";
                }
                
                return (
                  <div
                    key={profile.id}
                    onClick={() => handleSelectMember(profile.id)}
                    className="p-3 border-2 border-[#E0D3B4] rounded-lg cursor-pointer hover:border-[#DEAE53] hover:bg-[#DEAE53]/10 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#E0D3B4] flex items-center justify-center">
                        <DepartmentIcon className={`h-5 w-5 ${iconColor}`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-[#1E1A37]">
                          {profile.first_name} {profile.last_name}
                        </p>
                        <p className="text-xs text-[#1E1A37]/60">
                          {profile.department || 'Staff'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {availableProfiles.length === 0 && (
              <div className="text-center py-8 text-[#1E1A37]/50">
                <p>All team members are already assigned to columns</p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
      
      {/* Bouton flottant de création de tâche */}
      <VoiceCommandButton />
    </div>
  );
};

export default TeamDispatch;

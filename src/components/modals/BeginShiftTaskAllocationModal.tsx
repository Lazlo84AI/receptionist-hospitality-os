import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  PlayCircle, 
  Filter, 
  Eye,
  Settings,
  Edit,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TaskItem } from '@/types/database';
import { ShiftFacingCard } from '@/components/cards';
import EnhancedTaskDetailModal from '@/components/modals/EnhancedTaskDetailModal';
import { TaskFullEditView } from '@/components/modules/TaskFullEditView';
import { useLocations } from '@/hooks/useSupabaseData';

interface BeginShiftTaskAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  tasks: TaskItem[];
  profiles: any[];
}

const BeginShiftTaskAllocationModal: React.FC<BeginShiftTaskAllocationModalProps> = ({
  isOpen,
  onClose,
  onContinue,
  tasks,
  profiles
}) => {
  // Hook pour récupérer les locations dynamiques
  const { locations } = useLocations();
  // États des filtres
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPerson, setSelectedPerson] = useState<string>('all');
  const [selectedTheme, setSelectedTheme] = useState<string>('all');

  // États pour l'allocation
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [selectedChecklist, setSelectedChecklist] = useState<string>('none');
  const [assignToPerson, setAssignToPerson] = useState<string>('unassigned');
  
  // État pour tracker les modifications appliquées aux cartes
  const [taskModifications, setTaskModifications] = useState<{
    [taskId: string]: {
      assignedTo?: string;
      action?: string;
    }
  }>({});
  
  // États pour replier les sections
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);
  const [isActionsOpen, setIsActionsOpen] = useState(true);

  // État pour les détails de tâche
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);

  // États pour le modal d'édition
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  // Génération dynamique des options d'étages à partir des locations
  const generateFloorOptions = () => {
    const floors = new Set<number>();
    
    locations.forEach(location => {
      if (location.floor !== null && location.floor !== undefined) {
        floors.add(location.floor);
      }
    });
    
    const sortedFloors = Array.from(floors).sort((a, b) => a - b);
    
    const floorOptions = [{ value: 'all', label: 'All Floors' }];
    
    sortedFloors.forEach(floor => {
      if (floor === -1) {
        floorOptions.push({ value: '-1', label: 'Basement (-1)' });
      } else if (floor === 0) {
        floorOptions.push({ value: '0', label: 'Ground Floor (0)' });
      } else {
        floorOptions.push({ value: floor.toString(), label: `Floor ${floor}` });
      }
    });
    
    return floorOptions;
  };

  // Options des filtres dynamiques
  const floorOptions = generateFloorOptions();

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'ongoing_incidents', label: 'Ongoing Incidents' },
    { value: 'client_requests', label: 'Client Requests' },
    { value: 'follow_ups', label: 'Follow Ups' },
    { value: 'personal_tasks', label: 'Personal Tasks' },
    { value: 'chambres_arrivee', label: 'Arrival Rooms' },
    { value: 'chambres_recouche', label: 'Turndown Rooms' }
  ];

  const personOptions = [
    { value: 'all', label: 'All People' },
    ...profiles.map(profile => ({
      value: profile.id,
      label: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'Unknown'
    }))
  ];

  const themeOptions = [
    { value: 'all', label: 'All' },
    { value: 'priority', label: 'By Priority' },
    { value: 'most_delayed', label: 'Most Delayed' },
    { value: 'previous_shift', label: 'From Previous Shift' },
    { value: 'new_shift', label: 'From New Shift' }
  ];

  const checklistOptions = [
    { value: 'none', label: 'Choose Action' },
    { value: 'arrivee', label: 'Arrival Checklist' },
    { value: 'recouche', label: 'Turndown Checklist' },
    { value: 'deep_cleaning', label: 'Deep Cleaning' },
    { value: 'ongoing_incident', label: 'Ongoing Incident' },
    { value: 'to_repair', label: 'To Repair' }
  ];

  const assignmentOptions = [
    { value: 'unassigned', label: 'Unassigned' },
    ...profiles.map(profile => ({
      value: profile.id,
      label: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'Unknown'
    }))
  ];

  // Filtrage actif des tâches
  const filteredTasks = tasks.filter(task => {
    // Filtre par étage (basé sur la location/roomNumber)
    if (selectedFloor !== 'all') {
      const taskFloor = task.roomNumber ? task.roomNumber.charAt(0) : '0';
      if (selectedFloor === '-1' && taskFloor !== 'B') return false;
      if (selectedFloor !== '-1' && taskFloor !== selectedFloor) return false;
    }

    // Filtre par catégorie
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'client_requests' && task.type !== 'client_request') return false;
      if (selectedCategory === 'ongoing_incidents' && task.type !== 'incident') return false;
      if (selectedCategory === 'follow_ups' && task.type !== 'follow_up') return false;
      if (selectedCategory === 'personal_tasks' && task.type !== 'personal_task') return false;
    }

    // Filtre par personne
    if (selectedPerson !== 'all') {
      if (!task.assignedTo && selectedPerson !== 'unassigned') return false;
      if (task.assignedTo && task.assignedTo !== selectedPerson) return false;
    }

    // Filtre par thématique
    if (selectedTheme !== 'all') {
      if (selectedTheme === 'priority' && task.priority !== 'urgent') return false;
    }

    return true;
  });

  // Séparation : nouvelles cartes (modifiables) vs cartes existantes
  const newCards = filteredTasks.filter(task => task.id.startsWith('temp-card-'));
  const existingCards = filteredTasks.filter(task => !task.id.startsWith('temp-card-'));
  
  // Séparation des tâches assignées et non assignées pour les cartes existantes
  const unassignedExisting = existingCards.filter(task => !task.assignedTo);
  const assignedExisting = existingCards.filter(task => task.assignedTo);

  // Gestion de la sélection
  const allTasks = [...newCards, ...unassignedExisting, ...assignedExisting];
  
  const handleSelectAll = () => {
    if (selectedTasks.length === allTasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(allTasks.map(task => task.id));
    }
  };

  const handleTaskToggle = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleAssignTasks = () => {
    if (selectedTasks.length > 0) {
      const updates: typeof taskModifications = {};
      
      selectedTasks.forEach(taskId => {
        updates[taskId] = {
          ...(taskModifications[taskId] || {}),
          ...(assignToPerson !== 'unassigned' && { assignedTo: assignToPerson }),
          ...(selectedChecklist !== 'none' && { action: selectedChecklist })
        };
      });
      
      setTaskModifications(prev => ({ ...prev, ...updates }));
      
      console.log('✅ Changes applied:', {
        tasks: selectedTasks,
        assignedTo: assignToPerson,
        action: selectedChecklist,
        updates
      });
      
      // Reset selections
      setSelectedTasks([]);
      setSelectedChecklist('none');
      setAssignToPerson('unassigned');
    }
  };

  // Fonction de sauvegarde pour le modal d'édition
  const handleSaveTask = (updatedTask: TaskItem) => {
    console.log('Task updated:', updatedTask);
    // TODO: Implémenter la logique de sauvegarde en base
    setIsEditModalOpen(false);
    setEditingTask(null);
  };

  const handleCardClick = (task: TaskItem) => {
    setSelectedTask(task);
    
    if (task.id.startsWith('temp-card-')) {
      // Nouvelles cartes -> Modal d'édition
      setEditingTask(task);
      setIsEditModalOpen(true);
    } else {
      // Cartes existantes -> Modal de détails (lecture seule)
      setIsTaskDetailOpen(true);
    }
  };

  // Vérification si le bouton Assign doit être actif
  const isAssignButtonActive = selectedTasks.length > 0 && (assignToPerson !== 'unassigned' || selectedChecklist !== 'none');

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl h-[95vh] p-0 flex flex-col">
          <DialogHeader className="p-6 pb-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#E0D3B4] rounded-full flex items-center justify-center">
                <PlayCircle className="h-4 w-4 text-[#1E1A37]" />
              </div>
              <DialogTitle className="text-xl font-semibold">
                Begin Service Shift - Task Allocation
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Filters - Collapsible */}
            <div className="flex-shrink-0 px-6 pb-6 border-b-2 border-gray-100">
              <div className="bg-[#E0D3B4]/20 rounded-lg p-4 shadow-sm">
                <div 
                  className="flex items-center gap-2 mb-4 cursor-pointer" 
                  onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                >
                  <Filter className="h-4 w-4 text-gray-600" />
                  <h3 className="font-semibold text-gray-800">Filters</h3>
                  {isFiltersOpen ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
                  {(() => {
                    const activeFiltersCount = [
                      selectedFloor !== 'all', 
                      selectedCategory !== 'all', 
                      selectedPerson !== 'all', 
                      selectedTheme !== 'all'
                    ].filter(Boolean).length;
                    
                    return activeFiltersCount > 0 ? (
                      <Badge variant="outline" className="bg-[#DEAE53] text-[#1E1A37] border-[#DEAE53] text-xs ml-2">
                        {activeFiltersCount} active
                      </Badge>
                    ) : null;
                  })()}
                </div>
                
                {isFiltersOpen && (
                  <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Floors</label>
                    <Select value={selectedFloor} onValueChange={setSelectedFloor}>
                      <SelectTrigger className={cn("w-full transition-all duration-200", selectedFloor !== 'all' && "ring-1 ring-yellow-400 border-yellow-400")}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {floorOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Category</label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className={cn("w-full transition-all duration-200", selectedCategory !== 'all' && "ring-1 ring-yellow-400 border-yellow-400")}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Person</label>
                    <Select value={selectedPerson} onValueChange={setSelectedPerson}>
                      <SelectTrigger className={cn("w-full transition-all duration-200", selectedPerson !== 'all' && "ring-1 ring-yellow-400 border-yellow-400")}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {personOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Themes</label>
                    <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                      <SelectTrigger className={cn("w-full transition-all duration-200", selectedTheme !== 'all' && "ring-1 ring-yellow-400 border-yellow-400")}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {themeOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions - Collapsible */}
            <div className="flex-shrink-0 px-6 py-6 border-b-2 border-gray-100">
              <div className="bg-white rounded-lg border border-[#E0D3B4] p-4 shadow-sm">
                <div 
                  className="flex items-center gap-2 mb-4 cursor-pointer"
                  onClick={() => setIsActionsOpen(!isActionsOpen)}
                >
                  <Settings className="h-4 w-4 text-gray-600" />
                  <h3 className="font-semibold text-gray-800">Actions</h3>
                  {isActionsOpen ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
                </div>
                
                {isActionsOpen && (
                  <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">
                      Select
                    </label>
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="select-all"
                        checked={selectedTasks.length === allTasks.length && allTasks.length > 0}
                        onCheckedChange={handleSelectAll}
                        className="h-4 w-4"
                      />
                      <label htmlFor="select-all" className="text-sm cursor-pointer font-medium">
                        Select All
                      </label>
                      {selectedTasks.length > 0 && (
                        <Badge variant="outline" className="text-xs bg-[#DEAE53] text-[#1E1A37] border-[#DEAE53]">
                          {selectedTasks.length} selected
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Specific Actions */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">Apply Specific Actions</label>
                    <Select value={selectedChecklist} onValueChange={setSelectedChecklist}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {checklistOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Assignment */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">Assign To</label>
                    <div className="flex gap-3 items-end">
                      <Select value={assignToPerson} onValueChange={setAssignToPerson}>
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {assignmentOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        onClick={handleAssignTasks}
                        disabled={!isAssignButtonActive}
                        className={cn(
                          "px-4 py-2 transition-all",
                          isAssignButtonActive 
                            ? "bg-[#1E1A37] hover:bg-[#DEAE53] text-white hover:text-[#1E1A37]" 
                            : "bg-[#E0D3B4] text-[#1E1A37]/50 cursor-not-allowed"
                        )}
                      >
                        Assign
                      </Button>
                    </div>
                  </div>
                  </div>
                )}
              </div>
            </div>

            {/* Task List - scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {/* New Cards (Editable) */}
              {newCards.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-semibold text-[#BBA88A]">
                      New Cards Created ({newCards.length})
                    </h3>
                    <Badge className="bg-[#BBA88A] text-white border-[#BBA88A]">
                      Editable
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {newCards.map((task) => {
                      const isSelected = selectedTasks.includes(task.id);
                      const modifications = taskModifications[task.id];
                      
                      return (
                        <div key={task.id} className="relative">
                          <div className="absolute top-2 left-2 z-10">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleTaskToggle(task.id)}
                              className="bg-white border-2 shadow-sm"
                            />
                          </div>
                          <div className="absolute top-2 right-2 z-10">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCardClick(task);
                              }}
                              className="h-8 w-8 p-0 bg-[#BBA88A] hover:bg-[#DEAE53] shadow-sm"
                            >
                              <Edit className="h-4 w-4 text-white" />
                            </Button>
                          </div>
                          
                          {/* Afficher les modifications appliquées */}
                          {modifications && (
                            <div className="absolute top-12 left-2 z-10 flex flex-col gap-1">
                              {modifications.assignedTo && (
                                <Badge style={{ backgroundColor: '#BBA88A', color: 'white' }} className="text-xs border-0">
                                  Assigned
                                </Badge>
                              )}
                              {modifications.action && (
                                <Badge style={{ backgroundColor: '#1E1A37', color: '#DEAE53' }} className="text-xs border-0">
                                  {modifications.action === 'deep_cleaning' ? 'Deep' : modifications.action}
                                </Badge>
                              )}
                            </div>
                          )}
                          
                          <div className={cn(
                            "transition-all duration-200 ring-2 ring-[#BBA88A]",
                            isSelected && "ring-[#DEAE53] shadow-lg",
                            modifications && "ring-[#E0D3B4]"
                          )}>
                            <ShiftFacingCard 
                              task={task}
                              onClick={() => handleCardClick(task)}
                              className="hover:shadow-md transition-shadow"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Existing Unassigned Tasks (Read-only) */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900">
                  Unassigned Tasks ({unassignedExisting.length})
                </h3>
                {unassignedExisting.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {unassignedExisting.map((task) => {
                      const isSelected = selectedTasks.includes(task.id);
                      return (
                        <div key={task.id} className="relative">
                          <div className="absolute top-2 left-2 z-10">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleTaskToggle(task.id)}
                              className="bg-white border-2 shadow-sm"
                            />
                          </div>
                          <div className="absolute top-2 right-2 z-10">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCardClick(task);
                              }}
                              className="h-8 w-8 p-0 bg-white/80 hover:bg-white shadow-sm"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className={cn(
                            "transition-all duration-200",
                            isSelected && "ring-2 ring-[#DEAE53] shadow-lg"
                          )}>
                            <ShiftFacingCard 
                              task={task}
                              onClick={() => handleCardClick(task)}
                              className="hover:shadow-md transition-shadow"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No unassigned tasks</p>
                  </div>
                )}
              </div>

              {/* Existing Assigned Tasks (Read-only) */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-600">
                  Already Assigned Tasks ({assignedExisting.length})
                </h3>
                {assignedExisting.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {assignedExisting.map((task) => {
                      const isSelected = selectedTasks.includes(task.id);
                      return (
                        <div key={task.id} className="relative">
                          <div className="absolute top-2 left-2 z-10">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleTaskToggle(task.id)}
                              className="bg-white border-2 shadow-sm"
                            />
                          </div>
                          <div className="absolute top-2 right-2 z-10">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCardClick(task);
                              }}
                              className="h-8 w-8 p-0 bg-white/80 hover:bg-white shadow-sm"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className={cn(
                            "transition-all duration-200 opacity-75",
                            isSelected && "ring-2 ring-[#DEAE53] shadow-lg opacity-100"
                          )}>
                            <ShiftFacingCard 
                              task={task}
                              onClick={() => handleCardClick(task)}
                              className="hover:shadow-md transition-shadow"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No assigned tasks</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Fixed Footer */}
          <div className="flex-shrink-0 border-t bg-white p-6">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''} selected • 
                {newCards.length} new • 
                {unassignedExisting.length} unassigned • 
                {assignedExisting.length} assigned
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={onContinue}
                  className="bg-[#1E1A37] hover:bg-[#DEAE53] text-white hover:text-[#1E1A37] px-6"
                >
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Review Cards of Previous Shift
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Task Details Modal */}
      <EnhancedTaskDetailModal 
        task={selectedTask} 
        isOpen={isTaskDetailOpen} 
        onClose={() => { 
          setIsTaskDetailOpen(false); 
          setSelectedTask(null); 
        }} 
        onUpdateTask={() => {
          // Update logic if needed
        }}
      />

      {/* Edit Modal for New Cards */}
      {editingTask && (
        <TaskFullEditView
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingTask(null);
          }}
          task={editingTask}
          onSave={handleSaveTask}
        />
      )}
    </>
  );
};

export default BeginShiftTaskAllocationModal;

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
  Settings
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
  onStartShift: () => void;
  tasks: TaskItem[];
  profiles: any[];
}

const BeginShiftTaskAllocationModal: React.FC<BeginShiftTaskAllocationModalProps> = ({
  isOpen,
  onClose,
  onStartShift,
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
  const [assignToPerson, setAssignToPerson] = useState<string>('à personne'); // Valeur par défaut

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
    
    const floorOptions = [{ value: 'all', label: 'Tous les étages' }];
    
    sortedFloors.forEach(floor => {
      if (floor === -1) {
        floorOptions.push({ value: '-1', label: 'Sous-sol (-1)' });
      } else if (floor === 0) {
        floorOptions.push({ value: '0', label: 'RDC (0)' });
      } else {
        floorOptions.push({ value: floor.toString(), label: `Étage ${floor}` });
      }
    });
    
    return floorOptions;
  };

  // Options des filtres dynamiques
  const floorOptions = generateFloorOptions();

  const categoryOptions = [
    { value: 'all', label: 'Toutes les catégories' },
    { value: 'ongoing_incidents', label: 'Ongoing Incidents' },
    { value: 'client_requests', label: 'Client Requests' },
    { value: 'follow_ups', label: 'Follow Ups' },
    { value: 'personal_tasks', label: 'Personal Tasks' },
    { value: 'chambres_arrivee', label: 'Chambres "en arrivée"' },
    { value: 'chambres_recouche', label: 'Chambres "en recouche"' }
  ];

  const personOptions = [
    { value: 'all', label: 'Toutes les personnes' },
    ...profiles.map(profile => ({
      value: profile.id,
      label: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'Unknown'
    }))
  ];

  const themeOptions = [
    { value: 'all', label: 'Tous' },
    { value: 'priority', label: 'Par priorité' },
    { value: 'most_delayed', label: 'Les plus en retard' },
    { value: 'previous_shift', label: 'Issues du shift précédent' },
    { value: 'new_shift', label: 'Issues du nouveau shift' }
  ];

  const checklistOptions = [
    { value: 'none', label: 'Choisir checklist' },
    { value: 'arrivee', label: 'Checklist en arrivée' },
    { value: 'recouche', label: 'Checklist en recouche' }
  ];

  const assignmentOptions = [
    { value: 'à personne', label: 'À personne' },
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
      // Ajouter logique pour chambres_arrivee et chambres_recouche si nécessaire
    }

    // Filtre par personne
    if (selectedPerson !== 'all') {
      if (!task.assignedTo && selectedPerson !== 'unassigned') return false;
      if (task.assignedTo && task.assignedTo !== selectedPerson) return false;
    }

    // Filtre par thématique
    if (selectedTheme !== 'all') {
      if (selectedTheme === 'priority' && task.priority !== 'urgent') return false;
      // Ajouter d'autres logiques de thématiques si nécessaire
    }

    return true;
  });

  // Séparation des tâches assignées et non assignées
  const unassignedTasks = filteredTasks.filter(task => !task.assignedTo);
  const assignedTasks = filteredTasks.filter(task => task.assignedTo);

  // Gestion de la sélection
  const allTasks = [...unassignedTasks, ...assignedTasks];
  
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
    if (selectedTasks.length > 0 && assignToPerson !== 'à personne') {
      const checklistToApply = selectedChecklist !== 'none' ? selectedChecklist : null;
      console.log('Applying changes:');
      console.log('- Tasks:', selectedTasks);
      console.log('- Assigned to:', assignToPerson);
      console.log('- Checklist applied:', checklistToApply);
      
      setSelectedTasks([]);
      setSelectedChecklist('none');
      setAssignToPerson('à personne');
    }
  };

  // Fonction de sauvegarde pour le modal d'édition
  const handleSaveTask = (updatedTask: TaskItem) => {
    console.log('Task updated:', updatedTask);
    // TODO: Implémenter la logique de sauvegarde en base
    setIsEditModalOpen(false);
    setEditingTask(null);
    // Optionnel : rafraîchir la liste des tâches
  };

  const handleCardClick = (task: TaskItem) => {
    setSelectedTask(task);
    
    if (task.id.startsWith('temp-card-')) {
      // Nouvelles cartes -> Modal d'édition
      setEditingTask(task);
      setIsEditModalOpen(true);
    } else {
      // Cartes existantes -> Modal de détails
      setIsTaskDetailOpen(true);
    }
  };

  // Vérification si le bouton Attribuer doit être actif
  const isAssignButtonActive = selectedTasks.length > 0 && assignToPerson !== 'à personne';

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl max-h-[95vh] p-0 flex flex-col">
          <DialogHeader className="p-6 pb-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <PlayCircle className="h-4 w-4 text-blue-600" />
              </div>
              <DialogTitle className="text-xl font-semibold">
                Begin Service Shift - Task Allocation
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Filtres - Design élégant */}
            <div className="flex-shrink-0 px-6 pb-6 border-b-2 border-gray-100">
              <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="h-4 w-4 text-gray-600" />
                  <h3 className="font-semibold text-gray-800">Filtres</h3>
                  {/* Indicateur de filtres actifs */}
                  {(() => {
                    const activeFiltersCount = [
                      selectedFloor !== 'all', 
                      selectedCategory !== 'all', 
                      selectedPerson !== 'all', 
                      selectedTheme !== 'all'
                    ].filter(Boolean).length;
                    
                    return activeFiltersCount > 0 ? (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 text-xs">
                        {activeFiltersCount} actif{activeFiltersCount > 1 ? 's' : ''}
                      </Badge>
                    ) : null;
                  })()}
                </div>
                
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Étages</label>
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
                    <label className="text-sm font-medium text-gray-700">Catégorie</label>
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
                    <label className="text-sm font-medium text-gray-700">Personne</label>
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
                    <label className="text-sm font-medium text-gray-700">Thématiques</label>
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
              </div>
            </div>

            {/* Actions - Design élégant sur fond blanc */}
            <div className="flex-shrink-0 px-6 py-6 border-b-2 border-gray-100">
              <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="h-4 w-4 text-gray-600" />
                  <h3 className="font-semibold text-gray-800">Actions</h3>
                </div>
                
                <div className="grid grid-cols-3 gap-6">
                  {/* Sélection - sans icône */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">
                      Sélectionner
                    </label>
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="select-all"
                        checked={selectedTasks.length === allTasks.length && allTasks.length > 0}
                        onCheckedChange={handleSelectAll}
                        className="h-4 w-4"
                      />
                      <label htmlFor="select-all" className="text-sm cursor-pointer font-medium">
                        Tout sélectionner
                      </label>
                      {selectedTasks.length > 0 && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300">
                          {selectedTasks.length} sélectionnée{selectedTasks.length !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Checklist */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">Appliquer checklist</label>
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

                  {/* Attribution */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">Attribuer à</label>
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
                            ? "bg-blue-600 hover:bg-blue-700 text-white" 
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        )}
                      >
                        Attribuer
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Liste des tâches - scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {/* Tâches non assignées */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900">
                  Tâches non assignées ({unassignedTasks.length})
                </h3>
                {unassignedTasks.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {unassignedTasks.map((task) => {
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
                          <div className={cn(
                            "transition-all duration-200",
                            isSelected && "ring-2 ring-blue-400 shadow-lg"
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
                    <p>Aucune tâche non assignée</p>
                  </div>
                )}
              </div>

              {/* Tâches déjà assignées */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-600">
                  Tâches déjà assignées ({assignedTasks.length})
                </h3>
                {assignedTasks.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {assignedTasks.map((task) => {
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
                                e.stopPropagation(); // Empêcher le clic sur la carte
                                handleCardClick(task); // Forcer l'ouverture du bon modal
                              }}
                              className="h-8 w-8 p-0 bg-white/80 hover:bg-white shadow-sm"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className={cn(
                            "transition-all duration-200 opacity-75",
                            isSelected && "ring-2 ring-blue-400 shadow-lg opacity-100"
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
                    <p>Aucune tâche assignée</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer fixe */}
          <div className="flex-shrink-0 border-t bg-white p-6">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {selectedTasks.length} tâche{selectedTasks.length !== 1 ? 's' : ''} sélectionnée{selectedTasks.length !== 1 ? 's' : ''} • 
                {unassignedTasks.length} non assignées • 
                {assignedTasks.length} assignées
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={onClose}>
                  Annuler
                </Button>
                <Button 
                  onClick={onStartShift}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                >
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Commencer le Service
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de détails des tâches */}
      <EnhancedTaskDetailModal 
        task={selectedTask} 
        isOpen={isTaskDetailOpen} 
        onClose={() => { 
          setIsTaskDetailOpen(false); 
          setSelectedTask(null); 
        }} 
        onUpdateTask={() => {
          // Logique de mise à jour si nécessaire
        }}
      />

      {/* Modal d'édition pour nouvelles cartes */}
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

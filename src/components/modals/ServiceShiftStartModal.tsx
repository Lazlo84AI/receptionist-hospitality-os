import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  PlayCircle, 
  Filter,
  Users,
  Building,
  Tag,
  CheckSquare,
  Clock,
  AlertTriangle,
  TrendingDown,
  RotateCcw,
  Plus,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TaskItem } from '@/types/database';
import { useProfiles, useLocations } from '@/hooks/useSupabaseData';
import { CardFaceModal } from '@/components/shared/CardFaceModal';
import { formatTimeElapsed } from '@/utils/timeUtils';
import EnhancedTaskDetailModal from '@/components/modals/EnhancedTaskDetailModal';
import { TaskFullEditView } from '@/components/modules/TaskFullEditView';

interface ServiceShiftStartModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  onShiftStarted: () => void;
}

const ServiceShiftStartModal = ({
  isOpen,
  onClose,
  tasks,
  onShiftStarted
}: ServiceShiftStartModalProps) => {
  const { profiles } = useProfiles();
  const { locations } = useLocations();
  
  // États pour les filtres - identiques à ServiceControl
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPerson, setSelectedPerson] = useState<string>('all');
  const [selectedTheme, setSelectedTheme] = useState<string>('all');
  
  // États pour les sections repliables
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(true);
  const [isActionsExpanded, setIsActionsExpanded] = useState(true);
  
  // États pour les modals
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [assignmentTarget, setAssignmentTarget] = useState<string>('');
  const [selectedChecklist, setSelectedChecklist] = useState<string>('');
  const [selectedCardTask, setSelectedCardTask] = useState<TaskItem | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [isFullEditOpen, setIsFullEditOpen] = useState(false);

  // Créer les cartes de chambres vierges (une par chambre)
  const roomCards = useMemo(() => {
    if (!locations) return [];
    
    // Filtrer les locations de type 'room' et créer des cartes vierges
    const rooms = locations.filter(loc => loc.type === 'room');
    
    return rooms.map(room => {
      // Extraire l'étage du nom de la chambre (ex: "101" -> étage 1)
      let floor = 0;
      if (room.name && room.name.match(/^\d+$/)) {
        const roomNumber = parseInt(room.name);
        floor = Math.floor(roomNumber / 100);
      }
      
      return {
        id: `room-${room.id}`,
        title: `Service - ${room.name}`,
        location: room.name,
        roomNumber: room.name,
        floor: floor,
        category: 'room_service',
        priority: 'normal' as const,
        status: 'pending' as const,
        type: 'internal_task' as const,
        isRoomCard: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });
  }, [locations]);

  // Combiner les tâches existantes et les cartes de chambres
  const allCards = useMemo(() => {
    return [...tasks, ...roomCards];
  }, [tasks, roomCards]);

  // Filtrer les membres de l'équipe housekeeping
  const teamMembers = useMemo(() => {
    if (!profiles) return [];
    return profiles.filter(p => 
      p.department === 'housekeeping' || 
      p.role === 'housekeeping' ||
      p.role === 'staff' ||
      p.is_active
    );
  }, [profiles]);

  // Étages disponibles (RDC, Basement, 1-5)
  const floors = useMemo(() => {
    const floorSet = new Set();
    allCards.forEach(card => {
      if ('floor' in card && card.floor !== undefined) {
        floorSet.add(card.floor);
      }
    });
    return Array.from(floorSet).sort((a: any, b: any) => a - b);
  }, [allCards]);

  // Options des filtres - identiques à ServiceControl
  const floorOptions = [
    { value: 'all', label: 'Tous les étages' },
    { value: 'basement', label: 'Sous-sol (Personnel)' },
    { value: '0', label: 'RDC' },
    { value: '1', label: 'Étage 1' },
    { value: '2', label: 'Étage 2' },
    { value: '3', label: 'Étage 3' },
    { value: '4', label: 'Étage 4' },
    { value: '5', label: 'Étage 5' },
    { value: '6', label: 'Toit' }
  ];

  const categoryOptions = [
    { value: 'all', label: 'Toutes les catégories' },
    { value: 'ongoing_incidents', label: 'Ongoing Incidents' },
    { value: 'client_requests', label: 'Client Requests' },
    { value: 'follow_up', label: 'Follow up' },
    { value: 'internal_task', label: 'Internal Task' },
    { value: 'room', label: 'Room' },
    { value: 'common_areas', label: 'Common areas' },
    { value: 'restauration', label: 'Restauration' }
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

  // Calculer les tâches en retard
  const getOverdueTasks = () => {
    return allCards.filter(card => {
      if ('dueDate' in card && card.dueDate) {
        return new Date(card.dueDate) < new Date();
      }
      // Considérer les tâches créées il y a plus de 24h comme en retard
      const createdAt = new Date(card.created_at);
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return createdAt < twentyFourHoursAgo && card.status === 'pending';
    });
  };

  const handleApplyChecklist = () => {
    if (!selectedChecklist || selectedTasks.size === 0) return;
    
    console.log(`Applying checklist ${selectedChecklist} to ${selectedTasks.size} tasks`);
    
    // Reset selection
    setSelectedTasks(new Set());
  };

  // Appliquer les filtres aux tâches - corrigé pour bien filtrer
  const filteredTasks = useMemo(() => {
    let filtered = [...allCards];
    console.log('ServiceShiftStartModal - Filtrage:', { 
      totalCards: allCards.length, 
      selectedFloor, 
      selectedCategory, 
      selectedPerson, 
      selectedTheme 
    });
    
    // Filtre par étage
    if (selectedFloor !== 'all') {
      console.log('Avant filtrage étage:', filtered.length, 'cartes');
      
      filtered = filtered.filter(card => {
        const location = card.location || card.roomNumber || '';
        const floor = 'floor' in card ? card.floor : null;
        
        console.log('Card:', card.id, 'Location:', location, 'Floor:', floor);
        
        let shouldKeep = false;
        
        if (selectedFloor === 'basement') {
          // Sous-sol : étage -1 ou locations de type staff_area
          shouldKeep = floor === -1 || 
                 location.includes('Atelier') || location.includes('Chaufferie') || 
                 location.includes('Cuisine') || location.includes('Lingerie') || 
                 location.includes('Vestiaire') || location.includes('Salle de Réunion');
        } else if (selectedFloor === '0') {
          // RDC : étage 0 ou common areas du RDC
          shouldKeep = floor === 0 || 
                 location.includes('Accueil') || location.includes('Bar') || 
                 location.includes('Salon') || location.includes('Terrasse') ||
                 location.includes('Spa') || location.includes('Executive');
        } else {
          // Étages spécifiques
          const floorNum = parseInt(selectedFloor);
          shouldKeep = floor === floorNum || 
                 location.startsWith(`${floorNum}`) || 
                 (card.roomNumber && card.roomNumber.startsWith(selectedFloor));
        }
        
        console.log('ShouldKeep:', shouldKeep);
        return shouldKeep;
      });
      
      console.log('Après filtrage étage:', filtered.length, 'cartes');
    }
    
    // Filtre par catégorie
    if (selectedCategory !== 'all') {
      console.log('Avant filtrage catégorie:', filtered.length, 'cartes');
      
      filtered = filtered.filter(card => {
        console.log('Card type:', card.type, 'isRoomCard:', 'isRoomCard' in card ? card.isRoomCard : false);
        
        let shouldKeep = false;
        
        switch (selectedCategory) {
          case 'ongoing_incidents':
            shouldKeep = card.type === 'incident';
            break;
          case 'client_requests':
            shouldKeep = card.type === 'client_request';
            break;
          case 'follow_up':
            shouldKeep = card.type === 'follow_up';
            break;
          case 'internal_task':
            shouldKeep = card.type === 'internal_task' || card.type === 'personal_task';
            break;
          case 'room':
            // Cartes de chambres ou tâches liées aux chambres
            shouldKeep = ('isRoomCard' in card && card.isRoomCard) || 
                   (card.type === 'internal_task' && card.location && 
                   (card.location.match(/^\d+$/) || card.location.toLowerCase().includes('room')));
            break;
          case 'common_areas':
            // Zones communes selon les locations définies
            const commonLocation = card.location || '';
            shouldKeep = (card.type === 'incident' || card.type === 'internal_task') && 
                   (commonLocation.includes('Salon') || commonLocation.includes('Bar') || 
                    commonLocation.includes('Accueil') || commonLocation.includes('Spa') ||
                    commonLocation.includes('Executive') || commonLocation.includes('Terrasse') ||
                    commonLocation.includes('Couloir') || commonLocation.includes('Palier') ||
                    commonLocation.includes('Escalier') || commonLocation.includes('Ascenseur'));
            break;
          case 'restauration':
            // Zones de restauration selon les locations
            const restoLocation = card.location || '';
            shouldKeep = (card.type === 'internal_task') && 
                   (restoLocation.includes('Cuisine') || restoLocation.includes('Bar') || 
                    restoLocation.includes('Petit Déjeuner') || restoLocation.includes('Salle Petit Déjeuner'));
            break;
          default:
            shouldKeep = true;
        }
        
        console.log('Category filter result:', shouldKeep);
        return shouldKeep;
      });
      
      console.log('Après filtrage catégorie:', filtered.length, 'cartes');
    }
    
    // Filtre par personne
    if (selectedPerson !== 'all') {
      filtered = filtered.filter(card => card.assignedTo === selectedPerson);
    }
    
    // Filtre par thématique
    if (selectedTheme !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (selectedTheme) {
        case 'priority':
          filtered.sort((a, b) => {
            const priorityOrder = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 };
            return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
          });
          break;
        case 'most_delayed':
          filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          break;
        case 'previous_shift':
          filtered = filtered.filter(card => 
            new Date(card.created_at) < today
          );
          break;
        case 'new_shift':
          filtered = filtered.filter(card => 
            new Date(card.created_at) >= today || ('isRoomCard' in card && card.isRoomCard)
          );
          break;
      }
    }
    
    console.log('ServiceShiftStartModal - Résultat filtrage:', filtered.length, 'cartes');
    return filtered;
  }, [allCards, selectedFloor, selectedCategory, selectedPerson, selectedTheme]);

  // Séparer les tâches assignées et non assignées
  const { assignedTasks, unassignedTasks } = useMemo(() => {
    const assigned = filteredTasks.filter(task => task.assignedTo);
    const unassigned = filteredTasks.filter(task => !task.assignedTo);
    return { assignedTasks: assigned, unassignedTasks: unassigned };
  }, [filteredTasks]);

  const handleTaskSelection = (taskId: string, checked: boolean) => {
    const newSelected = new Set(selectedTasks);
    if (checked) {
      newSelected.add(taskId);
    } else {
      newSelected.delete(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTasks.size === unassignedTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(unassignedTasks.map(t => t.id)));
    }
  };

  const handleAssignTasks = () => {
    if (!assignmentTarget || selectedTasks.size === 0) return;
    
    console.log(`Assigning ${selectedTasks.size} tasks to ${assignmentTarget}`);
    
    // Les cartes assignées vont à la fin - on les retire de la sélection
    setSelectedTasks(new Set());
    
    // Valider toutes les actions et commencer le shift
    onShiftStarted();
    onClose();
  };

  const getFloorLabel = (floor: number) => {
    if (floor === -1) return 'Basement';
    if (floor === 0) return 'RDC';
    return `Étage ${floor}`;
  };

  const transformTaskForCard = (task: any) => {
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
      location: task.location || 'No location',
      clientName: task.guestName,
      status: getStatus(task.status),
      priority: task.priority === 'urgent' || task.priority === 'high' ? 'URGENCE' as const : 'NORMAL' as const,
      assignedTo: task.assignedTo || 'Unassigned',
      timeElapsed: task.created_at ? formatTimeElapsed(task.created_at) : '0 min'
    };
  };

  const handleCardClick = (card: any) => {
    setSelectedCardTask(card);
    
    // Déterminer quelle modal ouvrir selon le type de carte
    if ('isRoomCard' in card && card.isRoomCard) {
      // Nouvelle carte de chambre -> TaskFullEditView
      setIsFullEditOpen(true);
    } else {
      // Carte existante du shift précédent -> EnhancedTaskDetailModal  
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const cardDate = new Date(card.created_at);
      cardDate.setHours(0, 0, 0, 0);
      
      if (cardDate < today) {
        // Carte du shift précédent -> TaskDetail
        setIsTaskDetailOpen(true);
      } else {
        // Nouvelle carte -> FullEdit
        setIsFullEditOpen(true);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-3">
            <PlayCircle className="w-6 h-6 text-blue-600" />
            Begin Service Shift - Task Allocation
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 px-6">
          {/* Filtres */}
          <Card className="mb-4">
            <CardHeader className="pb-3 cursor-pointer" onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Filtres</span>
                {isFiltersExpanded ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </CardTitle>
            </CardHeader>
            {isFiltersExpanded && (
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  <span className="font-medium">Filtres</span>
                </div>
                {(() => {
                  const activeFiltersCount = [
                    selectedFloor !== 'all',
                    selectedCategory !== 'all',
                    selectedPerson !== 'all',
                    selectedTheme !== 'all'
                  ].filter(Boolean).length;
                  
                  const clearAllFilters = () => {
                    setSelectedFloor('all');
                    setSelectedCategory('all');
                    setSelectedPerson('all');
                    setSelectedTheme('all');
                  };
                  
                  return activeFiltersCount > 0 ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                        {activeFiltersCount} filtre{activeFiltersCount > 1 ? 's' : ''} actif{activeFiltersCount > 1 ? 's' : ''}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="text-yellow-700 hover:text-yellow-800 hover:bg-yellow-50 h-6 px-2 text-xs"
                      >
                        Effacer tout
                      </Button>
                    </div>
                  ) : null;
                })()}
              </div>
              <div className="grid grid-cols-4 gap-4">
                {/* Filtre par étages */}
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Building className="w-4 h-4" />
                    Étages
                  </Label>
                  <Select value={selectedFloor} onValueChange={setSelectedFloor}>
                    <SelectTrigger className={cn(
                      "transition-all duration-200",
                      selectedFloor !== 'all' && "ring-1 ring-yellow-400 border-yellow-400"
                    )}>
                      <SelectValue placeholder="Sélectionner un étage" />
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

                {/* Filtre par catégorie */}
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4" />
                    Catégorie
                  </Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className={cn(
                      "transition-all duration-200",
                      selectedCategory !== 'all' && "ring-1 ring-yellow-400 border-yellow-400"
                    )}>
                      <SelectValue placeholder="Sélectionner une catégorie" />
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

                {/* Filtre par personne */}
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4" />
                    Personne
                  </Label>
                  <Select value={selectedPerson} onValueChange={setSelectedPerson}>
                    <SelectTrigger className={cn(
                      "transition-all duration-200",
                      selectedPerson !== 'all' && "ring-1 ring-yellow-400 border-yellow-400"
                    )}>
                      <SelectValue placeholder="Sélectionner une personne" />
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

                {/* Filtre par thématiques */}
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    Thématiques
                  </Label>
                  <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                    <SelectTrigger className={cn(
                      "transition-all duration-200",
                      selectedTheme !== 'all' && "ring-1 ring-yellow-400 border-yellow-400"
                    )}>
                      <SelectValue placeholder="Sélectionner un thème" />
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
            </CardContent>
            )}
          </Card>

          {/* Actions */}
          <Card className="mb-4">
            <CardHeader className="pb-3 cursor-pointer" onClick={() => setIsActionsExpanded(!isActionsExpanded)}>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Actions</span>
                {isActionsExpanded ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </CardTitle>
            </CardHeader>
            {isActionsExpanded && (
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {/* Sélectionner */}
                <div>
                  <Label className="mb-2 block">Sélectionner</Label>
                  <Button 
                    variant="outline" 
                    onClick={handleSelectAll}
                    className={cn(
                      "w-full transition-all duration-200",
                      selectedTasks.size > 0 && "ring-1 ring-yellow-400 border-yellow-400 bg-yellow-50"
                    )}
                  >
                    <CheckSquare className="w-4 h-4 mr-2" />
                    {selectedTasks.size === 0 ? 'Tout sélectionner' : `${selectedTasks.size} sélectionné${selectedTasks.size > 1 ? 's' : ''}`}
                  </Button>
                </div>

                {/* Appliquer checklist */}
                <div>
                  <Label className="mb-2 block">Appliquer checklist</Label>
                  <Select value={selectedChecklist} onValueChange={setSelectedChecklist}>
                    <SelectTrigger className={cn(
                      "w-full transition-all duration-200",
                      selectedChecklist && "ring-1 ring-yellow-400 border-yellow-400"
                    )}>
                      <SelectValue placeholder="Choisir checklist" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="arrival">Checklist "en arrivée"</SelectItem>
                      <SelectItem value="turnover">Checklist "en recouche"</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Attribuer */}
                <div>
                  <Label className="mb-2 block">Attribuer</Label>
                  <div className="flex gap-2">
                    <Select value={assignmentTarget} onValueChange={setAssignmentTarget}>
                      <SelectTrigger className={cn(
                        "flex-1 transition-all duration-200",
                        assignmentTarget && "ring-1 ring-yellow-400 border-yellow-400"
                      )}>
                        <SelectValue placeholder="Choisir personne" />
                      </SelectTrigger>
                      <SelectContent>
                        {personOptions.slice(1).map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={handleAssignTasks}
                      disabled={!assignmentTarget || selectedTasks.size === 0}
                      className={cn(
                        "transition-all duration-200",
                        assignmentTarget && selectedTasks.size > 0 && "ring-1 ring-yellow-400"
                      )}
                    >
                      Attribuer
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
            )}
          </Card>
        </div>

        {/* Liste des tâches scrollable - largeur des cartes comme Shift Management */}
        <ScrollArea className="flex-1 px-6 pb-6 max-h-96">
          <div className="space-y-4">
            {/* Tâches non assignées */}
            <div>
              <h3 className="font-semibold mb-3">Tâches non assignées ({unassignedTasks.length})</h3>
              <div className="grid grid-cols-2 gap-3">
                {unassignedTasks.map(task => {
                  const transformedTask = transformTaskForCard(task);
                  return (
                    <div key={task.id} className="relative">
                      <div className="absolute top-2 left-2 z-10">
                        <Checkbox 
                          checked={selectedTasks.has(task.id)}
                          onCheckedChange={(checked) => handleTaskSelection(task.id, !!checked)}
                        />
                      </div>
                      
                      <div className={cn(
                        "ml-6",
                        'isRoomCard' in task && task.isRoomCard ? "opacity-75 bg-yellow-50" : ""
                      )}>
                        <CardFaceModal
                          id={transformedTask.id}
                          title={transformedTask.title}
                          location={transformedTask.location}
                          clientName={transformedTask.clientName}
                          status={transformedTask.status}
                          priority={transformedTask.priority}
                          assignedTo={transformedTask.assignedTo}
                          timeElapsed={transformedTask.timeElapsed}
                          onClick={() => handleCardClick(task)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Separator si il y a des tâches assignées */}
            {assignedTasks.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3 text-muted-foreground">
                    Tâches déjà assignées ({assignedTasks.length})
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {assignedTasks.map(task => {
                      const transformedTask = transformTaskForCard(task);
                      return (
                        <div key={task.id} className="opacity-50">
                        <CardFaceModal
                          id={transformedTask.id}
                          title={transformedTask.title}
                          location={transformedTask.location}
                          clientName={transformedTask.clientName}
                          status={transformedTask.status}
                          priority={transformedTask.priority}
                          assignedTo={transformedTask.assignedTo}
                          timeElapsed={transformedTask.timeElapsed}
                          onClick={() => handleCardClick(task)}
                        />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t p-6 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedTasks.size} tâche(s) sélectionnée(s) • {unassignedTasks.length} non assignées • {assignedTasks.length} assignées
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={handleAssignTasks} disabled={selectedTasks.size === 0}>
              <PlayCircle className="w-4 h-4 mr-2" />
              Commencer le Service
            </Button>
          </div>
        </div>
      </DialogContent>
      
      {/* Modal pour les cartes existantes du shift précédent */}
      <EnhancedTaskDetailModal
        task={selectedCardTask}
        isOpen={isTaskDetailOpen}
        onClose={() => {
          setIsTaskDetailOpen(false);
          setSelectedCardTask(null);
        }}
        onUpdateTask={() => {
          // Optionnel: refetch ou mise à jour des données
        }}
      />
      
      {/* Modal pour les nouvelles cartes */}
      {selectedCardTask && (
        <TaskFullEditView
          task={selectedCardTask}
          isOpen={isFullEditOpen}
          onClose={() => {
            setIsFullEditOpen(false);
            setSelectedCardTask(null);
          }}
          onSave={(updatedTask) => {
            console.log('Task saved:', updatedTask);
            setIsFullEditOpen(false);
            setSelectedCardTask(null);
            // Optionnel: refetch ou mise à jour des données
          }}
        />
      )}
    </Dialog>
  );
};

export default ServiceShiftStartModal;
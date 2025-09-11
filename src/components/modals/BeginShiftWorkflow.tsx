import React, { useState, useEffect } from 'react';
import BeginShiftDailyTasksModal from './BeginShiftDailyTasksModal';
import BeginShiftCardsCreationModal from './BeginShiftCardsCreationModal';
import BeginShiftVoiceNoteModal from './BeginShiftVoiceNoteModal';
import BeginShiftTaskAllocationModal from './BeginShiftTaskAllocationModal';
import { TaskItem } from '@/types/database';

interface BeginShiftWorkflowProps {
  isOpen: boolean;
  onClose: () => void;
  onShiftStarted: () => void;
  tasks: TaskItem[];
  profiles: any[];
}

type WorkflowStep = 'daily_tasks' | 'cards_creation' | 'voice_note' | 'task_allocation' | 'completed';

const BeginShiftWorkflow: React.FC<BeginShiftWorkflowProps> = ({
  isOpen,
  onClose,
  onShiftStarted,
  tasks,
  profiles
}) => {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('daily_tasks');
  const [workflowData, setWorkflowData] = useState({
    withCreation: false,
    selectedLocations: [] as string[],
    createdCards: [] as TaskItem[]
  });

  // Debug: log des changements d'étape
  useEffect(() => {
    console.log('🔄 Workflow step changed to:', currentStep);
  }, [currentStep]);

  const handleClose = () => {
    console.log('❌ Workflow closing');
    setCurrentStep('daily_tasks');
    setWorkflowData({ withCreation: false, selectedLocations: [], createdCards: [] });
    onClose();
  };

  const handleWithCreation = () => {
    console.log('✅ With creation selected, moving to cards_creation');
    setWorkflowData(prev => ({ ...prev, withCreation: true }));
    setCurrentStep('cards_creation');
  };

  const handleWithoutCreation = () => {
    console.log('✅ Without creation selected, moving to voice_note');
    setWorkflowData(prev => ({ ...prev, withCreation: false }));
    setCurrentStep('voice_note');
  };

  // Fonction pour générer le titre de la carte selon le type de location
  const generateCardTitle = (locationName: string, locationType: string) => {
    const lowerLocationName = locationName.toLowerCase();
    
    if (locationType === 'room') {
      return 'Room';
    }
    
    if (lowerLocationName.includes('breakfast') || lowerLocationName.includes('petit déjeuner') || 
        lowerLocationName.includes('restaurant') || lowerLocationName.includes('dining')) {
      return 'Restauration';
    }
    
    if (locationType === 'common_area' || locationType === 'public_areas' || locationType === 'staff_area') {
      return 'Cleaning';
    }
    
    return 'Cleaning'; // Défaut
  };

  const handleCreateCards = (selectedLocationsWithTypes: Array<{ name: string; type: string }>) => {
    console.log('✅ Cards created for locations:', selectedLocationsWithTypes);
    
    // Créer les nouvelles cartes avec les titres appropriés
    const newCards: TaskItem[] = selectedLocationsWithTypes.map((location, index) => {
      return {
        id: `temp-card-${Date.now()}-${index}`, // ID temporaire
        title: generateCardTitle(location.name, location.type),
        location: location.name,
        roomNumber: location.name,
        type: 'internal_task' as const,
        status: 'pending' as const,
        priority: 'normal' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        assignedTo: null, // Non assignée
        guestName: null,
        description: `Daily task for ${location.name}`,
        category: 'daily_task'
      };
    });
    
    setWorkflowData(prev => ({ 
      ...prev, 
      selectedLocations: selectedLocationsWithTypes.map(loc => loc.name),
      createdCards: newCards 
    }));
    setCurrentStep('voice_note');
  };

  const handleVoiceNoteContinue = () => {
    console.log('✅ Voice note continued, moving to task_allocation');
    setCurrentStep('task_allocation');
  };

  const handleStartShift = () => {
    console.log('✅ Shift starting, completing workflow');
    setCurrentStep('completed');
    onShiftStarted();
    handleClose();
  };

  // Détermine quel modal afficher
  const renderCurrentModal = () => {
    console.log('🎭 Rendering modal for step:', currentStep);
    
    switch (currentStep) {
      case 'daily_tasks':
        return (
          <BeginShiftDailyTasksModal
            isOpen={isOpen}
            onClose={handleClose}
            onWithCreation={handleWithCreation}
            onWithoutCreation={handleWithoutCreation}
          />
        );

      case 'cards_creation':
        return (
          <BeginShiftCardsCreationModal
            isOpen={isOpen}
            onClose={handleClose}
            onCreateCards={handleCreateCards}
          />
        );

      case 'voice_note':
        return (
          <BeginShiftVoiceNoteModal
            isOpen={isOpen}
            onClose={handleClose}
            onContinue={handleVoiceNoteContinue}
          />
        );

      case 'task_allocation':
        return (
          <BeginShiftTaskAllocationModal
            isOpen={isOpen}
            onClose={handleClose}
            onStartShift={handleStartShift}
            tasks={[...tasks, ...workflowData.createdCards]} // Fusionner les tâches existantes et nouvelles
            profiles={profiles}
          />
        );

      default:
        console.log('⚠️ Unknown step:', currentStep);
        return null;
    }
  };

  return <>{renderCurrentModal()}</>;
};

export default BeginShiftWorkflow;

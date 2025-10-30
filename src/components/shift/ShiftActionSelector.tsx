import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  PlayCircle, 
  Target, 
  StopCircle 
} from 'lucide-react';

interface ShiftActionSelectorProps {
  shiftStatus: 'not_started' | 'active' | 'closed';
  onShiftAction: (action: 'start' | 'improve' | 'close') => void;
}

// Hook personnalisé pour détecter la taille d'écran
const useWindowSize = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkWindowSize = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint de Tailwind
    };

    // Vérification initiale
    checkWindowSize();

    // Écoute des changements de taille
    window.addEventListener('resize', checkWindowSize);
    
    return () => window.removeEventListener('resize', checkWindowSize);
  }, []);

  return isMobile;
};

const ShiftActionSelector = ({ shiftStatus, onShiftAction }: ShiftActionSelectorProps) => {
  const isMobile = useWindowSize();
  const [selectedAction, setSelectedAction] = useState<string>('');

  // Configuration des actions avec leurs états
  const actions = [
    {
      id: 'start',
      label: 'Start Shift',
      icon: PlayCircle,
      disabled: shiftStatus === 'active',
      variant: shiftStatus === 'active' ? 'secondary' : 'default',
      displayLabel: shiftStatus === 'active' ? 'Active Shift' : 'Start Shift'
    },
    {
      id: 'improve',
      label: 'Work Improvement',
      icon: Target,
      disabled: false,
      variant: 'outline',
      displayLabel: 'Work Improvement'
    },
    {
      id: 'close',
      label: 'End Shift',
      icon: StopCircle,
      disabled: shiftStatus !== 'active',
      variant: shiftStatus === 'active' ? 'default' : 'secondary',
      displayLabel: 'End Shift'
    }
  ];

  // Gestion de la sélection mobile
  const handleMobileSelection = (actionId: string) => {
    const action = actions.find(a => a.id === actionId);
    if (action && !action.disabled) {
      onShiftAction(actionId as 'start' | 'improve' | 'close');
      setSelectedAction(''); // Reset après sélection
    }
  };

  // Styles pour la couleur Gold exacte avec texte blanc
  const goldStyles = {
    backgroundColor: '#BBA57A',
    borderColor: '#A6956B',
    color: '#FFFFFF' // Texte en blanc
  };

  // Rendu mobile : Menu déroulant
  if (isMobile) {
    return (
      <div className="mb-8">
        <style jsx>{`
          .gold-select-trigger {
            background-color: #BBA57A !important;
            border-color: #A6956B !important;
            color: #FFFFFF !important;
          }
          .gold-select-trigger:hover {
            background-color: #A6956B !important;
            color: #FFFFFF !important;
          }
          .gold-select-trigger:focus {
            background-color: #A6956B !important;
            color: #FFFFFF !important;
          }
          .gold-select-trigger svg {
            color: #FFFFFF !important;
          }
          .gold-select-content {
            background-color: #BBA57A !important;
            border-color: #A6956B !important;
          }
          .gold-select-item {
            color: #FFFFFF !important;
          }
          .gold-select-item:hover {
            background-color: #A6956B !important;
            color: #FFFFFF !important;
          }
          .gold-select-item[data-highlighted] {
            background-color: #A6956B !important;
            color: #FFFFFF !important;
          }
          .gold-select-item svg {
            color: #FFFFFF !important;
          }
          .gold-select-item span {
            color: #FFFFFF !important;
          }
          .gold-select-item .text-xs {
            color: #FFFFFF !important;
            opacity: 0.8;
          }
        `}</style>
        <Select value={selectedAction} onValueChange={handleMobileSelection}>
          <SelectTrigger 
            className="w-full h-14 text-base gold-select-trigger"
            style={goldStyles}
          >
            <SelectValue placeholder="Select Shift Action" />
          </SelectTrigger>
          <SelectContent 
            className="gold-select-content"
            style={goldStyles}
          >
            {actions.map((action) => {
              const IconComponent = action.icon;
              return (
                <SelectItem 
                  key={action.id} 
                  value={action.id}
                  disabled={action.disabled}
                  className="h-12 text-base gold-select-item"
                >
                  <div className="flex items-center gap-3">
                    <IconComponent className="h-5 w-5 text-white" />
                    <span className="text-white">{action.displayLabel}</span>
                    {action.disabled && (
                      <span className="text-xs text-white opacity-80 ml-auto">
                        {action.id === 'start' ? '(Active)' : '(Inactive)'}
                      </span>
                    )}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Rendu desktop : Boutons séparés (code existant)
  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      {actions.map((action) => {
        const IconComponent = action.icon;
        return (
          <Button
            key={action.id}
            onClick={() => onShiftAction(action.id as 'start' | 'improve' | 'close')}
            disabled={action.disabled}
            className="h-auto py-3 text-sm md:text-base md:h-12"
            variant={action.variant as any}
          >
            <IconComponent className="h-5 w-5 mr-2 flex-shrink-0" />
            <span className="leading-tight">{action.displayLabel}</span>
          </Button>
        );
      })}
    </div>
  );
};

export default ShiftActionSelector;
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
  Play, 
  Target, 
  Award 
} from 'lucide-react';

interface TrainingActionSelectorProps {
  onStartTraining: () => void;
  onMyProgress: () => void;
  onCompleteQuizz: () => void;
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

const TrainingActionSelector = ({ onStartTraining, onMyProgress, onCompleteQuizz }: TrainingActionSelectorProps) => {
  const isMobile = useWindowSize();
  const [selectedAction, setSelectedAction] = useState<string>('');

  // Configuration des actions Training
  const actions = [
    {
      id: 'start',
      label: 'Start Training',
      icon: Play,
      action: onStartTraining,
      color: '#1E1A37', // WARM RAL Pantone 5255C
      hoverColor: '#DEAE35' // Yellow hover
    },
    {
      id: 'progress',
      label: 'My Progress',
      icon: Target,
      action: onMyProgress,
      color: '#E0D3B4', // Sand RAL Pantone 7500C
      hoverColor: '#DEAE35' // Yellow hover
    },
    {
      id: 'quizz',
      label: 'Complete Quizz',
      icon: Award,
      action: onCompleteQuizz,
      color: '#BBA57A', // Gold RAL Pantone 4006C
      hoverColor: '#DEAE35' // Yellow hover
    }
  ];

  // Gestion de la sélection mobile
  const handleMobileSelection = (actionId: string) => {
    const action = actions.find(a => a.id === actionId);
    if (action) {
      action.action();
      setSelectedAction(''); // Reset après sélection
    }
  };

  // Styles pour la couleur GOLD exacte avec texte BLANC RAL 9016
  const goldStyles = {
    backgroundColor: '#BBA57A', // Gold RAL Pantone 4006C
    borderColor: '#A6956B',
    color: '#FFFFFF' // Blanc RAL 9016 C0 M0 Y0 N0 R255 G255 B255
  };

  // Rendu mobile : Menu déroulant couleur GOLD
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
        `}</style>
        <Select value={selectedAction} onValueChange={handleMobileSelection}>
          <SelectTrigger 
            className="w-full h-14 text-base gold-select-trigger"
            style={goldStyles}
          >
            <SelectValue placeholder="Select Training Action" />
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
                  className="h-12 text-base gold-select-item"
                >
                  <div className="flex items-center gap-3">
                    <IconComponent className="h-5 w-5 text-white" />
                    <span className="text-white">{action.label}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Rendu desktop : Boutons séparés avec les couleurs originales
  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      {actions.map((action) => {
        const IconComponent = action.icon;
        return (
          <Button
            key={action.id}
            onClick={action.action}
            className="h-12 text-base transition-all duration-200"
            style={{ 
              backgroundColor: action.color,
              color: action.id === 'progress' ? '#6B7280' : '#FFFFFF'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = action.hoverColor;
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = action.color;
              e.currentTarget.style.color = action.id === 'progress' ? '#6B7280' : '#FFFFFF';
            }}
          >
            <IconComponent className="h-5 w-5 mr-2" />
            {action.label}
          </Button>
        );
      })}
    </div>
  );
};

export default TrainingActionSelector;
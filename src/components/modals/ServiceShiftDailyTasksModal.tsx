import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  PlayCircle, 
  Plus,
  X
} from 'lucide-react';
import ServiceShiftCardCreationModal from './ServiceShiftCardCreationModal';

interface ServiceShiftDailyTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWithCreation: () => void;
  onWithoutCreation: () => void;
}

const ServiceShiftDailyTasksModal = ({
  isOpen,
  onClose,
  onWithCreation,
  onWithoutCreation
}: ServiceShiftDailyTasksModalProps) => {
  const [isCardCreationOpen, setIsCardCreationOpen] = useState(false);

  const handleWithCreation = () => {
    setIsCardCreationOpen(true);
  };

  const handleCreateCards = (selectedLocations: string[]) => {
    console.log('Creating cards for locations:', selectedLocations);
    
    // Fermer la modal de création de cartes
    setIsCardCreationOpen(false);
    
    // Appeler la fonction de création originale
    onWithCreation();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <PlayCircle className="w-6 h-6 text-blue-600" />
            Begin shift - Daily tasks creation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-6">
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold mb-2">Begin the shift by</h2>
            <p className="text-muted-foreground">
              Choose how you want to start your service shift today
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {/* Avec création de cartes */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Plus className="w-6 h-6 text-green-600" />
                <span className="text-lg font-semibold">With creation of daily task cards</span>
              </div>
              <p className="text-muted-foreground text-sm mb-4">
                Generate automatic daily task cards for all rooms and common areas based on your hotel's standard procedures.
              </p>
              <Button 
                onClick={handleWithCreation}
                className="w-full h-12 text-base bg-blue-600 hover:bg-yellow-500 transition-colors duration-200"
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Daily Tasks
              </Button>
            </div>

            {/* Sans création de cartes */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-3 mb-2">
                <X className="w-6 h-6 text-gray-600" />
                <span className="text-lg font-semibold">Without creation of daily task cards</span>
              </div>
              <p className="text-muted-foreground text-sm mb-4">
                Start your shift with only existing tasks and incidents. You can manually add tasks as needed during your shift.
              </p>
              <Button 
                onClick={onWithoutCreation}
                variant="outline"
                className="w-full h-12 text-base border-gray-300 hover:bg-yellow-500 hover:border-yellow-500 transition-colors duration-200"
                size="lg"
              >
                <PlayCircle className="w-5 h-5 mr-2" />
                Start Without Tasks
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t pt-6 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            You can change this preference later in your settings profile
          </div>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
      
      {/* Modal de création de cartes */}
      <ServiceShiftCardCreationModal
        isOpen={isCardCreationOpen}
        onClose={() => setIsCardCreationOpen(false)}
        onCreateCards={handleCreateCards}
      />
    </Dialog>
  );
};

export default ServiceShiftDailyTasksModal;
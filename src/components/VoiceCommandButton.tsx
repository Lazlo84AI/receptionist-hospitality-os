import { useState } from 'react';
import { FilePlus2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaskCreationModal } from '@/components/modals/TaskCreationModal';
import { useTasks } from '@/hooks/useSupabaseData';
import { cn } from '@/lib/utils';

export function VoiceCommandButton() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isVoicePopupOpen, setIsVoicePopupOpen] = useState(false);
  const { refetch } = useTasks();

  const handleMainButtonClick = () => {
    console.log('Opening task creation modal');
    setShowCreateModal(true);
  };

  return (
    <>
      {/* Main Creation Button - Responsive avec breakpoints */}
      <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[9999]">

        <Button
          onClick={handleMainButtonClick}
          className={cn(
            // Tailles responsive: 64px (mobile) -> 80px (tablet) -> 96px (desktop)
            "h-16 w-16 md:h-20 md:w-20 lg:h-24 lg:w-24 rounded-full transition-all duration-500",
            "bg-hotel-navy hover:bg-hotel-navy/90 border-2 border-hotel-yellow/50 hover:border-hotel-yellow",
            "shadow-lg hover:shadow-2xl",
            // Assurer que le bouton est toujours visible
            "flex items-center justify-center"
          )}
        >
          <FilePlus2 
            className="text-hotel-gold-dark" 
            style={{ 
              width: '20px', 
              height: '20px',
            }} 
          />
        </Button>
        
        {/* Animation de pulsation - Responsive */}
        <div className="absolute -bottom-8 -right-8 md:-bottom-12 md:-right-12 h-32 w-32 md:h-48 md:w-48 rounded-full border-2 border-hotel-yellow/20 animate-ping pointer-events-none" />
      </div>

      {/* Task Creation Modal */}
      <TaskCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onTaskCreated={refetch}
      />
    </>
  );
}

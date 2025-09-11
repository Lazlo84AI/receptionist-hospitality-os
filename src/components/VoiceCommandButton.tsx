import { useState } from 'react';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaskCreationModal } from '@/components/modals/TaskCreationModal';
import { cn } from '@/lib/utils';

export function VoiceCommandButton() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleMainButtonClick = () => {
    console.log('Opening task creation modal');
    setShowCreateModal(true);
  };

  return (
    <>
      {/* Main Creation Button - Simplifié */}
      <div className="fixed bottom-6 right-6 z-[9999]">
        <Button
          onClick={handleMainButtonClick}
          className={cn(
            "h-16 w-16 rounded-full transition-all duration-500",
            "bg-hotel-navy hover:bg-hotel-navy/90 border-2 border-hotel-yellow/50 hover:border-hotel-yellow",
            "shadow-lg"
          )}
        >
          <FileText className="h-6 w-6 text-hotel-yellow" />
        </Button>
        
        {/* Animation de pulsation */}
        <div className="absolute bottom-0 right-0 h-16 w-16 rounded-full border-2 border-champagne-gold/20 animate-ping pointer-events-none" />
      </div>

      {/* Task Creation Modal */}
      <TaskCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </>
  );
}
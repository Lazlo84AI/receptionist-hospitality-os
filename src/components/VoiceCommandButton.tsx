import { useState } from 'react';
import { FilePlus2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaskCreationModal } from '@/components/modals/TaskCreationModal';
import { useTasks } from '@/hooks/useSupabaseData'; // ← Import du hook
import { cn } from '@/lib/utils';

export function VoiceCommandButton() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isVoicePopupOpen, setIsVoicePopupOpen] = useState(false);
  const { refetch } = useTasks(); // ← Hook pour refresh

  const handleMainButtonClick = () => {
    if (!isVoicePopupOpen) {
      console.log('Opening voice popup');
      setIsVoicePopupOpen(true);
    } else {
      console.log('Closing voice popup');
      setIsVoicePopupOpen(false);
    }
  };

  return (
    <>
      {/* Main Creation Button - Simplifié */}
      <div className="fixed bottom-6 right-6 z-[9999]">
        
        {/* Bouton écrit */}
        <Button
          onClick={() => setShowCreateModal(true)}
          className={cn(
            "absolute -top-28 left-0 h-16 w-16 rounded-full transition-all duration-300",
            "bg-hotel-navy hover:bg-hotel-navy/90 border-2 border-hotel-yellow/50 hover:border-hotel-yellow",
            "shadow-lg"
          )}
          title="Create written card"
        >
          <span className="text-2xl">✏️</span>
        </Button>

        {/* Widget ElevenLabs - visible UNIQUEMENT si popup vocal ouvert */}
        {isVoicePopupOpen && (
          <div className="absolute bottom-28 right-0">
            <elevenlabs-convai agent-id="agent_4601kfg261veejy8ryqgfdrbavqj"></elevenlabs-convai>
          </div>
        )}

        <Button
          onClick={handleMainButtonClick}
          className={cn(
            "h-24 w-24 rounded-full transition-all duration-500",
            "bg-hotel-navy hover:bg-hotel-navy/90 border-2 border-hotel-yellow/50 hover:border-hotel-yellow",
            "shadow-lg"
          )}
        >
          <FilePlus2 className="text-hotel-gold-dark" style={{ width: '24px', height: '24px' }} />
        </Button>
        
        {/* Animation de pulsation */}
        <div className="absolute -bottom-12 -right-12 h-48 w-48 rounded-full border-2 border-hotel-yellow/20 animate-ping pointer-events-none" />
      </div>

      {/* Task Creation Modal */}
      <TaskCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onTaskCreated={refetch} // ← Callback de refresh
      />
    </>
  );
}
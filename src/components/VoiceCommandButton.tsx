import { useState } from 'react';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export function VoiceCommandButton() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleMainButtonClick = () => {
    console.log('VoiceCommandButton - Bouton cliqué');
    setShowCreateModal(true);
  };

  return (
    <>
      {/* Main Button - Simple et fonctionnel */}
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
      </div>

      {/* Modal Vide - Juste pour éviter les erreurs */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Voice Command</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 text-center">
            <p className="text-muted-foreground">
              Fonctionnalité en cours de développement
            </p>
            <Button 
              onClick={() => setShowCreateModal(false)}
              className="w-full"
            >
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
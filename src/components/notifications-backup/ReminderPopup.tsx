import { useState } from 'react';
import { X, Clock, Snooze, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface ReminderData {
  id: string;
  title: string;
  message?: string;
  task_id?: string;
  task_type?: string;
  remind_at: string;
  // Pour les checklists
  checklist_title?: string;
  task_title?: string;
}

interface ReminderPopupProps {
  reminder: ReminderData;
  isVisible: boolean;
  onClose: () => void;
  onSnooze: (reminderID: string, minutes: number) => void;
  onMarkDone: (reminderID: string) => void;
}

export function ReminderPopup({ 
  reminder, 
  isVisible, 
  onClose, 
  onSnooze, 
  onMarkDone 
}: ReminderPopupProps) {
  const [isClosing, setIsClosing] = useState(false);
  
  if (!isVisible) return null;

  const currentTime = format(new Date(), 'HH:mm');
  
  // Déterminer le texte selon le type
  const isChecklist = reminder.task_type === 'checklist' || reminder.checklist_title;
  
  const displayText = isChecklist 
    ? `${reminder.checklist_title || 'Checklist'} - ${reminder.task_title || reminder.title} - Il est ${currentTime}`
    : `Reminder: ${reminder.title} - Il est ${currentTime}`;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  const handleSnooze = (minutes: number) => {
    onSnooze(reminder.id, minutes);
    handleClose();
  };

  const handleDone = () => {
    onMarkDone(reminder.id);
    handleClose();
  };

  return (
    <>
      {/* Overlay noir semi-transparent */}
      <div 
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleClose}
      />
      
      {/* Pop-up principal */}
      <div 
        className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50
          w-96 max-w-[90vw] bg-gradient-to-br from-yellow-400 to-yellow-600 
          rounded-2xl shadow-2xl border-4 border-yellow-300
          transition-all duration-300 ${
            isClosing 
              ? 'opacity-0 scale-95 translate-y-4' 
              : 'opacity-100 scale-100 translate-y-0'
          }`}
      >
        {/* Header avec bouton fermer */}
        <div className="flex justify-between items-start p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-full">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <span className="text-white/90 font-medium text-sm uppercase tracking-wide">
              NOTIFICATION
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-white hover:bg-white/20 p-2"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Contenu principal */}
        <div className="px-6 pb-6">
          <div className="text-white text-xl font-bold leading-tight mb-6">
            {displayText}
          </div>

          {/* Message optionnel */}
          {reminder.message && reminder.message !== reminder.title && (
            <div className="text-white/90 text-sm mb-6 bg-white/10 rounded-lg p-3">
              {reminder.message}
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex flex-col gap-3">
            {/* Bouton Done - principal */}
            <Button
              onClick={handleDone}
              className="w-full bg-white text-yellow-600 hover:bg-yellow-50 
                font-semibold py-3 text-base transition-colors duration-200
                border-2 border-white hover:border-yellow-100"
            >
              <Check className="w-5 h-5 mr-2" />
              Marquer comme terminé
            </Button>

            {/* Boutons Snooze */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={() => handleSnooze(5)}
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 
                  hover:border-white/50 transition-colors duration-200"
              >
                <Snooze className="w-4 h-4 mr-1" />
                5min
              </Button>
              <Button
                onClick={() => handleSnooze(15)}
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 
                  hover:border-white/50 transition-colors duration-200"
              >
                <Snooze className="w-4 h-4 mr-1" />
                15min
              </Button>
              <Button
                onClick={() => handleSnooze(60)}
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 
                  hover:border-white/50 transition-colors duration-200"
              >
                <Snooze className="w-4 h-4 mr-1" />
                1h
              </Button>
            </div>
          </div>
        </div>

        {/* Indicateur visuel en bas */}
        <div className="h-2 bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-b-2xl" />
      </div>
    </>
  );
}
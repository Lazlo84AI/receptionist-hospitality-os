import { useState } from 'react';
import { 
  Mic, 
  MessageCircle, 
  FileText, 
  CheckSquare, 
  Settings,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const voiceOptions = [
  { icon: Mic, label: 'Parler à l\'IA', action: 'voice' },
  { icon: MessageCircle, label: 'Chat', action: 'chat' },
  { icon: FileText, label: 'Rapport', action: 'report' },
  { icon: CheckSquare, label: 'Créer tâche', action: 'task' },
  { icon: Settings, label: 'Paramètres', action: 'settings' },
];

export function VoiceCommandButton() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const handleOptionClick = (action: string) => {
    console.log('Voice action:', action);
    if (action === 'voice') {
      setIsListening(!isListening);
    }
    setIsExpanded(false);
  };

  return (
    <>
      {/* Backdrop when expanded */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Voice Command Menu */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Expanded Options */}
        {isExpanded && (
          <div className="absolute bottom-16 right-0 mb-4 space-y-3 animate-in slide-in-from-bottom-4 duration-300">
            {voiceOptions.map((option, index) => (
              <Button
                key={index}
                onClick={() => handleOptionClick(option.action)}
                className={cn(
                  "h-12 px-4 bg-palace-navy text-warm-cream border border-champagne-gold/30 hover:bg-champagne-gold hover:text-palace-navy transition-all duration-300",
                  "shadow-lg"
                )}
              >
                <option.icon className="h-5 w-5 mr-2" />
                <span className="whitespace-nowrap font-medium">
                  {option.label}
                </span>
              </Button>
            ))}
          </div>
        )}

        {/* Main Voice Button */}
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "h-16 w-16 rounded-full transition-all duration-500",
            isExpanded
              ? "bg-urgence-red hover:bg-urgence-red/90 rotate-45 border-2 border-urgence-red"
              : isListening
                ? "bg-champagne-gold hover:bg-champagne-gold/90 border-2 border-champagne-gold"
                : "bg-palace-navy hover:bg-palace-navy/90 border-2 border-champagne-gold/50 hover:border-champagne-gold",
            "shadow-lg"
          )}
        >
          {isExpanded ? (
            <X className="h-6 w-6 text-warm-cream" />
          ) : isListening ? (
            <Mic className="h-6 w-6 text-palace-navy" />
          ) : (
            <Mic className="h-6 w-6 text-champagne-gold" />
          )}
        </Button>

        {/* Subtle Pulse Animation when idle */}
        {!isExpanded && !isListening && (
          <div className="absolute inset-0 rounded-full border-2 border-champagne-gold/20 animate-ping" />
        )}
      </div>
    </>
  );
}
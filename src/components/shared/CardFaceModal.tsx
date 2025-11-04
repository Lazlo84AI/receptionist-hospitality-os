import { Eye, User, Clock, FileText, CheckCircle, Brain } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getTimeElapsedColor } from '@/utils/timeUtils';

interface CardFaceModalProps {
  id: string;
  title: string;
  location: string;
  clientName?: string; // Optional pour les cas où on a un nom client
  status: 'To Process' | 'In Progress' | 'Completed' | 'Cancelled';
  priority?: 'URGENCE' | 'NORMAL';
  assignedTo: string;
  timeElapsed: string;
  onClick: () => void;
  onEyeClick?: () => void; // NOUVEAU: Handler pour l'icône œil
}

export function CardFaceModal({
  id,
  title,
  location,
  clientName,
  status,
  priority,
  assignedTo,
  timeElapsed,
  onClick,
  onEyeClick
}: CardFaceModalProps) {
  
  const getStatusBadgeClass = (status: string) => {
    // Si c'est une carte QCM, adapter les couleurs pour le fond Gold
    if (assignedTo === 'QCM') {
      switch (status) {
        case 'To Process':
          return 'bg-white text-[#BBA57A] border-white';
        case 'In Progress': 
          return 'bg-white text-[#BBA57A] border-white';
        case 'Completed':
          return 'bg-white text-[#BBA57A] border-white';
        case 'Cancelled':
          return 'bg-white text-[#BBA57A] border-white';
        default:
          return 'bg-white text-[#BBA57A] border-white';
      }
    }
    
    // Couleurs normales pour les autres cartes
    switch (status) {
      case 'To Process':
        return 'bg-hotel-gold-dark text-white border-hotel-gold-dark'; // Gold RAL Pantone 4006C
      case 'In Progress': 
        return 'in-progress-badge'; // Badge blanc selon charte graphique
      case 'Completed':
        return 'bg-white text-gray-600 border-gray-200'; // Blanc
      case 'Cancelled':
        return 'bg-gray-100 text-gray-500 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  return (
    <div 
      className={cn(
        "w-full px-6 py-5 rounded-lg border cursor-pointer hotel-hover",
        assignedTo === 'QCM' 
          ? "bg-[#BBA57A] text-white border-[#BBA57A]" 
          : "bg-white border-hotel-navy/20"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <h3 className={cn(
              "font-semibold leading-tight",
              assignedTo === 'QCM' ? "text-white" : "text-hotel-navy"
            )}>
              {title}
            </h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn(
                "shrink-0",
                assignedTo === 'QCM' 
                  ? "text-white/80 hover:text-white" 
                  : "text-hotel-navy/60 hover:text-hotel-navy"
              )}
              onClick={(e) => {
                e.stopPropagation(); // Empêcher le clic sur la carte
                onEyeClick?.(); // Appeler le handler de l'œil
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
          
          <div className={cn(
            "text-sm mb-3",
            assignedTo === 'QCM' ? "text-white/80" : "text-hotel-navy/60"
          )}>
            {location}{clientName && ` • ${clientName}`}
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge className={cn("text-xs px-2 py-1", getStatusBadgeClass(status))}>
              {status}
            </Badge>
            {priority === 'URGENCE' && (
              <Badge className="bg-hotel-yellow text-hotel-navy border-hotel-yellow animate-pulse text-xs px-2 py-1">
                {priority}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-2">
          {assignedTo === 'Formation' ? (
            <FileText className={cn(
              "h-4 w-4",
              assignedTo === 'QCM' ? "text-white/80" : "text-hotel-navy/60"
            )} />
          ) : assignedTo === 'QCM' ? (
            <CheckCircle className={cn(
              "h-4 w-4",
              assignedTo === 'QCM' ? "text-white/80" : "text-hotel-navy/60"
            )} />
          ) : assignedTo === 'Training' ? (
            <Brain className={cn(
              "h-4 w-4",
              assignedTo === 'QCM' ? "text-white/80" : "text-hotel-navy/60"
            )} />
          ) : (
            <User className={cn(
              "h-4 w-4",
              assignedTo === 'QCM' ? "text-white/80" : "text-hotel-navy/60"
            )} />
          )}
          <span className={cn(
            "text-sm",
            assignedTo === 'QCM' ? "text-white/80" : "text-hotel-navy/60"
          )}>
            {assignedTo}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className={cn(
            "h-4 w-4",
            assignedTo === 'QCM' ? "text-white/80" : "text-hotel-navy/60"
          )} />
          <span className={cn("text-sm font-medium", getTimeElapsedColor(timeElapsed))}>
            {timeElapsed}
          </span>
        </div>
      </div>
    </div>
  );
}
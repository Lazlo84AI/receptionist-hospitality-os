import { Eye, User, Clock } from 'lucide-react';
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
  onClick
}: CardFaceModalProps) {
  
  const getStatusBadgeClass = (status: string) => {
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
      className="w-full px-6 py-5 bg-white rounded-lg border border-hotel-navy/20 cursor-pointer hotel-hover"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-hotel-navy leading-tight">
              {title}
            </h3>
            <Button variant="ghost" size="sm" className="shrink-0 text-hotel-navy/60 hover:text-hotel-navy">
              <Eye className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-sm text-hotel-navy/60 mb-3">
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
          <User className="h-4 w-4 text-hotel-navy/60" />
          <span className="text-sm text-hotel-navy/60">
            {assignedTo}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-hotel-navy/60" />
          <span className={cn("text-sm font-medium", getTimeElapsedColor(timeElapsed))}>
            {timeElapsed}
          </span>
        </div>
      </div>
    </div>
  );
}
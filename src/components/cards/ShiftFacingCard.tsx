import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  AlertTriangle,
  Users,
  Clock,
  Wrench,
  User,
  MapPin,
  Heart,
  UserCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TaskItem } from '@/types/database';

interface ShiftFacingCardProps {
  task: TaskItem;
  onClick?: () => void;
  className?: string;
}

/**
 * Composant de carte pour les shifts (début et fin de shift)
 * Toutes les données proviennent de Supabase via les props TaskItem
 * Design : Picto en haut à gauche, priorité en haut à droite,
 * titre, description (max 2 lignes), statut en bas à gauche,
 * location et assigné en bas
 */
export const ShiftFacingCard = ({ task, onClick, className }: ShiftFacingCardProps) => {
  
  // Configuration des types avec icônes et couleurs
  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'incident':
        return { 
          icon: AlertTriangle, 
          color: 'bg-red-100 text-red-600',
          label: 'Incident' 
        };
      case 'client_request':
        return { 
          icon: Heart, 
          color: 'bg-green-100 text-green-600',
          label: 'Client Request' 
        };
      case 'follow_up':
        return { 
          icon: Clock, 
          color: 'bg-gray-600 text-white',
          label: 'Follow-up' 
        };
      case 'internal_task':
      case 'personal_task':
        return { 
          icon: UserCircle, 
          color: 'bg-yellow-100 text-yellow-600',
          label: 'Personal Task' 
        };
      default:
        return { 
          icon: Wrench, 
          color: 'bg-gray-100 text-gray-600',
          label: 'Task' 
        };
    }
  };

  // Configuration du statut avec couleurs
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { 
          label: 'To Process', 
          color: 'bg-green-600 text-white border-green-600' 
        };
      case 'in_progress': 
        return { 
          label: 'In Progress', 
          color: 'bg-gray-300 text-gray-700 border-gray-300' 
        };
      case 'completed':
        return { 
          label: 'Completed', 
          color: 'bg-white text-gray-600 border-gray-200' 
        };
      default:
        return { 
          label: 'Unknown', 
          color: 'bg-gray-100 text-gray-500 border-gray-200' 
        };
    }
  };

  const typeConfig = getTypeConfig(task.type);
  const statusConfig = getStatusConfig(task.status);
  const TypeIcon = typeConfig.icon;

  // Formatage de la description avec ellipsis après 2 lignes
  const formatDescription = (description?: string) => {
    if (!description) return '';
    // Limite approximative pour 2 lignes (environ 120 caractères)
    if (description.length > 120) {
      return description.substring(0, 117) + '...';
    }
    return description;
  };

  // Formatage de la location (Room + location ou juste location)
  const getLocationDisplay = () => {
    if (task.roomNumber && task.location) {
      return `Room ${task.roomNumber} • ${task.location}`;
    } else if (task.roomNumber) {
      return `Room ${task.roomNumber}`;
    } else if (task.location) {
      return task.location;
    }
    return 'No location';
  };

  return (
    <Card 
      className={cn(
        "transition-all duration-200 hover:shadow-md cursor-pointer border border-border/50",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        {/* Header : Picto à gauche + Priorité à droite */}
        <div className="flex items-start justify-between mb-3">
          {/* Picto de type */}
          <div className={cn("p-2 rounded-full", typeConfig.color)}>
            <TypeIcon className="h-4 w-4" />
          </div>
          
          {/* Badge de priorité (seulement si urgent) */}
          {task.priority === 'urgent' && (
            <Badge className="bg-red-500 text-white border-red-500 animate-pulse text-xs px-2 py-1">
              Urgent
            </Badge>
          )}
        </div>

        {/* Titre de la tâche */}
        <h3 className="font-semibold text-base text-foreground leading-tight mb-2">
          {task.title}
        </h3>
        
        {/* Description (max 2 lignes avec ellipsis) */}
        {task.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {formatDescription(task.description)}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Footer : Statut à gauche + Infos en bas */}
        <div className="space-y-3">
          {/* Statut */}
          <div>
            <Badge className={cn("text-xs px-2 py-1", statusConfig.color)}>
              {statusConfig.label}
            </Badge>
          </div>
          
          {/* Location et personne assignée */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {/* Location */}
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{getLocationDisplay()}</span>
            </div>
            
            {/* Personne assignée */}
            {task.assignedTo && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{task.assignedTo}</span>
              </div>
            )}
          </div>
          
          {/* Guest name si c'est une client request */}
          {task.guestName && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span>Guest: {task.guestName}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
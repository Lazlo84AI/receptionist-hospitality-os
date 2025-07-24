import { AlertCircle, Building2, CreditCard, Clock, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const followUps = [
  {
    id: 1,
    title: 'Confirmation arrivée VIP',
    statut: 'À traiter',
    priority: 'urgence',
    assignedTo: 'Réception : Leopold Bechu',
    hoursElapsed: 3,
    overdue: false
  },
  {
    id: 2,
    title: 'Message non lu WhatsApp',
    statut: 'En cours',
    priority: null,
    assignedTo: 'Gouvernante : Marie Dubois',
    hoursElapsed: 24,
    overdue: true
  },
  {
    id: 3,
    title: 'Équipement manquant en chambre',
    statut: 'À traiter',
    priority: 'urgence',
    assignedTo: 'Prestataire : Jean Dupont',
    hoursElapsed: 6,
    overdue: false
  },
  {
    id: 4,
    title: 'Confirmation équipements massage',
    statut: 'En cours',
    priority: null,
    assignedTo: 'Gouvernante : Marie Dubois',
    hoursElapsed: 12,
    overdue: false
  },
  {
    id: 5,
    title: 'Livraison arrangements floraux',
    statut: 'À traiter',
    priority: 'urgence',
    assignedTo: 'Prestataire : Jean Dupont',
    hoursElapsed: 48,
    overdue: true
  }
];

export function FollowUpsCard() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerPage = 2;
  const maxIndex = Math.max(0, followUps.length - itemsPerPage);

  const getStatusColor = (statut: string) => {
    if (statut === 'À traiter') return 'bg-green-500 text-white';
    if (statut === 'En cours') return 'bg-palace-navy text-white';
    return 'bg-muted text-soft-pewter border-border';
  };

  const formatElapsedTime = (hours: number) => {
    if (hours < 24) {
      return `Depuis ${hours}h`;
    } else {
      const days = Math.floor(hours / 24);
      return `Depuis ${days}j`;
    }
  };

  const overdueCount = followUps.filter(item => item.overdue).length;
  const visibleItems = followUps.slice(currentIndex, currentIndex + itemsPerPage);

  const nextSlide = () => {
    setCurrentIndex(Math.min(currentIndex + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex(Math.max(currentIndex - 1, 0));
  };

  return (
    <div className="luxury-card p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-urgence-red/10 rounded-lg">
            <AlertCircle className="h-6 w-6 text-urgence-red" />
          </div>
          <div>
            <h2 className="text-xl font-playfair font-semibold text-palace-navy">
              Relances et tâches à faire
            </h2>
            <p className="text-sm text-soft-pewter">
              Suivi des échéances critiques
            </p>
          </div>
        </div>
        {overdueCount > 0 && (
          <Badge className="bg-urgence-red text-white text-sm px-3 py-1">
            {overdueCount} en retard
          </Badge>
        )}
      </div>

      {/* Carousel Navigation */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={prevSlide}
          disabled={currentIndex === 0}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <span className="text-sm text-soft-pewter">
          {currentIndex + 1}-{Math.min(currentIndex + itemsPerPage, followUps.length)} of {followUps.length}
        </span>
        
        <Button
          variant="outline"
          size="sm"
          onClick={nextSlide}
          disabled={currentIndex >= maxIndex}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Cards with new UI structure */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {visibleItems.map((item) => (
          <div
            key={item.id}
            className="p-6 rounded-lg border bg-background hover:shadow-md transition-all duration-300"
          >
            {/* Header with title and eye icon */}
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-bold text-palace-navy text-base flex-1">
                {item.title}
              </h3>
              <div className="flex flex-col items-end space-y-2">
                <Eye className="h-4 w-4 text-soft-pewter hover:text-palace-navy cursor-pointer" />
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3 text-soft-pewter" />
                  <span className={cn(
                    "text-xs font-medium",
                    item.overdue ? "text-urgence-red" : "text-soft-pewter"
                  )}>
                    {formatElapsedTime(item.hoursElapsed)}
                  </span>
                </div>
              </div>
            </div>

            {/* Status and priority badges */}
            <div className="flex items-center space-x-2 mb-4">
              <Badge className={getStatusColor(item.statut)}>
                {item.statut}
              </Badge>
              {item.priority === 'urgence' && (
                <Badge className="bg-urgence-red text-white">
                  URGENCE
                </Badge>
              )}
            </div>

            {/* Assignment line */}
            <div className="mb-4">
              <span className="text-sm text-soft-pewter">Assigné à : </span>
              <span className="text-sm font-medium text-palace-navy">
                {item.assignedTo}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-6 border-t border-border/20">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-urgence-red">{overdueCount}</p>
            <p className="text-xs text-soft-pewter">En retard</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-soft-pewter">
              {followUps.filter(item => item.statut === 'À traiter').length}
            </p>
            <p className="text-xs text-soft-pewter">À traiter</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-palace-navy">
              {followUps.filter(item => item.statut === 'En cours').length}
            </p>
            <p className="text-xs text-soft-pewter">En cours</p>
          </div>
        </div>
      </div>
    </div>
  );
}
import { AlertCircle, Building2, CreditCard, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const followUps = [
  {
    id: 1,
    type: 'Prestataire',
    destinataire: 'Spa Wellness Pro',
    sujet: 'Confirmation équipements massage',
    dateLimite: '2024-01-15',
    statut: 'En retard',
    priority: 'high',
    icon: Building2,
    overdue: true
  },
  {
    id: 2,
    type: 'Client',
    destinataire: 'M. Richardson',
    sujet: 'Paiement séjour prolongé',
    dateLimite: '2024-01-16',
    statut: 'À faire',
    priority: 'medium',
    icon: CreditCard,
    overdue: false
  },
  {
    id: 3,
    type: 'Prestataire',
    destinataire: 'Alpine Flowers',
    sujet: 'Livraison arrangements floraux',
    dateLimite: '2024-01-14',
    statut: 'En retard',
    priority: 'high',
    icon: Building2,
    overdue: true
  },
  {
    id: 4,
    type: 'Tâche',
    destinataire: 'Équipe Maintenance',
    sujet: 'Inspection système chauffage',
    dateLimite: '2024-01-17',
    statut: 'Programmé',
    priority: 'low',
    icon: Clock,
    overdue: false
  },
  {
    id: 5,
    type: 'Client',
    destinataire: 'Famille Chen',
    sujet: 'Confirmation excursion privée',
    dateLimite: '2024-01-15',
    statut: 'En retard',
    priority: 'medium',
    icon: CreditCard,
    overdue: true
  }
];

export function FollowUpsCard() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerPage = 2;
  const maxIndex = Math.max(0, followUps.length - itemsPerPage);

  const getStatusColor = (statut: string, overdue: boolean) => {
    if (overdue) return 'bg-urgence-red text-white';
    return 'bg-muted text-soft-pewter border-border';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    });
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

      {/* Horizontal Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {visibleItems.map((item) => (
          <div
            key={item.id}
            className={cn(
              "p-6 rounded-lg border transition-all duration-300",
              item.overdue 
                ? "bg-urgence-red/5 border-urgence-red/20" 
                : "bg-muted/20 border-border/30"
            )}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-3 flex-1">
                <div className={cn(
                  "p-2 rounded-lg",
                  item.overdue ? "bg-urgence-red/10" : "bg-muted"
                )}>
                  <item.icon className={cn(
                    "h-4 w-4",
                    item.overdue ? "text-urgence-red" : "text-soft-pewter"
                  )} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-palace-navy text-sm mb-1">
                    {item.sujet}
                  </h3>
                  <p className="text-sm text-soft-pewter mb-3">
                    {item.destinataire}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-soft-pewter">
                      {item.type}
                    </span>
                    <Badge className={getStatusColor(item.statut, item.overdue)}>
                      {item.overdue ? 'En retard' : item.statut}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className={cn(
                "text-xs font-medium",
                item.overdue ? "text-urgence-red" : "text-soft-pewter"
              )}>
                {formatDate(item.dateLimite)}
              </p>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs h-7"
              >
                Relancer
              </Button>
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
              {followUps.filter(item => !item.overdue && item.statut === 'À faire').length}
            </p>
            <p className="text-xs text-soft-pewter">À traiter</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-palace-navy">
              {followUps.filter(item => item.statut === 'Programmé').length}
            </p>
            <p className="text-xs text-soft-pewter">Programmés</p>
          </div>
        </div>
      </div>
    </div>
  );
}
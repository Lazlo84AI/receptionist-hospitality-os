import { AlertCircle, Building2, CreditCard, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Prestataire': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Client': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Tâche': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (statut: string, overdue: boolean) => {
    if (overdue) return 'bg-urgence-red text-white';
    switch (statut) {
      case 'À faire': return 'bg-warning-orange/10 text-warning-orange border-warning-orange/20';
      case 'Programmé': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Terminé': return 'bg-success-green/10 text-success-green border-success-green/20';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    });
  };

  const overdueCount = followUps.filter(item => item.overdue).length;

  return (
    <div className="luxury-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-urgence-red/10 rounded-lg">
            <AlertCircle className="h-6 w-6 text-urgence-red" />
          </div>
          <div>
            <h2 className="text-xl font-playfair font-semibold text-palace-navy">
              Relances à Faire
            </h2>
            <p className="text-sm text-soft-pewter">
              Suivi des échéances critiques
            </p>
          </div>
        </div>
        {overdueCount > 0 && (
          <Badge className="bg-urgence-red text-white text-sm px-3 py-1 animate-pulse">
            {overdueCount} en retard
          </Badge>
        )}
      </div>

      <div className="space-y-3">
        {followUps.map((item) => (
          <div
            key={item.id}
            className={cn(
              "p-4 rounded-lg border transition-all duration-300",
              item.overdue 
                ? "bg-urgence-red/5 border-urgence-red/20 hover:bg-urgence-red/10" 
                : "bg-muted/20 border-border/30 hover-luxury"
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start space-x-3 flex-1">
                <div className={cn(
                  "p-1 rounded-lg mt-1",
                  item.overdue ? "bg-urgence-red/10" : "bg-soft-pewter/10"
                )}>
                  <item.icon className={cn(
                    "h-4 w-4",
                    item.overdue ? "text-urgence-red" : "text-soft-pewter"
                  )} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-palace-navy text-sm">
                      {item.sujet}
                    </h3>
                  </div>
                  <p className="text-sm text-soft-pewter mb-2">
                    {item.destinataire}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getTypeColor(item.type)}>
                      {item.type}
                    </Badge>
                    <Badge className={getStatusColor(item.statut, item.overdue)}>
                      {item.overdue ? 'En retard' : item.statut}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className={cn(
                  "text-xs font-medium",
                  item.overdue ? "text-urgence-red" : "text-soft-pewter"
                )}>
                  {formatDate(item.dateLimite)}
                </p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="mt-2 text-xs h-7"
                >
                  Relancer
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-border/20">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-urgence-red">{overdueCount}</p>
            <p className="text-xs text-soft-pewter">En retard</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-warning-orange">
              {followUps.filter(item => !item.overdue && item.statut === 'À faire').length}
            </p>
            <p className="text-xs text-soft-pewter">À traiter</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-champagne-gold">
              {followUps.filter(item => item.statut === 'Programmé').length}
            </p>
            <p className="text-xs text-soft-pewter">Programmés</p>
          </div>
        </div>
      </div>
    </div>
  );
}
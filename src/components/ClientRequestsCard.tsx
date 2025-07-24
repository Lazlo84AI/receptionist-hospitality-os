import { Heart, User, CheckCircle, Clock, Star, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const clientRequests = [
  {
    id: 1,
    clientName: 'M. et Mme Anderson',
    room: 'Suite 201',
    request: 'Champagne Dom Pérignon et roses rouges',
    occasion: 'Anniversaire de mariage',
    status: 'À traiter',
    gouvernante: 'Claire Petit',
    avatar: 'CP',
    daysSince: 2,
    priority: 'URGENCE'
  },
  {
    id: 2,
    clientName: 'Famille Dubois',
    room: 'Chambre 305',
    request: 'Lit bébé et produits hypoallergéniques',
    occasion: 'Voyage en famille',
    status: 'En cours',
    gouvernante: 'Marie Rousseau',
    avatar: 'MR',
    daysSince: 1,
    priority: 'NORMAL'
  },
  {
    id: 3,
    clientName: 'Dr. Williams',
    room: 'Suite 102',
    request: 'Bureau adapté télétravail + silence',
    occasion: 'Séjour d\'affaires',
    status: 'Résolu',
    gouvernante: 'Sophie Bernard',
    avatar: 'SB',
    daysSince: 0,
    priority: 'NORMAL'
  },
  {
    id: 4,
    clientName: 'Mlle Martinez',
    room: 'Chambre 208',
    request: 'Repas végétalien + yoga mat',
    occasion: 'Retraite wellness',
    status: 'À traiter',
    gouvernante: 'Claire Petit',
    avatar: 'CP',
    daysSince: 1,
    priority: 'URGENCE'
  }
];

export function ClientRequestsCard() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'À traiter': return 'bg-green-500 text-white';
      case 'En cours': return 'bg-palace-navy text-white';
      case 'Résolu': return '';
      default: return 'bg-muted text-soft-pewter border-border';
    }
  };

  const getPriorityBadge = (priority: string) => {
    if (priority === 'URGENCE') {
      return (
        <Badge className="bg-urgence-red text-white">
          URGENCE
        </Badge>
      );
    }
    return null;
  };

  const getDaysSinceText = (days: number) => {
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return "Depuis 1 jour";
    return `Depuis ${days} jours`;
  };

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="luxury-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-50 rounded-lg">
            <Heart className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-playfair font-semibold text-palace-navy">
              Demandes Clients
            </h2>
            <p className="text-sm text-soft-pewter capitalize">
              {today}
            </p>
          </div>
        </div>
        <span className="text-sm text-soft-pewter font-medium">
          {clientRequests.length} demandes
        </span>
      </div>

      <div className="space-y-4">
        {clientRequests.map((request) => (
          <div
            key={request.id}
            className="p-4 bg-muted/20 rounded-lg border border-border/30 hover-luxury transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-palace-navy">
                    {request.request}
                  </h3>
                  <Eye className="h-4 w-4 text-soft-pewter cursor-pointer hover:text-palace-navy" />
                </div>
                <p className="text-palace-navy mb-1">
                  {request.room}
                </p>
                <p className="text-sm text-soft-pewter mb-3">
                  {request.clientName}
                </p>
                
                <div className="flex items-center space-x-2 mb-3">
                  {request.status !== 'Résolu' && (
                    <Badge className={getStatusColor(request.status)}>
                      {request.status}
                    </Badge>
                  )}
                  {request.status === 'Résolu' && (
                    <span className="text-soft-pewter">Résolu</span>
                  )}
                  {getPriorityBadge(request.priority)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border/20">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-soft-pewter">Assigné à :</span>
                <span className="text-sm font-bold text-palace-navy">
                  Gouvernante : {request.gouvernante}
                </span>
              </div>
              <div className="flex items-center space-x-1 text-sm text-urgence-red">
                <Clock className="h-4 w-4" />
                <span>{getDaysSinceText(request.daysSince)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-border/20">
        <div className="flex items-center justify-between text-sm">
          <span className="text-soft-pewter">Statuts aujourd'hui:</span>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-xs">{clientRequests.filter(r => r.status === 'À traiter').length} à traiter</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 rounded-full bg-soft-pewter" />
                <span className="text-xs">1 en cours</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-xs">1 préparé</span>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}
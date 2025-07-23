import { Calendar, User, CheckCircle, Clock, Star } from 'lucide-react';
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
    status: 'À préparer',
    gouvernante: 'Claire Petit',
    avatar: 'CP',
    time: '16:00',
    priority: 'VIP'
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
    time: '14:30',
    priority: 'Standard'
  },
  {
    id: 3,
    clientName: 'Dr. Williams',
    room: 'Suite 102',
    request: 'Bureau adapté télétravail + silence',
    occasion: 'Séjour d\'affaires',
    status: 'Préparé',
    gouvernante: 'Sophie Bernard',
    avatar: 'SB',
    time: '12:00',
    priority: 'Business'
  },
  {
    id: 4,
    clientName: 'Mlle Martinez',
    room: 'Chambre 208',
    request: 'Repas végétalien + yoga mat',
    occasion: 'Retraite wellness',
    status: 'À préparer',
    gouvernante: 'Claire Petit',
    avatar: 'CP',
    time: '18:00',
    priority: 'Wellness'
  }
];

export function ClientRequestsCard() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'À préparer': return 'bg-urgence-red/10 text-urgence-red border-urgence-red/20';
      case 'En cours': return 'bg-muted text-soft-pewter border-border';
      case 'Préparé': return 'bg-muted text-palace-navy border-border';
      default: return 'bg-muted text-soft-pewter border-border';
    }
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'VIP') return <Star className="h-4 w-4 text-palace-navy" />;
    return null;
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
          <div className="p-2 bg-palace-navy/10 rounded-lg">
            <Calendar className="h-6 w-6 text-palace-navy" />
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
        <Badge variant="outline" className="border-palace-navy/30 text-palace-navy">
          {clientRequests.length} demandes
        </Badge>
      </div>

      <div className="space-y-4">
        {clientRequests.map((request) => (
          <div
            key={request.id}
            className="p-4 bg-muted/20 rounded-lg border border-border/30 hover-luxury transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-semibold text-palace-navy">
                    {request.clientName}
                  </h3>
                  {getPriorityIcon(request.priority)}
                </div>
                <p className="text-sm text-soft-pewter mb-2">
                  {request.room} • {request.occasion}
                </p>
                <p className="text-sm text-palace-navy font-medium">
                  {request.request}
                </p>
              </div>
              <div className="text-right">
                <Badge className={getStatusColor(request.status)}>
                  {request.status}
                </Badge>
                <div className="flex items-center justify-end space-x-1 mt-2 text-xs text-soft-pewter">
                  <Clock className="h-3 w-3" />
                  <span>{request.time}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border/20">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-soft-pewter" />
                <span className="text-sm text-soft-pewter">Assigné à:</span>
              </div>
              <div className="flex items-center space-x-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs bg-palace-navy text-warm-cream">
                    {request.avatar}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-palace-navy">
                  {request.gouvernante}
                </span>
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
              <div className="h-2 w-2 rounded-full bg-urgence-red" />
              <span className="text-xs">2 à préparer</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="h-2 w-2 rounded-full bg-soft-pewter" />
              <span className="text-xs">1 en cours</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="h-2 w-2 rounded-full bg-palace-navy" />
              <span className="text-xs">1 préparé</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
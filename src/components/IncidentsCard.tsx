import { useState } from 'react';
import { AlertTriangle, Clock, User, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const incidents = [
  {
    id: 1,
    title: 'Problème climatisation Suite Présidentielle',
    status: 'Ouvert',
    type: 'Maintenance',
    priority: 'URGENCE',
    assignedTo: 'Jean Dupont',
    avatar: 'JD',
    timeElapsed: '2 jours',
    description: 'Le système de climatisation de la Suite Présidentielle ne fonctionne plus depuis hier soir.',
    room: 'Suite 301'
  },
  {
    id: 2,
    title: 'Réclamation client - Service petit-déjeuner',
    status: 'En cours',
    type: 'Client',
    priority: 'NORMAL',
    assignedTo: 'Sophie Martin',
    avatar: 'SM',
    timeElapsed: '4 heures',
    description: 'Client mécontent de la qualité du service au petit-déjeuner.',
    room: 'Chambre 205'
  },
  {
    id: 3,
    title: 'Absence imprevue équipe ménage',
    status: 'En cours',
    type: 'Équipe',
    priority: 'URGENCE',
    assignedTo: 'Marie Dubois',
    avatar: 'MD',
    timeElapsed: '1 jour',
    description: 'Trois membres de l\'équipe ménage sont absents aujourd\'hui.',
    room: 'Étages 2-4'
  },
  {
    id: 4,
    title: 'Fuite dans la salle de bain',
    status: 'Ouvert',
    type: 'Maintenance',
    priority: 'NORMAL',
    assignedTo: 'Pierre Leroy',
    avatar: 'PL',
    timeElapsed: '6 heures',
    description: 'Fuite détectée sous le lavabo de la chambre 107.',
    room: 'Chambre 107'
  }
];

export function IncidentsCard() {
  const [selectedIncident, setSelectedIncident] = useState<any>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ouvert': return 'destructive';
      case 'En cours': return 'default';
      case 'Résolu': return 'secondary';
      default: return 'outline';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Équipe': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Client': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Maintenance': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    return priority === 'URGENCE' 
      ? 'bg-urgence-red text-white animate-pulse' 
      : 'bg-blue-500 text-white';
  };

  const getTimeColor = (timeElapsed: string) => {
    if (timeElapsed.includes('jour')) return 'text-red-600';
    if (timeElapsed.includes('heure') && parseInt(timeElapsed) > 12) return 'text-orange-600';
    return 'text-gray-600';
  };

  return (
    <>
      <div className="luxury-card p-6 col-span-full lg:col-span-2">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-urgence-red/10 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-urgence-red" />
            </div>
            <div>
              <h2 className="text-xl font-playfair font-semibold text-palace-navy">
                Incidents en Cours
              </h2>
              <p className="text-sm text-soft-pewter">
                Suivi des situations prioritaires
              </p>
            </div>
          </div>
          <Badge className="bg-urgence-red text-white text-lg px-3 py-1 font-semibold">
            {incidents.length} actifs
          </Badge>
        </div>

        <div className="space-y-4">
          {incidents.map((incident) => (
            <div
              key={incident.id}
              className="p-4 bg-muted/30 rounded-lg border border-border/50 hover-luxury cursor-pointer transition-all duration-300"
              onClick={() => setSelectedIncident(incident)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-palace-navy mb-2">
                    {incident.title}
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant={getStatusColor(incident.status)}>
                      {incident.status}
                    </Badge>
                    <Badge className={getTypeColor(incident.type)}>
                      {incident.type}
                    </Badge>
                    <Badge className={getPriorityColor(incident.priority)}>
                      {incident.priority}
                    </Badge>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="shrink-0">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs bg-champagne-gold text-palace-navy">
                      {incident.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-soft-pewter">{incident.assignedTo}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-soft-pewter" />
                  <span className={cn("font-medium", getTimeColor(incident.timeElapsed))}>
                    Depuis {incident.timeElapsed}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Incident Detail Modal */}
      <Dialog open={!!selectedIncident} onOpenChange={() => setSelectedIncident(null)}>
        <DialogContent className="max-w-2xl luxury-card">
          <DialogHeader>
            <DialogTitle className="font-playfair text-xl text-palace-navy">
              Détails de l'Incident
            </DialogTitle>
          </DialogHeader>
          {selectedIncident && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg text-palace-navy mb-3">
                  {selectedIncident.title}
                </h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant={getStatusColor(selectedIncident.status)}>
                    {selectedIncident.status}
                  </Badge>
                  <Badge className={getTypeColor(selectedIncident.type)}>
                    {selectedIncident.type}
                  </Badge>
                  <Badge className={getPriorityColor(selectedIncident.priority)}>
                    {selectedIncident.priority}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-palace-navy">Assigné à:</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-champagne-gold text-palace-navy">
                        {selectedIncident.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <span>{selectedIncident.assignedTo}</span>
                  </div>
                </div>
                <div>
                  <span className="font-medium text-palace-navy">Localisation:</span>
                  <p className="mt-1">{selectedIncident.room}</p>
                </div>
              </div>

              <div>
                <span className="font-medium text-palace-navy">Description:</span>
                <p className="mt-2 text-soft-pewter">{selectedIncident.description}</p>
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="outline">
                  Prendre en charge
                </Button>
                <Button className="bg-champagne-gold text-palace-navy hover:bg-champagne-gold/90">
                  Marquer résolu
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
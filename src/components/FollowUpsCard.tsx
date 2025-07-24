import { AlertCircle, Building2, CreditCard, Clock, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { TaskDetailModal } from './TaskDetailModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const followUps = [
  {
    id: 1,
    title: 'Confirmation arrivée VIP',
    location: 'Réception',
    client: '',
    statut: 'À traiter',
    priority: 'urgence',
    assignedTo: 'Réception : Leopold Bechu',
    hoursElapsed: 3,
    overdue: false
  },
  {
    id: 2,
    title: 'Message non lu WhatsApp',
    location: 'Réception',
    client: '',
    statut: 'En cours',
    priority: null,
    assignedTo: 'Gouvernante : Marie Dubois',
    hoursElapsed: 24,
    overdue: true
  },
  {
    id: 3,
    title: 'Équipement manquant en chambre',
    location: 'Chambre 450',
    client: '',
    statut: 'À traiter',
    priority: 'urgence',
    assignedTo: 'Prestataire : Jean Dupont',
    hoursElapsed: 6,
    overdue: false
  },
  {
    id: 4,
    title: 'Confirmation équipements massage',
    location: 'Spa',
    client: '',
    statut: 'En cours',
    priority: null,
    assignedTo: 'Gouvernante : Marie Dubois',
    hoursElapsed: 12,
    overdue: false
  },
  {
    id: 5,
    title: 'Livraison arrangements floraux',
    location: 'Lobby',
    client: '',
    statut: 'À traiter',
    priority: 'urgence',
    assignedTo: 'Prestataire : Jean Dupont',
    hoursElapsed: 48,
    overdue: true
  }
];

export function FollowUpsCard() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedTask, setSelectedTask] = useState<(typeof followUps[0] & { description?: string; type?: string }) | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const handleTaskClick = (task: typeof followUps[0]) => {
    setSelectedTask({
      ...task,
      description: 'Description détaillée de la tâche à effectuer.',
      type: 'Relance'
    });
    setIsModalOpen(true);
  };

  return (
    <div className="luxury-card p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <AlertCircle className="h-6 w-6 text-blue-500" />
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
        <span className="text-sm text-soft-pewter font-medium">
          {overdueCount} en retard
        </span>
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
            className="p-6 rounded-lg border bg-background hover-luxury transition-all duration-300"
          >
            {/* En-tête avec titre et sous-titre */}
            <div className="mb-4">
              <h3 className="font-bold text-foreground text-lg mb-2">
                Relance
              </h3>
              <p className="text-foreground font-medium">
                {item.title}
              </p>
            </div>

            {/* Badges de statut et priorité */}
            <div className="flex items-center space-x-2 mb-6">
              <Badge className={getStatusColor(item.statut)}>
                {item.statut}
              </Badge>
              {item.priority === 'urgence' && (
                <Badge className="bg-urgence-red text-white">
                  URGENCE
                </Badge>
              )}
            </div>

            {/* Informations en deux colonnes */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm font-medium text-foreground mb-1">
                  Assigné à :
                </p>
                <p className="text-sm text-soft-pewter">
                  {item.assignedTo}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-1">
                  Localisation :
                </p>
                <p className="text-sm text-soft-pewter">
                  {item.location}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <p className="text-sm font-medium text-foreground mb-2">
                Description de la relance
              </p>
              <p className="text-sm text-soft-pewter italic">
                (avec le nom du client, le contexte du besoin et toute information personnelle pour être plus sympathique)
              </p>
              <p className="text-sm text-soft-pewter mt-2">
                Tâche nécessitant un suivi et une action dans les meilleurs délais.
              </p>
            </div>

            {/* Boutons d'action */}
            <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-border/20">
              <Button
                variant="ghost"
                size="sm"
                className="text-foreground hover:bg-muted"
                onClick={() => handleTaskClick(item)}
              >
                <Clock className="h-4 w-4 mr-2" />
                Reminder
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-foreground hover:bg-muted"
              >
                <Building2 className="h-4 w-4 mr-2" />
                Checklist
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-foreground hover:bg-muted"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Membres
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-foreground hover:bg-muted"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Escalade
              </Button>
            </div>

            {/* Section commentaires et activité */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-foreground">
                  Commentaires et activité
                </h4>
                <Button variant="ghost" size="sm" className="text-foreground">
                  Afficher les détails
                </Button>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm text-soft-pewter placeholder:text-soft-pewter">
                  Écrivez un commentaire...
                </p>
              </div>
            </div>

            {/* Indicateur de temps et bouton statut */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <Clock className={cn(
                  "h-4 w-4",
                  item.overdue ? "text-urgence-red" : "text-soft-pewter"
                )} />
                <span className={cn(
                  "text-sm font-medium",
                  item.overdue ? "text-urgence-red" : "text-soft-pewter"
                )}>
                  {formatElapsedTime(item.hoursElapsed)}
                </span>
              </div>
              <Button className="bg-primary text-primary-foreground">
                Changer le statut
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-border/20">
        <div className="flex flex-col items-center text-sm space-y-3">
          <span className="text-soft-pewter">Statuts aujourd'hui:</span>
          <div className="flex space-x-4">
            <div className="flex items-center space-x-1">
              <div className="h-2 w-2 rounded-full bg-urgence-red" />
              <span className="text-xs">{overdueCount} en retard</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-xs">{followUps.filter(item => item.statut === 'À traiter').length} à traiter</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="h-2 w-2 rounded-full bg-palace-navy" />
              <span className="text-xs">{followUps.filter(item => item.statut === 'En cours').length} en cours</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de détails */}
      {selectedTask && (
        <TaskDetailModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTask(null);
          }}
          task={selectedTask}
        />
      )}
    </div>
  );
}
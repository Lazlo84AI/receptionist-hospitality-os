import { AlertCircle, Eye, ChevronLeft, ChevronRight, X, MessageSquare, Calendar, Users, TrendingUp, Building2, CreditCard, Clock, Wrench, User, Home } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const followUps = [
  {
    id: 1,
    taskType: 'Relance',
    objet: 'Confirmation équipements massage',
    statut: 'À traiter',
    type: 'Client',
    urgence: 'Urgence',
    assigneTo: 'Claire Petit',
    avatar: 'CP',
    localisation: 'Spa - Niveau -1',
    dateLimite: '2024-01-15',
    overdue: true,
    description: 'Relancer Spa Wellness Pro pour la confirmation des équipements de massage commander pour le 20 janvier. Client VIP Anderson attend cette prestation pour son anniversaire de mariage.',
    icon: Building2
  },
  {
    id: 2,
    taskType: 'Tâche personnelle',
    objet: 'Paiement séjour prolongé',
    statut: 'À traiter',
    type: 'Personnel',
    urgence: 'Pas d\'urgence',
    assigneTo: 'Marie Rousseau',
    avatar: 'MR',
    localisation: 'Réception',
    dateLimite: '2024-01-16',
    overdue: false,
    description: 'Contacter M. Richardson pour le règlement de la prolongation de séjour. Famille avec bébé, être délicat dans l\'approche.',
    icon: CreditCard
  },
  {
    id: 3,
    taskType: 'Relance',
    objet: 'Livraison arrangements floraux',
    statut: 'À traiter',
    type: 'Maintenance',
    urgence: 'Urgence',
    assigneTo: 'Sophie Bernard',
    avatar: 'SB',
    localisation: 'Lobby',
    dateLimite: '2024-01-14',
    overdue: true,
    description: 'Relancer Alpine Flowers pour la livraison des arrangements floraux du lobby. Event important ce soir, criticité élevée.',
    icon: Building2
  },
  {
    id: 4,
    taskType: 'Tâche personnelle',
    objet: 'Inspection système chauffage',
    statut: 'En cours',
    type: 'Équipe',
    urgence: 'Pas d\'urgence',
    assigneTo: 'Pierre Martin',
    avatar: 'PM',
    localisation: 'Étage 3',
    dateLimite: '2024-01-17',
    overdue: false,
    description: 'Inspection préventive du système de chauffage de l\'étage 3. Vérifier les radiateurs des chambres 301 à 315.',
    icon: Wrench
  },
  {
    id: 5,
    taskType: 'Relance',
    objet: 'Confirmation excursion privée',
    statut: 'À traiter',
    type: 'Client',
    urgence: 'Pas d\'urgence',
    assigneTo: 'Julie Durand',
    avatar: 'JD',
    localisation: 'Conciergerie',
    dateLimite: '2024-01-15',
    overdue: true,
    description: 'Relancer la famille Chen pour la confirmation de l\'excursion privée. Leur bébé nécessite des aménagements spéciaux.',
    icon: User
  }
];

export function FollowUpsCard() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedTask, setSelectedTask] = useState<typeof followUps[0] | null>(null);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [isEscaladeOpen, setIsEscaladeOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  
  const itemsPerPage = 3;
  const maxIndex = Math.max(0, followUps.length - itemsPerPage);

  const getStatusColor = (statut: string, urgence: string) => {
    if (urgence === 'Urgence') return 'bg-urgence-red text-white';
    if (statut === 'En cours') return 'bg-blue-500 text-white';
    return 'bg-muted text-soft-pewter border-border';
  };

  const getUrgencyColor = (urgence: string) => {
    return urgence === 'Urgence' ? 'text-urgence-red' : 'text-soft-pewter';
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

  const handleTaskClick = (task: typeof followUps[0]) => {
    setSelectedTask(task);
  };

  const closeModal = () => {
    setSelectedTask(null);
  };

  const addComment = () => {
    if (newComment.trim()) {
      // Logique pour ajouter un commentaire
      setNewComment('');
    }
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

      {/* Navigation */}
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
          {currentIndex + 1}-{Math.min(currentIndex + itemsPerPage, followUps.length)} sur {followUps.length}
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

      {/* Tasks List */}
      <div className="space-y-4 mb-8">
        {visibleItems.map((task) => (
          <div
            key={task.id}
            className={cn(
              "p-4 rounded-lg border transition-all duration-300 hover:shadow-md cursor-pointer",
              task.urgence === 'Urgence' 
                ? "bg-urgence-red/5 border-urgence-red/20" 
                : "bg-muted/20 border-border/30"
            )}
            onClick={() => handleTaskClick(task)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                  <span className="text-xs font-semibold text-palace-navy">
                    {task.avatar}
                  </span>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {task.taskType}
                    </Badge>
                    <Badge className={getStatusColor(task.statut, task.urgence)}>
                      {task.statut}
                    </Badge>
                  </div>
                  
                  <h3 className="font-semibold text-palace-navy text-sm mb-1">
                    {task.objet}
                  </h3>
                  
                  <div className="flex items-center space-x-4 text-xs text-soft-pewter">
                    <span>Type: {task.type}</span>
                    <span className={getUrgencyColor(task.urgence)}>
                      {task.urgence}
                    </span>
                    <span>Assigné à: {task.assigneTo}</span>
                    <span>{task.localisation}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-xs text-soft-pewter">
                  {formatDate(task.dateLimite)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTaskClick(task);
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="pt-6 border-t border-border/20">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-urgence-red">{overdueCount}</p>
            <p className="text-xs text-soft-pewter">En retard</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-soft-pewter">
              {followUps.filter(item => !item.overdue && item.statut === 'À traiter').length}
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

      {/* Task Detail Modal */}
      {selectedTask && (
        <Dialog open={!!selectedTask} onOpenChange={() => closeModal()}>
          <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl font-playfair text-palace-navy">
                  Détails de la tâche
                </DialogTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeModal}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Left Column */}
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-palace-navy mb-2">Type de tâche</h3>
                    <Badge variant="outline">{selectedTask.taskType}</Badge>
                  </div>

                  <div>
                    <h3 className="font-semibold text-palace-navy mb-2">Objet</h3>
                    <p className="text-soft-pewter">{selectedTask.objet}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-palace-navy mb-2">Statut</h3>
                    <Badge className={getStatusColor(selectedTask.statut, selectedTask.urgence)}>
                      {selectedTask.statut}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="font-semibold text-palace-navy mb-2">Type</h3>
                    <p className="text-soft-pewter">{selectedTask.type}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-palace-navy mb-2">Urgence</h3>
                    <span className={getUrgencyColor(selectedTask.urgence)}>
                      {selectedTask.urgence}
                    </span>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-palace-navy mb-2">Assigné à</h3>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-xs font-semibold">{selectedTask.avatar}</span>
                      </div>
                      <span className="text-soft-pewter">{selectedTask.assigneTo}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-palace-navy mb-2">Localisation</h3>
                    <p className="text-soft-pewter">{selectedTask.localisation}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-palace-navy mb-2">Date limite</h3>
                    <p className="text-soft-pewter">{formatDate(selectedTask.dateLimite)}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-palace-navy mb-2">Description de la tâche</h3>
                    <p className="text-soft-pewter">{selectedTask.description}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mb-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsReminderOpen(true)}
                  className="flex items-center space-x-2"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Reminder</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsChecklistOpen(true)}
                  className="flex items-center space-x-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Checklist</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMembersOpen(true)}
                  className="flex items-center space-x-2"
                >
                  <Users className="h-4 w-4" />
                  <span>Membres</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEscaladeOpen(true)}
                  className="flex items-center space-x-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>Escalade</span>
                </Button>
              </div>

              {/* Comments Section */}
              <div className="border-t pt-6">
                <h3 className="font-semibold text-palace-navy mb-4">Commentaires et activités</h3>
                
                <div className="space-y-4 mb-4">
                  <div className="p-3 bg-muted/20 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-palace-navy flex items-center justify-center">
                        <span className="text-xs text-white">CP</span>
                      </div>
                      <span className="text-sm font-medium">Claire Petit</span>
                      <span className="text-xs text-soft-pewter">Il y a 2h</span>
                    </div>
                    <p className="text-sm text-soft-pewter">Tâche créée et assignée</p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Textarea
                    placeholder="Ajouter un commentaire..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={addComment}>Envoyer</Button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center pt-4 border-t flex-shrink-0">
              <Button variant="outline" onClick={closeModal}>
                Fermer
              </Button>
              <div className="flex space-x-2">
                <Button variant="outline">Changer le statut</Button>
                <Button>Afficher les détails</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Pop-ins pour Reminder, Checklist, Membres, Escalade */}
      {/* Ces modales seraient identiques à celles de ClientRequestsCard */}
    </div>
  );
}
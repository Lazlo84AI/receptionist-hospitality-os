import { useState } from 'react';
import { X, Clock, MessageSquare, ChevronDown, ChevronUp, AlarmClock, CheckSquare, Users, ArrowUp, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { ReminderModal } from './modals/ReminderModal';
import { MembersModal } from './modals/MembersModal';
import { EscalationModal } from './modals/EscalationModal';
import { ChecklistModal } from './modals/ChecklistModal';
import { ChecklistComponent } from './ChecklistComponent';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: {
    id: number;
    title: string;
    location: string;
    client: string;
    statut: string;
    priority: string | null;
    assignedTo: string;
    hoursElapsed: number;
    overdue: boolean;
    description?: string;
    type?: string;
  };
}

export function TaskDetailModal({ isOpen, onClose, task }: TaskDetailModalProps) {
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [escalationModalOpen, setEscalationModalOpen] = useState(false);
  const [checklistModalOpen, setChecklistModalOpen] = useState(false);
  const [checklists, setChecklists] = useState<Array<{ id: string; title: string }>>([]);

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

  const handleAddChecklist = (title: string) => {
    const newChecklist = {
      id: Date.now().toString(),
      title
    };
    setChecklists([...checklists, newChecklist]);
  };

  const handleDeleteChecklist = (id: string) => {
    setChecklists(checklists.filter(checklist => checklist.id !== id));
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b">
            <h2 className="text-lg font-bold text-foreground">
              {task.type || 'Demande client'}
            </h2>
          </DialogHeader>

          <div className="pt-4">
            <h3 className="text-base font-medium text-foreground mb-4">
              {task.title}
            </h3>
            <div className="flex items-center space-x-2 mb-6">
              <Badge className={getStatusColor(task.statut)}>
                {task.statut}
              </Badge>
              {task.type && (
                <Badge className="bg-muted text-foreground">
                  Client
                </Badge>
              )}
              {task.priority === 'urgence' && (
                <Badge className="bg-urgence-red text-white">
                  URGENCE
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Attribution & Localisation */}
            <div className="grid grid-cols-2 gap-8">
              <div>
                <span className="text-sm text-foreground font-medium">Assigné à:</span>
                <div className="text-foreground">{task.assignedTo}</div>
              </div>
              <div>
                <span className="text-sm text-foreground font-medium">Localisation:</span>
                <div className="text-foreground">{task.location}</div>
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Description de la demande</p>
              <p className="text-xs text-soft-pewter italic mb-2">
                (avec le nom du client, le contexte du besoin et toute information personnelle pour être plus sympathique)
              </p>
              <p className="text-foreground">
                {task.description || "Dr. James Williams, chirurgien cardiaque de Londres, doit finaliser une publication médicale importante pendant son séjour. Il travaille souvent tard le soir et apprécie le calme absolu. Grand amateur de café italien, il sera ravi de notre sélection."}
              </p>
            </div>

            {/* Boutons d'action */}
            <div className="grid grid-cols-4 gap-4">
              <Button
                variant="outline"
                onClick={() => setReminderModalOpen(true)}
                className="flex items-center justify-center space-x-2 h-10 text-sm"
              >
                <AlarmClock className="h-4 w-4" />
                <span>Reminder</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setChecklistModalOpen(true)}
                className="flex items-center justify-center space-x-2 h-10 text-sm"
              >
                <CheckSquare className="h-4 w-4" />
                <span>Checklist</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setMembersModalOpen(true)}
                className="flex items-center justify-center space-x-2 h-10 text-sm"
              >
                <Users className="h-4 w-4" />
                <span>Membres</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setEscalationModalOpen(true)}
                className="flex items-center justify-center space-x-2 h-10 text-sm"
              >
                <ArrowUp className="h-4 w-4" />
                <span>Escalade</span>
              </Button>
            </div>

            {/* Checklists */}
            {checklists.map((checklist) => (
              <ChecklistComponent
                key={checklist.id}
                title={checklist.title}
                onDelete={() => handleDeleteChecklist(checklist.id)}
              />
            ))}

            {/* Commentaires et activité */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-foreground">Commentaires et activité</h3>
                <span 
                  className="text-soft-pewter cursor-pointer hover:text-foreground text-sm"
                  onClick={() => setShowComments(!showComments)}
                >
                  Afficher les détails
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <Textarea
                    placeholder="Écrivez un commentaire..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>

                {showComments && (
                  <div className="space-y-4">
                    {/* Commentaire existant */}
                    <div className="flex space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-medium">X</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-foreground">Commentaire laissé</span>
                          <span className="text-sm text-soft-pewter">il y a 4 heures</span>
                        </div>
                        <p className="text-foreground mb-2">lol</p>
                        <div className="flex space-x-2 text-sm text-soft-pewter">
                          <button className="hover:text-foreground">Modifier</button>
                          <span>|</span>
                          <button className="hover:text-foreground">Supprimer</button>
                        </div>
                      </div>
                    </div>

                    {/* Historique d'activité */}
                    <div className="space-y-2 text-sm text-soft-pewter">
                      <div>Nom utilisateur a marqué cette carte comme inachevée <span className="text-soft-pewter">il y a 4 heures</span></div>
                      <div>Nom utilisateur a marqué cette carte comme étant terminée <span className="text-soft-pewter">il y a 4 heures</span></div>
                      <div>Nom utilisateur a ajouté cette carte à Aujourd'hui <span className="text-soft-pewter">il y a 4 heures</span></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bouton Changer le statut */}
            <div className="flex justify-end pt-4">
              <Button className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium px-6 py-2 rounded-md">
                Changer le statut
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modals secondaires */}
      <ReminderModal
        isOpen={reminderModalOpen}
        onClose={() => setReminderModalOpen(false)}
      />
      
      <MembersModal
        isOpen={membersModalOpen}
        onClose={() => setMembersModalOpen(false)}
      />
      
      <EscalationModal
        isOpen={escalationModalOpen}
        onClose={() => setEscalationModalOpen(false)}
      />
      
      <ChecklistModal
        isOpen={checklistModalOpen}
        onClose={() => setChecklistModalOpen(false)}
        onAdd={handleAddChecklist}
      />
    </>
  );
}
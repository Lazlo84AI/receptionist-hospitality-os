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
          <DialogHeader className="space-y-0 pb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-lg font-medium text-foreground mb-2">
                  Détails de l'Incident
                </h1>
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  {task.title}
                </h2>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(task.statut)}>
                    {task.statut}
                  </Badge>
                  {task.type && (
                    <Badge className="bg-gray-200 text-gray-600">
                      {task.type}
                    </Badge>
                  )}
                  {task.priority === 'urgence' && (
                    <Badge className="bg-pink-400 text-white">
                      URGENCE
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

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
              <p className="text-sm font-medium text-foreground mb-2">Description:</p>
              <p className="text-gray-400">
                {task.description || "Le système de climatisation de la Suite Présidentielle ne fonctionne plus depuis hier soir."}
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
                <div
                  className="flex items-center space-x-2 cursor-pointer"
                  onClick={() => setShowComments(!showComments)}
                >
                  <MessageSquare className="h-4 w-4 text-soft-pewter" />
                  <h3 className="font-bold text-foreground">Commentaires et activité</h3>
                  {showComments ? (
                    <ChevronUp className="h-4 w-4 text-soft-pewter" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-soft-pewter" />
                  )}
                </div>
                <span 
                  className="text-soft-pewter cursor-pointer hover:text-foreground"
                  onClick={() => setShowComments(!showComments)}
                >
                  {showComments ? 'Masquer les détails' : 'Afficher les détails'}
                </span>
              </div>

              {showComments && (
                <div className="space-y-4">
                  <div>
                    <Textarea
                      placeholder="Écrivez un commentaire…"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <div className="flex justify-end mt-2">
                      <Button size="sm">Publier</Button>
                    </div>
                  </div>

                  {/* Exemple de commentaires passés */}
                  <div className="space-y-3">
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-foreground">Marie Dubois</span>
                        <span className="text-xs text-soft-pewter">Il y a 2h</span>
                      </div>
                      <p className="text-sm text-soft-pewter">
                        Équipement vérifié, tout est en ordre pour l'arrivée VIP.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bouton Changer le statut */}
            <div className="flex justify-end pt-4">
              <Button className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium px-6 py-2 rounded-md">
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
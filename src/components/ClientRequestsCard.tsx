import { Heart, User, CheckCircle, Clock, Star, Eye, Calendar, Users, TrendingUp, MessageCircle, Send, X, Trash2, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

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

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  assignee?: string;
  dueDate?: Date;
}

interface Checklist {
  id: string;
  title: string;
  items: ChecklistItem[];
}

const availableMembers = [
  { id: 'JD', name: 'Jean Dupont', initials: 'JD' },
  { id: 'SM', name: 'Sophie Martin', initials: 'SM' },
  { id: 'MD', name: 'Marie Dubois', initials: 'MD' }
];

export function ClientRequestsCard() {
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [showActivityDetails, setShowActivityDetails] = useState(false);
  const [newComment, setNewComment] = useState('');
  
  // Checklist states
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [checklistTitle, setChecklistTitle] = useState('Checklist');
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [newItemText, setNewItemText] = useState('');
  const [showMemberSelection, setShowMemberSelection] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

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

  // Checklist functions
  const handleCreateChecklist = () => {
    const newChecklist: Checklist = {
      id: Date.now().toString(),
      title: checklistTitle,
      items: []
    };
    setChecklists([...checklists, newChecklist]);
    setIsChecklistModalOpen(false);
    setChecklistTitle('Checklist');
  };

  const handleAddItem = (checklistId: string) => {
    if (!newItemText.trim()) return;
    
    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      text: newItemText,
      completed: false
    };

    setChecklists(checklists.map(checklist => 
      checklist.id === checklistId 
        ? { ...checklist, items: [...checklist.items, newItem] }
        : checklist
    ));
    setNewItemText('');
    setEditingItem(null);
  };

  const handleToggleItem = (checklistId: string, itemId: string) => {
    setChecklists(checklists.map(checklist => 
      checklist.id === checklistId 
        ? {
            ...checklist,
            items: checklist.items.map(item => 
              item.id === itemId ? { ...item, completed: !item.completed } : item
            )
          }
        : checklist
    ));
  };

  const handleDeleteItem = (checklistId: string, itemId: string) => {
    setChecklists(checklists.map(checklist => 
      checklist.id === checklistId 
        ? { ...checklist, items: checklist.items.filter(item => item.id !== itemId) }
        : checklist
    ));
  };

  const handleDeleteChecklist = (checklistId: string) => {
    setChecklists(checklists.filter(checklist => checklist.id !== checklistId));
  };

  const handleAssignMember = (checklistId: string, itemId: string, memberId: string) => {
    setChecklists(checklists.map(checklist => 
      checklist.id === checklistId 
        ? {
            ...checklist,
            items: checklist.items.map(item => 
              item.id === itemId ? { ...item, assignee: memberId } : item
            )
          }
        : checklist
    ));
    setShowMemberSelection(null);
  };

  const handleSetDueDate = (checklistId: string, itemId: string, date: Date) => {
    setChecklists(checklists.map(checklist => 
      checklist.id === checklistId 
        ? {
            ...checklist,
            items: checklist.items.map(item => 
              item.id === itemId ? { ...item, dueDate: date } : item
            )
          }
        : checklist
    ));
    setShowDatePicker(null);
    setSelectedDate(undefined);
  };

  const getChecklistProgress = (checklist: Checklist) => {
    if (checklist.items.length === 0) return 0;
    const completedItems = checklist.items.filter(item => item.completed).length;
    return Math.round((completedItems / checklist.items.length) * 100);
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
                  <Eye 
                    className="h-4 w-4 text-soft-pewter cursor-pointer hover:text-palace-navy" 
                    onClick={() => {
                      setSelectedRequest(request);
                      setIsDetailModalOpen(true);
                    }}
                  />
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

      {/* Modal de détails de la demande client */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-playfair font-semibold text-palace-navy">
              Demande client
            </DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              {/* En-tête avec nom et badges */}
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-palace-navy">
                  {selectedRequest.request}
                </h2>
                
                <div className="flex items-center space-x-2">
                  <Badge className="bg-green-600 text-white">À traiter</Badge>
                  <Badge className="bg-muted text-soft-pewter">Client</Badge>
                  {selectedRequest.priority === 'URGENCE' && (
                    <Badge className="bg-urgence-red text-white">URGENCE</Badge>
                  )}
                </div>
              </div>

              {/* Informations générales */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-palace-navy mb-2">Assigné à :</h3>
                  <p className="text-palace-navy">Gouvernante : {selectedRequest.gouvernante}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-palace-navy mb-2">Localisation :</h3>
                  <p className="text-palace-navy">{selectedRequest.room}</p>
                </div>
              </div>

              {/* Description de la demande */}
              <div>
                <h3 className="font-semibold text-palace-navy mb-2">Description de la demande :</h3>
                <p className="text-soft-pewter">
                  {selectedRequest.clientName}, {selectedRequest.occasion === 'Anniversaire de mariage' 
                    ? "fêtent leur anniversaire de mariage, ne pas oublier de rajouter une carte bonne anniversaire de mariage de la part de l'Hotel Duquesne."
                    : `contexte: ${selectedRequest.occasion}`}
                </p>
              </div>

              {/* Barre d'actions rapides */}
              <div className="flex items-center space-x-4 p-4 bg-muted/20 rounded-lg">
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Reminder</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center space-x-2"
                  onClick={() => setIsChecklistModalOpen(true)}
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Checklist</span>
                </Button>
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Membres</span>
                </Button>
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Escalade</span>
                </Button>
              </div>

              {/* Section Commentaires et activité */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-palace-navy">Commentaires et activité</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowActivityDetails(!showActivityDetails)}
                  >
                    {showActivityDetails ? 'Masquer les détails' : 'Afficher les détails'}
                  </Button>
                </div>

                <Textarea
                  placeholder="Écrivez un commentaire…"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[100px]"
                />

                {showActivityDetails && (
                  <div className="space-y-4 p-4 bg-muted/10 rounded-lg">
                    {/* Commentaire existant */}
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-blue-500 text-white text-sm">XX</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-palace-navy">Commentaire laissé</span>
                            <span className="text-sm text-soft-pewter">il y a 4 heures</span>
                          </div>
                          <p className="text-palace-navy mb-2">lol</p>
                          <div className="flex space-x-4 text-sm text-soft-pewter">
                            <button className="hover:text-palace-navy">Modifier</button>
                            <button className="hover:text-palace-navy">Supprimer</button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Historique d'activité */}
                    <div className="space-y-2 pt-4 border-t border-border/20">
                      <div className="text-sm text-soft-pewter">
                        <span>Nom utilisateur a marqué cette carte comme inachevée</span>
                        <span className="ml-2">il y a 4 heures</span>
                      </div>
                      <div className="text-sm text-soft-pewter">
                        <span>Nom utilisateur a marqué cette carte comme étant terminée</span>
                        <span className="ml-2">il y a 4 heures</span>
                      </div>
                      <div className="text-sm text-soft-pewter">
                        <span>Nom utilisateur a ajouté cette carte à Aujourd'hui</span>
                        <span className="ml-2">il y a 4 heures</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Affichage des checklists */}
              {checklists.map((checklist) => (
                <div key={checklist.id} className="space-y-4 p-4 bg-muted/10 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <input 
                        type="checkbox" 
                        className="h-4 w-4 rounded border-border"
                        checked={false}
                        readOnly
                      />
                      <h4 className="font-bold text-palace-navy">{checklist.title}</h4>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteChecklist(checklist.id)}
                      className="text-urgence-red hover:text-urgence-red"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Barre de progression */}
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${getChecklistProgress(checklist)}%` }}
                    />
                  </div>
                  <div className="text-sm text-soft-pewter">
                    {getChecklistProgress(checklist)}% complété
                  </div>

                  {/* Items de la checklist */}
                  <div className="space-y-2">
                    {checklist.items.map((item, index) => (
                      <div key={item.id} className="flex items-center justify-between space-x-3">
                        <div className="flex items-center space-x-3 flex-1">
                          <input 
                            type="checkbox" 
                            className="h-4 w-4 rounded border-border"
                            checked={item.completed}
                            onChange={() => handleToggleItem(checklist.id, item.id)}
                          />
                          <span className={cn(
                            "text-palace-navy",
                            item.completed && "line-through text-soft-pewter"
                          )}>
                            {index + 1}. {item.text}
                          </span>
                          {item.assignee && (
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="bg-blue-500 text-white text-xs">
                                {availableMembers.find(m => m.id === item.assignee)?.initials}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          {item.dueDate && (
                            <span className="text-xs text-soft-pewter">
                              {format(item.dueDate, 'dd/MM')}
                            </span>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteItem(checklist.id, item.id)}
                          className="text-soft-pewter hover:text-urgence-red"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    
                    {/* Ajouter un nouvel item */}
                    {editingItem === checklist.id ? (
                      <div className="space-y-3">
                        <Input
                          value={newItemText}
                          onChange={(e) => setNewItemText(e.target.value)}
                          placeholder="Nom de l'élément"
                          className="border-yellow-500"
                          autoFocus
                        />
                        <div className="flex items-center space-x-2">
                          <Button 
                            size="sm"
                            onClick={() => handleAddItem(checklist.id)}
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                          >
                            Ajouter
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setEditingItem(null);
                              setNewItemText('');
                            }}
                            className="text-soft-pewter"
                          >
                            Annuler
                          </Button>
                          
                          {/* Attribution membre */}
                          <Popover open={showMemberSelection === `${checklist.id}-new`} onOpenChange={(open) => setShowMemberSelection(open ? `${checklist.id}-new` : null)}>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm">
                                Attribuer
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48 p-2">
                              <div className="space-y-1">
                                {availableMembers.map((member) => (
                                  <button
                                    key={member.id}
                                    className="w-full flex items-center space-x-2 p-2 hover:bg-muted rounded text-left"
                                    onClick={() => {
                                      // For new items, we'll handle this when adding
                                      setShowMemberSelection(null);
                                    }}
                                  >
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback className="bg-blue-500 text-white text-xs">
                                        {member.initials}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm">{member.name}</span>
                                  </button>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>

                          {/* Date limite */}
                          <Popover open={showDatePicker === `${checklist.id}-new`} onOpenChange={(open) => setShowDatePicker(open ? `${checklist.id}-new` : null)}>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm">
                                Date limite
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date) => {
                                  if (date) {
                                    setSelectedDate(date);
                                    setShowDatePicker(null);
                                  }
                                }}
                                initialFocus
                                className="p-3 pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingItem(checklist.id)}
                        className="text-soft-pewter hover:text-palace-navy text-sm"
                      >
                        Ajouter un élément
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Bouton Changer le statut */}
              <div className="flex justify-end pt-4">
                <Button className="bg-yellow-500 hover:bg-yellow-600 text-white">
                  Changer le statut
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal pour ajouter une checklist */}
      <Dialog open={isChecklistModalOpen} onOpenChange={setIsChecklistModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-bold text-palace-navy">
                Ajouter une checklist
              </DialogTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsChecklistModalOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="checklist-title" className="text-sm font-medium text-palace-navy">
                Titre
              </Label>
              <Input
                id="checklist-title"
                value={checklistTitle}
                onChange={(e) => setChecklistTitle(e.target.value)}
                className="mt-1 border-yellow-500"
                autoFocus
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline"
                onClick={() => setIsChecklistModalOpen(false)}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleCreateChecklist}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                Ajouter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
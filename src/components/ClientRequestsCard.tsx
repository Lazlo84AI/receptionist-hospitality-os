import { Heart, User, CheckCircle, Clock, Star, Eye, Calendar, Users, TrendingUp, MessageCircle, Send, X, Trash2, Plus, Search } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
    priority: 'URGENCE',
    description: 'Charles et Emily Anderson célèbrent leurs 25 ans de mariage. Charles est amateur de grands crus et Emily adore les roses. Ils ont mentionné que leur lune de miel était à Champagne, ils seront touchés par ce clin d\'œil.'
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
    priority: 'NORMAL',
    description: 'Pierre et Léa Dubois voyagent avec leur bébé de 8 mois, Lucas, qui fait ses premières vacances. Léa a mentionné que Lucas a une peau sensible suite à un eczéma. Très attentifs au bien-être de leur enfant, ils apprécieront notre attention aux détails.'
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
    priority: 'NORMAL',
    description: 'Dr. James Williams, chirurgien cardiaque de Londres, doit finaliser une publication médicale importante pendant son séjour. Il travaille souvent tard le soir et apprécie le calme absolu. Grand amateur de café italien, il sera ravi de notre sélection.'
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
    priority: 'URGENCE',
    description: 'Isabella Martinez, professeure de yoga et influenceuse wellness, revient d\'un voyage spirituel de 3 mois à Bali. Passionnée de méditation et de cuisine ayurvédique, elle documente son séjour pour ses 50k followers. Une attention particulière l\'enchantera.'
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
  { id: 'MD', name: 'Marie Dubois', initials: 'MD' },
  { id: 'WR', name: 'Wilfried de Renty', initials: 'WR' }
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
  
  // Reminder states
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [reminderSubject, setReminderSubject] = useState('');
  const [reminderDate, setReminderDate] = useState<Date | undefined>(new Date());
  const [reminderTime, setReminderTime] = useState('23:30');
  const [reminderNotification, setReminderNotification] = useState('10 minutes avant');
  const [hasStartDate, setHasStartDate] = useState(false);
  const [hasEndDate, setHasEndDate] = useState(true);
  
  // Members states
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  
  // Escalade states
  const [isEscaladeModalOpen, setIsEscaladeModalOpen] = useState(false);
  const [escaladeChannel, setEscaladeChannel] = useState<'email' | 'whatsapp' | null>(null);
  const [escaladeMemberSearchQuery, setEscaladeMemberSearchQuery] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'À traiter': return 'bg-green-500 text-white';
      case 'En cours': return 'bg-background text-foreground border border-border';
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
          <div className="p-2 bg-champagne-gold/10 rounded-lg">
            <Heart className="h-6 w-6 text-champagne-gold" />
          </div>
          <div>
            <h2 className="text-xl font-playfair font-semibold text-foreground">
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
                  <h3 className="font-bold text-foreground">
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
                <p className="text-foreground mb-1">
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
                <span className="text-sm font-bold text-foreground">
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
                <h3 className="font-semibold text-palace-navy mb-1">Description de la demande</h3>
                <p className="text-xs text-muted-foreground italic mb-2">(avec le nom du client, le contexte du besoin et toute information personnelle pour être plus sympathique)</p>
                <p className="text-soft-pewter">
                  {selectedRequest.description}
                </p>
              </div>

              {/* Barre d'actions rapides */}
              <div className="flex items-center space-x-4 p-4 bg-muted/20 rounded-lg">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center space-x-2"
                  onClick={() => setIsReminderModalOpen(true)}
                >
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
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center space-x-2"
                  onClick={() => setIsMembersModalOpen(true)}
                >
                  <Users className="h-4 w-4" />
                  <span>Membres</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center space-x-2"
                  onClick={() => setIsEscaladeModalOpen(true)}
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>Escalade</span>
                </Button>
              </div>

              {/* Affichage des checklists */}
              {checklists.map((checklist) => (
                <div key={checklist.id} className="space-y-4 p-4 bg-muted/10 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={checklist.items.every(item => item.completed)}
                        onChange={() => {}}
                        className="rounded border-border"
                      />
                      <h4 className="font-bold text-palace-navy">{checklist.title}</h4>
                    </div>
                    <Button
                      variant="outline"
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

                  {/* Liste des éléments */}
                  <div className="space-y-2">
                    {checklist.items.map((item, index) => (
                      <div key={item.id} className="flex items-center space-x-2 group">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => handleToggleItem(checklist.id, item.id)}
                          className="rounded border-border"
                        />
                        <span className="text-sm text-palace-navy flex-1">
                          {index + 1}. {item.text}
                        </span>
                        {item.assignee && (
                          <Badge variant="outline" className="text-xs">
                            {availableMembers.find(m => m.id === item.assignee)?.initials}
                          </Badge>
                        )}
                        {item.dueDate && (
                          <Badge variant="outline" className="text-xs">
                            {format(item.dueDate, 'dd/MM')}
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteItem(checklist.id, item.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3 w-3 text-soft-pewter" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Ajout d'un nouvel élément */}
                  {editingItem === checklist.id ? (
                    <div className="space-y-3">
                      <Input
                        value={newItemText}
                        onChange={(e) => setNewItemText(e.target.value)}
                        placeholder="Ajouter un élément"
                        className="border-yellow-400 focus:border-yellow-400"
                        autoFocus
                      />
                      <div className="flex items-center space-x-2">
                        <Button size="sm" onClick={() => handleAddItem(checklist.id)}>
                          Ajouter
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            setEditingItem(null);
                            setNewItemText('');
                          }}
                        >
                          Annuler
                        </Button>
                        
                        {/* Assignation */}
                        <Popover open={showMemberSelection === checklist.id} onOpenChange={(open) => setShowMemberSelection(open ? checklist.id : null)}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm">
                              Attribuer
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48">
                            <div className="space-y-2">
                              {availableMembers.map((member) => (
                                <div
                                  key={member.id}
                                  className="flex items-center space-x-2 p-2 hover:bg-muted rounded cursor-pointer"
                                  onClick={() => {
                                    // Pour la nouvelle tâche, on peut stocker l'assignation temporairement
                                    setShowMemberSelection(null);
                                  }}
                                >
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-xs">{member.initials}</AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm">{member.name}</span>
                                </div>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>

                        {/* Date limite */}
                        <Popover open={showDatePicker === checklist.id} onOpenChange={(open) => setShowDatePicker(open ? checklist.id : null)}>
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
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingItem(checklist.id)}
                      className="text-soft-pewter hover:text-palace-navy"
                    >
                      Ajouter un élément
                    </Button>
                  )}
                </div>
              ))}

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
            <DialogTitle className="text-lg font-bold text-palace-navy">
              Ajouter une checklist
            </DialogTitle>
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

      {/* Modal pour définir un reminder */}
      <Dialog open={isReminderModalOpen} onOpenChange={setIsReminderModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-pink-500" />
              <DialogTitle className="text-lg font-bold text-palace-navy">
                Définir un reminder
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Champ objet du reminder */}
            <div>
              <Input
                value={reminderSubject}
                onChange={(e) => setReminderSubject(e.target.value)}
                placeholder="Objet du reminder"
                className="w-full"
              />
            </div>

            {/* Calendrier */}
            <div className="space-y-4">
              <CalendarComponent
                mode="single"
                selected={reminderDate}
                onSelect={setReminderDate}
                className="w-full border rounded-lg p-3 pointer-events-auto"
              />
            </div>

            {/* Section date limite et heure */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={hasStartDate}
                  onCheckedChange={setHasStartDate}
                />
                <span className="text-sm text-soft-pewter">Date de début</span>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={hasEndDate}
                    onCheckedChange={setHasEndDate}
                  />
                  <span className="text-sm font-medium text-palace-navy">Date limite</span>
                </div>
                
                {hasEndDate && (
                  <div className="ml-8 space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-palace-navy">Date :</span>
                      <span className="text-sm text-palace-navy">
                        {reminderDate ? format(reminderDate, 'dd/MM/yyyy') : '24/07/2025'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-palace-navy">Heure :</span>
                      <Input
                        type="time"
                        value={reminderTime}
                        onChange={(e) => setReminderTime(e.target.value)}
                        className="w-20 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Définir un rappel */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="text-pink-500">⏰</span>
                <span className="text-sm font-medium text-palace-navy">Définir un rappel</span>
              </div>
              
              <Select value={reminderNotification} onValueChange={setReminderNotification}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5 minutes avant">5 minutes avant</SelectItem>
                  <SelectItem value="10 minutes avant">10 minutes avant</SelectItem>
                  <SelectItem value="15 minutes avant">15 minutes avant</SelectItem>
                  <SelectItem value="30 minutes avant">30 minutes avant</SelectItem>
                  <SelectItem value="1 heure avant">1 heure avant</SelectItem>
                  <SelectItem value="1 jour avant">1 jour avant</SelectItem>
                </SelectContent>
              </Select>
              
              <p className="text-xs text-soft-pewter">
                Les rappels seront envoyés à tous les membres et les observateurs de cette carte.
              </p>
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline"
                onClick={() => {
                  setReminderSubject('');
                  setReminderDate(new Date());
                  setReminderTime('23:30');
                  setReminderNotification('10 minutes avant');
                  setHasStartDate(false);
                  setHasEndDate(true);
                }}
              >
                Effacer
              </Button>
              <Button 
                onClick={() => {
                  // Logique pour enregistrer le reminder
                  setIsReminderModalOpen(false);
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                Enregistrer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Attribution de membres */}
      <Dialog open={isMembersModalOpen} onOpenChange={setIsMembersModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-palace-navy">
              Attribution de membres
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Bouton Membres */}
            <Button 
              className="w-full justify-start space-x-2 bg-purple-100 text-purple-700 hover:bg-purple-200"
              variant="outline"
            >
              <Users className="h-4 w-4 text-purple-500" />
              <span>👥 Membres</span>
            </Button>

            {/* Champ de recherche */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-palace-navy">Membres</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-soft-pewter" />
                <Input
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  placeholder="Rechercher des membres"
                  className="pl-10"
                />
              </div>
            </div>

            {/* Section Membres de l'annuaire de l'hôtel */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-palace-navy">
                Membres de l'annuaire de l'hôtel
              </h4>
              
              <div className="space-y-2">
                {availableMembers
                  .filter(member => 
                    member.name.toLowerCase().includes(memberSearchQuery.toLowerCase())
                  )
                  .map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center space-x-3 p-2 hover:bg-muted rounded cursor-pointer"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-500 text-white text-sm">
                          {member.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-palace-navy">{member.name}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Escalade */}
      <Dialog open={isEscaladeModalOpen} onOpenChange={setIsEscaladeModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-palace-navy">
              Choix du canal
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Section Choix du canal */}
            <div className="space-y-3">
              <RadioGroup value={escaladeChannel || ''} onValueChange={(value) => setEscaladeChannel(value as 'email' | 'whatsapp')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email" id="email" />
                  <Label htmlFor="email" className="text-palace-navy">Envoi d'un email</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="whatsapp" id="whatsapp" />
                  <Label htmlFor="whatsapp" className="text-palace-navy">Envoi d'un message WhatsApp</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Section Attribution de membres */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-palace-navy">Attribution de membres</h4>
              
              <div className="space-y-2">
                <Label className="text-sm text-palace-navy">Membres</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-soft-pewter" />
                  <Input
                    value={escaladeMemberSearchQuery}
                    onChange={(e) => setEscaladeMemberSearchQuery(e.target.value)}
                    placeholder="Rechercher des membres"
                    className="pl-10"
                    disabled={!escaladeChannel}
                  />
                </div>
              </div>

              {/* Liste des membres */}
              <div className="space-y-2">
                {availableMembers
                  .filter(member => 
                    member.name.toLowerCase().includes(escaladeMemberSearchQuery.toLowerCase())
                  )
                  .map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center space-x-3 p-2 hover:bg-muted rounded cursor-pointer"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-500 text-white text-sm">
                          {member.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-palace-navy">{member.name}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Bouton d'action */}
            <div className="flex justify-end pt-4">
              <Button 
                disabled={!escaladeChannel}
                onClick={() => {
                  // Logique pour envoyer l'escalade
                  setIsEscaladeModalOpen(false);
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white disabled:bg-soft-pewter"
              >
                Envoyer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
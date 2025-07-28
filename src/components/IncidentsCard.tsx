import { useState } from 'react';
import { AlertTriangle, Clock, User, Eye, MessageCircle, ChevronDown, ChevronUp, CheckSquare, Users, X, Plus, ChevronLeft, ChevronRight, TrendingUp, Mail, MessageSquare, MoveUp, Paperclip } from 'lucide-react';
import { ChecklistComponent } from './ChecklistComponent';
import { ReminderModal } from './modals/ReminderModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const incidents = [
  {
    id: 1,
    title: 'Problème climatisation Suite Présidentielle',
    status: 'À traiter',
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
    status: 'À traiter',
    type: 'Maintenance',
    priority: 'NORMAL',
    assignedTo: 'Pierre Leroy',
    avatar: 'PL',
    timeElapsed: '6 heures',
    description: 'Fuite détectée sous le lavabo de la chambre 107.',
    room: 'Chambre 107'
  }
];

const teamMembers = [
  {
    name: 'Jean Dupont',
    role: 'Responsable Maintenance',
    initials: 'JD',
    bgColor: 'bg-blue-600'
  },
  {
    name: 'Sophie Martin',
    role: 'Responsable Réception',
    initials: 'SM',
    bgColor: 'bg-green-600'
  },
  {
    name: 'Marie Dubois',
    role: 'Gouvernante Générale',
    initials: 'MD',
    bgColor: 'bg-purple-600'
  },
  {
    name: 'Pierre Leroy',
    role: 'Technicien',
    initials: 'PL',
    bgColor: 'bg-orange-600'
  },
  {
    name: 'Claire Rousseau',
    role: 'Directrice',
    initials: 'CR',
    bgColor: 'bg-red-600'
  }
];

export function IncidentsCard() {
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [showActivityDetails, setShowActivityDetails] = useState(false);
  const [comment, setComment] = useState('');
  
  // États pour les pop-ins
  const [showChecklistDialog, setShowChecklistDialog] = useState(false);
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [showEscaladeDialog, setShowEscaladeDialog] = useState(false);
  const [selectedEscaladeMember, setSelectedEscaladeMember] = useState('');
  const [escaladeMethod, setEscaladeMethod] = useState('mail');
  
  // États pour l'historique et les actions
  const [activities, setActivities] = useState([
    {
      id: 1,
      type: 'comment',
      user: 'Jean Dupont',
      action: 'a laissé un commentaire',
      content: 'Problème résolu, climatisation réparée',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000)
    },
    {
      id: 2,
      type: 'reminder',
      user: 'Sophie Martin',
      action: 'a programmé un reminder',
      content: 'Vérification tous les vendredis à 16h pour la maintenance préventive',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      id: 3,
      type: 'checklist',
      user: 'Marie Dubois',
      action: 'a complété une tâche de la checklist',
      content: 'Vérification du système de chauffage',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000)
    },
    {
      id: 4,
      type: 'escalation',
      user: 'Pierre Leroy',
      action: 'a escaladé par email',
      content: 'Envoi au responsable technique pour intervention urgente',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000)
    }
  ]);
  
  // États pour les fonctionnalités
  const [checklistTitle, setChecklistTitle] = useState('Checklist');
  const [showChecklist, setShowChecklist] = useState(false);
  const [checklistItem, setChecklistItem] = useState('');
  

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'À traiter': return 'bg-green-500 text-white';
      case 'En cours': return 'default';
      case 'Résolu': return 'secondary';
      default: return 'outline';
    }
  };


  const getPriorityColor = (priority: string) => {
    return priority === 'URGENCE' 
      ? 'bg-urgence-red text-white animate-pulse' 
      : 'text-palace-navy';
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
          <span className="text-sm text-soft-pewter font-medium">
            {incidents.length} incidents
          </span>
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
                      {incident.status === 'À traiter' ? (
                        <Badge className={getStatusBadge(incident.status)}>
                          {incident.status}
                        </Badge>
                      ) : (
                        <Badge variant={getStatusBadge(incident.status) as any}>
                          {incident.status}
                        </Badge>
                      )}
                      {incident.priority === 'URGENCE' && (
                       <Badge className={getPriorityColor(incident.priority)}>
                         {incident.priority}
                       </Badge>
                      )}
                   </div>
                </div>
                <Button variant="ghost" size="sm" className="shrink-0">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-soft-pewter">Assigné à:</span>
                  <span className="text-sm font-medium text-palace-navy">
                    {incident.type === 'Maintenance' ? 'Prestataire' : incident.type === 'Client' ? 'Réception' : 'Gouvernante'} : {incident.assignedTo}
                  </span>
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

        <div className="mt-6 pt-4 border-t border-border/20">
          <div className="flex items-center justify-between text-sm">
            <span className="text-soft-pewter">Statuts aujourd'hui:</span>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-xs">{incidents.filter(i => i.status === 'À traiter').length} à traiter</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 rounded-full bg-soft-pewter" />
                <span className="text-xs">{incidents.filter(i => i.status === 'En cours').length} en cours</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-xs">{incidents.filter(i => i.status === 'Résolu').length} résolus</span>
              </div>
            </div>
          </div>
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
                 {selectedIncident.status === 'À traiter' ? (
                   <Badge className={getStatusBadge(selectedIncident.status)}>
                     {selectedIncident.status}
                   </Badge>
                 ) : (
                   <Badge variant={getStatusBadge(selectedIncident.status) as any}>
                     {selectedIncident.status}
                   </Badge>
                 )}
                 <span className="text-xs text-soft-pewter px-2 py-1 bg-muted rounded">
                   {selectedIncident.type}
                 </span>
                  {selectedIncident.priority === 'URGENCE' && (
                    <Badge className={getPriorityColor(selectedIncident.priority)}>
                      {selectedIncident.priority}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                 <div>
                  <span className="font-medium text-palace-navy">Assigné à:</span>
                  <p className="mt-1 text-palace-navy">
                    {selectedIncident.type === 'Maintenance' ? 'Prestataire' : selectedIncident.type === 'Client' ? 'Réception' : 'Gouvernante'} : {selectedIncident.assignedTo}
                  </p>
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

              {/* Barre d'outils Trello */}
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center space-x-2 px-3 py-2 border border-border rounded-md bg-background hover:bg-muted"
                  onClick={() => setShowReminderDialog(true)}
                >
                  <Clock className="h-4 w-4 text-palace-navy" />
                  <span className="text-sm text-palace-navy">Reminder</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center space-x-2 px-3 py-2 border border-border rounded-md bg-background hover:bg-muted"
                  onClick={() => setShowChecklistDialog(true)}
                >
                  <CheckSquare className="h-4 w-4 text-palace-navy" />
                  <span className="text-sm text-palace-navy">Checklist</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center space-x-2 px-3 py-2 border border-border rounded-md bg-background hover:bg-muted"
                  onClick={() => setShowMembersDialog(true)}
                >
                  <Users className="h-4 w-4 text-palace-navy" />
                  <span className="text-sm text-palace-navy">Membres</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center space-x-2 px-3 py-2 border border-border rounded-md bg-background hover:bg-muted"
                  onClick={() => setShowEscaladeDialog(true)}
                >
                  <MoveUp className="h-4 w-4 text-palace-navy" />
                  <span className="text-sm text-palace-navy">Escalade</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center space-x-2 px-3 py-2 border border-border rounded-md bg-background hover:bg-muted"
                >
                  <Paperclip className="h-4 w-4 text-palace-navy" />
                  <span className="text-sm text-palace-navy">Attachment</span>
                </Button>
              </div>

              {/* Affichage de la checklist si créée */}
              {showChecklist && (
                <ChecklistComponent
                  title={checklistTitle}
                  onDelete={() => setShowChecklist(false)}
                />
              )}

              {/* Commentaires et activité */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="h-5 w-5 text-palace-navy" />
                    <h4 className="font-semibold text-palace-navy">Commentaires et activité</h4>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowActivityDetails(!showActivityDetails)}
                    className="text-sm"
                  >
                    {showActivityDetails ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-1" />
                        Masquer les détails
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1" />
                        Afficher les détails
                      </>
                    )}
                  </Button>
                </div>

                {/* Zone de commentaire */}
                <div className="mb-4">
                  <Textarea
                    placeholder="Écrivez un commentaire…"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>

                {/* Affichage des reminders actifs */}
                {activities.filter(a => a.type === 'reminder').length > 0 && (
                  <div className="mb-4">
                    <h5 className="font-medium text-palace-navy mb-2">Reminders configurés :</h5>
                    {activities.filter(a => a.type === 'reminder').map((reminder) => (
                      <div key={reminder.id} className="bg-blue-50 p-3 rounded-lg mb-2">
                        <p className="text-sm text-palace-navy">{reminder.content}</p>
                        <p className="text-xs text-soft-pewter mt-1">
                          Configuré par {reminder.user} - {new Date(reminder.timestamp).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Historique d'activité */}
                {showActivityDetails && (
                  <div className="space-y-4">
                    <h5 className="font-medium text-palace-navy">Activités récentes :</h5>
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-blue-600 text-white text-xs">
                            {activity.user.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          {activity.type === 'comment' ? (
                            <div className="bg-muted/50 p-3 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-palace-navy">Commentaire laissé</span>
                                <span className="text-xs text-soft-pewter">
                                  {Math.floor((Date.now() - activity.timestamp.getTime()) / (1000 * 60 * 60))} heures
                                </span>
                              </div>
                              <p className="text-sm">{activity.content}</p>
                            </div>
                          ) : (
                            <div className="text-sm text-soft-pewter">
                              <span className="font-medium">{activity.user}</span> {activity.action}
                              <span className="text-xs ml-2">
                                il y a {Math.floor((Date.now() - activity.timestamp.getTime()) / (1000 * 60 * 60))} heures
                              </span>
                              {activity.content && (
                                <div className="text-xs text-palace-navy mt-1">{activity.content}</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="bg-champagne-gold text-palace-navy hover:bg-champagne-gold/90">
                      Changer le statut
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => console.log('À traiter')}>
                      À traiter
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => console.log('En cours')}>
                      En cours
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => console.log('Résolu')}>
                      Résolu
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Checklist */}
      <Dialog open={showChecklistDialog} onOpenChange={setShowChecklistDialog}>
        <DialogContent className="max-w-md luxury-card">
          <DialogHeader>
            <DialogTitle className="font-playfair text-lg text-palace-navy">
              Ajouter une checklist
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-palace-navy">Titre</label>
              <Input
                value={checklistTitle}
                onChange={(e) => setChecklistTitle(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowChecklistDialog(false)}
              >
                Annuler
              </Button>
              <Button
                onClick={() => {
                  setShowChecklist(true);
                  setShowChecklistDialog(false);
                }}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Ajouter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reminder Modal */}
      <ReminderModal
        isOpen={showReminderDialog}
        onClose={() => setShowReminderDialog(false)}
      />

      {/* Dialog Membres */}
      <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
        <DialogContent className="max-w-md luxury-card">
          <DialogHeader>
            <DialogTitle className="font-playfair text-lg text-palace-navy">
              Attribution de membres
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Tabs defaultValue="members" className="w-full">
              <TabsList className="grid w-full grid-cols-1">
                <TabsTrigger value="members" className="text-sm">
                  👥 Membres
                </TabsTrigger>
              </TabsList>
              <TabsContent value="members" className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-palace-navy">Membres</label>
                  <Input
                    placeholder="Rechercher des membres"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <h5 className="text-sm font-medium text-palace-navy mb-3">Membres de l'annuaire de l'hôtel</h5>
                  <div className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-600 text-white text-xs">
                        WR
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-palace-navy">Wilfried de Renty</span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Escalade */}
      <Dialog open={showEscaladeDialog} onOpenChange={setShowEscaladeDialog}>
        <DialogContent className="max-w-md luxury-card">
          <DialogHeader>
            <DialogTitle className="font-playfair text-lg text-palace-navy">
              Choix du canal
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Sélection du canal */}
            <div>
              <RadioGroup 
                value={escaladeMethod} 
                onValueChange={setEscaladeMethod}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email" id="email" />
                  <Label htmlFor="email" className="text-sm text-palace-navy">
                    Envoi d'un email
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="whatsapp" id="whatsapp" />
                  <Label htmlFor="whatsapp" className="text-sm text-palace-navy">
                    Envoi d'un message WhatsApp
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Section Attribution de membres */}
            <div>
              <h3 className="font-playfair text-lg text-palace-navy mb-4">
                Attribution de membres
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-palace-navy">Membres</label>
                  <Input
                    placeholder="Rechercher des membres"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <h5 className="text-sm font-medium text-palace-navy mb-3">Membres de l'annuaire de l'hôtel</h5>
                  <div 
                    className={cn(
                      "flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors",
                      selectedEscaladeMember === 'WR' && "bg-blue-100 border border-blue-300"
                    )}
                    onClick={() => setSelectedEscaladeMember('WR')}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-600 text-white text-xs">
                        WR
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-palace-navy">Wilfried de Renty</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bouton Envoyé */}
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  // Ici on peut ajouter la logique d'envoi
                  console.log(`Escalade via ${escaladeMethod} vers ${selectedEscaladeMember}`);
                  setShowEscaladeDialog(false);
                }}
                disabled={!selectedEscaladeMember}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Envoyé
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
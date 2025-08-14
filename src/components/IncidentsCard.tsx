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
import { useTasks, useProfiles } from '@/hooks/useSupabaseData';
import { TaskItem } from '@/types/database';

// Helper function to calculate hours elapsed
const getHoursElapsed = (createdAt: string): number => {
  const now = new Date();
  const created = new Date(createdAt);
  return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
};

// Transform database TaskItem (incident) to UI format
const transformIncident = (incident: TaskItem) => ({
  id: incident.id,
  title: incident.title,
  status: incident.status === 'pending' ? 'To Process' : 
          incident.status === 'in_progress' ? 'In Progress' : 
          incident.status === 'completed' ? 'Completed' : 'Cancelled',
  type: 'Incident',
  priority: incident.priority === 'urgent' ? 'URGENCE' : 'NORMAL',
  assignedTo: incident.assignedTo || 'Unassigned',
  avatar: incident.assignedTo ? incident.assignedTo.split(' ').map(n => n[0]).join('') : 'UN',
  location: incident.location || 'Unknown',
  hoursElapsed: getHoursElapsed(incident.created_at),
  description: incident.description || '',
  created_at: incident.created_at,
  updated_at: incident.updated_at,
  timeElapsed: `${getHoursElapsed(incident.created_at)}h`,
  room: incident.location || 'Unknown'
});

export function IncidentsCard() {
  const { tasks, loading, error } = useTasks();
  const { profiles } = useProfiles();
  
  // Filter incidents from all tasks
  const incidents = tasks
    .filter(task => task.type === 'incident')
    .map(transformIncident)
    .slice(0, 4); // Show only top 4 incidents

  const [selectedIncident, setSelectedIncident] = useState<ReturnType<typeof transformIncident> | null>(null);
  const [showActivityDetails, setShowActivityDetails] = useState(false);
  const [comment, setComment] = useState('');
  
  // States for popups
  const [showChecklistDialog, setShowChecklistDialog] = useState(false);
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [showEscaladeDialog, setShowEscaladeDialog] = useState(false);
  const [selectedEscaladeMember, setSelectedEscaladeMember] = useState('');
  const [escaladeMethod, setEscaladeMethod] = useState('email');
  
  // States for history and actions
  const [activities, setActivities] = useState([
    {
      id: 1,
      type: 'comment',
      user: 'Staff Member',
      action: 'left a comment',
      content: 'Problem being resolved',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000)
    },
    {
      id: 2,
      type: 'reminder',
      user: 'System',
      action: 'scheduled a reminder',
      content: 'Verification required in 2 hours',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    }
  ]);
  
  // States for features
  const [checklistTitle, setChecklistTitle] = useState('Checklist');
  const [showChecklist, setShowChecklist] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'To Process': return 'bg-green-500 text-white';
      case 'In Progress': return 'default';
      case 'Resolved': return 'secondary';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    return priority === 'URGENCE' 
      ? 'bg-urgence-red text-white animate-pulse' 
      : 'text-palace-navy';
  };

  const getTimeColor = (timeElapsed: string) => {
    if (timeElapsed.includes('day')) return 'text-red-600';
    if (timeElapsed.includes('h') && parseInt(timeElapsed) > 12) return 'text-orange-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg border shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Incidents</h2>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-lg border shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Incidents</h2>
        </div>
        <div className="text-center text-muted-foreground">
          Error loading incidents: {error}
        </div>
      </div>
    );
  }

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
                Ongoing Incidents
              </h2>
              <p className="text-sm text-soft-pewter">
                Priority situations tracking
              </p>
            </div>
          </div>
          <span className="text-sm text-soft-pewter font-medium">
            {incidents.length} incidents
          </span>
        </div>

        {incidents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No incidents found
          </div>
        ) : (
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
                        {incident.status === 'To Process' ? (
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
                    <span className="text-sm text-soft-pewter">Assigned to:</span>
                    <span className="text-sm font-medium text-palace-navy">
                      {incident.assignedTo}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-soft-pewter" />
                    <span className={cn("font-medium", getTimeColor(incident.timeElapsed))}>
                      Since {incident.timeElapsed}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-border/20">
          <div className="flex items-center justify-between text-sm">
            <span className="text-soft-pewter">Today's Status:</span>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-xs">{incidents.filter(i => i.status === 'To Process').length} to process</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 rounded-full bg-soft-pewter" />
                <span className="text-xs">{incidents.filter(i => i.status === 'In Progress').length} in progress</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-xs">{incidents.filter(i => i.status === 'Resolved').length} resolved</span>
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
              Incident Details
            </DialogTitle>
          </DialogHeader>
          {selectedIncident && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg text-palace-navy mb-3">
                  {selectedIncident.title}
                </h3>
                <div className="flex flex-wrap gap-2 mb-4">
                 {selectedIncident.status === 'To Process' ? (
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
                  <span className="font-medium text-palace-navy">Assigned to:</span>
                  <p className="mt-1 text-palace-navy">
                    {selectedIncident.assignedTo}
                  </p>
                 </div>
                <div>
                  <span className="font-medium text-palace-navy">Location:</span>
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

              {/* Comments & Activity */}
              <div className="border-t pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <MessageCircle className="h-5 w-5 text-muted-foreground" />
                  <h4 className="font-medium text-foreground">Comments & Activity</h4>
                </div>
                
                {/* Comment input */}
                <div className="space-y-2 mb-4">
                  <Textarea
                    placeholder="Add a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <div className="flex justify-end">
                    <Button 
                      size="sm"
                      disabled={!comment.trim()}
                    >
                      Add Comment
                    </Button>
                  </div>
                </div>

                <div className="border-t border-border/20 pt-4">
                  <div className="space-y-3">
                    {/* Posted comments */}
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-medium">
                              {activity.user.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-foreground">{activity.user}</span>
                            <span className="text-sm text-muted-foreground">
                              {Math.floor((Date.now() - activity.timestamp.getTime()) / (1000 * 60 * 60))}h ago
                            </span>
                          </div>
                          <p className="text-foreground">{activity.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="bg-champagne-gold text-palace-navy hover:bg-champagne-gold/90">
                      Change status
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => console.log('To Process')}>
                      To Process
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => console.log('In Progress')}>
                      In Progress
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => console.log('Resolved')}>
                      Resolved
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
              Add checklist
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-palace-navy">Title</label>
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
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowChecklist(true);
                  setShowChecklistDialog(false);
                }}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Add
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

import { useState } from 'react';
import { 
  FileText, 
  Edit3, 
  Mic,
  X,
  AlertTriangle,
  Users,
  Clock,
  Wrench,
  MapPin,
  User,
  Calendar,
  CheckSquare,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChecklistModal } from '@/components/modals/ChecklistModal';
import { ReminderModal } from '@/components/modals/ReminderModal';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const categories = [
  { id: 'incident', label: 'Incident en cours', icon: AlertTriangle, color: 'bg-urgence-red text-warm-cream' },
  { id: 'client_request', label: 'Demande client', icon: Users, color: 'bg-champagne-gold text-palace-navy' },
  { id: 'follow_up', label: 'Relance', icon: Clock, color: 'bg-palace-navy text-warm-cream' },
  { id: 'internal_task', label: 'Tâche interne', icon: Wrench, color: 'bg-muted text-muted-foreground' },
];

const originTypes = [
  { id: 'maintenance', label: 'Maintenance' },
  { id: 'team', label: 'Équipe' },
  { id: 'client', label: 'Client' },
  { id: 'staff', label: 'Personnel' },
];

const priorityLevels = [
  { id: 'normal', label: 'Normale', color: 'bg-muted text-muted-foreground' },
  { id: 'urgent', label: 'Urgence', color: 'bg-urgence-red text-warm-cream' },
];

const services = [
  { id: 'housekeeping', label: 'Gouvernantes' },
  { id: 'reception', label: 'Réception' },
  { id: 'maintenance', label: 'Maintenance' },
];

const hotelMembers = [
  { id: '1', name: 'Jean Dupont', role: 'Réception', service: 'reception', initials: 'JD' },
  { id: '2', name: 'Marie Dubois', role: 'Gouvernante', service: 'housekeeping', initials: 'MD' },
  { id: '3', name: 'Pierre Leroy', role: 'Réception', service: 'reception', initials: 'PL' },
  { id: '4', name: 'Claire Petit', role: 'Gouvernante', service: 'housekeeping', initials: 'CP' },
  { id: '5', name: 'Wilfried de Renty', role: 'Direction', service: 'reception', initials: 'WR' },
  { id: '6', name: 'Leopold Bechu', role: 'Réception', service: 'reception', initials: 'LB' },
  { id: '7', name: 'Marc Martin', role: 'Maintenance', service: 'maintenance', initials: 'MM' },
  { id: '8', name: 'Sophie Bernard', role: 'Maintenance', service: 'maintenance', initials: 'SB' },
];

const rooms = Array.from({ length: 30 }, (_, i) => i + 1);
const commonAreas = [
  'Lobby', 'Restaurant', 'Terrasse', 'Cuisine', 'Accueil', 'Lounge', 'Spa'
];

export function VoiceCommandButton() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creationMode, setCreationMode] = useState<'edit' | 'voice' | null>(null);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    originType: '',
    priority: 'normal',
    service: '',
    assignedMember: '',
    location: '',
    description: '',
    guestName: '', // For special requests
    roomNumber: '', // For special requests
    recipient: '', // For follow-ups
    dueDate: null as Date | null,
  });
  const { toast } = useToast();

  const handleMainButtonClick = () => {
    console.log('CLIC PRINCIPAL DÉTECTÉ!');
    // Ouvrir directement la modal de création
    setCreationMode('edit'); // Mode par défaut
    setShowCreateModal(true);
  };

  const handleModeSelection = (mode: 'edit' | 'voice') => {
    console.log('Mode sélectionné:', mode); 
    setCreationMode(mode);
    setShowCreateModal(true);
    setIsExpanded(false);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      category: '',
      originType: '',
      priority: 'normal',
      service: '',
      assignedMember: '',
      location: '',
      description: '',
      guestName: '',
      roomNumber: '',
      recipient: '',
      dueDate: null,
    });
  };

  const handleCreateCard = async () => {
    try {
      let result;
      
      // Create object based on category
      switch (formData.category) {
        case 'incident':
          result = await supabase
            .from('incidents')
            .insert({
              title: formData.title || 'Nouvel incident',
              description: formData.description,
              incident_type: formData.originType,
              priority: formData.priority,
              status: 'open',
              // assigned_to: would need user ID mapping
              // created_by: would need current user ID
              // location_id: would need location mapping
            });
          break;
          
        case 'client_request':
          result = await supabase
            .from('special_requests')
            .insert({
              guest_name: formData.guestName || 'Client',
              room_number: formData.roomNumber || formData.location,
              request_type: formData.originType,
              request_details: formData.description,
              preparation_status: 'to_prepare',
              arrival_date: new Date().toISOString().split('T')[0],
              // assigned_to: would need user ID mapping
              // created_by: would need current user ID
            });
          break;
          
        case 'follow_up':
          result = await supabase
            .from('follow_ups')
            .insert({
              title: formData.title || 'Nouvelle relance',
              recipient: formData.recipient || formData.assignedMember,
              follow_up_type: formData.originType,
              notes: formData.description,
              status: 'pending',
              due_date: formData.dueDate?.toISOString() || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              // assigned_to: would need user ID mapping
              // created_by: would need current user ID
            });
          break;
          
        case 'internal_task':
          result = await supabase
            .from('tasks')
            .insert({
              title: formData.title || 'Nouvelle tâche',
              description: formData.description,
              task_type: formData.originType,
              priority: formData.priority,
              status: 'pending',
              location: formData.location,
              department: formData.service,
              due_date: formData.dueDate?.toISOString(),
              // assigned_to: would need user ID mapping
              // created_by: would need current user ID
            });
          break;
          
        default:
          throw new Error('Catégorie invalide');
      }

      if (result?.error) {
        throw result.error;
      }

      toast({
        title: "Succès",
        description: "La carte a été créée avec succès !",
        variant: "default",
      });

      setShowCreateModal(false);
      resetForm();
      
    } catch (error) {
      console.error('Error creating card:', error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la création de la carte.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      {/* Backdrop when expanded */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Creation Button System */}
      <div className="fixed bottom-6 right-6 z-[9999]">
        {/* Expanded Sub-Buttons */}
        {isExpanded && (
          <div className="absolute bottom-16 right-0 mb-4 space-y-3 animate-in slide-in-from-bottom-4 duration-300">
            <Button
              onClick={() => {
                console.log('Clic sur bouton Édition');
                handleModeSelection('edit');
              }}
              className={cn(
                "h-12 px-4 bg-palace-navy text-warm-cream border border-champagne-gold/30 hover:bg-champagne-gold hover:text-palace-navy transition-all duration-300",
                "shadow-lg pointer-events-auto"
              )}
            >
              <Edit3 className="h-5 w-5 mr-2" />
              <span className="whitespace-nowrap font-medium">
                Édition
              </span>
            </Button>
            <Button
              onClick={() => {
                console.log('Clic sur bouton Vocal');
                handleModeSelection('voice');
              }}
              className={cn(
                "h-12 px-4 bg-palace-navy text-warm-cream border border-champagne-gold/30 hover:bg-champagne-gold hover:text-palace-navy transition-all duration-300",
                "shadow-lg pointer-events-auto"
              )}
            >
              <Mic className="h-5 w-5 mr-2" />
              <span className="whitespace-nowrap font-medium">
                Vocal
              </span>
            </Button>
          </div>
        )}

        {/* Main Creation Button */}
        <Button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('CLIC DÉTECTÉ sur le bouton principal!');
            handleMainButtonClick();
          }}
          className={cn(
            "h-16 w-16 rounded-full transition-all duration-500 pointer-events-auto cursor-pointer",
            isExpanded
              ? "bg-urgence-red hover:bg-urgence-red/90 rotate-45 border-2 border-urgence-red"
              : "bg-palace-navy hover:bg-palace-navy/90 border-2 border-champagne-gold/50 hover:border-champagne-gold",
            "shadow-lg"
          )}
          style={{ pointerEvents: 'auto' }}
        >
          {isExpanded ? (
            <X className="h-6 w-6 text-warm-cream" />
          ) : (
            <FileText className="h-6 w-6 text-champagne-gold" />
          )}
        </Button>

        {/* Subtle Pulse Animation when idle */}
        {!isExpanded && (
          <div className="absolute inset-0 rounded-full border-2 border-champagne-gold/20 animate-ping pointer-events-none" />
        )}
      </div>

      {/* Create Card Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {creationMode === 'voice' ? <Mic className="h-5 w-5" /> : <Edit3 className="h-5 w-5" />}
              Créer une nouvelle carte - Mode {creationMode === 'voice' ? 'Vocal' : 'Édition'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Title Field */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Titre de la carte</label>
              <Input 
                placeholder="Titre descriptif de la carte"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            {/* Category Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Catégorie de la carte</label>
              <div className="grid grid-cols-2 gap-3">
                {categories.map((category) => (
                  <Card 
                    key={category.id}
                    className={cn(
                      "cursor-pointer transition-all duration-200 hover:scale-105",
                      formData.category === category.id ? "ring-2 ring-champagne-gold" : ""
                    )}
                    onClick={() => setFormData(prev => ({ ...prev, category: category.id }))}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={cn("p-2 rounded-full", category.color)}>
                        <category.icon className="h-5 w-5" />
                      </div>
                      <span className="font-medium">{category.label}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Conditional Fields for Client Requests */}
            {formData.category === 'client_request' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-sm font-medium">Nom du client</label>
                  <Input 
                    placeholder="Nom du client"
                    value={formData.guestName}
                    onChange={(e) => setFormData(prev => ({ ...prev, guestName: e.target.value }))}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium">Numéro de chambre</label>
                  <Input 
                    placeholder="Ex: 101"
                    value={formData.roomNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, roomNumber: e.target.value }))}
                  />
                </div>
              </div>
            )}

            {/* Conditional Fields for Follow-ups */}
            {formData.category === 'follow_up' && (
              <div className="space-y-3">
                <label className="text-sm font-medium">Destinataire de la relance</label>
                <Input 
                  placeholder="Nom du destinataire"
                  value={formData.recipient}
                  onChange={(e) => setFormData(prev => ({ ...prev, recipient: e.target.value }))}
                />
              </div>
            )}

            {/* Origin Type */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Type d'origine</label>
              <Select value={formData.originType} onValueChange={(value) => setFormData(prev => ({ ...prev, originType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type d'origine" />
                </SelectTrigger>
                <SelectContent>
                  {originTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority Level (only for incidents and tasks) */}
            {(formData.category === 'incident' || formData.category === 'internal_task') && (
              <div className="space-y-3">
                <label className="text-sm font-medium">Niveau de priorité</label>
                <div className="flex gap-3">
                  {priorityLevels.map((priority) => (
                    <Button
                      key={priority.id}
                      variant={formData.priority === priority.id ? "default" : "outline"}
                      onClick={() => setFormData(prev => ({ ...prev, priority: priority.id }))}
                      className={cn(
                        formData.priority === priority.id ? priority.color : ""
                      )}
                    >
                      {priority.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Assignment */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-sm font-medium">Service</label>
                <Select 
                  value={formData.service} 
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    service: value,
                    assignedMember: '' // Reset member when service changes
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>{service.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium">Membres assignés</label>
                {formData.service ? (
                  <Select 
                    value={formData.assignedMember} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, assignedMember: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un membre" />
                    </SelectTrigger>
                    <SelectContent>
                      {hotelMembers
                        .filter(member => member.service === formData.service)
                        .map((member) => (
                          <SelectItem key={member.id} value={member.name}>
                            {member.name} - {member.role}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="h-10 flex items-center px-3 py-2 border border-input bg-muted text-muted-foreground rounded-md text-sm">
                    Sélectionnez d'abord un service
                  </div>
                )}
              </div>
            </div>

            {/* Location (not for client requests as they have room number) */}
            {formData.category !== 'client_request' && (
              <div className="space-y-3">
                <label className="text-sm font-medium">Localisation</label>
                <div className="grid grid-cols-2 gap-4">
                  {/* Rooms */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Chambres</h4>
                    <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto">
                      {rooms.map((room) => (
                        <Button
                          key={room}
                          variant={formData.location === `Chambre ${room}` ? "default" : "outline"}
                          className="h-8 w-12 text-xs"
                          onClick={() => setFormData(prev => ({ ...prev, location: `Chambre ${room}` }))}
                        >
                          {room}
                        </Button>
                      ))}
                    </div>
                  </div>
                  {/* Common Areas */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Espaces communs</h4>
                    <div className="space-y-2">
                      {commonAreas.map((area) => (
                        <Button
                          key={area}
                          variant={formData.location === area ? "default" : "outline"}
                          className="w-full text-xs"
                          onClick={() => setFormData(prev => ({ ...prev, location: area }))}
                        >
                          {area}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Due Date for Follow-ups and Tasks */}
            {(formData.category === 'follow_up' || formData.category === 'internal_task') && (
              <div className="space-y-3">
                <label className="text-sm font-medium">Date d'échéance</label>
                <Input 
                  type="datetime-local"
                  value={formData.dueDate ? formData.dueDate.toISOString().slice(0, 16) : ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    dueDate: e.target.value ? new Date(e.target.value) : null 
                  }))}
                />
              </div>
            )}

            {/* Description */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Description personnalisée</label>
                <span className="text-xs text-muted-foreground">
                  💡 Décrivez précisément pour une meilleure compréhension
                </span>
              </div>
              <Textarea 
                placeholder="Décrivez précisément la situation ou la demande..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
              />
            </div>

            {/* Additional Features */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setIsChecklistModalOpen(true)}
                className="flex items-center gap-2"
              >
                <CheckSquare className="h-4 w-4" />
                Ajouter une checklist
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsReminderModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Bell className="h-4 w-4" />
                Configurer un rappel
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setShowCreateModal(false)}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleCreateCard}
                disabled={
                  !formData.category || 
                  !formData.description || 
                  (formData.category === 'client_request' && (!formData.guestName || !formData.roomNumber)) ||
                  (formData.category === 'follow_up' && !formData.recipient)
                }
                className="bg-champagne-gold text-palace-navy hover:bg-champagne-gold/90"
              >
                Créer la carte
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Checklist Modal */}
      <ChecklistModal
        isOpen={isChecklistModalOpen}
        onClose={() => setIsChecklistModalOpen(false)}
        onAdd={() => console.log('Adding checklist item')}
      />

      {/* Reminder Modal */}
      <ReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
      />
    </>
  );
}
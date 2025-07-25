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
    category: '',
    originType: '',
    priority: 'normal',
    service: '',
    assignedMember: '',
    location: '',
    description: ''
  });

  const handleMainButtonClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handleModeSelection = (mode: 'edit' | 'voice') => {
    setCreationMode(mode);
    setShowCreateModal(true);
    setIsExpanded(false);
  };

  const resetForm = () => {
    setFormData({
      category: '',
      originType: '',
      priority: 'normal',
      service: '',
      assignedMember: '',
      location: '',
      description: ''
    });
  };

  const handleCreateCard = () => {
    console.log('Creating card with data:', formData);
    console.log('Creation mode:', creationMode);
    // Here you would typically save to database
    setShowCreateModal(false);
    resetForm();
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
      <div className="fixed bottom-6 right-6 z-50">
        {/* Expanded Sub-Buttons */}
        {isExpanded && (
          <div className="absolute bottom-16 right-0 mb-4 space-y-3 animate-in slide-in-from-bottom-4 duration-300">
            <Button
              onClick={() => handleModeSelection('edit')}
              className={cn(
                "h-12 px-4 bg-palace-navy text-warm-cream border border-champagne-gold/30 hover:bg-champagne-gold hover:text-palace-navy transition-all duration-300",
                "shadow-lg"
              )}
            >
              <Edit3 className="h-5 w-5 mr-2" />
              <span className="whitespace-nowrap font-medium">
                Édition
              </span>
            </Button>
            <Button
              onClick={() => handleModeSelection('voice')}
              className={cn(
                "h-12 px-4 bg-palace-navy text-warm-cream border border-champagne-gold/30 hover:bg-champagne-gold hover:text-palace-navy transition-all duration-300",
                "shadow-lg"
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
          onClick={handleMainButtonClick}
          className={cn(
            "h-16 w-16 rounded-full transition-all duration-500",
            isExpanded
              ? "bg-urgence-red hover:bg-urgence-red/90 rotate-45 border-2 border-urgence-red"
              : "bg-palace-navy hover:bg-palace-navy/90 border-2 border-champagne-gold/50 hover:border-champagne-gold",
            "shadow-lg"
          )}
        >
          {isExpanded ? (
            <X className="h-6 w-6 text-warm-cream" />
          ) : (
            <FileText className="h-6 w-6 text-champagne-gold" />
          )}
        </Button>

        {/* Subtle Pulse Animation when idle */}
        {!isExpanded && (
          <div className="absolute inset-0 rounded-full border-2 border-champagne-gold/20 animate-ping" />
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

            {/* Priority Level */}
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

            {/* Assignment */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-sm font-medium">Service</label>
                <Select value={formData.service} onValueChange={(value) => setFormData(prev => ({ ...prev, service: value }))}>
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
                <label className="text-sm font-medium">Membre assigné</label>
                <Input 
                  placeholder="Nom du membre"
                  value={formData.assignedMember}
                  onChange={(e) => setFormData(prev => ({ ...prev, assignedMember: e.target.value }))}
                />
              </div>
            </div>

            {/* Location */}
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

            {/* Description */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Description personnalisée</label>
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
                disabled={!formData.category || !formData.description}
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
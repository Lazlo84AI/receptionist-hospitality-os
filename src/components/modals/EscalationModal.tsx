import { useState } from 'react';
import { X, Mail, MessageCircle, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface EscalationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const hotelMembers = [
  { id: '1', name: 'Jean Dupont', role: 'Réception', initials: 'JD' },
  { id: '2', name: 'Marie Dubois', role: 'Gouvernante', initials: 'MD' },
  { id: '3', name: 'Pierre Leroy', role: 'Réception', initials: 'PL' },
  { id: '4', name: 'Claire Petit', role: 'Gouvernante', initials: 'CP' },
  { id: '5', name: 'Wilfried de Renty', role: 'Direction', initials: 'WR' },
  { id: '6', name: 'Leopold Bechu', role: 'Réception', initials: 'LB' },
];

export function EscalationModal({ isOpen, onClose }: EscalationModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('email');
  const [selectedMember, setSelectedMember] = useState('');

  const filteredMembers = hotelMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSend = () => {
    // Logique d'envoi d'escalade
    console.log('Escalation sent:', { channel: selectedChannel, member: selectedMember });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="pb-4 border-b">
          <h2 className="text-lg font-bold text-foreground">
            Choix du canal
          </h2>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Choix du canal */}
          <div>
            <Label className="text-sm font-medium text-foreground mb-3 block">
              Canal de communication
            </Label>
            <RadioGroup value={selectedChannel} onValueChange={setSelectedChannel}>
              <div className="space-y-2">
                <div className="flex items-center space-x-3 p-3 rounded-lg border">
                  <RadioGroupItem value="email" id="email" />
                  <Mail className="h-4 w-4 text-foreground" />
                  <Label htmlFor="email" className="cursor-pointer text-foreground">
                    Envoi d'un email
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border">
                  <RadioGroupItem value="whatsapp" id="whatsapp" />
                  <MessageCircle className="h-4 w-4 text-foreground" />
                  <Label htmlFor="whatsapp" className="cursor-pointer text-foreground">
                    Envoi d'un message WhatsApp
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Attribution de membres */}
          <div>
            <Label className="text-sm font-medium text-foreground mb-3 block">
              Destinataire
            </Label>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-3 h-4 w-4 text-foreground" />
              <Input
                placeholder="Rechercher des membres..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="max-h-48 overflow-y-auto">
              <RadioGroup value={selectedMember} onValueChange={setSelectedMember}>
                <div className="space-y-2">
                  {filteredMembers.map((member) => (
                    <div key={member.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted">
                      <RadioGroupItem value={member.id} id={`escalation-${member.id}`} />
                       <Avatar className="h-8 w-8">
                         <AvatarFallback className="bg-palace-navy text-white text-xs">
                           {member.initials}
                         </AvatarFallback>
                      </Avatar>
                      <Label htmlFor={`escalation-${member.id}`} className="flex-1 cursor-pointer">
                        <div className="font-medium text-foreground">{member.name}</div>
                        <div className="text-sm text-foreground">{member.role}</div>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            {filteredMembers.length === 0 && (
              <div className="text-center text-foreground py-4">
                Aucun membre trouvé
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleSend}
              disabled={!selectedMember}
            >
              Envoyer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import { useState } from 'react';
import { X, Mail, MessageCircle, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { sendTaskUpdatedEvent } from '@/lib/webhookService';
import { useProfiles, useLocations } from '@/hooks/useSupabaseData';
import { useToast } from '@/hooks/use-toast';

interface EscalationModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: any;
  onUpdate?: () => void;
}


export function EscalationModal({ isOpen, onClose, task, onUpdate }: EscalationModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('email');
  const [selectedMember, setSelectedMember] = useState('');
  
  const { profiles } = useProfiles();
  const { locations } = useLocations();
  const { toast } = useToast();

  // Convert profiles to hotel members format
  const hotelMembers = profiles?.map(profile => ({
    id: profile.id,
    name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
    role: profile.department || profile.role || 'Staff',
    initials: `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase() || 'U'
  })) || [];

  const filteredMembers = hotelMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSend = async () => {
    if (task && selectedMember) {
      try {
        const selectedMemberData = hotelMembers.find(m => m.id === selectedMember);
        const escalationData = {
          id: Date.now().toString(),
          message: `Task escalated via ${selectedChannel}`,
          method: selectedChannel,
          escalated_to: selectedMemberData?.name || '',
        };

        // Send webhook event for task update with escalation
        const webhookResult = await sendTaskUpdatedEvent(
          task.id,
          task,
          task,
          profiles,
          locations,
          {
            escalations: [escalationData]
          }
        );

        if (webhookResult.success) {
          toast({
            title: "Escalation Sent",
            description: "Escalation has been sent and notification sent successfully",
          });
          // Call onUpdate to trigger data refresh
          if (onUpdate) {
            onUpdate();
          }
        } else {
          toast({
            title: "Webhook Error",
            description: webhookResult.error || "Failed to send escalation notification",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error sending webhook:', error);
        toast({
          title: "Escalation Error",
          description: "Failed to send escalation notification",
          variant: "destructive",
        });
      }
    }
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
                  <Mail className="h-4 w-4 text-soft-pewter" />
                  <Label htmlFor="email" className="cursor-pointer">
                    Envoi d'un email
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border">
                  <RadioGroupItem value="whatsapp" id="whatsapp" />
                  <MessageCircle className="h-4 w-4 text-soft-pewter" />
                  <Label htmlFor="whatsapp" className="cursor-pointer">
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
              <Search className="absolute left-3 top-3 h-4 w-4 text-soft-pewter" />
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
                        <div className="text-sm text-soft-pewter">{member.role}</div>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            {filteredMembers.length === 0 && (
              <div className="text-center text-soft-pewter py-4">
                Aucun membre trouvé
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleSend}
              disabled={!selectedMember}
              className="bg-primary text-primary-foreground"
            >
              Envoyer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
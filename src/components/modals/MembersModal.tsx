import { useState } from 'react';
import { X, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { sendTaskUpdatedEvent } from '@/lib/webhookService';
import { useProfiles, useLocations } from '@/hooks/useSupabaseData';
import { useToast } from '@/hooks/use-toast';

interface MembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: any;
  onUpdate?: () => void;
}


export function MembersModal({ isOpen, onClose, task, onUpdate }: MembersModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  
  const { profiles } = useProfiles();
  const { locations } = useLocations();
  const { toast } = useToast();

  // Convert profiles to hotel members format
  const hotelMembers = profiles?.map(profile => ({
    id: profile.id,
    name: profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
    role: profile.department || profile.role || 'Staff',
    initials: profile.full_name ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase() || 'U'
  })) || [];

  const filteredMembers = hotelMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleAssign = async () => {
    if (task && selectedMembers.length > 0) {
      try {
        const membersData = selectedMembers.map(memberId => {
          const memberInfo = hotelMembers.find(m => m.id === memberId);
          return {
            id: memberId,
            user_id: memberId,
            role: 'assignee',
            name: memberInfo?.name || 'Unknown'
          };
        });

        // Send webhook event for task update with multiple member assignments
        const webhookResult = await sendTaskUpdatedEvent(
          task.id,
          task,
          task,
          profiles,
          locations,
          {
            members: membersData
          }
        );

        if (webhookResult.success) {
          const memberNames = membersData.map(m => m.name).join(', ');
          toast({
            title: "Members Assigned",
            description: `${memberNames} have been assigned and notifications sent successfully`,
          });
          // Call onUpdate to trigger data refresh
          if (onUpdate) {
            onUpdate();
          }
        } else {
          toast({
            title: "Webhook Error",
            description: webhookResult.error || "Failed to send member assignment notifications",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error sending webhook:', error);
        toast({
          title: "Assignment Error",
          description: "Failed to send member assignment notifications",
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
            Assigned People
          </h2>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-soft-pewter" />
            <Input
              placeholder="Rechercher des membres..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="max-h-60 overflow-y-auto">
            <div className="space-y-2">
              {filteredMembers.map((member) => (
                <div key={member.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted">
                  <Checkbox 
                    id={member.id}
                    checked={selectedMembers.includes(member.id)}
                    onCheckedChange={() => handleMemberToggle(member.id)}
                  />
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-palace-navy text-white text-xs">
                      {member.initials}
                    </AvatarFallback>
                  </Avatar>
                  <Label htmlFor={member.id} className="flex-1 cursor-pointer">
                    <div className="font-medium text-foreground">{member.name}</div>
                    <div className="text-sm text-soft-pewter">{member.role}</div>
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {filteredMembers.length === 0 && (
            <div className="text-center text-soft-pewter py-4">
              Aucun membre trouvé
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleAssign}
              disabled={selectedMembers.length === 0}
            >
              Assign {selectedMembers.length > 0 ? `(${selectedMembers.length})` : ''}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
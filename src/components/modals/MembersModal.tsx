import { useState } from 'react';
import { X, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface MembersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const hotelMembers = [
  { id: '1', name: 'Jean Dupont', role: 'Réception', initials: 'JD', color: 'bg-blue-500' },
  { id: '2', name: 'Marie Dubois', role: 'Gouvernante', initials: 'MD', color: 'bg-green-500' },
  { id: '3', name: 'Pierre Leroy', role: 'Réception', initials: 'PL', color: 'bg-purple-500' },
  { id: '4', name: 'Claire Petit', role: 'Gouvernante', initials: 'CP', color: 'bg-pink-500' },
  { id: '5', name: 'Wilfried de Renty', role: 'Direction', initials: 'WR', color: 'bg-orange-500' },
  { id: '6', name: 'Leopold Bechu', role: 'Réception', initials: 'LB', color: 'bg-teal-500' },
];

export function MembersModal({ isOpen, onClose }: MembersModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState('');

  const filteredMembers = hotelMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAssign = () => {
    // Logique d'assignation du membre
    console.log('Member assigned:', selectedMember);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="flex-row items-center justify-between space-y-0 pb-4 border-b">
          <h2 className="text-lg font-bold text-foreground">
            Attribution de membres
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
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
            <RadioGroup value={selectedMember} onValueChange={setSelectedMember}>
              <div className="space-y-2">
                {filteredMembers.map((member) => (
                  <div key={member.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted">
                    <RadioGroupItem value={member.id} id={member.id} />
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className={`${member.color} text-white text-xs`}>
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
            </RadioGroup>
          </div>

          {filteredMembers.length === 0 && (
            <div className="text-center text-soft-pewter py-4">
              Aucun membre trouvé
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleAssign}
              disabled={!selectedMember}
            >
              Assigner
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import { useState, useEffect } from 'react';
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
import { supabase } from '@/integrations/supabase/client';

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

  // Initialiser avec les membres déjà assignés
  useEffect(() => {
    if (task?.assigned_to && Array.isArray(task.assigned_to)) {
      setSelectedMembers(task.assigned_to);
    } else {
      setSelectedMembers([]);
    }
  }, [task]);

  // Reset search when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  const handleMemberToggle = (memberId: string) => {
    console.log('🔍 Toggle member:', memberId, 'Current selected:', selectedMembers);
    setSelectedMembers(prev => {
      if (prev.includes(memberId)) {
        // Retirer le membre
        const newSelection = prev.filter(id => id !== memberId);
        console.log('❌ Removing member:', memberId, 'New selection:', newSelection);
        return newSelection;
      } else {
        // Ajouter le membre (vérifier la limite de 10)
        if (prev.length >= 10) {
          console.log('⚠️ Limit reached, cannot add more members');
          toast({
            title: "Limite atteinte",
            description: "Maximum 10 personnes peuvent être assignées à une tâche",
            variant: "destructive",
          });
          return prev;
        }
        const newSelection = [...prev, memberId];
        console.log('✅ Adding member:', memberId, 'New selection:', newSelection);
        return newSelection;
      }
    });
  };

  const handleAssign = async () => {
    console.log('DEBUT handleAssign');
    console.log('task:', task);
    console.log('selectedMembers:', selectedMembers);
    
    // ✅ VALIDATION: Au moins 1 membre doit être assigné
    if (selectedMembers.length === 0) {
      toast({
        title: "Assignation requise",
        description: "Au moins 1 membre doit être assigné à cette tâche",
        variant: "destructive",
      });
      return;
    }
    
    if (task) {
      try {
        // Récupérer les assignés actuels depuis la base
        console.log('Récupération des assignés actuels depuis la base...');
        const { data: currentTask, error: fetchError } = await supabase
          .from('task')
          .select('assigned_to')
          .eq('id', task.id)
          .single();
        
        if (fetchError) {
          console.error('Erreur récupération task actuelle:', fetchError);
          throw new Error(`Erreur récupération: ${fetchError.message}`);
        }
        
        const currentAssigned = currentTask?.assigned_to || [];
        console.log('Assignés actuels en base:', currentAssigned);
        console.log('Nouveaux sélectionnés:', selectedMembers);
        
        // ✅ REMPLACER complètement la liste (pas de merge)
        const newAssigned = selectedMembers;
        console.log('Nouvelle liste assignée (remplace l\'ancienne):', newAssigned);
        
        console.log('Tentative sauvegarde en base...');
        console.log('task.id:', task.id);
        console.log('Data à sauver:', { 
          assigned_to: newAssigned, 
          updated_at: new Date().toISOString() 
        });

        // 1. Sauvegarder avec la nouvelle liste (remplace l'ancienne)
        const { data: updateResult, error: updateError } = await supabase
          .from('task')
          .update({ 
            assigned_to: newAssigned, // ✅ Remplace complètement l'ancienne liste
            updated_at: new Date().toISOString()
          })
          .eq('id', task.id)
          .select();

        console.log('Resultat update Supabase:', updateResult);
        console.log('Erreur update Supabase:', updateError);

        if (updateError) {
          console.error('Erreur detaillee:', updateError);
          throw new Error(`Erreur sauvegarde: ${updateError.message}`);
        }

        console.log('Sauvegarde réussie!');

        // 2. Préparer les données pour webhook (avec tous les assignés)
        const membersData = newAssigned.map(memberId => {
          const memberInfo = hotelMembers.find(m => m.id === memberId);
          return {
            id: memberId,
            user_id: memberId,
            role: 'assignee',
            name: memberInfo?.name || 'Unknown'
          };
        });

        console.log('Webhook data:', membersData);

        // 3. Envoyer webhook (optionnel mais utile pour notifications)
        try {
          await sendTaskUpdatedEvent(
            task.id,
            task,
            { ...task, assigned_to: newAssigned },
            profiles,
            locations,
            { members: membersData }
          );
          console.log('Webhook envoyé avec succès');
        } catch (webhookError) {
          console.warn('Webhook failed but assignment was saved:', webhookError);
        }

        // ✅ MESSAGES AMÉLIORÉS - Afficher qui a été ajouté/retiré
        const added = newAssigned.filter(id => !currentAssigned.includes(id));
        const removed = currentAssigned.filter(id => !newAssigned.includes(id));
        
        const addedNames = added.map(id => hotelMembers.find(m => m.id === id)?.name || 'Unknown').join(', ');
        const removedNames = removed.map(id => hotelMembers.find(m => m.id === id)?.name || 'Unknown').join(', ');
        
        let description = '';
        if (added.length > 0 && removed.length > 0) {
          description = `Ajoutés: ${addedNames} | Retirés: ${removedNames}`;
        } else if (added.length > 0) {
          description = `Ajoutés: ${addedNames}`;
        } else if (removed.length > 0) {
          description = `Retirés: ${removedNames}`;
        } else {
          description = 'Aucun changement';
        }
        
        toast({
          title: "Membres mis à jour",
          description: `${description} (Total: ${newAssigned.length} assignés)`,
        });
        
        console.log('Calling onUpdate...');
        // 4. Rafraichir les donnees
        if (onUpdate) {
          onUpdate();
        }
      } catch (error) {
        console.error('ERREUR COMPLETE:', error);
        toast({
          title: "Erreur d'assignation",
          description: error.message || "Impossible d'assigner les membres",
          variant: "destructive",
        });
      }
    } else {
      console.log('Conditions non remplies:', {
        hasTask: !!task,
        selectedMembersCount: selectedMembers.length,
        selectedMembers
      });
    }
    
    console.log('Fermeture modal');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="pb-4 border-b">
          <h2 className="text-lg font-bold text-foreground">
            Assigned People {selectedMembers.length > 0 && (
              <span className="ml-2 px-2 py-1 bg-[#BBA57A] text-[#1E1A37] rounded-full text-sm font-medium">
                {selectedMembers.length} selected
              </span>
            )}
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
                <div key={member.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-[#BBA57A]/10 border border-transparent hover:border-[#BBA57A]/30 transition-all duration-200">
                  <Checkbox 
                    id={member.id}
                    checked={selectedMembers.includes(member.id)}
                    onCheckedChange={() => handleMemberToggle(member.id)}
                    className="cursor-pointer"
                  />
                  <Avatar className="h-10 w-10 cursor-pointer transition-all duration-200" onClick={() => handleMemberToggle(member.id)}>
                    <AvatarFallback className={`text-sm font-medium transition-all duration-200 ${
                      selectedMembers.includes(member.id)
                        ? 'bg-[#BBA57A] text-[#1E1A37] ring-2 ring-[#BBA57A]'
                        : 'bg-[#1E1A37] text-white hover:bg-[#BBA57A] hover:text-[#1E1A37]'
                    }`}>
                      {member.initials}
                    </AvatarFallback>
                  </Avatar>
                  <Label htmlFor={member.id} className="flex-1 cursor-pointer" onClick={() => handleMemberToggle(member.id)}>
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
              className="min-w-[120px]"
            >
              Assign {selectedMembers.length > 0 ? `(${selectedMembers.length})` : ''}
            </Button>
            {selectedMembers.length === 0 && (
              <p className="text-xs text-destructive mt-2 text-right">
                Au moins 1 membre requis
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
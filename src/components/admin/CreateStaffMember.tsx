// src/components/admin/CreateStaffMember.tsx
//
// Bouton flottant + modal d'invitation d'un nouveau membre du staff.
// Visible uniquement sur l'onglet "Roles & Hierarchie" de /admin/onboarding.
// Appelle l'Edge Function `invite-staff` qui declenche supabase.auth.admin.inviteUserByEmail.

import { useState } from 'react';
import { UserPlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

// ─── Constantes : strictement alignees sur le dropdown Sign Up (Auth.tsx) ────

const JOB_ROLES = [
  'Receptionist',
  'Director',
  'Housekeeping Supervisor',
  'Room Attendant',
  'Restaurant staff',
  'Tech maintenance team',
  'AI Engineer',
] as const;

const HIERARCHIES = ['Collaborator', 'Manager'] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function CreateStaffMember() {
  const [isOpen, setIsOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [hierarchy, setHierarchy] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const reset = () => {
    setFirstName(''); setLastName(''); setEmail('');
    setJobRole(''); setHierarchy(''); setError('');
  };

  const close = () => { if (!loading) { setIsOpen(false); reset(); } };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !jobRole || !hierarchy) {
      setError('Tous les champs sont requis.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('invite-staff', {
        body: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          jobRole,
          hierarchy,
          appOrigin: window.location.origin,
        },
      });

      // supabase.functions.invoke masque le body JSON d'erreur derriere un message generique.
      // On recupere le vrai message en lisant fnError.context.json() si dispo.
      if (fnError) {
        let detailedMessage = fnError.message;
        try {
          const errorBody = await (fnError as any).context?.json?.();
          if (errorBody?.error) detailedMessage = errorBody.error;
        } catch { /* body pas lisible, on garde le message generique */ }
        throw new Error(detailedMessage);
      }
      if (data?.error) throw new Error(data.error);

      toast({
        title: 'Invitation envoyee',
        description: `Un email a ete envoye a ${email}. Le compte sera cree apres definition du mot de passe.`,
      });

      queryClient.invalidateQueries({ queryKey: ['staff_directory_all'] });
      queryClient.invalidateQueries({ queryKey: ['staff_directory_active'] });
      queryClient.invalidateQueries({ queryKey: ['staff_directory_count'] });

      reset();
      setIsOpen(false);
    } catch (err: any) {
      console.error('invite-staff error:', err);
      setError(err.message || "Erreur lors de l'envoi de l'invitation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Bouton flottant - meme gabarit que UploadTutorialVideo */}
      <div className="fixed bottom-6 right-6 z-[9998]">
        <Button
          onClick={() => setIsOpen(true)}
          className={cn(
            'h-24 w-24 rounded-full transition-all duration-500',
            'bg-[#1E1A37] hover:bg-[#1E1A37]/90',
            'border-2 border-[#DEAE35]/50 hover:border-[#DEAE35]',
            'shadow-lg relative',
          )}
          size="icon"
          title="Ajouter un membre de l'equipe"
        >
          <UserPlus style={{ color: '#BBA57A', width: '44px', height: '44px' }} />
        </Button>
        <div className="absolute -bottom-12 -right-12 h-48 w-48 rounded-full border-2 border-[#DEAE35]/20 animate-ping pointer-events-none" />
      </div>

      {/* Modal - style aligne sur /auth Sign Up */}
      <Dialog open={isOpen} onOpenChange={close}>
        <DialogContent className="sm:max-w-md w-[95vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
              <UserPlus className="h-5 w-5" style={{ color: '#BBA57A' }} />
              Ajouter un membre de l'équipe
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="job-role">Rôle</Label>
              <Select value={jobRole} onValueChange={setJobRole} required>
                <SelectTrigger className="hotel-hover">
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {JOB_ROLES.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hierarchy">Hiérarchie</Label>
              <Select value={hierarchy} onValueChange={setHierarchy} required>
                <SelectTrigger className="hotel-hover">
                  <SelectValue placeholder="Sélectionner une hiérarchie" />
                </SelectTrigger>
                <SelectContent>
                  {HIERARCHIES.map(h => (
                    <SelectItem key={h} value={h}>{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">Prénom</Label>
                <Input id="first-name" value={firstName} onChange={e => setFirstName(e.target.value)}
                  placeholder="Prénom" className="hotel-hover" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Nom</Label>
                <Input id="last-name" value={lastName} onChange={e => setLastName(e.target.value)}
                  placeholder="Nom" className="hotel-hover" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="email@exemple.com" className="hotel-hover" required />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={close} disabled={loading} className="flex-1">
                Annuler
              </Button>
              <Button type="submit" disabled={loading}
                className="flex-1 bg-[#BBA57A] text-white border border-hotel-gold-dark/30 shadow-lg transition-all duration-300 hover:!bg-[#DEAE35] hover:text-[#1E1A37] hover:shadow-2xl hover:border-[#BBA57A] hover:scale-[1.02]">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Envoyer l'invitation
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

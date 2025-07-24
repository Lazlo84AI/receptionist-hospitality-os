import { useState } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Users } from 'lucide-react';

const UserManagement = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'receptionist',
    shift_type: 'morning',
    department: 'Front Desk',
    is_active: true
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const userData = {
        id: crypto.randomUUID(),
        ...formData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        permissions: {}
      };

      const response = await fetch('https://primary-production-31bef.up.railway.app/webhook-test/fetch_data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        toast({
          title: "Utilisateur créé avec succès",
          description: `${formData.full_name} a été ajouté au système.`,
        });
        
        // Reset form
        setFormData({
          email: '',
          full_name: '',
          role: 'receptionist',
          shift_type: 'morning',
          department: 'Front Desk',
          is_active: true
        });
      } else {
        throw new Error('Erreur lors de la création');
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer l'utilisateur. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header onMenuToggle={() => setSidebarOpen(true)} />
      
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main Content */}
      <main className="p-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              <Users className="h-8 w-8 text-champagne-gold" />
              <h1 className="text-3xl font-playfair font-bold text-foreground">
                Gestion des Utilisateurs
              </h1>
            </div>
            <p className="text-muted-foreground">
              Gérez les comptes utilisateurs et leurs permissions dans le système.
            </p>
          </div>

          {/* Create User Form */}
          <Card className="border-champagne-gold/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5 text-champagne-gold" />
                <span>Créer un Nouvel Utilisateur</span>
              </CardTitle>
              <CardDescription>
                Ajoutez un nouveau membre à l'équipe avec les informations requises.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="marie.dubois@hotel.com"
                      required
                    />
                  </div>

                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nom Complet *</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="Marie Dubois"
                      required
                    />
                  </div>

                  {/* Role */}
                  <div className="space-y-2">
                    <Label htmlFor="role">Rôle</Label>
                    <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="receptionist">Réceptionniste</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Administrateur</SelectItem>
                        <SelectItem value="housekeeping">Ménage</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Shift Type */}
                  <div className="space-y-2">
                    <Label htmlFor="shift_type">Type d'Équipe</Label>
                    <Select value={formData.shift_type} onValueChange={(value) => setFormData({ ...formData, shift_type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">Matin</SelectItem>
                        <SelectItem value="afternoon">Après-midi</SelectItem>
                        <SelectItem value="evening">Soir</SelectItem>
                        <SelectItem value="night">Nuit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Department */}
                  <div className="space-y-2">
                    <Label htmlFor="department">Département</Label>
                    <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Front Desk">Réception</SelectItem>
                        <SelectItem value="Housekeeping">Ménage</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                        <SelectItem value="Management">Direction</SelectItem>
                        <SelectItem value="Security">Sécurité</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Active Status */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                      <Label htmlFor="is_active">Compte Actif</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Un compte inactif ne pourra pas se connecter au système.
                    </p>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                  <Button 
                    type="submit" 
                    disabled={isCreating}
                    className="min-w-[150px]"
                  >
                    {isCreating ? "Création..." : "Créer l'Utilisateur"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default UserManagement;
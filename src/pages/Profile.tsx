import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Pencil, X, Check, Lock, User, Phone, Mail, Briefcase, ShieldCheck } from 'lucide-react';

// ─── Brand colours ──────────────────────────────────────────────────────────
const GOLD = '#BBA57A';
const NAVY = '#1E1A37';
const YELLOW = '#DEAE35';

// ─── Types ───────────────────────────────────────────────────────────────────
interface ProfileData {
  first_name: string;
  last_name:  string;
  email:      string;
  service:    string | null;
  hierarchy:  string | null;
}

interface FormData {
  first_name: string;
  last_name:  string;
  phone:      string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getInitials = (first: string, last: string) => {
  const a = first.trim().charAt(0).toUpperCase();
  const b = last.trim().charAt(0).toUpperCase();
  return `${a}${b}` || '?';
};

const formatService = (s: string | null) => {
  if (!s) return '—';
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">{children}</p>
);

const FieldValue = ({ children }: { children: React.ReactNode }) => (
  <p className="text-base font-medium" style={{ color: NAVY }}>{children || '—'}</p>
);

const ReadOnlyField = ({
  icon, label, value,
}: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="rounded-2xl border border-[#BBA57A]/15 bg-[#faf8f4] p-4 flex items-start gap-3">
    <div className="mt-0.5 text-gray-300">{icon}</div>
    <div className="flex-1">
      <FieldLabel>{label}</FieldLabel>
      <FieldValue>{value}</FieldValue>
    </div>
    <Lock className="w-3.5 h-3.5 text-gray-300 mt-1 shrink-0" />
  </div>
);

const EditableField = ({
  icon, label, value, name, onChange, placeholder = '', type = 'text',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  name: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
}) => (
  <div className="rounded-2xl border border-[#BBA57A]/30 bg-white p-4 flex items-start gap-3 shadow-sm">
    <div className="mt-0.5" style={{ color: GOLD }}>{icon}</div>
    <div className="flex-1">
      <FieldLabel>{label}</FieldLabel>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full text-base font-medium bg-transparent border-none outline-none focus:ring-0 p-0"
        style={{ color: NAVY }}
      />
    </div>
  </div>
);

const DisplayField = ({
  icon, label, value,
}: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="rounded-2xl border border-[#BBA57A]/15 bg-white p-4 flex items-start gap-3 shadow-sm">
    <div className="mt-0.5" style={{ color: GOLD }}>{icon}</div>
    <div className="flex-1">
      <FieldLabel>{label}</FieldLabel>
      <FieldValue>{value}</FieldValue>
    </div>
  </div>
);

// ─── Page ────────────────────────────────────────────────────────────────────

const Profile = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditing, setIsEditing]         = useState(false);
  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);

  const [profile, setProfile] = useState<ProfileData>({
    first_name: '',
    last_name:  '',
    email:      '',
    service:    null,
    hierarchy:  null,
  });

  const [phone, setPhone]     = useState('');
  const [staffId, setStaffId] = useState<string | null>(null);

  const [form, setForm] = useState<FormData>({
    first_name: '',
    last_name:  '',
    phone:      '',
  });

  // ── Fetch ──
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // profiles (first_name, last_name, email, service, hierarchy)
        const { data: profileData, error: profileError } = await (supabase as any)
          .from('profiles')
          .select('first_name, last_name, email, service, hierarchy')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        // staff_directory (phone, id)
        const { data: staffData } = await supabase
          .from('staff_directory')
          .select('id, phone')
          .eq('auth_user_id', user.id)
          .maybeSingle();

        const p: ProfileData = {
          first_name: profileData?.first_name ?? '',
          last_name:  profileData?.last_name  ?? '',
          email:      profileData?.email      ?? user.email ?? '',
          service:    profileData?.service    ?? null,
          hierarchy:  profileData?.hierarchy  ?? null,
        };

        setProfile(p);
        setPhone(staffData?.phone ?? '');
        setStaffId(staffData?.id ?? null);
        setForm({ first_name: p.first_name, last_name: p.last_name, phone: staffData?.phone ?? '' });
      } catch (err) {
        console.error('Error fetching profile:', err);
        toast.error('Impossible de charger le profil.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // ── Handlers ──
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCancel = () => {
    setForm({ first_name: profile.first_name, last_name: profile.last_name, phone });
    setIsEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Update profiles
      const { error: profileError } = await (supabase as any)
        .from('profiles')
        .update({ first_name: form.first_name, last_name: form.last_name, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update staff_directory phone (si la ligne existe)
      if (staffId) {
        const { error: staffError } = await supabase
          .from('staff_directory')
          .update({ phone: form.phone || null })
          .eq('id', staffId);

        if (staffError) throw staffError;
      }

      // Mettre à jour l'état local
      setProfile(prev => ({ ...prev, first_name: form.first_name, last_name: form.last_name }));
      setPhone(form.phone);
      setIsEditing(false);
      toast.success('Profil mis à jour avec succès.');
    } catch (err: any) {
      console.error('Error saving profile:', err);
      toast.error('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  // ── Render ──
  if (loading) return (
    <div className="min-h-screen bg-[#faf8f4] flex items-center justify-center">
      <Loader2 className="animate-spin w-10 h-10" style={{ color: GOLD }} />
    </div>
  );

  const initials = getInitials(profile.first_name, profile.last_name);
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Mon profil';

  return (
    <div className="min-h-screen bg-[#faf8f4]">
      <Header onMenuToggle={() => setIsSidebarOpen(prev => !prev)} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="p-4 md:p-8 max-w-2xl mx-auto space-y-8">

        {/* ── En-tête ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-playfair" style={{ color: NAVY }}>Mon Profil</h1>
            <p className="text-sm text-gray-400 mt-1">Gérez vos informations personnelles</p>
          </div>

          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ background: GOLD, color: '#fff' }}
            >
              <Pencil className="w-4 h-4" />
              Modifier
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-all"
              >
                <X className="w-4 h-4" />
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{ background: NAVY, color: '#fff' }}
              >
                {saving
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Check className="w-4 h-4" />
                }
                Enregistrer
              </button>
            </div>
          )}
        </div>

        {/* ── Avatar ── */}
        <div className="flex items-center gap-5">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold shrink-0"
            style={{ background: NAVY, color: GOLD }}
          >
            {initials}
          </div>
          <div>
            <p className="text-xl font-semibold" style={{ color: NAVY }}>{fullName}</p>
            <p className="text-sm text-gray-400">{profile.email}</p>
            {profile.hierarchy && (
              <span
                className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: `${GOLD}20`, color: GOLD }}
              >
                {profile.hierarchy}
              </span>
            )}
          </div>
        </div>

        {/* ── Informations personnelles ── */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: GOLD }}>
            Informations personnelles
          </h2>

          <div className="space-y-3">
            {isEditing ? (
              <>
                <EditableField
                  icon={<User className="w-4 h-4" />}
                  label="Prénom"
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  placeholder="Votre prénom"
                />
                <EditableField
                  icon={<User className="w-4 h-4" />}
                  label="Nom"
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  placeholder="Votre nom"
                />
                <EditableField
                  icon={<Phone className="w-4 h-4" />}
                  label="Téléphone portable"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+33 6 00 00 00 00"
                  type="tel"
                />
              </>
            ) : (
              <>
                <DisplayField
                  icon={<User className="w-4 h-4" />}
                  label="Prénom"
                  value={profile.first_name}
                />
                <DisplayField
                  icon={<User className="w-4 h-4" />}
                  label="Nom"
                  value={profile.last_name}
                />
                <DisplayField
                  icon={<Phone className="w-4 h-4" />}
                  label="Téléphone portable"
                  value={phone}
                />
              </>
            )}

            {/* Email — toujours non modifiable */}
            <ReadOnlyField
              icon={<Mail className="w-4 h-4" />}
              label="Email"
              value={profile.email}
            />
          </div>
        </section>

        {/* ── Poste & Service ── */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: GOLD }}>
            Poste &amp; Service
          </h2>

          <div className="space-y-3">
            <ReadOnlyField
              icon={<Briefcase className="w-4 h-4" />}
              label="Service"
              value={formatService(profile.service)}
            />
            <ReadOnlyField
              icon={<ShieldCheck className="w-4 h-4" />}
              label="Hiérarchie"
              value={profile.hierarchy ?? '—'}
            />
          </div>
        </section>

      </main>
    </div>
  );
};

export default Profile;

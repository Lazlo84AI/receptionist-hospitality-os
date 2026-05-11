import { useState, useMemo } from 'react';
import { AdminLayout } from './AdminLayout';
import { UploadTraining } from '@/components/UploadTraining';
import { DocumentViewerModal } from '@/components/modals/DocumentViewerModal';
import QuizzModal from '@/components/modals/QuizzModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  GraduationCap,
  BookOpen,
  Brain,
  Dumbbell,
  FlaskConical,
  HelpCircle,
  Hand,
  Search,
  Trash2,
  Eye,
  LayoutGrid,
  List,
  Loader2,
  AlertTriangle,
  Users,
  Bell,
  BarChart2,
  CheckCircle2,
  Clock,
  Archive,
  X,
  Plus,
  ArrowRight,
  User,
  Layers,
  Calendar,
  Send,
  ChevronDown,
  Phone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// ─── Types ────────────────────────────────────────────────────────────────────

interface KnowledgeItem {
  id: string;
  document_title: string;
  document_name: string;
  document_url: string | null;
  thematic: string;
  summary: string | null;
  average_score: number | null;
  status: string;
  formation_steps: string;
  kanban_status: string;
  related_item_ids: string[] | null;
  last_score?: number | null;
  file_name: string | null;
  created_at: string;
  updated_at: string;
}

type TabId = 'bibliotheque' | 'attribution' | 'suivi' | 'workflows';
type ViewMode = 'grid' | 'list';
type StepFilter = 'all' | 'formation' | 'training' | 'qcm' | 'practice';

// ─── Config par type ──────────────────────────────────────────────────────────

const STEP_CONFIG: Record<string, {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  accent: string;
}> = {
  formation: {
    label: 'Formation',
    icon: BookOpen,
    color: '#E0D3B4',
    bg: 'rgba(224,211,180,0.12)',
    border: 'rgba(224,211,180,0.35)',
    accent: '#E0D3B4',
  },
  training: {
    label: 'Training',
    icon: Brain,
    color: '#BBA57A',
    bg: 'rgba(187,165,122,0.12)',
    border: 'rgba(187,165,122,0.4)',
    accent: '#BBA57A',
  },
  qcm: {
    label: 'QCM',
    icon: HelpCircle,
    color: '#DEAE35',
    bg: 'rgba(222,174,53,0.1)',
    border: 'rgba(222,174,53,0.4)',
    accent: '#DEAE35',
  },
  practice: {
    label: 'Practice',
    icon: Hand,
    color: '#8b83b8',
    bg: 'rgba(30,26,55,0.35)',
    border: 'rgba(139,131,184,0.35)',
    accent: '#8b83b8',
  },
};

const getStepConfig = (step: string) =>
  STEP_CONFIG[step] ?? STEP_CONFIG['formation'];

// ─── Config thématique → emoji + dégradé ─────────────────────────────────────

const THEMATIC_TRAINING_CONFIG: Record<string, { emoji: string; gradient: string; iconBg: string }> = {
  // Thématiques explicites
  // ── Charte Sokle alignée : Navy · Gold · Yellow · Sand · White · Teal ──
  'Housekeeping':          { emoji: '🧹', gradient: 'linear-gradient(135deg, #2d2850 0%, #1E1A37 100%)', iconBg: 'rgba(139,131,184,0.2)' },
  'Réception':             { emoji: '🛎️', gradient: 'linear-gradient(135deg, #5a1428 0%, #2e0a14 100%)', iconBg: 'rgba(196,99,122,0.22)' },
  'Reception':             { emoji: '🛎️', gradient: 'linear-gradient(135deg, #5a1428 0%, #2e0a14 100%)', iconBg: 'rgba(196,99,122,0.22)' },
  'Maintenance':           { emoji: '🔧', gradient: 'linear-gradient(135deg, #4a3c28 0%, #241d12 100%)', iconBg: 'rgba(224,211,180,0.2)' },
  'Sécurité':              { emoji: '🔒', gradient: 'linear-gradient(135deg, #1a1030 0%, #100820 100%)', iconBg: 'rgba(222,174,53,0.18)' },
  'F&B':                   { emoji: '🍽️', gradient: 'linear-gradient(135deg, #7a5e10 0%, #3d2f08 100%)', iconBg: 'rgba(222,174,53,0.2)' },
  'Restauration':          { emoji: '🍽️', gradient: 'linear-gradient(135deg, #7a5e10 0%, #3d2f08 100%)', iconBg: 'rgba(222,174,53,0.2)' },
  'Petit Dejeuner':        { emoji: '☕', gradient: 'linear-gradient(135deg, #7a5e10 0%, #3d2f08 100%)', iconBg: 'rgba(222,174,53,0.2)' },
  'Espace Bien Etre':      { emoji: '🧘', gradient: 'linear-gradient(135deg, #0d3d3d 0%, #061f1f 100%)', iconBg: 'rgba(95,179,179,0.2)' },
  'Spa':                   { emoji: '🧘', gradient: 'linear-gradient(135deg, #0d3d3d 0%, #061f1f 100%)', iconBg: 'rgba(95,179,179,0.2)' },
  'Bar':                   { emoji: '🍸', gradient: 'linear-gradient(135deg, #100a1f 0%, #070412 100%)', iconBg: 'rgba(139,131,184,0.2)' },
  'Conciergerie':          { emoji: '🗝️', gradient: 'linear-gradient(135deg, #5a1428 0%, #2e0a14 100%)', iconBg: 'rgba(196,99,122,0.22)' },
  'Terrain':               { emoji: '🎯', gradient: 'linear-gradient(135deg, #3a2f1a 0%, #1a1509 100%)', iconBg: 'rgba(224,211,180,0.2)' },
};

const THEMATIC_TRAINING_FALLBACK = {
  emoji: '📚',
  gradient: 'linear-gradient(135deg, #1e1a37 0%, #0f0d1f 100%)',
  iconBg: 'rgba(187,165,122,0.15)',
};

const getThematicTrainingConfig = (thematic: string) =>
  THEMATIC_TRAINING_CONFIG[thematic] ?? THEMATIC_TRAINING_FALLBACK;

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div
      className="rounded-xl p-5 border flex items-center gap-4"
      style={{
        backgroundColor: 'rgba(30,26,55,0.85)',
        borderColor: 'rgba(187,165,122,0.2)',
      }}
    >
      <div
        className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${accent}18` }}
      >
        <Icon className="h-5 w-5" style={{ color: accent }} />
      </div>
      <div>
        <p className="text-2xl font-bold text-white leading-none mb-1">{value}</p>
        <p className="text-xs" style={{ color: 'rgba(187,165,122,0.6)' }}>
          {label}
        </p>
      </div>
    </div>
  );
}

// ─── Tab Button ───────────────────────────────────────────────────────────────

function TabButton({
  id,
  label,
  icon: Icon,
  active,
  onClick,
  disabled,
}: {
  id: TabId;
  label: string;
  icon: React.ElementType;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
        active
          ? 'text-white'
          : disabled
          ? 'opacity-30 cursor-not-allowed'
          : 'hover:text-white/80',
      )}
      style={
        active
          ? { backgroundColor: 'rgba(187,165,122,0.18)', color: '#BBA57A' }
          : { color: 'rgba(187,165,122,0.45)' }
      }
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

// ─── Card Grid View ───────────────────────────────────────────────────────────

function ItemCard({
  item,
  onDelete,
  onOpen,
}: {
  item: KnowledgeItem;
  onDelete: (item: KnowledgeItem) => void;
  onOpen: (item: KnowledgeItem) => void;
}) {
  const cfg = getStepConfig(item.formation_steps);
  const Icon = cfg.icon;

  const statusColor =
    item.kanban_status === 'completed'
      ? '#4ade80'
      : item.kanban_status === 'in_progress'
      ? '#DEAE35'
      : 'rgba(187,165,122,0.45)';

  const statusLabel =
    item.kanban_status === 'completed'
      ? 'Complété'
      : item.kanban_status === 'in_progress'
      ? 'En cours'
      : 'À traiter';

  const themCfg = getThematicTrainingConfig(item.thematic);

  return (
    <div
      onClick={() => onOpen(item)}
      className="rounded-2xl overflow-hidden group transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl cursor-pointer flex flex-col"
      style={{ background: themCfg.gradient, border: `1px solid ${cfg.border}` }}
    >
      {/* Top accent bar — couleur par TYPE (Formation/QCM/etc.) conservée */}
      <div
        className="h-1 w-full flex-shrink-0"
        style={{ backgroundColor: cfg.accent, opacity: 0.9 }}
      />

      {/* Icon header */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between">
        {/* Emoji thématique dans le carré */}
        <div
          className="h-11 w-11 rounded-xl flex items-center justify-center shadow-lg"
          style={{
            backgroundColor: item.formation_steps === 'formation' ? themCfg.iconBg : cfg.bg,
            backdropFilter: 'blur(4px)',
          }}
        >
          {item.formation_steps === 'formation'
            ? <span className="text-2xl">{themCfg.emoji}</span>
            : <Icon className="h-6 w-6" style={{ color: cfg.color }} />
          }
        </div>

        {/* Actions (visible on hover) */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {item.document_url && (
            <a href={item.document_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
              <button
                className="h-7 w-7 rounded-md flex items-center justify-center transition-colors"
                style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}
                title="Voir le document"
              >
                <Eye className="h-3.5 w-3.5" style={{ color: '#BBA57A' }} />
              </button>
            </a>
          )}
          <button
            onClick={e => { e.stopPropagation(); onDelete(item); }}
            className="h-7 w-7 rounded-md flex items-center justify-center transition-colors"
            style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}
            title="Supprimer"
          >
            <Trash2 className="h-3.5 w-3.5 text-red-400" />
          </button>
        </div>
      </div>

      {/* Titre */}
      <div className="px-4 pb-3 flex-1">
        <h3
          className="text-sm font-bold text-white mb-1 line-clamp-2 leading-snug drop-shadow-sm"
          title={item.document_title}
        >
          {item.document_title}
        </h3>
        <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>
          {item.thematic}
        </p>
      </div>

      {/* Badges row — TYPE badge garde sa couleur d'origine */}
      <div className="px-4 pb-4 flex items-center justify-between flex-wrap gap-2">
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{
            backgroundColor: cfg.bg,
            color: cfg.color,
            border: `1px solid ${cfg.border}`,
          }}
        >
          {cfg.label}
        </span>

        <div className="flex items-center gap-1">
          <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
          <span className="text-xs" style={{ color: statusColor }}>{statusLabel}</span>
        </div>
      </div>

      {/* Score moyen si dispo */}
      {item.average_score !== null && item.average_score > 0 && (
        <div
          className="px-4 py-3"
          style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Score moyen</span>
            <span className="text-xs font-bold" style={{ color: '#DEAE35' }}>{item.average_score}%</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <div className="h-full rounded-full" style={{ width: `${item.average_score}%`, backgroundColor: '#DEAE35' }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── List Row ─────────────────────────────────────────────────────────────────

function ItemRow({
  item,
  onDelete,
  onOpen,
}: {
  item: KnowledgeItem;
  onDelete: (item: KnowledgeItem) => void;
  onOpen: (item: KnowledgeItem) => void;
}) {
  const cfg = getStepConfig(item.formation_steps);
  const Icon = cfg.icon;

  const statusColor =
    item.kanban_status === 'completed'
      ? '#4ade80'
      : item.kanban_status === 'in_progress'
      ? '#DEAE35'
      : 'rgba(187,165,122,0.4)';

  const statusLabel =
    item.kanban_status === 'completed'
      ? 'Complété'
      : item.kanban_status === 'in_progress'
      ? 'En cours'
      : 'À traiter';

  return (
    <div
      onClick={() => onOpen(item)}
      className="flex items-center gap-4 px-4 py-3 rounded-xl border group transition-all duration-150 hover:border-opacity-60 cursor-pointer"
      style={{
        backgroundColor: 'rgba(30,26,55,0.75)',
        borderColor: 'rgba(187,165,122,0.15)',
      }}
    >
      {/* Icon */}
      <div
        className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: cfg.bg }}
      >
        <Icon className="h-4 w-4" style={{ color: cfg.color }} />
      </div>

      {/* Title + thematic */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{item.document_name}</p>
        <p className="text-xs truncate mt-0.5" style={{ color: 'rgba(187,165,122,0.5)' }}>
          {item.thematic}
        </p>
      </div>

      {/* Type badge */}
      <span
        className="hidden sm:inline text-xs px-2 py-0.5 rounded-full flex-shrink-0"
        style={{
          backgroundColor: cfg.bg,
          color: cfg.color,
          border: `1px solid ${cfg.border}`,
        }}
      >
        {cfg.label}
      </span>

      {/* Score */}
      {item.average_score !== null && item.average_score > 0 ? (
        <span className="hidden md:inline text-xs flex-shrink-0" style={{ color: '#DEAE35' }}>
          {item.average_score}%
        </span>
      ) : (
        <span className="hidden md:inline text-xs flex-shrink-0" style={{ color: 'rgba(187,165,122,0.3)' }}>
          —
        </span>
      )}

      {/* Status */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
        <span className="text-xs hidden sm:inline" style={{ color: statusColor }}>
          {statusLabel}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {item.document_url && (
          <a href={item.document_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
            <button
              className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-white/10 transition-colors"
              title="Voir"
            >
              <Eye className="h-3.5 w-3.5" style={{ color: '#BBA57A' }} />
            </button>
          </a>
        )}
        <button
          onClick={e => { e.stopPropagation(); onDelete(item); }}
          className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-red-500/20 transition-colors"
          title="Supprimer"
        >
          <Trash2 className="h-3.5 w-3.5 text-red-400" />
        </button>
      </div>
    </div>
  );
}

// ─── Coming Soon Stub ─────────────────────────────────────────────────────────

function ComingSoon({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div
      className="rounded-xl border p-16 flex flex-col items-center justify-center text-center"
      style={{
        backgroundColor: 'rgba(30,26,55,0.4)',
        borderColor: 'rgba(187,165,122,0.12)',
        borderStyle: 'dashed',
      }}
    >
      <Icon className="h-10 w-10 mb-3 opacity-20" style={{ color: '#BBA57A' }} />
      <p className="text-white font-medium mb-1">{label}</p>
      <p className="text-xs" style={{ color: 'rgba(187,165,122,0.4)' }}>
        Module en cours de développement
      </p>
    </div>
  );
}

// ─── Tab Attribution ────────────────────────────────────────────────────────────

type AssignMode = 'individual' | 'service';

interface ProgramStep {
  id: string;
  item: KnowledgeItem;
}

const SERVICES = [
  'Réception',
  'Housekeeping',
  'Petit Dejeuner',
  'Espace Bien Etre',
  'Maintenance',
  'Direction',
];

function TabAttribution({ items }: { items: KnowledgeItem[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<AssignMode>('individual');
  const [programName, setProgramName] = useState('');
  const [deadline, setDeadline] = useState('');
  const [steps, setSteps] = useState<ProgramStep[]>([]);
  const [contentSearch, setContentSearch] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Mode individuel — multi-sélection
  const [staffSearch, setStaffSearch] = useState('');
  const [selectedStaffIds, setSelectedStaffIds] = useState<Set<string>>(new Set());
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);

  // Mode service — multi-sélection
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());

  // Fetch staff directory
  const { data: staffList = [] } = useQuery({
    queryKey: ['staff_directory_active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_directory')
        .select('id, full_name, first_name, last_name, service, role')
        .eq('is_active', true)
        .order('full_name');
      if (error) throw error;
      return data as { id: string; full_name: string; first_name: string; last_name: string; service: string; role: string }[];
    },
  });

  const filteredStaff = staffList.filter(s =>
    (s.full_name || `${s.first_name} ${s.last_name}`)
      .toLowerCase()
      .includes(staffSearch.toLowerCase())
  );

  const filteredContent = items.filter(item =>
    contentSearch === '' ||
    item.document_name.toLowerCase().includes(contentSearch.toLowerCase()) ||
    item.thematic.toLowerCase().includes(contentSearch.toLowerCase())
  );

  const addStep = (item: KnowledgeItem) => {
    if (steps.find(s => s.id === item.id)) return;

    // Si c'est un QCM → vérifier que la formation existe
    if (item.formation_steps === 'qcm') {
      const relatedFormation = items.find(
        i => i.document_name === item.document_name && i.formation_steps === 'formation'
      );
      
      if (!relatedFormation) {
        toast({
          title: 'Formation manquante',
          description: `La formation "${item.document_name}" est à charger pour attribuer ce QCM.`,
          variant: 'destructive'
        });
        return;
      }

      // ✅ Ajoute QCM + Formation
      setSteps(prev => [
        ...prev,
        { id: item.id, item },
        ...(prev.find(s => s.id === relatedFormation.id) ? [] : [{ id: relatedFormation.id, item: relatedFormation }])
      ]);
    }
    // Si c'est une formation → vérifier que le QCM existe
    else if (item.formation_steps === 'formation') {
      const relatedQcm = items.find(
        i => i.document_name === item.document_name && i.formation_steps === 'qcm'
      );
      
      if (!relatedQcm) {
        toast({
          title: 'QCM manquant',
          description: `Le QCM "${item.document_name}" est à créer pour attribuer cette formation.`,
          variant: 'destructive'
        });
        return;
      }

      // ✅ Ajoute Formation + QCM
      setSteps(prev => [
        ...prev,
        { id: item.id, item },
        ...(prev.find(s => s.id === relatedQcm.id) ? [] : [{ id: relatedQcm.id, item: relatedQcm }])
      ]);
    }
    // Autres types (training, practice) → ajouter directement
    else {
      setSteps(prev => [...prev, { id: item.id, item }]);
    }
  };

  const removeStep = (id: string) => {
    setSteps(prev => prev.filter(s => s.id !== id));
  };

  const moveStep = (index: number, dir: 1 | -1) => {
    const next = [...steps];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setSteps(next);
  };

  const toggleStaff = (id: string) => {
    setSelectedStaffIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleService = (svc: string) => {
    setSelectedServices(prev => {
      const next = new Set(prev);
      if (next.has(svc)) next.delete(svc); else next.add(svc);
      return next;
    });
  };

  const handleSend = async () => {
    if (!programName.trim()) {
      toast({ title: 'Nom requis', description: 'Donnez un nom au programme.', variant: 'destructive' });
      return;
    }
    if (steps.length === 0) {
      toast({ title: 'Programme vide', description: 'Ajoutez au moins une étape.', variant: 'destructive' });
      return;
    }
    if (mode === 'individual' && selectedStaffIds.size === 0) {
      toast({ title: 'Destinataire requis', description: 'Sélectionnez au moins une personne.', variant: 'destructive' });
      return;
    }
    if (mode === 'service' && selectedServices.size === 0) {
      toast({ title: 'Service requis', description: 'Sélectionnez au moins un service.', variant: 'destructive' });
      return;
    }

    setIsSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const base = {
        program_name: programName.trim(),
        knowledge_item_ids: steps.map(s => s.id),
        deadline: deadline || null,
        status: 'pending',
        created_by: user?.id,
      };

      // Une row par personne OU par service
      const payloads: Record<string, unknown>[] = mode === 'individual'
        ? Array.from(selectedStaffIds).map(id => ({ ...base, assigned_to: id }))
        : Array.from(selectedServices).map(svc => ({ ...base, service: svc }));

      const { error } = await supabase.from('training_assignments').insert(payloads);
      if (error) throw error;

      const countLabel = mode === 'individual'
        ? `${payloads.length} personne${payloads.length > 1 ? 's' : ''}`
        : `${payloads.length} service${payloads.length > 1 ? 's' : ''}`;

      toast({ title: '✅ Programme envoyé', description: `Assigné à ${countLabel}` });

      // Reset
      setProgramName('');
      setDeadline('');
      setSteps([]);
      setSelectedStaffIds(new Set());
      setSelectedServices(new Set());
      queryClient.invalidateQueries({ queryKey: ['training_assignments'] });
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  const cardStyle = {
    backgroundColor: 'rgba(30,26,55,0.85)',
    borderColor: 'rgba(187,165,122,0.2)',
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'rgba(15,12,36,0.7)',
    borderColor: 'rgba(187,165,122,0.25)',
    color: 'white',
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

      {/* ── Colonne gauche : Builder ── */}
      <div className="flex flex-col gap-4">

        {/* Mode toggle */}
        <div
          className="rounded-xl border p-4"
          style={cardStyle}
        >
          <p className="text-xs font-medium mb-3" style={{ color: 'rgba(187,165,122,0.6)' }}>Mode d'attribution</p>
          <div
            className="flex rounded-lg p-0.5"
            style={{ backgroundColor: 'rgba(15,12,36,0.6)', border: '1px solid rgba(187,165,122,0.12)' }}
          >
            {([['individual', User, 'Individuelle'], ['service', Layers, 'Par service']] as const).map(
              ([m, Icon, label]) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all"
                  style={{
                    backgroundColor: mode === m ? 'rgba(187,165,122,0.18)' : 'transparent',
                    color: mode === m ? '#BBA57A' : 'rgba(187,165,122,0.4)',
                  }}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              )
            )}
          </div>
        </div>

        {/* Nom du programme + cible */}
        <div className="rounded-xl border p-4 flex flex-col gap-3" style={cardStyle}>
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: 'rgba(187,165,122,0.6)' }}>Nom du programme</label>
            <input
              type="text"
              placeholder="Ex: Onboarding Réception — Printemps 2025"
              value={programName}
              onChange={e => setProgramName(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none border placeholder:text-white/20"
              style={inputStyle}
            />
          </div>

          {/* Picker individuel — multi-sélection */}
          {mode === 'individual' && (
            <div className="relative">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs" style={{ color: 'rgba(187,165,122,0.6)' }}>Personnes assignées</label>
                <div className="flex items-center gap-2">
                  {selectedStaffIds.size > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(187,165,122,0.15)', color: '#BBA57A' }}>
                      {selectedStaffIds.size} sélectionné{selectedStaffIds.size > 1 ? 'e·s' : 'e'}
                    </span>
                  )}
                  <button
                    onClick={() => setShowStaffDropdown(v => !v)}
                    className="text-xs" style={{ color: 'rgba(187,165,122,0.5)' }}
                  >
                    {showStaffDropdown ? '▴ Fermer' : '▾ Ouvrir'}
                  </button>
                </div>
              </div>
              {/* Pills personnes sélectionnées */}
              {selectedStaffIds.size > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {Array.from(selectedStaffIds).map(id => {
                    const s = staffList.find(x => x.id === id);
                    const name = s ? (s.full_name || `${s.first_name} ${s.last_name}`) : id;
                    return (
                      <span key={id} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: 'rgba(187,165,122,0.15)', color: '#BBA57A', border: '1px solid rgba(187,165,122,0.3)' }}>
                        {name}
                        <button onClick={() => toggleStaff(id)} className="ml-0.5 opacity-60 hover:opacity-100">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
              {/* Dropdown */}
              <div
                className="flex items-center gap-2 rounded-lg px-3 py-2 border cursor-pointer"
                style={inputStyle}
                onClick={() => setShowStaffDropdown(v => !v)}
              >
                <User className="h-4 w-4 flex-shrink-0" style={{ color: 'rgba(187,165,122,0.5)' }} />
                <span className="flex-1 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Rechercher et sélectionner…
                </span>
                <ChevronDown className="h-4 w-4" style={{ color: 'rgba(187,165,122,0.4)' }} />
              </div>
              {showStaffDropdown && (
                <div
                  className="absolute z-20 mt-1 w-full rounded-xl border overflow-hidden shadow-2xl"
                  style={{ backgroundColor: '#1a1630', borderColor: 'rgba(187,165,122,0.25)' }}
                >
                  {/* Recherche + Tout sélectionner */}
                  <div className="p-2 flex gap-2">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Rechercher…"
                      value={staffSearch}
                      onChange={e => setStaffSearch(e.target.value)}
                      className="flex-1 rounded-lg px-3 py-1.5 text-sm outline-none border placeholder:text-white/20"
                      style={inputStyle}
                    />
                    <button
                      onClick={() => {
                        const all = new Set(filteredStaff.map(s => s.id));
                        const allSelected = filteredStaff.every(s => selectedStaffIds.has(s.id));
                        if (allSelected) {
                          setSelectedStaffIds(prev => { const n = new Set(prev); filteredStaff.forEach(s => n.delete(s.id)); return n; });
                        } else {
                          setSelectedStaffIds(prev => { const n = new Set(prev); filteredStaff.forEach(s => n.add(s.id)); return n; });
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium flex-shrink-0 transition-all"
                      style={{ backgroundColor: 'rgba(187,165,122,0.15)', color: '#BBA57A', border: '1px solid rgba(187,165,122,0.25)' }}
                    >
                      {filteredStaff.every(s => selectedStaffIds.has(s.id)) ? 'Désél.' : 'Tout'}
                    </button>
                  </div>
                  <div className="max-h-52 overflow-y-auto">
                    {filteredStaff.length === 0 ? (
                      <p className="text-xs px-3 py-3 text-center" style={{ color: 'rgba(187,165,122,0.4)' }}>Aucun résultat</p>
                    ) : filteredStaff.map(s => {
                      const isSelected = selectedStaffIds.has(s.id);
                      const name = s.full_name || `${s.first_name} ${s.last_name}`;
                      return (
                        <button
                          key={s.id}
                          onClick={() => toggleStaff(s.id)}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left transition-colors"
                          style={{ backgroundColor: isSelected ? 'rgba(187,165,122,0.08)' : 'transparent' }}
                        >
                          {/* Checkbox */}
                          <div className="h-4 w-4 rounded flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: isSelected ? '#BBA57A' : 'transparent', border: `1.5px solid ${isSelected ? '#BBA57A' : 'rgba(187,165,122,0.3)'}` }}>
                            {isSelected && <CheckCircle2 className="h-3 w-3 text-white" />}
                          </div>
                          <div
                            className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ backgroundColor: 'rgba(187,165,122,0.15)', color: '#BBA57A' }}
                          >
                            {(name || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm text-white">{name}</p>
                            <p className="text-xs" style={{ color: 'rgba(187,165,122,0.5)' }}>{s.service}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="px-3 py-2 border-t" style={{ borderColor: 'rgba(187,165,122,0.1)' }}>
                    <button
                      onClick={() => setShowStaffDropdown(false)}
                      className="w-full py-1.5 rounded-lg text-xs font-medium"
                      style={{ backgroundColor: 'rgba(187,165,122,0.15)', color: '#BBA57A' }}
                    >Confirmer ({selectedStaffIds.size})</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Picker service — multi-sélection */}
          {mode === 'service' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs" style={{ color: 'rgba(187,165,122,0.6)' }}>Services cibles</label>
                <button
                  onClick={() => {
                    if (selectedServices.size === SERVICES.length) {
                      setSelectedServices(new Set());
                    } else {
                      setSelectedServices(new Set(SERVICES));
                    }
                  }}
                  className="text-xs"
                  style={{ color: 'rgba(187,165,122,0.5)' }}
                >
                  {selectedServices.size === SERVICES.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {SERVICES.map(svc => {
                  const isSelected = selectedServices.has(svc);
                  return (
                    <button
                      key={svc}
                      onClick={() => toggleService(svc)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5"
                      style={{
                        backgroundColor: isSelected ? 'rgba(187,165,122,0.2)' : 'rgba(15,12,36,0.6)',
                        color: isSelected ? '#BBA57A' : 'rgba(187,165,122,0.45)',
                        border: `1px solid ${isSelected ? 'rgba(187,165,122,0.5)' : 'rgba(187,165,122,0.15)'}`,
                      }}
                    >
                      {isSelected && <CheckCircle2 className="h-3 w-3" />}
                      {svc}
                    </button>
                  );
                })}
              </div>
              {selectedServices.size > 0 && (
                <p className="text-xs mt-1.5" style={{ color: 'rgba(187,165,122,0.45)' }}>
                  → {selectedServices.size} programme{selectedServices.size > 1 ? 's' : ''} créé{selectedServices.size > 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}

          {/* Deadline */}
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: 'rgba(187,165,122,0.6)' }}>Date limite</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'rgba(187,165,122,0.45)' }} />
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full rounded-lg pl-9 pr-3 py-2 text-sm outline-none border"
                style={{ ...inputStyle, colorScheme: 'dark' }}
              />
            </div>
          </div>
        </div>

        {/* Programme séquentiel */}
        <div className="rounded-xl border p-4 flex flex-col gap-3" style={cardStyle}>
          <p className="text-xs font-medium" style={{ color: 'rgba(187,165,122,0.6)' }}>Programme séquentiel</p>

          {steps.length === 0 ? (
            <div
              className="rounded-lg border-dashed border p-6 flex flex-col items-center justify-center text-center"
              style={{ borderColor: 'rgba(187,165,122,0.2)' }}
            >
              <Plus className="h-6 w-6 mb-2 opacity-25" style={{ color: '#BBA57A' }} />
              <p className="text-xs" style={{ color: 'rgba(187,165,122,0.4)' }}>Cliquez sur un contenu à droite pour l'ajouter</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {steps.map((step, i) => {
                const cfg = getStepConfig(step.item.formation_steps);
                const Icon = cfg.icon;
                return (
                  <div
                    key={step.id}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 border"
                    style={{ backgroundColor: 'rgba(15,12,36,0.5)', borderColor: 'rgba(187,165,122,0.15)' }}
                  >
                    {/* Numéro étape */}
                    <div
                      className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: 'rgba(187,165,122,0.15)', color: '#BBA57A' }}
                    >
                      {i + 1}
                    </div>

                    {/* Icône type */}
                    <div
                      className="h-7 w-7 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: cfg.bg }}
                    >
                      <Icon className="h-3.5 w-3.5" style={{ color: cfg.color }} />
                    </div>

                    {/* Nom */}
                    <p className="flex-1 text-sm text-white truncate">{step.item.document_name}</p>

                    {/* Badge type */}
                    <span
                      className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                    >
                      {cfg.label}
                    </span>

                    {/* Réordonner */}
                    <div className="flex flex-col gap-0.5 flex-shrink-0">
                      <button
                        onClick={() => moveStep(i, -1)}
                        disabled={i === 0}
                        className="h-4 w-4 flex items-center justify-center rounded opacity-40 hover:opacity-100 disabled:opacity-10 transition-opacity"
                        style={{ color: '#BBA57A' }}
                      >
                        <ChevronDown className="h-3 w-3 rotate-180" />
                      </button>
                      <button
                        onClick={() => moveStep(i, 1)}
                        disabled={i === steps.length - 1}
                        className="h-4 w-4 flex items-center justify-center rounded opacity-40 hover:opacity-100 disabled:opacity-10 transition-opacity"
                        style={{ color: '#BBA57A' }}
                      >
                        <ChevronDown className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Supprimer */}
                    <button
                      onClick={() => removeStep(step.id)}
                      className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-red-500/20 transition-colors flex-shrink-0"
                    >
                      <X className="h-3.5 w-3.5 text-red-400" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bouton Envoyer */}
          <button
            onClick={handleSend}
            disabled={isSending || steps.length === 0}
            className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={{
              backgroundColor: steps.length === 0 ? 'rgba(187,165,122,0.08)' : 'rgba(187,165,122,0.2)',
              color: steps.length === 0 ? 'rgba(187,165,122,0.3)' : '#BBA57A',
              border: `1px solid ${steps.length === 0 ? 'rgba(187,165,122,0.1)' : 'rgba(187,165,122,0.4)'}`,
            }}
          >
            {isSending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Envoi en cours…</>
            ) : (
              <><Send className="h-4 w-4" /> Envoyer le programme</>
            )}
          </button>
        </div>
      </div>

      {/* ── Colonne droite : Sélection de contenus ── */}
      <div
        className="rounded-xl border p-4 flex flex-col gap-3"
        style={{ ...cardStyle, maxHeight: '75vh' }}
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium" style={{ color: 'rgba(187,165,122,0.6)' }}>Sélectionner des contenus</p>
          <span className="text-xs" style={{ color: 'rgba(187,165,122,0.35)' }}>{steps.length} ajouté{steps.length > 1 ? 's' : ''}</span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'rgba(187,165,122,0.4)' }} />
          <input
            type="text"
            placeholder="Filtrer par titre ou thématique…"
            value={contentSearch}
            onChange={e => setContentSearch(e.target.value)}
            className="w-full rounded-lg pl-9 pr-3 py-2 text-sm outline-none border placeholder:text-white/20"
            style={inputStyle}
          />
        </div>

        {/* Liste scrollable */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
          {filteredContent.map(item => {
            const cfg = getStepConfig(item.formation_steps);
            const Icon = cfg.icon;
            const alreadyAdded = steps.some(s => s.id === item.id);
            return (
              <button
                key={item.id}
                onClick={() => !alreadyAdded && addStep(item)}
                disabled={alreadyAdded}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 border text-left transition-all"
                style={{
                  backgroundColor: alreadyAdded ? 'rgba(74,222,128,0.06)' : 'rgba(15,12,36,0.5)',
                  borderColor: alreadyAdded ? 'rgba(74,222,128,0.25)' : 'rgba(187,165,122,0.12)',
                  opacity: alreadyAdded ? 0.7 : 1,
                  cursor: alreadyAdded ? 'default' : 'pointer',
                }}
              >
                <div
                  className="h-8 w-8 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: cfg.bg }}
                >
                  <Icon className="h-4 w-4" style={{ color: cfg.color }} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{item.document_name}</p>
                  <p className="text-xs truncate" style={{ color: 'rgba(187,165,122,0.5)' }}>{item.thematic}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                  >
                    {cfg.label}
                  </span>
                  {alreadyAdded ? (
                    <CheckCircle2 className="h-4 w-4" style={{ color: '#4ade80' }} />
                  ) : (
                    <Plus className="h-4 w-4" style={{ color: 'rgba(187,165,122,0.4)' }} />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Tab Suivi & Retards ────────────────────────────────────────────────────────

type SuiviStatus = 'all' | 'pending' | 'in_progress' | 'completed' | 'overdue';

interface Assignment {
  id: string;
  program_name: string;
  knowledge_item_ids: string[];
  assigned_to: string | null;
  service: string | null;
  deadline: string | null;
  status: string;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending:     { label: 'Non démarré', color: 'rgba(187,165,122,0.6)',  bg: 'rgba(187,165,122,0.08)', dot: 'rgba(187,165,122,0.5)' },
  in_progress: { label: 'En cours',   color: '#DEAE35',                bg: 'rgba(222,174,53,0.1)',   dot: '#DEAE35' },
  completed:   { label: 'Complété',   color: '#4ade80',                bg: 'rgba(74,222,128,0.1)',   dot: '#4ade80' },
  overdue:     { label: 'En retard',  color: '#f87171',                bg: 'rgba(248,113,113,0.1)',  dot: '#f87171' },
};

function TabSuivi({ items }: { items: KnowledgeItem[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<SuiviStatus>('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [contentFilter, setContentFilter] = useState('all');

  // ── Fetch assignments ──────────────────────────────────────────────────────
  const { data: assignments = [], isLoading: loadingAssign } = useQuery({
    queryKey: ['training_assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_assignments')
        .select('id, program_name, knowledge_item_ids, assigned_to, service, deadline, status, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Assignment[];
    },
    staleTime: 1000 * 30,
  });

  // ── Fetch staff ────────────────────────────────────────────────────────────
  const { data: staffMap = {} } = useQuery({
    queryKey: ['staff_directory_map'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_directory')
        .select('id, full_name, first_name, last_name, service');
      if (error) throw error;
      const map: Record<string, { name: string; service: string }> = {};
      for (const s of data) {
        map[s.id] = {
          name: s.full_name || `${s.first_name ?? ''} ${s.last_name ?? ''}`.trim(),
          service: s.service ?? '',
        };
      }
      return map;
    },
  });

  // ── Fetch workflow rules par programme ─────────────────────────────────────
  const { data: workflowRules = [] } = useQuery({
    queryKey: ['training_workflow_rules_suivi'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_workflow_rules')
        .select('id, assignment_id, channel, is_active, delay_days, frequency_days')
        .not('assignment_id', 'is', null);
      if (error) throw error;
      return data as { id: string; assignment_id: string; channel: string; is_active: boolean; delay_days: number; frequency_days: number | null }[];
    },
  });

  // ── KPI totaux ─────────────────────────────────────────────────────────────
  const kpi = useMemo(() => ({
    completed:   assignments.filter(a => a.status === 'completed').length,
    in_progress: assignments.filter(a => a.status === 'in_progress').length,
    overdue:     assignments.filter(a => a.status === 'overdue').length,
    pending:     assignments.filter(a => a.status === 'pending').length,
    total:       assignments.length,
  }), [assignments]);

  // ── Services disponibles ───────────────────────────────────────────────────
  const services = useMemo(() => {
    const set = new Set<string>();
    for (const a of assignments) {
      if (a.service) set.add(a.service);
      if (a.assigned_to && staffMap[a.assigned_to]?.service)
        set.add(staffMap[a.assigned_to].service);
    }
    return Array.from(set).sort();
  }, [assignments, staffMap]);

  // ── Bandeau contenus ───────────────────────────────────────────────────────
  const contentBandeau = useMemo(() => {
    const map: Record<string, { item: KnowledgeItem; total: number; completed: number; overdue: number }> = {};
    for (const a of assignments) {
      for (const kid of a.knowledge_item_ids) {
        const item = items.find(i => i.id === kid);
        if (!item) continue;
        if (!map[kid]) map[kid] = { item, total: 0, completed: 0, overdue: 0 };
        map[kid].total++;
        if (a.status === 'completed') map[kid].completed++;
        if (a.status === 'overdue')   map[kid].overdue++;
      }
    }
    return Object.values(map);
  }, [assignments, items]);

  // ── Filtrage tableau ───────────────────────────────────────────────────────
  // ── Workflow summary par assignment ──────────────────────────────────────────
  const workflowByAssignment = useMemo(() => {
    const map: Record<string, { platform: number; email: number; whatsapp: number }> = {};
    for (const rule of workflowRules) {
      if (!rule.is_active || !rule.assignment_id) continue;
      if (!map[rule.assignment_id]) map[rule.assignment_id] = { platform: 0, email: 0, whatsapp: 0 };
      if (rule.channel === 'platform') map[rule.assignment_id].platform++;
      else if (rule.channel === 'email') map[rule.assignment_id].email++;
      else if (rule.channel === 'whatsapp') map[rule.assignment_id].whatsapp++;
    }
    return map;
  }, [workflowRules]);

  const filtered = useMemo(() => assignments.filter(a => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (serviceFilter !== 'all') {
      const svc = a.service ?? staffMap[a.assigned_to ?? '']?.service ?? '';
      if (svc !== serviceFilter) return false;
    }
    if (contentFilter !== 'all') {
      if (!a.knowledge_item_ids.includes(contentFilter)) return false;
    }
    return true;
  }), [assignments, statusFilter, serviceFilter, contentFilter, staffMap]);

  // ── Relancer ───────────────────────────────────────────────────────────────
  const handleRelancer = async (a: Assignment) => {
    try {
      const { error } = await supabase
        .from('training_assignments')
        .update({ status: 'in_progress' })
        .eq('id', a.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['training_assignments'] });
      toast({
        title: '↻ Relance envoyée',
        description: `${a.program_name} — notification déclenchée`,
      });
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  const cardStyle = { backgroundColor: 'rgba(30,26,55,0.85)', borderColor: 'rgba(187,165,122,0.2)' };

  if (loadingAssign) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#BBA57A' }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">

      {/* ── KPI Bandeau TalentLMS-style ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {([
          ['completed',   CheckCircle2, `${kpi.completed} complétés`,   '#4ade80'],
          ['in_progress', Clock,        `${kpi.in_progress} en cours`,   '#DEAE35'],
          ['overdue',     AlertTriangle,`${kpi.overdue} en retard`,      '#f87171'],
          ['pending',     Archive,      `${kpi.pending} non démarrés`,   'rgba(187,165,122,0.5)'],
        ] as const).map(([key, Icon, label, color]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(s => s === key ? 'all' : key)}
            className="rounded-xl border p-4 flex items-center gap-3 transition-all"
            style={{
              ...cardStyle,
              borderColor: statusFilter === key ? color : 'rgba(187,165,122,0.2)',
              backgroundColor: statusFilter === key ? `${color}14` : 'rgba(30,26,55,0.85)',
            }}
          >
            <div className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${color}18` }}>
              <Icon className="h-5 w-5" style={{ color }} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white leading-none mb-0.5">
                {key === 'completed' ? kpi.completed
                  : key === 'in_progress' ? kpi.in_progress
                  : key === 'overdue' ? kpi.overdue
                  : kpi.pending}
              </p>
              <p className="text-xs" style={{ color: 'rgba(187,165,122,0.55)' }}>{label.split(' ').slice(1).join(' ')}</p>
            </div>
          </button>
        ))}
      </div>

      {/* ── Bandeau par contenu (progress bars) ── */}
      {contentBandeau.length > 0 && (
        <div className="rounded-xl border p-4 flex flex-col gap-3" style={cardStyle}>
          <p className="text-xs font-medium mb-1" style={{ color: 'rgba(187,165,122,0.6)' }}>Avancement par contenu</p>
          {contentBandeau.map(({ item, total, completed, overdue }) => {
            const cfg = getStepConfig(item.formation_steps);
            const Icon = cfg.icon;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
            const isAllDone = completed === total && total > 0;
            return (
              <div key={item.id} className="flex items-center gap-3">
                {/* Icône */}
                <div className="h-8 w-8 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: cfg.bg }}>
                  <Icon className="h-4 w-4" style={{ color: cfg.color }} />
                </div>
                {/* Titre */}
                <div className="w-48 flex-shrink-0 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{item.document_name}</p>
                  <p className="text-xs" style={{ color: 'rgba(187,165,122,0.45)' }}>{item.thematic}</p>
                </div>
                {/* Barre */}
                <div className="flex-1 flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: 'rgba(187,165,122,0.12)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: isAllDone ? '#4ade80' : '#BBA57A',
                      }}
                    />
                  </div>
                  {/* Compteur */}
                  <span className="text-xs font-semibold flex-shrink-0 w-14 text-right"
                    style={{ color: isAllDone ? '#4ade80' : 'rgba(187,165,122,0.7)' }}>
                    {completed}/{total}
                  </span>
                  {/* Badge retard */}
                  {overdue > 0 ? (
                    <span className="flex items-center gap-1 text-xs flex-shrink-0 px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.25)' }}>
                      <AlertTriangle className="h-3 w-3" />{overdue} en retard
                    </span>
                  ) : isAllDone ? (
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: '#4ade80' }} />
                  ) : (
                    <div className="w-20 flex-shrink-0" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Filtres ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Filtre service */}
        <select
          value={serviceFilter}
          onChange={e => setServiceFilter(e.target.value)}
          className="rounded-lg px-3 py-1.5 text-xs border outline-none"
          style={{ backgroundColor: 'rgba(15,12,36,0.7)', borderColor: 'rgba(187,165,122,0.25)', color: '#BBA57A' }}
        >
          <option value="all">Tous les services</option>
          {services.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Filtre statut pills */}
        {(['all', 'pending', 'in_progress', 'completed', 'overdue'] as SuiviStatus[]).map(s => {
          const cfg = s === 'all' ? null : STATUS_CONFIG[s];
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                backgroundColor: statusFilter === s
                  ? (cfg ? cfg.bg : 'rgba(187,165,122,0.18)')
                  : 'rgba(30,26,55,0.6)',
                color: statusFilter === s
                  ? (cfg ? cfg.color : '#BBA57A')
                  : 'rgba(187,165,122,0.4)',
                border: `1px solid ${statusFilter === s
                  ? (cfg ? cfg.dot : 'rgba(187,165,122,0.4)')
                  : 'rgba(187,165,122,0.12)'}`,
              }}
            >
              {s === 'all' ? 'Tous' : STATUS_CONFIG[s].label}
            </button>
          );
        })}

        {/* Filtre contenu */}
        <select
          value={contentFilter}
          onChange={e => setContentFilter(e.target.value)}
          className="rounded-lg px-3 py-1.5 text-xs border outline-none"
          style={{ backgroundColor: 'rgba(15,12,36,0.7)', borderColor: 'rgba(187,165,122,0.25)', color: '#BBA57A' }}
        >
          <option value="all">Toutes les formations</option>
          {items.map(i => <option key={i.id} value={i.id}>{i.document_name}</option>)}
        </select>

        <span className="ml-auto text-xs" style={{ color: 'rgba(187,165,122,0.4)' }}>
          {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Tableau détaillé ── */}
      <div className="rounded-xl border overflow-hidden" style={cardStyle}>
        {/* Header */}
        <div
          className="grid grid-cols-[1fr_1.5fr_120px_100px_130px_100px] gap-4 px-5 py-3"
          style={{ backgroundColor: 'rgba(15,12,36,0.6)', borderBottom: '1px solid rgba(187,165,122,0.12)' }}
        >
          {['Personne / Service', 'Programme', 'Statut', 'Deadline', 'Workflow', ''].map((h, i) => (
            <span key={i} className="text-xs font-medium" style={{ color: 'rgba(187,165,122,0.45)' }}>{h}</span>
          ))}
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <BarChart2 className="h-8 w-8 mb-2 opacity-20" style={{ color: '#BBA57A' }} />
            <p className="text-sm text-white opacity-40">Aucune assignation trouvée</p>
          </div>
        ) : (
          filtered.map((a, idx) => {
            const statusCfg = STATUS_CONFIG[a.status] ?? STATUS_CONFIG['pending'];
            const personName = a.assigned_to
              ? (staffMap[a.assigned_to]?.name ?? 'Inconnu')
              : null;
            const targetLabel = personName ?? (a.service ? `Service : ${a.service}` : '—');
            const deadlineStr = a.deadline
              ? new Date(a.deadline).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
              : '—';
            const canRelancer = a.status === 'pending' || a.status === 'overdue';

            return (
              <div
                key={a.id}
                className="grid grid-cols-[1fr_1.5fr_120px_100px_130px_100px] gap-4 px-5 py-3.5 items-center transition-colors hover:bg-white/[0.02]"
                style={{
                  borderBottom: idx < filtered.length - 1 ? '1px solid rgba(187,165,122,0.07)' : 'none',
                }}
              >
                {/* Personne / Service */}
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: 'rgba(187,165,122,0.12)', color: '#BBA57A' }}
                  >
                    {a.assigned_to ? <User className="h-3.5 w-3.5" /> : <Layers className="h-3.5 w-3.5" />}
                  </div>
                  <span className="text-sm text-white truncate">{targetLabel}</span>
                </div>

                {/* Programme + contenus */}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{a.program_name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(187,165,122,0.45)' }}>
                    {a.knowledge_item_ids.length} contenu{a.knowledge_item_ids.length > 1 ? 's' : ''}
                  </p>
                </div>

                {/* Statut */}
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full w-fit"
                  style={{ backgroundColor: statusCfg.bg }}
                >
                  <div className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: statusCfg.dot }} />
                  <span className="text-xs font-medium" style={{ color: statusCfg.color }}>{statusCfg.label}</span>
                </div>

                {/* Deadline */}
                <span
                  className="text-sm"
                  style={{ color: a.status === 'overdue' ? '#f87171' : 'rgba(187,165,122,0.6)' }}
                >
                  {deadlineStr}
                </span>

                {/* Workflow résumé */}
                {(() => {
                  const wf = workflowByAssignment[a.id];
                  if (!wf) return <span className="text-xs" style={{ color: 'rgba(187,165,122,0.25)' }}>—</span>;
                  return (
                    <div className="flex items-center gap-2 flex-wrap">
                      {wf.platform > 0 && (
                        <span className="text-xs flex items-center gap-0.5" style={{ color: '#BBA57A' }}>🔔{wf.platform}</span>
                      )}
                      {wf.email > 0 && (
                        <span className="text-xs flex items-center gap-0.5" style={{ color: '#a5b4fc' }}>@{wf.email}</span>
                      )}
                      {wf.whatsapp > 0 && (
                        <span className="text-xs flex items-center gap-0.5" style={{ color: '#4ade80' }}>💬{wf.whatsapp}</span>
                      )}
                    </div>
                  );
                })()}

                {/* Action */}
                <div className="flex justify-end">
                  {canRelancer && (
                    <button
                      onClick={() => handleRelancer(a)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all hover:opacity-90"
                      style={{
                        backgroundColor: 'rgba(222,174,53,0.12)',
                        color: '#DEAE35',
                        border: '1px solid rgba(222,174,53,0.3)',
                      }}
                    >
                      <ArrowRight className="h-3 w-3" /> Relancer
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Tab Workflows ──────────────────────────────────────────────────────────────

interface WorkflowRule {
  id: string;
  rule_key: string;
  label: string;
  is_active: boolean;
  delay_days: number;
  frequency_days: number | null;
  channel: string;
  cc_email: string | null;
  target_email: string | null;
}

const CHANNEL_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  platform: { label: 'Plateforme', icon: Bell,        color: '#BBA57A', bg: 'rgba(187,165,122,0.12)' },
  email:    { label: 'Email',      icon: Send,        color: '#a5b4fc', bg: 'rgba(165,180,252,0.12)' },
  whatsapp: { label: 'WhatsApp',   icon: ArrowRight,  color: '#4ade80', bg: 'rgba(74,222,128,0.12)'  },
};

function TabWorkflows() {
  const { toast } = useToast();
  const [rules, setRules] = useState<WorkflowRule[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isCloned, setIsCloned] = useState(false); // true = règles clonées depuis globals, pas encore en DB
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');

  // ── Fetch programmes (training_assignments) ────────────────────────────────
  const { data: assignments = [] } = useQuery({
    queryKey: ['training_assignments_list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_assignments')
        .select('id, program_name, service, assigned_to')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as { id: string; program_name: string; service: string | null; assigned_to: string | null }[];
    },
  });

  // ── Fetch staff direction (pour dropdown CC) ───────────────────────────────
  const { data: directionStaff = [] } = useQuery({
    queryKey: ['staff_direction'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_directory')
        .select('id, full_name, first_name, last_name, email')
        .eq('service', 'direction')
        .eq('is_active', true)
        .order('full_name');
      if (error) throw error;
      return data as { id: string; full_name: string; first_name: string; last_name: string; email: string | null }[];
    },
  });

  // ── Fetch règles globales (template, assignment_id = null) ─────────────────
  const { data: globalRules = [] } = useQuery({
    queryKey: ['training_workflow_rules_global'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_workflow_rules')
        .select('id, rule_key, label, is_active, delay_days, frequency_days, channel, cc_email, target_email')
        .is('assignment_id', null)
        .order('delay_days');
      if (error) throw error;
      return data as WorkflowRule[];
    },
    staleTime: 1000 * 60 * 5,
  });

  // ── Chargement règles quand programme sélectionné ──────────────────────────
  const { isLoading: loadingRules } = useQuery({
    queryKey: ['training_workflow_rules', selectedAssignmentId],
    enabled: !!selectedAssignmentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_workflow_rules')
        .select('id, rule_key, label, is_active, delay_days, frequency_days, channel, cc_email, target_email')
        .eq('assignment_id', selectedAssignmentId)
        .order('delay_days');
      if (error) throw error;

      if (data && data.length > 0) {
        // Règles spécifiques existantes → on les charge
        setRules(data as WorkflowRule[]);
        setIsCloned(false);
      } else {
        // Pas encore de règles pour ce programme → on clone les globals
        setRules(globalRules.map(r => ({ ...r, id: crypto.randomUUID() })));
        setIsCloned(true);
      }
      setIsDirty(false);
      return data;
    },
  });

  // ── Helpers édition locale ─────────────────────────────────────────────────
  const updateRule = (id: string, patch: Partial<WorkflowRule>) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
    setIsDirty(true);
  };

  // ── Sauvegarde (UPDATE si existantes, INSERT si clonées) ──────────────────
  const handleSave = async () => {
    if (!selectedAssignmentId) return;
    setIsSaving(true);
    try {
      if (isCloned) {
        // INSERT — nouvelles règles spécifiques à ce programme
        const inserts = rules.map(r => ({
          rule_key:       r.rule_key,
          label:          r.label,
          is_active:      r.is_active,
          delay_days:     r.delay_days,
          frequency_days: r.frequency_days,
          channel:        r.channel,
          cc_email:       r.cc_email || null,
          target_email:   r.target_email || null,
          assignment_id:  selectedAssignmentId,
        }));
        const { error } = await supabase.from('training_workflow_rules').insert(inserts);
        if (error) throw error;
        setIsCloned(false);
      } else {
        // UPDATE — règles existantes
        for (const rule of rules) {
          const { error } = await supabase
            .from('training_workflow_rules')
            .update({
              is_active:      rule.is_active,
              delay_days:     rule.delay_days,
              frequency_days: rule.frequency_days,
              cc_email:       rule.cc_email || null,
              target_email:   rule.target_email || null,
            })
            .eq('id', rule.id);
          if (error) throw error;
        }
      }
      toast({ title: '✅ Règles sauvegardées', description: 'Les workflows ont été mis à jour pour ce programme.' });
      setIsDirty(false);
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'rgba(15,12,36,0.7)',
    borderColor: 'rgba(187,165,122,0.25)',
    color: 'white',
    border: '1px solid rgba(187,165,122,0.25)',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: 'pointer',
  };

  return (
    <div className="flex flex-col gap-4 max-w-3xl">

      {/* ── En-tête ── */}
      <div className="mb-1">
        <p className="text-sm text-white font-medium">Règles de relance automatique</p>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(187,165,122,0.5)' }}>
          Configurez les délais et canaux par programme. Les règles globales servent de modèle par défaut.
        </p>
      </div>

      {/* ── Sélecteur de programme ── */}
      <div
        className="rounded-xl border p-4"
        style={{ backgroundColor: 'rgba(30,26,55,0.85)', borderColor: 'rgba(187,165,122,0.2)' }}
      >
        <label className="text-xs block mb-2" style={{ color: 'rgba(187,165,122,0.6)' }}>
          Programme concerné
        </label>
        <select
          value={selectedAssignmentId}
          onChange={e => { setSelectedAssignmentId(e.target.value); setRules([]); setIsDirty(false); }}
          className="w-full rounded-lg px-3 py-2 text-sm outline-none"
          style={selectStyle}
        >
          <option value="">— Sélectionner un programme —</option>
          {assignments.map(a => (
            <option key={a.id} value={a.id}>
              {a.program_name}{a.service ? ` · ${a.service}` : ''}
            </option>
          ))}
        </select>
        {isCloned && selectedAssignmentId && (
          <p className="text-xs mt-2" style={{ color: '#DEAE35' }}>
            ✦ Aucune règle spécifique — modèle global chargé. Sauvegardez pour les personnaliser.
          </p>
        )}
      </div>

      {/* ── État vide : aucun programme sélectionné ── */}
      {!selectedAssignmentId && (
        <div
          className="rounded-xl border p-12 flex flex-col items-center justify-center text-center"
          style={{ borderColor: 'rgba(187,165,122,0.12)', borderStyle: 'dashed', backgroundColor: 'rgba(30,26,55,0.3)' }}
        >
          <Bell className="h-8 w-8 mb-3 opacity-20" style={{ color: '#BBA57A' }} />
          <p className="text-sm text-white opacity-50">Sélectionnez un programme pour configurer ses règles</p>
        </div>
      )}

      {/* ── Loader ── */}
      {selectedAssignmentId && loadingRules && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#BBA57A' }} />
        </div>
      )}

      {/* ── Cartes règles ── */}
      {selectedAssignmentId && !loadingRules && rules.map(rule => {
        const chCfg = CHANNEL_CONFIG[rule.channel] ?? CHANNEL_CONFIG['platform'];
        const isPhone = rule.rule_key === 'relance_service';
        const ChIcon = isPhone ? Phone : chCfg.icon;
        const chColor = isPhone ? '#BBA57A' : chCfg.color;
        const chBg = isPhone ? 'rgba(187,165,122,0.12)' : chCfg.bg;
        const ruleLabel = isPhone ? 'Téléphone de service interne' : rule.label;

        return (
          <div
            key={rule.id}
            className="rounded-xl border transition-all duration-200"
            style={{
              backgroundColor: rule.is_active ? 'rgba(30,26,55,0.9)' : 'rgba(20,17,40,0.6)',
              borderColor: rule.is_active ? 'rgba(187,165,122,0.25)' : 'rgba(187,165,122,0.1)',
              opacity: rule.is_active ? 1 : 0.6,
            }}
          >
            {/* ── Header carte ── */}
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div
                  className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: chBg }}
                >
                  <ChIcon className="h-4 w-4" style={{ color: chColor }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{ruleLabel}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: chBg, color: chColor }}>
                      {isPhone ? 'Téléphone' : chCfg.label}
                    </span>
                    <span className="text-xs" style={{ color: 'rgba(187,165,122,0.45)' }}>
                      {rule.delay_days === 0 ? 'Immédiat' : `J+${rule.delay_days}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Toggle ON/OFF */}
              <button
                onClick={() => updateRule(rule.id, { is_active: !rule.is_active })}
                className="relative h-6 w-11 rounded-full transition-all duration-200 flex-shrink-0"
                style={{ backgroundColor: rule.is_active ? '#BBA57A' : 'rgba(187,165,122,0.15)' }}
              >
                <span
                  className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200"
                  style={{ left: rule.is_active ? '22px' : '2px' }}
                />
              </button>
            </div>

            {/* ── Body carte ── */}
            {rule.is_active && (
              <div
                className="px-5 pb-4 pt-3 flex flex-wrap gap-4"
                style={{ borderTop: '1px solid rgba(187,165,122,0.08)' }}
              >
                {/* Délai J+ */}
                {rule.rule_key !== 'on_create' && rule.rule_key !== 'relance_service' && (
                  <div>
                    <label className="text-xs block mb-1" style={{ color: 'rgba(187,165,122,0.55)' }}>Délai (jours)</label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs" style={{ color: 'rgba(187,165,122,0.5)' }}>J+</span>
                      <input
                        type="number" min={0}
                        value={rule.delay_days}
                        onChange={e => updateRule(rule.id, { delay_days: parseInt(e.target.value) || 0 })}
                        className="w-16 rounded-lg px-2 py-1.5 text-sm outline-none text-center"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                )}

                {/* Fréquence on_create */}
                {rule.rule_key === 'on_create' && (
                  <div>
                    <label className="text-xs block mb-1" style={{ color: 'rgba(187,165,122,0.55)' }}>Rappel tous les (jours)</label>
                    <input
                      type="number" min={1}
                      value={rule.frequency_days ?? 2}
                      onChange={e => updateRule(rule.id, { frequency_days: parseInt(e.target.value) || 1 })}
                      className="w-20 rounded-lg px-2 py-1.5 text-sm outline-none text-center"
                      style={inputStyle}
                    />
                  </div>
                )}

                {/* Téléphone de service interne — rappel uniquement */}
                {rule.rule_key === 'relance_service' && (
                  <div>
                    <label className="text-xs block mb-1" style={{ color: 'rgba(187,165,122,0.55)' }}>Rappel tous les (jours)</label>
                    <input
                      type="number" min={0}
                      value={rule.frequency_days ?? 3}
                      onChange={e => updateRule(rule.id, { frequency_days: parseInt(e.target.value) })}
                      className="w-20 rounded-lg px-2 py-1.5 text-sm outline-none text-center"
                      style={inputStyle}
                    />
                  </div>
                )}

                {/* CC Email → dropdown direction */}
                {rule.rule_key === 'j0_email' && (
                  <div className="flex-1 min-w-48">
                    <label className="text-xs block mb-1" style={{ color: 'rgba(187,165,122,0.55)' }}>CC — Responsable direction</label>
                    <select
                      value={rule.cc_email ?? ''}
                      onChange={e => updateRule(rule.id, { cc_email: e.target.value || null })}
                      className="w-full rounded-lg px-3 py-1.5 text-sm outline-none"
                      style={selectStyle}
                    >
                      <option value="">— Aucun CC —</option>
                      {directionStaff.map(s => {
                        const name = s.full_name || `${s.first_name} ${s.last_name}`;
                        const email = s.email ?? '';
                        return (
                          <option key={s.id} value={email}>
                            {name}{email ? ` · ${email}` : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                {/* Target Email escalade → dropdown direction */}
                {rule.rule_key === 'escalade_manager' && (
                  <div className="flex-1 min-w-48">
                    <label className="text-xs block mb-1" style={{ color: 'rgba(187,165,122,0.55)' }}>Destinataire escalade</label>
                    <select
                      value={rule.target_email ?? ''}
                      onChange={e => updateRule(rule.id, { target_email: e.target.value || null })}
                      className="w-full rounded-lg px-3 py-1.5 text-sm outline-none"
                      style={selectStyle}
                    >
                      <option value="">— Sélectionner —</option>
                      {directionStaff.map(s => {
                        const name = s.full_name || `${s.first_name} ${s.last_name}`;
                        const email = s.email ?? '';
                        return (
                          <option key={s.id} value={email}>
                            {name}{email ? ` · ${email}` : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* ── Bouton Sauvegarder ── */}
      {selectedAssignmentId && !loadingRules && rules.length > 0 && (
        <div className="flex items-center justify-between pt-2">
          {isDirty && (
            <p className="text-xs" style={{ color: '#DEAE35' }}>● Modifications non sauvegardées</p>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="ml-auto flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={{
              backgroundColor: isDirty ? 'rgba(187,165,122,0.2)' : 'rgba(187,165,122,0.06)',
              color: isDirty ? '#BBA57A' : 'rgba(187,165,122,0.25)',
              border: `1px solid ${isDirty ? 'rgba(187,165,122,0.4)' : 'rgba(187,165,122,0.1)'}`,
              cursor: isDirty ? 'pointer' : 'default',
            }}
          >
            {isSaving ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Sauvegarde…</>
            ) : (
              <><CheckCircle2 className="h-4 w-4" /> Sauvegarder les règles</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminTraining() {
  const [activeTab, setActiveTab] = useState<TabId>('bibliotheque');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [search, setSearch] = useState('');
  const [stepFilter, setStepFilter] = useState<StepFilter>('all');
  const [itemToDelete, setItemToDelete] = useState<KnowledgeItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);
  const [isDocViewerOpen, setIsDocViewerOpen] = useState(false);
  const [isQuizzOpen, setIsQuizzOpen] = useState(false);

  const handleOpenItem = (item: KnowledgeItem) => {
    setSelectedItem(item);
    if (item.formation_steps === 'qcm') {
      setIsQuizzOpen(true);
    } else {
      setIsDocViewerOpen(true);
    }
  };

  const handleCloseDocViewer = () => {
    setIsDocViewerOpen(false);
    setSelectedItem(null);
  };

  const handleCloseQuizz = () => {
    setIsQuizzOpen(false);
    setSelectedItem(null);
  };

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ── Data fetch ──────────────────────────────────────────────────────────────
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin_knowledge_queries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_queries')
        .select('id, document_title, document_name, document_url, thematic, summary, average_score, status, formation_steps, kanban_status, related_item_ids, file_name, created_at, updated_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as KnowledgeItem[];
    },
    staleTime: 1000 * 60 * 2,
  });

  // ── KPIs ────────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const total = items.length;
    const formations = items.filter(i => i.formation_steps === 'formation' || i.formation_steps === 'training').length;
    const qcms = items.filter(i => i.formation_steps === 'qcm').length;
    const completed = items.filter(i => i.kanban_status === 'completed').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, formations, qcms, completionRate };
  }, [items]);

  // ── Filter ──────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return items.filter(item => {
      const matchStep = stepFilter === 'all' || item.formation_steps === stepFilter;
      const matchSearch =
        search === '' ||
        item.document_name.toLowerCase().includes(search.toLowerCase()) ||
        item.thematic.toLowerCase().includes(search.toLowerCase());
      return matchStep && matchSearch;
    });
  }, [items, stepFilter, search]);

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('knowledge_queries')
        .delete()
        .eq('id', itemToDelete.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['admin_knowledge_queries'] });
      queryClient.invalidateQueries({ queryKey: ['knowledge_queries'] });
      queryClient.invalidateQueries({ queryKey: ['knowledge_formations'] });
      toast({ title: 'Supprimé', description: `"${itemToDelete.document_name}" a été supprimé.` });
      setItemToDelete(null);
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Tabs config ─────────────────────────────────────────────────────────────
  const TABS: { id: TabId; label: string; icon: React.ElementType; disabled?: boolean }[] = [
    { id: 'bibliotheque', label: 'Bibliothèque', icon: BookOpen },
    { id: 'attribution', label: 'Attribution', icon: Users },
    { id: 'workflows', label: 'Workflows', icon: Bell },
    { id: 'suivi', label: 'Suivi & Retards', icon: BarChart2 },
  ];

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <GraduationCap className="h-6 w-6" style={{ color: '#BBA57A' }} />
            <h1 className="text-2xl font-semibold text-white">Training Administration</h1>
          </div>
          <p className="text-sm" style={{ color: 'rgba(187,165,122,0.5)' }}>
            Bibliothèque de formations · Attribution · Suivi des équipes
          </p>
        </div>

        {/* ── KPI Row ───────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <KpiCard label="Contenus totaux" value={kpis.total} icon={BookOpen} accent="#BBA57A" />
          <KpiCard label="Formations / Trainings" value={kpis.formations} icon={Dumbbell} accent="#E0D3B4" />
          <KpiCard label="QCMs actifs" value={kpis.qcms} icon={Brain} accent="#DEAE35" />
          <KpiCard label="Taux de complétion" value={`${kpis.completionRate}%`} icon={CheckCircle2} accent="#4ade80" />
        </div>

        {/* ── Tab Navigation ────────────────────────────────────────────────── */}
        <div
          className="flex items-center gap-1 p-1 rounded-xl mb-6 w-fit"
          style={{ backgroundColor: 'rgba(15,12,36,0.6)', border: '1px solid rgba(187,165,122,0.12)' }}
        >
          {TABS.map(tab => (
            <TabButton
              key={tab.id}
              {...tab}
              active={activeTab === tab.id}
              onClick={() => !tab.disabled && setActiveTab(tab.id)}
            />
          ))}
        </div>

        {/* ── Tab Content ───────────────────────────────────────────────────── */}

        {/* BIBLIOTHÈQUE */}
        {activeTab === 'bibliotheque' && (
          <>
            {/* Search + Filters + View toggle */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              {/* Search */}
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                  style={{ color: 'rgba(187,165,122,0.45)' }}
                />
                <Input
                  placeholder="Rechercher par titre ou thématique…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 h-9 text-sm border-0 text-white placeholder:text-white/30 focus-visible:ring-1"
                  style={{
                    backgroundColor: 'rgba(30,26,55,0.8)',
                    borderColor: 'rgba(187,165,122,0.2)',
                    '--tw-ring-color': '#BBA57A',
                  } as React.CSSProperties}
                />
              </div>

              {/* Type filter pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {(['all', 'formation', 'training', 'qcm', 'practice'] as StepFilter[]).map(f => {
                  const isActive = stepFilter === f;
                  const cfg = f !== 'all' ? getStepConfig(f) : null;
                  return (
                    <button
                      key={f}
                      onClick={() => setStepFilter(f)}
                      className="px-3 py-1 rounded-full text-xs font-medium transition-all duration-150"
                      style={{
                        backgroundColor: isActive
                          ? cfg ? cfg.bg : 'rgba(187,165,122,0.18)'
                          : 'rgba(30,26,55,0.6)',
                        color: isActive
                          ? cfg ? cfg.color : '#BBA57A'
                          : 'rgba(187,165,122,0.45)',
                        border: `1px solid ${isActive ? (cfg ? cfg.border : 'rgba(187,165,122,0.4)') : 'rgba(187,165,122,0.12)'}`,
                      }}
                    >
                      {f === 'all' ? 'Tous' : getStepConfig(f).label}
                    </button>
                  );
                })}
              </div>

              {/* View mode */}
              <div
                className="flex items-center rounded-lg p-0.5 flex-shrink-0"
                style={{ backgroundColor: 'rgba(15,12,36,0.6)', border: '1px solid rgba(187,165,122,0.12)' }}
              >
                {([['grid', LayoutGrid], ['list', List]] as [ViewMode, React.ElementType][]).map(
                  ([mode, Icon]) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className="h-7 w-7 rounded-md flex items-center justify-center transition-all"
                      style={{
                        backgroundColor: viewMode === mode ? 'rgba(187,165,122,0.2)' : 'transparent',
                        color: viewMode === mode ? '#BBA57A' : 'rgba(187,165,122,0.35)',
                      }}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </button>
                  ),
                )}
              </div>
            </div>

            {/* Count */}
            <p className="text-xs mb-4" style={{ color: 'rgba(187,165,122,0.4)' }}>
              {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
              {search || stepFilter !== 'all' ? ' (filtrés)' : ''}
            </p>

            {/* Content */}
            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#BBA57A' }} />
              </div>
            ) : filtered.length === 0 ? (
              <div
                className="rounded-xl border p-14 flex flex-col items-center justify-center text-center"
                style={{
                  backgroundColor: 'rgba(30,26,55,0.4)',
                  borderColor: 'rgba(187,165,122,0.12)',
                  borderStyle: 'dashed',
                }}
              >
                <BookOpen className="h-10 w-10 mb-3 opacity-20" style={{ color: '#BBA57A' }} />
                <p className="text-white font-medium mb-1">Aucun contenu trouvé</p>
                <p className="text-xs" style={{ color: 'rgba(187,165,122,0.4)' }}>
                  {search ? 'Essayez une autre recherche' : 'Créez votre premier contenu via le bouton +'}
                </p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map(item => (
                  <ItemCard key={item.id} item={item} onDelete={setItemToDelete} onOpen={handleOpenItem} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {/* List header */}
                <div
                  className="hidden sm:grid grid-cols-[auto_1fr_120px_60px_90px_80px] gap-4 px-4 py-2 rounded-lg"
                  style={{ backgroundColor: 'rgba(15,12,36,0.5)' }}
                >
                  {['', 'Titre', 'Type', 'Score', 'Statut', ''].map((h, i) => (
                    <span
                      key={i}
                      className="text-xs font-medium"
                      style={{ color: 'rgba(187,165,122,0.45)' }}
                    >
                      {h}
                    </span>
                  ))}
                </div>
                {filtered.map(item => (
                  <ItemRow key={item.id} item={item} onDelete={setItemToDelete} onOpen={handleOpenItem} />
                ))}
              </div>
            )}
          </>
        )}

        {/* STUBS PROCHAINS ONGLETS */}
        {activeTab === 'attribution' && (
          <TabAttribution items={items} />
        )}
        {activeTab === 'suivi' && (
          <TabSuivi items={items} />
        )}
        {activeTab === 'workflows' && (
          <TabWorkflows />
        )}
      </div>

      {/* ── DocumentViewerModal ────────────────────────────────────────────── */}
      <DocumentViewerModal
        isOpen={isDocViewerOpen}
        onClose={handleCloseDocViewer}
        document={selectedItem ? {
          id: selectedItem.id,
          document_title: selectedItem.document_title,
          document_name: selectedItem.document_name,
          document_url: selectedItem.document_url ?? '',
          topic: selectedItem.thematic,
          formation_steps: selectedItem.formation_steps,
          created_at: selectedItem.created_at,
        } : null}
      />

      {/* ── QuizzModal ──────────────────────────────────────────────────────── */}
      <QuizzModal
        isOpen={isQuizzOpen}
        onClose={handleCloseQuizz}
        title={selectedItem ? `Quiz : ${selectedItem.thematic}` : 'Quiz'}
        selectedTask={selectedItem}
      />

      {/* ── Floating buttons (réutilise le composant existant) ─────────────── */}
      <UploadTraining />

      {/* ── Delete confirm dialog ──────────────────────────────────────────── */}
      <AlertDialog open={!!itemToDelete} onOpenChange={open => !open && setItemToDelete(null)}>
        <AlertDialogContent
          style={{ backgroundColor: '#1E1A37', border: '1px solid rgba(187,165,122,0.25)' }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              Supprimer ce contenu ?
            </AlertDialogTitle>
            <AlertDialogDescription style={{ color: 'rgba(187,165,122,0.6)' }}>
              <span className="text-white font-medium">"{itemToDelete?.document_name}"</span> sera
              définitivement supprimé. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border text-white hover:bg-white/10"
              style={{ backgroundColor: 'transparent', borderColor: 'rgba(187,165,122,0.3)' }}
            >
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Suppression...</>
              ) : (
                'Supprimer définitivement'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}

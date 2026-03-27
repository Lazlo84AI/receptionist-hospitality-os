import { useState, useMemo } from 'react';
import { AdminLayout } from './AdminLayout';
import { AssistantFloatingRAGUpload } from '@/components/AssistantFloatingRAGUpload';
import { Input } from '@/components/ui/input';
import {
  Brain,
  BookOpen,
  HelpCircle,
  Hammer,
  Search,
  LayoutGrid,
  List,
  Loader2,
  AlertTriangle,
  Trash2,
  FileText,
  Clock,
  CheckCircle2,
  RefreshCw,
  Star,
  Flag,
  AlertCircle,
  Upload,
  X,
  ChevronRight,
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
import { Button } from '@/components/ui/button';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AssistantDocument {
  id: string;
  document_name: string;
  file_name: string;
  document_url: string | null;
  thematic: string | null;
  status: string;
  uploaded_at: string;
  uploaded_by: string | null;
}

interface UnansweredQuestion {
  id: string;
  question: string;
  answer: string;
  confidence: 'high' | 'medium' | 'bad';
  feedback_rating: number | null;
  needs_review: boolean | null;
  created_at: string;
}

type TabId = 'bibliotheque' | 'questions' | 'construction';
type ViewMode = 'grid' | 'list';
type WordViewMode = 'cards' | 'cloud';
type ThematicFilter = 'all' | 'housekeeping' | 'reception' | 'maintenance' | 'security' | 'fb' | 'customer_experience';

// ─── Config thématiques ───────────────────────────────────────────────────────

const THEMATIC_CONFIG: Record<string, {
  label: string; color: string; bg: string; border: string;
  emoji: string; gradient: string; iconBg: string;
}> = {
  // ── Charte Sokle : 5 couleurs officielles + teal prestige (6e) ──
  // Navy #1E1A37 · Gold #BBA57A · Yellow #DEAE35 · Sand #E0D3B4 · White #FFFFFF · Teal #0d3d3d
  housekeeping: {
    // Navy pur : sobre, propre, structuré — distinct du Gold/Sand
    label: 'Housekeeping', color: '#8b83b8', bg: 'rgba(139,131,184,0.12)', border: 'rgba(139,131,184,0.35)',
    emoji: '🧹', gradient: 'linear-gradient(135deg, #2d2850 0%, #1E1A37 100%)', iconBg: 'rgba(139,131,184,0.2)',
  },
  reception: {
    // Lie de vin : ultra premium, service haut de gamme, hospitalité de luxe
    label: 'Réception', color: '#c4637a', bg: 'rgba(196,99,122,0.12)', border: 'rgba(196,99,122,0.4)',
    emoji: '🛎️', gradient: 'linear-gradient(135deg, #5a1428 0%, #2e0a14 100%)', iconBg: 'rgba(196,99,122,0.22)',
  },
  maintenance: {
    // Sand foncé : terrain, matière, infrastructure physique
    label: 'Maintenance', color: '#E0D3B4', bg: 'rgba(224,211,180,0.12)', border: 'rgba(224,211,180,0.35)',
    emoji: '🔧', gradient: 'linear-gradient(135deg, #4a3c28 0%, #241d12 100%)', iconBg: 'rgba(224,211,180,0.2)',
  },
  security: {
    // Navy teinté sombre : vigilance, rigueur, autorité
    label: 'Sécurité', color: '#DEAE35', bg: 'rgba(222,174,53,0.10)', border: 'rgba(222,174,53,0.35)',
    emoji: '🔒', gradient: 'linear-gradient(135deg, #1a1030 0%, #100820 100%)', iconBg: 'rgba(222,174,53,0.18)',
  },
  fb: {
    // Yellow foncé : chaleur, gastronomie, appétit
    label: 'F&B', color: '#DEAE35', bg: 'rgba(222,174,53,0.10)', border: 'rgba(222,174,53,0.35)',
    emoji: '🍽️', gradient: 'linear-gradient(135deg, #7a5e10 0%, #3d2f08 100%)', iconBg: 'rgba(222,174,53,0.2)',
  },
  customer_experience: {
    // Teal prestige : luxe hôtelier, bien-être, spa — cohérent charte (froid noble vs navy chaud)
    label: 'Expérience client', color: '#5fb3b3', bg: 'rgba(95,179,179,0.10)', border: 'rgba(95,179,179,0.35)',
    emoji: '⭐', gradient: 'linear-gradient(135deg, #0d3d3d 0%, #061f1f 100%)', iconBg: 'rgba(95,179,179,0.2)',
  },
};

const FALLBACK_THEMATIC = {
  label: 'Général', color: '#BBA57A', bg: 'rgba(187,165,122,0.12)', border: 'rgba(187,165,122,0.3)',
  emoji: '📄', gradient: 'linear-gradient(135deg, #1e1a37 0%, #0f0d1f 100%)', iconBg: 'rgba(187,165,122,0.15)',
};

const getThematicConfig = (thematic: string | null) =>
  THEMATIC_CONFIG[thematic ?? ''] ?? { ...FALLBACK_THEMATIC, label: thematic ?? 'Général' };

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  completed: { label: 'Indexé', color: '#6ee7b7', icon: CheckCircle2 },
  processing: { label: 'En traitement', color: '#DEAE35', icon: RefreshCw },
  error: { label: 'Erreur', color: '#f87171', icon: AlertTriangle },
};

const getStatusConfig = (status: string) => STATUS_CONFIG[status] ?? STATUS_CONFIG['processing'];

// ─── Détecter la "raison" d'une question sans réponse ─────────────────────────

function getQuestionReason(q: UnansweredQuestion): { label: string; color: string; bg: string; icon: React.ElementType } {
  if (q.confidence === 'bad') return { label: 'Pas de source', color: '#f87171', bg: 'rgba(248,113,113,0.15)', icon: AlertCircle };
  if (q.feedback_rating !== null && q.feedback_rating <= 3) return { label: `Note ${q.feedback_rating}★`, color: '#DEAE35', bg: 'rgba(222,174,53,0.15)', icon: Star };
  return { label: 'À réviser', color: '#a5b4fc', bg: 'rgba(165,180,252,0.15)', icon: Flag };
}

// ─── Tab Button ───────────────────────────────────────────────────────────────

function TabButton({ label, icon: Icon, active, onClick, disabled }: {
  label: string; icon: React.ElementType; active: boolean; onClick: () => void; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn('flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
        active ? 'text-white' : disabled ? 'opacity-30 cursor-not-allowed' : 'hover:text-white/80')}
      style={active ? { backgroundColor: 'rgba(187,165,122,0.18)', color: '#BBA57A' } : { color: 'rgba(187,165,122,0.45)' }}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

// ─── Document Card (Grid) ─────────────────────────────────────────────────────

function DocumentCard({ doc, onDelete }: { doc: AssistantDocument; onDelete: (doc: AssistantDocument) => void }) {
  const thematic = getThematicConfig(doc.thematic);
  const statusCfg = getStatusConfig(doc.status);
  const StatusIcon = statusCfg.icon;

  return (
    <div
      className="rounded-2xl flex flex-col overflow-hidden transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl group relative cursor-default"
      style={{ background: thematic.gradient, border: `1px solid ${thematic.border}` }}
    >
      {/* Zone icône + bouton delete */}
      <div className="flex items-start justify-between p-4 pb-2">
        <div
          className="h-11 w-11 rounded-xl flex items-center justify-center text-2xl shadow-lg"
          style={{ backgroundColor: thematic.iconBg, backdropFilter: 'blur(4px)' }}
        >
          {thematic.emoji}
        </div>
        <button
          onClick={() => onDelete(doc)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg backdrop-blur-sm"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)', color: '#fca5a5' }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Nom */}
      <div className="px-4 pb-3 flex-1">
        <p className="font-bold text-white text-sm leading-snug line-clamp-2 drop-shadow-sm">
          {doc.document_name}
        </p>
      </div>

      {/* Footer badges */}
      <div className="px-4 pb-4 flex items-center justify-between gap-2 flex-wrap">
        <span
          className="text-xs px-2.5 py-1 rounded-full font-semibold"
          style={{ backgroundColor: thematic.iconBg, color: thematic.color, backdropFilter: 'blur(4px)' }}
        >
          {thematic.label}
        </span>
        <span className="flex items-center gap-1 text-xs font-medium" style={{ color: statusCfg.color }}>
          <StatusIcon className="h-3 w-3" />
          {statusCfg.label}
        </span>
      </div>

      {/* Date en bas */}
      <div
        className="px-4 py-2 flex items-center gap-1.5"
        style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.08)' }}
      >
        <Clock className="h-3 w-3" style={{ color: 'rgba(255,255,255,0.4)' }} />
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
          {new Date(doc.uploaded_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
      </div>
    </div>
  );
}

// ─── Document Row (List) ──────────────────────────────────────────────────────

function DocumentRow({ doc, onDelete }: { doc: AssistantDocument; onDelete: (doc: AssistantDocument) => void }) {
  const thematic = getThematicConfig(doc.thematic);
  const statusCfg = getStatusConfig(doc.status);
  const StatusIcon = statusCfg.icon;

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 hover:border-[#BBA57A]/30 group"
      style={{ backgroundColor: 'rgba(30,26,55,0.85)', borderColor: 'rgba(187,165,122,0.15)' }}>
      <div className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(187,165,122,0.12)' }}>
        <Brain className="h-4 w-4" style={{ color: '#BBA57A' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white text-sm truncate">{doc.document_name}</p>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(187,165,122,0.45)' }}>{doc.file_name}</p>
      </div>
      <span className="text-xs px-2.5 py-1 rounded-full font-medium border flex-shrink-0"
        style={{ color: thematic.color, backgroundColor: thematic.bg, borderColor: thematic.border }}>
        {thematic.label}
      </span>
      <span className="flex items-center gap-1.5 text-xs flex-shrink-0" style={{ color: statusCfg.color }}>
        <StatusIcon className="h-3.5 w-3.5" />
        {statusCfg.label}
      </span>
      <p className="text-xs flex-shrink-0" style={{ color: 'rgba(187,165,122,0.45)' }}>
        {new Date(doc.uploaded_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
      </p>
      <button onClick={() => onDelete(doc)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 hover:text-red-300 flex-shrink-0">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Question Card (fond gold) ────────────────────────────────────────────────

function QuestionCard({ q, selected, onToggle }: {
  q: UnansweredQuestion; selected: boolean; onToggle: (id: string) => void;
}) {
  const reason = getQuestionReason(q);
  const ReasonIcon = reason.icon;

  return (
    <div
      onClick={() => onToggle(q.id)}
      className={cn(
        'rounded-xl p-4 cursor-pointer transition-all duration-200 flex flex-col gap-3 relative',
        selected ? 'ring-2 ring-white scale-[1.02]' : 'hover:scale-[1.01]',
      )}
      style={{ backgroundColor: selected ? '#C9B48A' : '#BBA57A' }}
    >
      {/* Checkbox */}
      <div className={cn(
        'absolute top-3 right-3 h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all',
        selected ? 'bg-[#1E1A37] border-[#1E1A37]' : 'bg-white/30 border-white/60'
      )}>
        {selected && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
      </div>

      {/* Badge raison */}
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full w-fit"
        style={{ backgroundColor: reason.bg, color: reason.color }}>
        <ReasonIcon className="h-3 w-3" />
        {reason.label}
      </span>

      {/* Question */}
      <p className="text-sm font-semibold leading-snug line-clamp-3 pr-6" style={{ color: '#1E1A37' }}>
        {q.question}
      </p>

      {/* Date */}
      <p className="text-xs mt-auto" style={{ color: 'rgba(30,26,55,0.55)' }}>
        <Clock className="h-3 w-3 inline mr-1" />
        {new Date(q.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
      </p>
    </div>
  );
}

// ─── Word Cloud ───────────────────────────────────────────────────────────────

function WordCloud({ questions, selectedIds, onToggle }: {
  questions: UnansweredQuestion[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  // Variations déterministes basées sur l'index
  const items = questions.map((q, i) => {
    const sizes = [14, 16, 18, 20, 22, 24, 13, 15, 17, 19];
    const rotations = [-8, -4, 0, 4, 8, -6, 6, -2, 2, -10];
    const opacities = [0.7, 0.85, 1, 0.9, 0.75, 0.95, 0.8, 1, 0.7, 0.9];
    return {
      ...q,
      fontSize: sizes[i % sizes.length],
      rotation: rotations[i % rotations.length],
      opacity: opacities[i % opacities.length],
    };
  });

  return (
    <div className="rounded-xl border p-8 min-h-[400px] flex flex-wrap gap-3 items-center justify-center"
      style={{ backgroundColor: 'rgba(30,26,55,0.6)', borderColor: 'rgba(187,165,122,0.15)' }}>
      {items.map((item) => {
        const isSelected = selectedIds.has(item.id);
        const reason = getQuestionReason(item);
        return (
          <button
            key={item.id}
            onClick={() => onToggle(item.id)}
            title={item.question}
            className={cn(
              'px-3 py-1.5 rounded-lg font-medium transition-all duration-200 max-w-[220px] truncate',
              isSelected ? 'ring-2 ring-white scale-105' : 'hover:scale-105',
            )}
            style={{
              fontSize: `${item.fontSize}px`,
              transform: `rotate(${item.rotation}deg)`,
              opacity: isSelected ? 1 : item.opacity,
              backgroundColor: isSelected ? '#BBA57A' : `${reason.color}22`,
              color: isSelected ? '#1E1A37' : reason.color,
              border: `1px solid ${isSelected ? '#BBA57A' : reason.color}55`,
            }}
          >
            {item.question.length > 40 ? item.question.slice(0, 40) + '…' : item.question}
          </button>
        );
      })}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function KnowledgeAssistance() {
  const [activeTab, setActiveTab] = useState<TabId>('bibliotheque');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [wordViewMode, setWordViewMode] = useState<WordViewMode>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [questionSearch, setQuestionSearch] = useState('');
  const [thematicFilter, setThematicFilter] = useState<ThematicFilter>('all');
  const [docToDelete, setDocToDelete] = useState<AssistantDocument | null>(null);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
  const [constructionContent, setConstructionContent] = useState('');
  const [constructionTitle, setConstructionTitle] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ── Query documents ──
  const { data: documents = [], isLoading: docsLoading } = useQuery({
    queryKey: ['assistant_documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assistant_documents')
        .select('id, document_name, file_name, document_url, thematic, status, uploaded_at, uploaded_by')
        .order('uploaded_at', { ascending: false });
      if (error) throw error;
      return data as AssistantDocument[];
    },
  });

  // ── Query questions sans réponse ──
  const { data: unansweredQuestions = [], isLoading: questionsLoading } = useQuery({
    queryKey: ['unanswered_questions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assistant_conversations')
        .select('id, question, answer, confidence, feedback_rating, needs_review, created_at')
        .or('confidence.eq.bad,needs_review.eq.true')
        .order('created_at', { ascending: false });
      if (error) throw error;
      // Inclure aussi feedback_rating <= 3 (Supabase OR avec filtre numérique)
      const { data: lowRated, error: err2 } = await supabase
        .from('assistant_conversations')
        .select('id, question, answer, confidence, feedback_rating, needs_review, created_at')
        .not('feedback_rating', 'is', null)
        .lte('feedback_rating', 3)
        .order('created_at', { ascending: false });
      if (err2) throw err2;

      // Fusionner + dédupliquer par id
      const all = [...(data || []), ...(lowRated || [])];
      const unique = Object.values(
        all.reduce((acc: Record<string, any>, q: any) => {
          acc[q.id] = q;
          return acc;
        }, {})
      );
      return unique as UnansweredQuestion[];
    },
  });

  // ── Filtres documents ──
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const matchSearch = doc.document_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchThematic = thematicFilter === 'all' || doc.thematic === thematicFilter;
      return matchSearch && matchThematic;
    });
  }, [documents, searchQuery, thematicFilter]);

  // ── Filtres questions ──
  const filteredQuestions = useMemo(() => {
    return unansweredQuestions.filter((q) =>
      q.question.toLowerCase().includes(questionSearch.toLowerCase())
    );
  }, [unansweredQuestions, questionSearch]);

  // ── Questions sélectionnées (objets complets) ──
  const selectedQuestions = useMemo(() =>
    unansweredQuestions.filter((q) => selectedQuestionIds.has(q.id)),
    [unansweredQuestions, selectedQuestionIds]
  );

  // ── Toggle sélection ──
  const toggleQuestion = (id: string) => {
    setSelectedQuestionIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Suppression document ──
  const handleDelete = async () => {
    if (!docToDelete) return;
    try {
      const { error } = await supabase.from('assistant_documents').delete().eq('id', docToDelete.id);
      if (error) throw error;
      toast({ title: '🗑️ Document supprimé', description: docToDelete.document_name });
      queryClient.invalidateQueries({ queryKey: ['assistant_documents'] });
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setDocToDelete(null);
    }
  };

  // ── Passer à l'onglet construction ──
  const goToConstruction = () => {
    // Pré-remplir avec les questions sélectionnées
    const questionsList = selectedQuestions.map((q, i) => `${i + 1}. ${q.question}`).join('\n');
    setConstructionContent(`Questions à traiter :\n${questionsList}\n\n---\n\nVotre réponse ici...`);
    setActiveTab('construction');
  };

  const THEMATIC_FILTERS: { id: ThematicFilter; label: string }[] = [
    { id: 'all', label: 'Tous' },
    { id: 'housekeeping', label: 'Housekeeping' },
    { id: 'reception', label: 'Réception' },
    { id: 'maintenance', label: 'Maintenance' },
    { id: 'security', label: 'Sécurité' },
    { id: 'fb', label: 'F&B' },
    { id: 'customer_experience', label: 'Expérience client' },
  ];

  return (
    <AdminLayout>
      <div className="p-8 max-w-6xl mx-auto">

        {/* ── Header ── */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-1">
            <Brain className="h-6 w-6" style={{ color: '#BBA57A' }} />
            <h1 className="text-2xl font-semibold text-white">Knowledge Assistance</h1>
          </div>
          <p className="text-sm" style={{ color: 'rgba(187,165,122,0.55)' }}>
            Gestion de la base de connaissances et de l'IA documentaire
          </p>
        </div>

        {/* ── Tabs ── */}
        <div className="flex items-center gap-1 p-1 rounded-xl mb-8 w-fit"
          style={{ backgroundColor: 'rgba(30,26,55,0.9)', border: '1px solid rgba(187,165,122,0.15)' }}>
          <TabButton label="Bibliothèque" icon={BookOpen} active={activeTab === 'bibliotheque'} onClick={() => setActiveTab('bibliotheque')} />
          <TabButton
            label={`Questions sans réponse${unansweredQuestions.length > 0 ? ` (${unansweredQuestions.length})` : ''}`}
            icon={HelpCircle}
            active={activeTab === 'questions'}
            onClick={() => setActiveTab('questions')}
          />
          <TabButton
            label={`Construction${selectedQuestions.length > 0 ? ` (${selectedQuestions.length})` : ''}`}
            icon={Hammer}
            active={activeTab === 'construction'}
            onClick={() => setActiveTab('construction')}
          />
        </div>

        {/* ══════════════════ ONGLET BIBLIOTHÈQUE ══════════════════ */}
        {activeTab === 'bibliotheque' && (
          <div className="space-y-5">
            {/* Barre recherche + toggle vue */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'rgba(187,165,122,0.5)' }} />
                <Input
                  placeholder="Rechercher par titre ou thématique..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-0 focus-visible:ring-1"
                  style={{ backgroundColor: 'rgba(30,26,55,0.9)', color: 'white', borderColor: 'rgba(187,165,122,0.2)' }}
                />
              </div>
              <div className="flex items-center gap-1 p-1 rounded-lg"
                style={{ backgroundColor: 'rgba(30,26,55,0.9)', border: '1px solid rgba(187,165,122,0.15)' }}>
                <button onClick={() => setViewMode('grid')}
                  className={cn('p-1.5 rounded transition-colors', viewMode === 'grid' ? 'text-white' : 'text-[#BBA57A]/40 hover:text-[#BBA57A]/70')}
                  style={viewMode === 'grid' ? { backgroundColor: 'rgba(187,165,122,0.18)' } : {}}>
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button onClick={() => setViewMode('list')}
                  className={cn('p-1.5 rounded transition-colors', viewMode === 'list' ? 'text-white' : 'text-[#BBA57A]/40 hover:text-[#BBA57A]/70')}
                  style={viewMode === 'list' ? { backgroundColor: 'rgba(187,165,122,0.18)' } : {}}>
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Filtres thématiques */}
            <div className="flex flex-wrap gap-2">
              {THEMATIC_FILTERS.map((f) => (
                <button key={f.id} onClick={() => setThematicFilter(f.id)}
                  className="px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200"
                  style={thematicFilter === f.id
                    ? { backgroundColor: '#BBA57A', color: '#1E1A37', borderColor: '#BBA57A' }
                    : { backgroundColor: 'transparent', color: 'rgba(187,165,122,0.7)', borderColor: 'rgba(187,165,122,0.3)' }}>
                  {f.label}
                </button>
              ))}
            </div>

            <p className="text-xs" style={{ color: 'rgba(187,165,122,0.5)' }}>
              {filteredDocs.length} résultat{filteredDocs.length !== 1 ? 's' : ''}
            </p>

            {docsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#BBA57A' }} />
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="rounded-xl border p-16 flex flex-col items-center justify-center text-center"
                style={{ backgroundColor: 'rgba(30,26,55,0.5)', borderColor: 'rgba(187,165,122,0.15)', borderStyle: 'dashed' }}>
                <FileText className="h-12 w-12 mb-4 opacity-30" style={{ color: '#BBA57A' }} />
                <p className="text-white font-medium mb-1">Aucun document trouvé</p>
                <p className="text-sm" style={{ color: 'rgba(187,165,122,0.45)' }}>
                  {searchQuery || thematicFilter !== 'all' ? 'Modifiez vos filtres' : 'Chargez votre premier document via le bouton en bas à droite'}
                </p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredDocs.map((doc) => <DocumentCard key={doc.id} doc={doc} onDelete={setDocToDelete} />)}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredDocs.map((doc) => <DocumentRow key={doc.id} doc={doc} onDelete={setDocToDelete} />)}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════ ONGLET QUESTIONS SANS RÉPONSE ══════════════════ */}
        {activeTab === 'questions' && (
          <div className="space-y-5">

            {/* Toolbar */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'rgba(187,165,122,0.5)' }} />
                <Input
                  placeholder="Rechercher dans les questions..."
                  value={questionSearch}
                  onChange={(e) => setQuestionSearch(e.target.value)}
                  className="pl-10 border-0 focus-visible:ring-1"
                  style={{ backgroundColor: 'rgba(30,26,55,0.9)', color: 'white', borderColor: 'rgba(187,165,122,0.2)' }}
                />
              </div>

              {/* Toggle cartes / nuage */}
              <div className="flex items-center gap-1 p-1 rounded-lg"
                style={{ backgroundColor: 'rgba(30,26,55,0.9)', border: '1px solid rgba(187,165,122,0.15)' }}>
                <button onClick={() => setWordViewMode('cards')}
                  className={cn('p-1.5 rounded transition-colors', wordViewMode === 'cards' ? 'text-white' : 'text-[#BBA57A]/40 hover:text-[#BBA57A]/70')}
                  style={wordViewMode === 'cards' ? { backgroundColor: 'rgba(187,165,122,0.18)' } : {}}>
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button onClick={() => setWordViewMode('cloud')}
                  className={cn('px-2 py-1.5 rounded transition-colors text-xs font-medium', wordViewMode === 'cloud' ? 'text-white' : 'text-[#BBA57A]/40 hover:text-[#BBA57A]/70')}
                  style={wordViewMode === 'cloud' ? { backgroundColor: 'rgba(187,165,122,0.18)' } : {}}>
                  ☁
                </button>
              </div>

              {/* Bouton construire (actif si sélection) */}
              {selectedQuestionIds.size > 0 && (
                <Button
                  onClick={goToConstruction}
                  className="flex items-center gap-2 text-sm font-semibold"
                  style={{ backgroundColor: '#1E1A37', color: '#BBA57A', border: '1px solid #BBA57A' }}
                >
                  <Hammer className="h-4 w-4" />
                  Construire une réponse ({selectedQuestionIds.size})
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Légende */}
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5 text-xs" style={{ color: '#f87171' }}>
                <AlertCircle className="h-3.5 w-3.5" /> Pas de source Qdrant
              </span>
              <span className="flex items-center gap-1.5 text-xs" style={{ color: '#DEAE35' }}>
                <Star className="h-3.5 w-3.5" /> Note ≤ 3 étoiles
              </span>
              <span className="flex items-center gap-1.5 text-xs" style={{ color: '#a5b4fc' }}>
                <Flag className="h-3.5 w-3.5" /> Flaggé à réviser
              </span>
              <span className="text-xs ml-auto" style={{ color: 'rgba(187,165,122,0.5)' }}>
                {filteredQuestions.length} question{filteredQuestions.length !== 1 ? 's' : ''}
                {selectedQuestionIds.size > 0 && ` · ${selectedQuestionIds.size} sélectionnée${selectedQuestionIds.size > 1 ? 's' : ''}`}
              </span>
            </div>

            {questionsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#BBA57A' }} />
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="rounded-xl border p-16 flex flex-col items-center justify-center text-center"
                style={{ backgroundColor: 'rgba(30,26,55,0.5)', borderColor: 'rgba(187,165,122,0.15)', borderStyle: 'dashed' }}>
                <HelpCircle className="h-12 w-12 mb-4 opacity-30" style={{ color: '#BBA57A' }} />
                <p className="text-white font-medium mb-1">Aucune question sans réponse</p>
                <p className="text-sm" style={{ color: 'rgba(187,165,122,0.45)' }}>
                  Toutes les questions ont eu des réponses satisfaisantes 🎉
                </p>
              </div>
            ) : wordViewMode === 'cards' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredQuestions.map((q) => (
                  <QuestionCard key={q.id} q={q} selected={selectedQuestionIds.has(q.id)} onToggle={toggleQuestion} />
                ))}
              </div>
            ) : (
              <WordCloud questions={filteredQuestions} selectedIds={selectedQuestionIds} onToggle={toggleQuestion} />
            )}

            {/* Barre flottante de sélection */}
            {selectedQuestionIds.size > 0 && (
              <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl"
                style={{ backgroundColor: '#1E1A37', border: '1.5px solid #BBA57A' }}>
                <span className="text-sm font-medium" style={{ color: '#BBA57A' }}>
                  {selectedQuestionIds.size} question{selectedQuestionIds.size > 1 ? 's' : ''} sélectionnée{selectedQuestionIds.size > 1 ? 's' : ''}
                </span>
                <button onClick={() => setSelectedQuestionIds(new Set())}
                  className="p-1 rounded hover:bg-white/10 transition-colors" style={{ color: 'rgba(187,165,122,0.6)' }}>
                  <X className="h-4 w-4" />
                </button>
                <Button onClick={goToConstruction} size="sm"
                  className="flex items-center gap-2 font-semibold"
                  style={{ backgroundColor: '#BBA57A', color: '#1E1A37' }}>
                  <Hammer className="h-4 w-4" />
                  Construire une réponse
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════ ONGLET CONSTRUCTION ══════════════════ */}
        {activeTab === 'construction' && (
          <div className="space-y-6">

            {/* Questions de contexte */}
            {selectedQuestions.length > 0 && (
              <div className="rounded-xl border p-5 space-y-3"
                style={{ backgroundColor: 'rgba(187,165,122,0.08)', borderColor: 'rgba(187,165,122,0.3)' }}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold" style={{ color: '#BBA57A' }}>
                    📌 Questions à traiter ({selectedQuestions.length})
                  </p>
                  <button onClick={() => setSelectedQuestionIds(new Set())}
                    className="text-xs px-2.5 py-1 rounded-lg transition-colors hover:bg-white/10"
                    style={{ color: 'rgba(187,165,122,0.6)' }}>
                    Vider la sélection
                  </button>
                </div>
                <div className="space-y-2">
                  {selectedQuestions.map((q, i) => {
                    const reason = getQuestionReason(q);
                    const ReasonIcon = reason.icon;
                    return (
                      <div key={q.id} className="flex items-start gap-3 p-3 rounded-lg"
                        style={{ backgroundColor: 'rgba(30,26,55,0.6)' }}>
                        <span className="text-xs font-bold mt-0.5" style={{ color: 'rgba(187,165,122,0.5)' }}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <p className="text-sm text-white flex-1 leading-snug">{q.question}</p>
                        <span className="flex items-center gap-1 text-xs flex-shrink-0" style={{ color: reason.color }}>
                          <ReasonIcon className="h-3 w-3" />
                          {reason.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedQuestions.length === 0 && (
              <div className="rounded-xl border p-5 flex items-center gap-3"
                style={{ backgroundColor: 'rgba(30,26,55,0.5)', borderColor: 'rgba(187,165,122,0.15)', borderStyle: 'dashed' }}>
                <HelpCircle className="h-5 w-5 flex-shrink-0" style={{ color: 'rgba(187,165,122,0.4)' }} />
                <p className="text-sm" style={{ color: 'rgba(187,165,122,0.5)' }}>
                  Sélectionnez des questions dans l'onglet "Questions sans réponse" pour les traiter ici.
                </p>
                <button onClick={() => setActiveTab('questions')}
                  className="ml-auto text-xs px-3 py-1.5 rounded-lg font-medium flex-shrink-0 transition-colors hover:opacity-80"
                  style={{ backgroundColor: 'rgba(187,165,122,0.15)', color: '#BBA57A' }}>
                  Aller aux questions →
                </button>
              </div>
            )}

            {/* Titre du document */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">
                Titre du document de connaissance <span className="text-red-400">*</span>
              </label>
              <Input
                placeholder="Ex: Procédure gestion conflits clients..."
                value={constructionTitle}
                onChange={(e) => setConstructionTitle(e.target.value)}
                className="border-0 focus-visible:ring-1 focus-visible:ring-[#BBA57A]"
                style={{ backgroundColor: 'rgba(30,26,55,0.9)', color: 'white', borderColor: 'rgba(187,165,122,0.2)' }}
              />
            </div>

            {/* Éditeur de contenu */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">
                Contenu de la réponse / document
              </label>
              <textarea
                value={constructionContent}
                onChange={(e) => setConstructionContent(e.target.value)}
                placeholder="Rédigez ici la réponse ou le document de connaissance qui sera chargé dans le RAG..."
                rows={14}
                className="w-full rounded-xl p-4 text-sm leading-relaxed resize-none outline-none transition-all focus:ring-1 focus:ring-[#BBA57A]"
                style={{
                  backgroundColor: 'rgba(30,26,55,0.9)',
                  color: 'white',
                  border: '1px solid rgba(187,165,122,0.2)',
                }}
              />
              <p className="text-xs text-right" style={{ color: 'rgba(187,165,122,0.4)' }}>
                {constructionContent.length} caractères
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => { setConstructionContent(''); setConstructionTitle(''); }}
                className="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
                style={{ backgroundColor: 'rgba(30,26,55,0.8)', color: 'rgba(187,165,122,0.7)', border: '1px solid rgba(187,165,122,0.2)' }}>
                Effacer
              </button>
              <Button
                disabled={!constructionContent.trim() || !constructionTitle.trim()}
                onClick={() => {
                  toast({
                    title: '💡 Prochaine étape',
                    description: 'Exportez ce contenu en fichier .txt puis chargez-le via le bouton RAG en bas à droite.',
                  });
                }}
                className="flex items-center gap-2 font-semibold ml-auto"
                style={{
                  backgroundColor: (!constructionContent.trim() || !constructionTitle.trim()) ? 'rgba(187,165,122,0.3)' : '#BBA57A',
                  color: '#1E1A37',
                }}
              >
                <Upload className="h-4 w-4" />
                Charger dans le RAG
              </Button>
            </div>

            {/* Tip */}
            <div className="rounded-lg p-4 flex items-start gap-3"
              style={{ backgroundColor: 'rgba(30,26,55,0.6)', border: '1px solid rgba(187,165,122,0.15)' }}>
              <span className="text-lg">💡</span>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(187,165,122,0.6)' }}>
                Une fois votre réponse rédigée, copiez-la dans un fichier <strong style={{ color: '#BBA57A' }}>.txt</strong> ou <strong style={{ color: '#BBA57A' }}>.pdf</strong>, puis utilisez le bouton flottant en bas à droite pour le charger dans la base de connaissances RAG.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Bouton flottant upload RAG ── */}
      <AssistantFloatingRAGUpload />

      {/* ── Dialog confirmation suppression ── */}
      <AlertDialog open={!!docToDelete} onOpenChange={(open) => !open && setDocToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce document ?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{docToDelete?.document_name}</strong> sera supprimé de la base de données.
              Les vecteurs dans Qdrant ne seront pas automatiquement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}

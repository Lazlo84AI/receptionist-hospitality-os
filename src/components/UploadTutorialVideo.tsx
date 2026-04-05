import { useState, useRef, useEffect } from 'react';
import {
  Upload, X, Loader2, FileVideo, Link2,
  Tag, AlignLeft, Plus, ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// ─── Icône clap/vidéo outline — couleur Sand/Gold charte ─────────────────────

const ClapperIcon = ({ style, className }: { style?: React.CSSProperties; className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    {/* Corps du clap */}
    <rect x="2" y="8" width="20" height="13" rx="2" />
    {/* Barre supérieure */}
    <path d="M2 11h20" />
    {/* Dents du clap — 4 segments inclinés */}
    <path d="M7 8V3" />
    <path d="M12 8V3" />
    <path d="M17 8V3" />
    {/* Ligne de clap inclinée */}
    <path d="M2 8l4.5-5" />
    <path d="M7 8l4.5-5" />
    <path d="M12 8l4.5-5" />
    {/* Bouton play au centre */}
    <path d="M10 14.5l4 2.5-4 2.5V14.5z" strokeWidth="1.5" />
  </svg>
);

// ─── Constants ────────────────────────────────────────────────────────────────

const PREDEFINED_CATEGORIES = [
  'Dashboard',
  'Team Dispatch',
  'Shift Management',
  'Service Control',
  'Réception',
  'Housekeeping',
  'Formation',
  'Onboarding',
  'Direction',
];

const ACCEPTED_VIDEO_TYPES = [
  'video/mp4', 'video/quicktime', 'video/x-msvideo',
  'video/webm', 'video/ogg', 'video/mpeg',
];

const STORAGE_BUCKET = 'tutorial-videos';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sanitizeFileName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

// ─── Keyword Tag Input ────────────────────────────────────────────────────────

function KeywordInput({ keywords, onChange }: { keywords: string[]; onChange: (kw: string[]) => void }) {
  const [input, setInput] = useState('');
  const add = (raw: string) => {
    const val = raw.trim().toLowerCase();
    if (val && !keywords.includes(val)) onChange([...keywords, val]);
    setInput('');
  };
  const remove = (kw: string) => onChange(keywords.filter(k => k !== kw));
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {keywords.map(kw => (
          <span key={kw} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border"
            style={{ backgroundColor: '#BBA57A18', color: '#9a7c55', borderColor: '#BBA57A40' }}>
            {kw}
            <button onClick={() => remove(kw)} className="opacity-60 hover:opacity-100"><X className="h-3 w-3" /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(input); }
            if (e.key === 'Backspace' && !input && keywords.length) remove(keywords[keywords.length - 1]);
          }}
          placeholder="Tapez un mot-clé puis Entrée…" className="text-sm" />
        {input.trim() && (
          <Button type="button" size="sm" variant="outline" onClick={() => add(input)}
            className="flex-shrink-0 hover:border-[#BBA57A] hover:text-[#BBA57A]">
            <Plus className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Conseils dépliables ──────────────────────────────────────────────────────

function TipsAccordion() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border-2 border-blue-100 bg-blue-50 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <span className="text-xl flex-shrink-0">💡</span>
        <p className="font-semibold text-blue-900 text-sm flex-1">Conseils importants</p>
        <ChevronDown
          className={cn('h-4 w-4 text-blue-400 transition-transform duration-200 flex-shrink-0', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 space-y-3 text-sm text-gray-700 border-t border-blue-100">
          <p>
            <span className="font-semibold text-blue-800">Quoi filmer ?</span>{' '}
            Utilisez les vidéos pour faire découvrir de nouvelles fonctionnalités de la plateforme,
            présenter des tutoriels opérationnels, ou appuyer sur des gestes métier à améliorer sur
            le terrain — bien nettoyer le spa, plier les serviettes de chambre, accueillir un client,
            etc.
          </p>
          <p>
            <span className="font-semibold text-blue-800">Comment enregistrer ?</span>{' '}
            Utilisez <strong>Loom</strong> (loom.com) ou <strong>Tella</strong> (tella.tv) pour vous
            enregistrer facilement en vidéo. Ces outils génèrent automatiquement un transcript que
            vous pouvez copier-coller ici. Vous pouvez ensuite garder la vidéo sur Loom ou la
            télécharger et la publier sur la{' '}
            <a
              href="https://studio.youtube.com/channel/UCk7iqeRXv5Tl74-8XucFseA/videos/upload?filter=%5B%5D&sort=%7B%22columnType%22%3A%22date%22%2C%22sortOrder%22%3A%22DESCENDING%22%7D"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-blue-700 underline underline-offset-2 hover:text-blue-900 transition-colors"
            >
              chaîne YouTube de l'hôtel
            </a>{' '}
            (non répertoriée) pour obtenir un lien à coller dans le champ URL.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Update Video Panel ─────────────────────────────────────────────────

interface ExistingVideo {
  id: string;
  title: string;
  category: string;
  url: string;
  objectif_fonctionnel: string | null;
  keywords: string[];
  transcript: string | null;
  sort_order: number;
  is_active: boolean;
}

function UpdateVideoPanel({
  videos,
  selectedId,
  onSelect,
  onClear,
}: {
  videos: ExistingVideo[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClear: () => void;
}) {
  const [search, setSearch] = useState('');

  const filtered = videos.filter(
    v =>
      search === '' ||
      v.title.toLowerCase().includes(search.toLowerCase()) ||
      v.category.toLowerCase().includes(search.toLowerCase()),
  );

  // Si une vidéo est sélectionnée, afficher sa fiche + bouton retour
  if (selectedId) {
    const v = videos.find(x => x.id === selectedId);
    if (!v) return null;
    return (
      <div className="space-y-3">
        {/* Fiche vidéo sélectionnée */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="font-semibold text-blue-900 mb-2 text-sm">Vidéo sélectionnée :</p>
          <p className="text-gray-900 font-medium">🎬 {v.title}</p>
          <p className="text-sm text-gray-500 mt-0.5">Catégorie : {v.category}</p>
          {v.url && (
            <a href={v.url} target="_blank" rel="noopener noreferrer"
              className="text-xs text-blue-600 underline mt-1 inline-block hover:text-blue-800 transition">
              Voir la vidéo actuelle →
            </a>
          )}
        </div>
        {/* Bouton retour */}
        <button
          onClick={onClear}
          className="text-sm text-gray-500 hover:text-gray-800 transition flex items-center gap-1.5"
        >
          ← Choisir une autre vidéo
        </button>
      </div>
    );
  }

  // Liste de sélection
  return (
    <div className="space-y-3">
      {/* Avertissement */}
      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3 flex items-start gap-3">
        <span className="text-lg flex-shrink-0">⚠️</span>
        <p className="text-sm text-gray-700">
          Sélectionnez la vidéo à modifier. Les nouvelles informations écraseront les données
          existantes (titre, URL, keywords, transcript).
        </p>
      </div>

      {/* Recherche */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher une vidéo…"
          className="pl-9 transition hover:border-[#BBA57A] focus:border-[#BBA57A] focus:ring-2 focus:ring-[#BBA57A]/20"
        />
      </div>

      {/* Liste scrollable */}
      <div className="max-h-64 overflow-y-auto border rounded-lg divide-y">
        {filtered.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">
            {search ? 'Aucune vidéo trouvée' : 'Aucune vidéo disponible'}
          </p>
        ) : (
          filtered.map(v => (
            <button
              key={v.id}
              onClick={() => onSelect(v.id)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 hover:border-l-4 hover:border-l-[#BBA57A] transition-all group"
            >
              <div className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0 mt-0.5">🎬</span>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm group-hover:text-[#9a7c55] truncate">{v.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{v.category}</p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode = 'create' | 'update';
type MediaMode = 'file' | 'url';

interface FormState {
  mode: Mode;
  mediaMode: MediaMode;
  file: File | null;
  url: string;
  existingId: string;
  title: string;
  category: string;
  isNewCategory: boolean;
  newCategoryInput: string;
  objectif: string;
  keywords: string[];
  transcript: string;
  sortOrder: number;
  isActive: boolean;
  isOnboarding: boolean;
}

const EMPTY_FORM: FormState = {
  mode: 'create', mediaMode: 'url', file: null, url: '', existingId: '',
  title: '', category: '', isNewCategory: false, newCategoryInput: '',
  objectif: '', keywords: [], transcript: '', sortOrder: 0,
  isActive: true, isOnboarding: false,
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface UploadTutorialVideoProps {
  forceOpen?: boolean;
  initialVideoId?: string | null;
  onForceClose?: () => void;
}

export function UploadTutorialVideo({ forceOpen, initialVideoId, onForceClose }: UploadTutorialVideoProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: existingVideos = [] } = useQuery({
    queryKey: ['platform_tutorial_videos_admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_tutorial_videos')
        .select('id, title, category, objectif_fonctionnel, url, keywords, transcript, sort_order, is_active')
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    enabled: isOpen,
  });

  const set = (patch: Partial<FormState>) => setForm(prev => ({ ...prev, ...patch }));

  // ── Ouverture forcée depuis le parent (bouton Modifier du popup vidéo) ──
  useEffect(() => {
    if (forceOpen && initialVideoId) {
      setIsOpen(true);
      set({ mode: 'update', existingId: initialVideoId });
    }
  }, [forceOpen, initialVideoId]);

  // ── Auto-remplissage quand les vidéos sont chargées après ouverture forcée ──
  useEffect(() => {
    if (form.mode === 'update' && form.existingId && !form.title && existingVideos.length > 0) {
      handleSelectExisting(form.existingId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingVideos, form.existingId]);

  const handleSelectExisting = (id: string) => {
    const v = existingVideos.find(x => x.id === id);
    if (!v) { set({ existingId: id }); return; }
    const isKnown = PREDEFINED_CATEGORIES.includes(v.category);
    set({
      existingId: id, title: v.title,
      category: isKnown ? v.category : '', isNewCategory: !isKnown,
      newCategoryInput: !isKnown ? v.category : '',
      objectif: v.objectif_fonctionnel ?? '', url: v.url ?? '',
      keywords: v.keywords ?? [], transcript: v.transcript ?? '',
      sortOrder: v.sort_order ?? 0, isActive: v.is_active ?? true, mediaMode: 'url',
    });
  };

  const handleFile = (file: File) => {
    if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
      toast({ title: 'Format non supporté', description: 'Accepté : MP4, MOV, AVI, WebM', variant: 'destructive' });
      return;
    }
    set({ file, mediaMode: 'file' });
  };

  const handleSubmit = async () => {
    const finalCategory = form.isNewCategory ? form.newCategoryInput.trim() : form.category;
    if (!form.title.trim())     { toast({ title: 'Titre requis', variant: 'destructive' }); return; }
    if (!finalCategory)          { toast({ title: 'Catégorie requise', variant: 'destructive' }); return; }
    if (form.mediaMode === 'url' && !form.url.trim()) { toast({ title: 'URL requise', variant: 'destructive' }); return; }
    if (form.mediaMode === 'file' && !form.file)      { toast({ title: 'Fichier requis', variant: 'destructive' }); return; }
    if (form.mode === 'update' && !form.existingId)   { toast({ title: 'Sélectionnez une vidéo', variant: 'destructive' }); return; }
    setIsSubmitting(true);
    try {
      let videoUrl = form.url.trim();
      if (form.mediaMode === 'file' && form.file) {
        const ts = Date.now();
        const safe = sanitizeFileName(form.file.name);
        const path = `${ts}_${safe}`;
        const { error: upErr } = await supabase.storage.from(STORAGE_BUCKET).upload(path, form.file, { upsert: false });
        if (upErr) throw new Error(`Upload storage : ${upErr.message}`);
        const { data: { publicUrl } } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
        videoUrl = publicUrl;
      }
      const payload = {
        title: form.title.trim(), category: finalCategory,
        objectif_fonctionnel: form.objectif.trim() || null,
        url: videoUrl, keywords: form.keywords,
        transcript: form.transcript.trim() || null,
        sort_order: form.sortOrder, is_active: form.isActive, is_onboarding: form.isOnboarding,
      };
      if (form.mode === 'create') {
        const { error } = await supabase.from('platform_tutorial_videos').insert(payload);
        if (error) throw error;
        toast({ title: '✅ Vidéo ajoutée', description: `"${form.title}" est disponible dans la médiathèque.` });
      } else {
        const { error } = await supabase.from('platform_tutorial_videos').update(payload).eq('id', form.existingId);
        if (error) throw error;
        toast({ title: '✅ Vidéo mise à jour', description: `"${form.title}" a été modifiée.` });
      }
      queryClient.refetchQueries({ queryKey: ['platform_tutorial_videos_admin'] });
      queryClient.refetchQueries({ queryKey: ['platform_tutorial_videos'] });
      queryClient.refetchQueries({ queryKey: ['onboarding_videos'] });
      setForm(EMPTY_FORM);
      setIsOpen(false);
      onForceClose?.();
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const close = () => { if (!isSubmitting) { setIsOpen(false); setForm(EMPTY_FORM); onForceClose?.(); } };

  return (
    <>
      {/* ── Bouton flottant — même gabarit que AssistantFloatingRAGUpload ── */}
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
          title="Charger une nouvelle vidéo tutorielle"
        >
          {/* Icône outline clap, couleur Sand #E0D3B4 */}
          <ClapperIcon style={{ color: '#BBA57A', width: '44px', height: '44px' }} />
        </Button>
        {/* Ring animé jaune */}
        <div className="absolute -bottom-12 -right-12 h-48 w-48 rounded-full border-2 border-[#DEAE35]/20 animate-ping pointer-events-none" />
      </div>

      {/* ── Modal — large, aéré, style light RAG ── */}
      <Dialog open={isOpen} onOpenChange={close}>
        <DialogContent className="sm:max-w-[760px] max-h-[92vh] overflow-y-auto w-[95vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
              <ClapperIcon style={{ color: '#BBA57A', width: '22px', height: '22px' }} />
              Charger une nouvelle vidéo tutorielle
            </DialogTitle>
          </DialogHeader>

          {/* ── Toggle Nouvelle / Mettre à jour ── */}
          <div className="flex gap-2 mt-2">
            <Button
              variant={form.mode === 'create' ? 'default' : 'outline'}
              onClick={() => set({ mode: 'create', existingId: '' })}
              disabled={isSubmitting}
              className={cn('flex-1 text-sm', form.mode === 'create' && 'bg-[#BBA57A] hover:bg-[#BBA57A]/90 text-white')}
            >
              Nouvelle vidéo
            </Button>
            <Button
              variant={form.mode === 'update' ? 'default' : 'outline'}
              onClick={() => set({ mode: 'update' })}
              disabled={isSubmitting}
              className={cn('flex-1 text-sm', form.mode === 'update' && 'bg-[#BBA57A] hover:bg-[#BBA57A]/90 text-white')}
            >
              Mettre à jour une vidéo existante
            </Button>
          </div>

          <div className="space-y-6 pt-2">

            {/* ── Conseils dépliables ── */}
            <TipsAccordion />

            {/* ── Mode Mettre à jour ── */}
            {form.mode === 'update' && (
              <UpdateVideoPanel
                videos={existingVideos}
                selectedId={form.existingId}
                onSelect={handleSelectExisting}
                onClear={() => set({ existingId: '', title: '', category: '', url: '', keywords: [], transcript: '', objectif: '' })}
              />
            )}

            {/* ── Source vidéo + reste du formulaire (masqué en mode update sans sélection) ── */}
            {(form.mode === 'create' || (form.mode === 'update' && form.existingId)) && <>
            <div className="space-y-3">
              <Label className="font-medium">Source vidéo</Label>
              <div className="flex gap-2">
                {([['file', FileVideo, 'Fichier (médiathèque)'], ['url', Link2, 'URL (Loom / YouTube)']] as const).map(([m, Icon, label]) => (
                  <button key={m} onClick={() => set({ mediaMode: m })}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md border text-sm font-medium transition-all',
                      form.mediaMode === m
                        ? 'bg-[#BBA57A] border-[#BBA57A] text-white'
                        : 'border-gray-300 text-gray-600 hover:border-[#BBA57A]/60 hover:text-[#9a7c55]',
                    )}>
                    <Icon className="h-4 w-4" />{label}
                  </button>
                ))}
              </div>

              {form.mediaMode === 'file' ? (
                <div
                  onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={e => { e.preventDefault(); setIsDragOver(false); }}
                  onDrop={e => { e.preventDefault(); setIsDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                  className={cn(
                    'border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer',
                    isDragOver ? 'border-[#BBA57A] bg-[#BBA57A]/10 scale-[1.01]' : 'border-gray-300 hover:border-[#BBA57A]/50',
                  )}
                  onClick={() => fileRef.current?.click()}>
                  {form.file ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileVideo className="h-8 w-8 text-[#1E1A37] flex-shrink-0" />
                      <div className="text-left flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">{form.file.name}</p>
                        <p className="text-xs text-gray-500">{formatBytes(form.file.size)}</p>
                      </div>
                      <Button type="button" variant="ghost" size="sm"
                        onClick={e => { e.stopPropagation(); set({ file: null }); }}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-12 w-12 text-[#BBA57A] mx-auto mb-3" />
                      <p className="text-sm font-medium text-gray-900 mb-1">Glissez-déposez votre fichier ici</p>
                      <p className="text-xs text-gray-500 mb-4">ou cliquez pour parcourir — ouvre la médiathèque sur mobile</p>
                      <Button type="button" variant="outline" className="hover:border-[#BBA57A] hover:text-[#9a7c55]">
                        Parcourir les fichiers
                      </Button>
                    </>
                  )}
                  <input ref={fileRef} type="file" accept="video/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                </div>
              ) : (
                <div>
                  <div className="relative">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input value={form.url} onChange={e => set({ url: e.target.value })}
                      placeholder="https://www.loom.com/share/... ou https://youtu.be/..."
                      className="pl-9 transition hover:border-[#BBA57A] focus:border-[#BBA57A] focus:ring-2 focus:ring-[#BBA57A]/20" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">Loom, YouTube (non répertorié), ou tout lien vidéo direct</p>
                </div>
              )}
            </div>

            {/* ── Grille : Titre + Catégorie ── */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-medium">Titre <span className="text-red-500">*</span></Label>
                <Input value={form.title} onChange={e => set({ title: e.target.value })}
                  placeholder="Ex: Comment créer une tâche vocale"
                  className="transition hover:border-[#BBA57A] focus:border-[#BBA57A] focus:ring-2 focus:ring-[#BBA57A]/20" />
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Catégorie <span className="text-red-500">*</span></Label>
                {!form.isNewCategory ? (
                  <div className="flex gap-2">
                    <select value={form.category} onChange={e => set({ category: e.target.value })}
                      className="flex-1 border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#BBA57A]/30 focus:border-[#BBA57A] transition">
                      <option value="">— Sélectionner —</option>
                      {PREDEFINED_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <Button type="button" variant="outline" onClick={() => set({ isNewCategory: true, category: '' })}
                      className="flex-shrink-0 hover:border-[#BBA57A] hover:text-[#9a7c55] px-2.5">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input value={form.newCategoryInput} onChange={e => set({ newCategoryInput: e.target.value })}
                      placeholder="Nouvelle catégorie…" autoFocus
                      className="flex-1 transition hover:border-[#BBA57A] focus:border-[#BBA57A] focus:ring-2 focus:ring-[#BBA57A]/20" />
                    <Button type="button" variant="outline" onClick={() => set({ isNewCategory: false, newCategoryInput: '' })}
                      className="flex-shrink-0 hover:border-[#BBA57A] hover:text-[#9a7c55] text-xs px-2.5">
                      ←
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* ── Objectif fonctionnel ── */}
            <div className="space-y-2">
              <Label className="font-medium flex items-center gap-1.5">
                <AlignLeft className="h-4 w-4 text-gray-400" />
                Objectif fonctionnel
              </Label>
              <textarea value={form.objectif} onChange={e => set({ objectif: e.target.value })}
                placeholder="Ce que l'utilisateur doit comprendre ou savoir faire après cette vidéo…"
                rows={2}
                className="w-full border rounded-md px-3 py-2 text-sm outline-none resize-y focus:ring-2 focus:ring-[#BBA57A]/30 focus:border-[#BBA57A] transition placeholder:text-gray-400" />
            </div>

            {/* ── Keywords ── */}
            <div className="space-y-2">
              <Label className="font-medium flex items-center gap-1.5">
                <Tag className="h-4 w-4 text-gray-400" />
                Keywords
              </Label>
              <KeywordInput keywords={form.keywords} onChange={kw => set({ keywords: kw })} />
            </div>

            {/* ── Transcript ── */}
            <div className="space-y-2">
              <Label className="font-medium flex items-center gap-1.5">
                <AlignLeft className="h-4 w-4 text-gray-400" />
                Transcript
                <span className="text-gray-400 text-xs font-normal">(optionnel — pour la recherche sémantique)</span>
              </Label>
              <textarea value={form.transcript} onChange={e => set({ transcript: e.target.value })}
                placeholder="Collez ici la transcription texte de la vidéo (générée par Loom ou Tella automatiquement)…"
                rows={4}
                className="w-full border rounded-md px-3 py-2 text-sm outline-none resize-y focus:ring-2 focus:ring-[#BBA57A]/30 focus:border-[#BBA57A] transition placeholder:text-gray-400" />
            </div>

            </> }

            {/* ── Actions ── */}
            <div className="flex justify-end gap-3 pt-2 border-t sticky bottom-0 bg-white pb-2">
              <Button type="button" variant="outline" onClick={close} disabled={isSubmitting}>
                Annuler
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}
                className="min-w-[150px] bg-[#BBA57A] hover:bg-[#BBA57A]/90 text-white">
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {form.mediaMode === 'file' ? 'Upload…' : 'Sauvegarde…'}
                  </>
                ) : (
                  <><Upload className="h-4 w-4 mr-2" />
                    {form.mode === 'create' ? 'Ajouter la vidéo' : 'Mettre à jour'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

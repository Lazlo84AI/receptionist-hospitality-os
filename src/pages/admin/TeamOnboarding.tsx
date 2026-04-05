import { useState, useMemo } from 'react';
import { AdminLayout } from './AdminLayout';
import { UploadTutorialVideo } from '@/components/UploadTutorialVideo';
import {
  Users, Video, Target, Shield, Search, Plus, X, ChevronDown,
  CheckCircle2, Calendar, Send, Loader2, User, Layers, Play,
  Clock, Star, Edit3, Save, Trash2, BarChart2, AlertTriangle, Monitor,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// ─── Types ──────────────────────────────────────────────────────────────────

type TabId = 'video-briefs' | 'team-focus' | 'attribution' | 'suivi' | 'role-hierarchy';
type AssignMode = 'individual' | 'service';
type ContentSelectorMode = 'videos' | 'okr';

interface VideoItem {
  id: string; title: string; category: string;
  objectif_fonctionnel: string | null; url: string;
  keywords: string[]; sort_order: number; is_active: boolean; created_at: string;
}
interface VideoChain { id: string; name: string; video_ids: string[]; created_at: string; }
interface StaffRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  service: string | null;
  hierarchy: string | null;
  is_active: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SERVICES = ['Réception', 'Housekeeping', 'Petit Dejeuner', 'Maintenance', 'Direction'];
const HIERARCHY_OPTIONS = ['Normal', 'Manager', 'Direction'];
const DURATION_OPTIONS = [2, 3, 4, 5, 6];

// ─── Video Category Config ────────────────────────────────────────────────────

const VIDEO_CATEGORY_CONFIG: Record<string, { emoji: string; gradient: string; iconBg: string; color: string }> = {
  'Réception':   { emoji: '🛎️', gradient: 'linear-gradient(135deg, #5a1428 0%, #2e0a14 100%)', iconBg: 'rgba(196,99,122,0.22)', color: '#f97bad' },
  'Reception':   { emoji: '🛎️', gradient: 'linear-gradient(135deg, #5a1428 0%, #2e0a14 100%)', iconBg: 'rgba(196,99,122,0.22)', color: '#f97bad' },
  'Housekeeping':{ emoji: '🧹', gradient: 'linear-gradient(135deg, #2d2850 0%, #1E1A37 100%)', iconBg: 'rgba(139,131,184,0.2)', color: '#a5b4fc' },
  'Maintenance': { emoji: '🔧', gradient: 'linear-gradient(135deg, #4a3c28 0%, #241d12 100%)', iconBg: 'rgba(224,211,180,0.2)', color: '#E0D3B4' },
  'Onboarding':  { emoji: '🚀', gradient: 'linear-gradient(135deg, #1a3a5c 0%, #0d1f33 100%)', iconBg: 'rgba(59,130,246,0.2)',  color: '#60a5fa' },
  'Tutorial':    { emoji: '📺', gradient: 'linear-gradient(135deg, #1a2a1a 0%, #0d150d 100%)', iconBg: 'rgba(74,222,128,0.15)', color: '#4ade80' },
  'Plateforme':  { emoji: '💻', gradient: 'linear-gradient(135deg, #2a1a3a 0%, #150d1e 100%)', iconBg: 'rgba(167,139,250,0.18)',color: '#a78bfa' },
  'Formation':   { emoji: '🎓', gradient: 'linear-gradient(135deg, #3a2a10 0%, #1d1508 100%)', iconBg: 'rgba(222,174,53,0.18)', color: '#DEAE35' },
  'Direction':   { emoji: '⭐', gradient: 'linear-gradient(135deg, #1a1030 0%, #100820 100%)', iconBg: 'rgba(222,174,53,0.15)', color: '#DEAE35' },
};
const VIDEO_CAT_FALLBACK = { emoji: '🎬', gradient: 'linear-gradient(135deg, #1e1a37 0%, #0f0d1f 100%)', iconBg: 'rgba(187,165,122,0.15)', color: '#BBA57A' };
const getCatCfg = (cat: string) => VIDEO_CATEGORY_CONFIG[cat] ?? VIDEO_CAT_FALLBACK;

// ─── Shared Styles ────────────────────────────────────────────────────────────

const cardStyle = { backgroundColor: 'rgba(30,26,55,0.85)', borderColor: 'rgba(187,165,122,0.2)' };
const inputStyle: React.CSSProperties = {
  backgroundColor: 'rgba(15,12,36,0.7)', borderColor: 'rgba(187,165,122,0.25)',
  color: 'white', border: '1px solid rgba(187,165,122,0.25)',
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, icon: Icon, accent }: { label: string; value: string | number; icon: React.ElementType; accent: string }) {
  return (
    <div className="rounded-xl p-5 border flex items-center gap-4" style={cardStyle}>
      <div className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${accent}18` }}>
        <Icon className="h-5 w-5" style={{ color: accent }} />
      </div>
      <div>
        <p className="text-2xl font-bold text-white leading-none mb-1">{value}</p>
        <p className="text-xs" style={{ color: 'rgba(187,165,122,0.6)' }}>{label}</p>
      </div>
    </div>
  );
}

// ─── Tab Button ───────────────────────────────────────────────────────────────

function TabButton({ label, icon: Icon, active, onClick }: { label: string; icon: React.ElementType; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
      style={active ? { backgroundColor: 'rgba(187,165,122,0.18)', color: '#BBA57A' } : { color: 'rgba(187,165,122,0.45)' }}>
      <Icon className="h-4 w-4" />{label}
    </button>
  );
}

// ─── Shared Data Hooks ────────────────────────────────────────────────────────

function useVideos() {
  return useQuery({
    queryKey: ['platform_tutorial_videos_admin'],
    queryFn: async () => {
      // Pas de filtre is_active ici — la vue admin affiche toutes les vidéos.
      // Le filtre is_active est géré dans OnboardingCarousel uniquement.
      const { data, error } = await supabase
        .from('platform_tutorial_videos')
        .select('id, title, category, objectif_fonctionnel, url, keywords, sort_order, is_active, created_at')
        .order('sort_order');
      if (error) throw error;
      return data as VideoItem[];
    },
    staleTime: 1000 * 60 * 5,
  });
}

function useChains() {
  return useQuery({
    queryKey: ['video_chains'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('video_chains').select('id, name, video_ids, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as VideoChain[];
    },
  });
}

// ─── Tab : Video Briefs ───────────────────────────────────────────────────────

function TabVideoBriefs({ onEditVideo }: { onEditVideo: (id: string) => void }) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { data: videos = [], isLoading } = useVideos();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  function getEmbedUrl(url: string): string {
    const loom = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
    if (loom) return `https://www.loom.com/embed/${loom[1]}`;
    const ytLong = url.match(/youtube\.com\/watch\?v=([^&]+)/);
    if (ytLong) return `https://www.youtube.com/embed/${ytLong[1]}?modestbranding=1&rel=0`;
    const ytShort = url.match(/youtu\.be\/([^?]+)/);
    if (ytShort) return `https://www.youtube.com/embed/${ytShort[1]}?modestbranding=1&rel=0`;
    return url;
  }

  const handleDelete = async (v: VideoItem) => {
    if (!window.confirm(`Supprimer « ${v.title} » définitivement ?`)) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('platform_tutorial_videos').delete().eq('id', v.id);
      if (error) throw error;
      toast({ title: '✅ Vidéo supprimée', description: `« ${v.title} » a été supprimée.` });
      setSelectedVideo(null);
      queryClient.invalidateQueries({ queryKey: ['platform_tutorial_videos_admin'] });
      queryClient.invalidateQueries({ queryKey: ['platform_tutorial_videos'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding_videos'] });
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally { setIsDeleting(false); }
  };

  const categories = useMemo(() => Array.from(new Set(videos.map(v => v.category))).sort(), [videos]);
  const filtered = useMemo(() => videos.filter(v => {
    const matchCat = catFilter === 'all' || v.category === catFilter;
    const matchSearch = search === '' || v.title.toLowerCase().includes(search.toLowerCase())
      || (v.objectif_fonctionnel ?? '').toLowerCase().includes(search.toLowerCase())
      || v.keywords.some(k => k.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  }), [videos, search, catFilter]);

  return (
    <div className="flex flex-col gap-5">
      {/* Search + Filtres catégorie */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'rgba(187,165,122,0.45)' }} />
          <input type="text" placeholder="Rechercher par titre ou thématique…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg pl-9 pr-3 py-2 text-sm outline-none border placeholder:text-white/20" style={inputStyle} />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {['all', ...categories].map(cat => {
            const cfg = cat !== 'all' ? getCatCfg(cat) : null;
            const isActive = catFilter === cat;
            return (
              <button key={cat} onClick={() => setCatFilter(isActive && cat !== 'all' ? 'all' : cat)}
                className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                style={{
                  backgroundColor: isActive ? (cfg ? cfg.iconBg : 'rgba(187,165,122,0.18)') : 'rgba(30,26,55,0.6)',
                  color: isActive ? (cfg ? cfg.color : '#BBA57A') : 'rgba(187,165,122,0.45)',
                  border: `1px solid ${isActive ? (cfg ? cfg.color + '60' : 'rgba(187,165,122,0.4)') : 'rgba(187,165,122,0.12)'}`,
                }}>
                {cat === 'all' ? 'Toutes' : `${cfg!.emoji} ${cat}`}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-xs" style={{ color: 'rgba(187,165,122,0.4)' }}>{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</p>

      {isLoading ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin" style={{ color: '#BBA57A' }} /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border p-14 flex flex-col items-center justify-center text-center"
          style={{ backgroundColor: 'rgba(30,26,55,0.4)', borderColor: 'rgba(187,165,122,0.12)', borderStyle: 'dashed' }}>
          <Video className="h-10 w-10 mb-3 opacity-20" style={{ color: '#BBA57A' }} />
          <p className="text-white font-medium mb-1">Aucune vidéo trouvée</p>
          <p className="text-xs" style={{ color: 'rgba(187,165,122,0.4)' }}>Vérifiez votre recherche ou les filtres actifs</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(v => {
            const cfg = getCatCfg(v.category);
            return (
              <div
                key={v.id}
                onClick={() => setSelectedVideo(v)}
                className="rounded-2xl overflow-hidden group transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl flex flex-col cursor-pointer"
                style={{ background: cfg.gradient, border: `1px solid ${cfg.color}40` }}
              >
                <div className="h-1 w-full flex-shrink-0" style={{ backgroundColor: cfg.color, opacity: 0.8 }} />
                <div className="px-4 pt-4 pb-3 flex items-start justify-between">
                  <div className="h-11 w-11 rounded-xl flex items-center justify-center text-2xl shadow-lg" style={{ backgroundColor: cfg.iconBg }}>
                    {cfg.emoji}
                  </div>
                  <div
                    className="h-7 px-2 rounded-md flex items-center gap-1.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: 'rgba(0,0,0,0.25)', color: '#BBA57A' }}
                  >
                    <Play className="h-3 w-3" /> Voir
                  </div>
                </div>
                <div className="px-4 pb-3 flex-1">
                  <h3 className="text-sm font-bold text-white mb-1 line-clamp-2 leading-snug">{v.title}</h3>
                  {v.objectif_fonctionnel && (
                    <p className="text-xs line-clamp-2" style={{ color: 'rgba(255,255,255,0.45)' }}>{v.objectif_fonctionnel}</p>
                  )}
                </div>
                <div className="px-4 pb-4">
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: cfg.iconBg, color: cfg.color, border: `1px solid ${cfg.color}40` }}
                  >
                    {cfg.emoji} {v.category}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal vidéo — toujours au même niveau que le reste du return ── */}
      {selectedVideo && ((): React.ReactElement => {
        const cfg = getCatCfg(selectedVideo.category);
        return (
          <div
            className="fixed inset-0 z-[9990] flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
            onClick={() => setSelectedVideo(null)}
          >
            <div
              className="w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl flex flex-col"
              style={{ background: cfg.gradient, border: `1px solid ${cfg.color}60`, maxHeight: '90vh' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${cfg.color}30` }}>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: cfg.iconBg }}>
                    {cfg.emoji}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{selectedVideo.title}</p>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full mt-0.5 inline-block"
                      style={{ backgroundColor: cfg.iconBg, color: cfg.color, border: `1px solid ${cfg.color}40` }}
                    >
                      {selectedVideo.category}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={selectedVideo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                    style={{ backgroundColor: 'rgba(0,0,0,0.3)', color: '#BBA57A', border: '1px solid rgba(187,165,122,0.3)' }}
                    onClick={e => e.stopPropagation()}
                  >
                    <Play className="h-3 w-3" /> Ouvrir dans l'onglet
                  </a>
                  <button
                    onClick={e => { e.stopPropagation(); onEditVideo(selectedVideo.id); setSelectedVideo(null); }}
                    className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
                    title="Modifier cette vidéo"
                  >
                    <Edit3 className="h-4 w-4" style={{ color: '#BBA57A' }} />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(selectedVideo); }}
                    disabled={isDeleting}
                    className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500/20"
                    title="Supprimer cette vidéo"
                  >
                    {isDeleting ? <Loader2 className="h-4 w-4 text-red-400 animate-spin" /> : <Trash2 className="h-4 w-4 text-red-400" />}
                  </button>
                  <button
                    onClick={() => setSelectedVideo(null)}
                    className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
                  >
                    <X className="h-4 w-4" style={{ color: 'rgba(187,165,122,0.6)' }} />
                  </button>
                </div>
              </div>
              <div className="relative w-full bg-black" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  key={selectedVideo.id}
                  src={getEmbedUrl(selectedVideo.url)}
                  title={selectedVideo.title}
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
              {selectedVideo.objectif_fonctionnel && (
                <div className="px-5 py-3" style={{ borderTop: `1px solid ${cfg.color}20` }}>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    <span className="font-semibold" style={{ color: cfg.color }}>Objectif : </span>
                    {selectedVideo.objectif_fonctionnel}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── Tab : Team Focus ─────────────────────────────────────────────────────────

interface ChainStep { id: string; video: VideoItem }

function TabTeamFocus() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [chainName, setChainName] = useState('');
  const [steps, setSteps] = useState<ChainStep[]>([]);
  const [videoSearch, setVideoSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { data: videos = [] } = useVideos();
  const { data: chains = [] } = useChains();

  const filteredVideos = videos.filter(v =>
    videoSearch === '' ||
    v.title.toLowerCase().includes(videoSearch.toLowerCase()) ||
    v.category.toLowerCase().includes(videoSearch.toLowerCase())
  );

  const addStep = (v: VideoItem) => {
    if (steps.find(s => s.id === v.id)) return;
    setSteps(prev => [...prev, { id: v.id, video: v }]);
  };
  const removeStep = (id: string) => setSteps(prev => prev.filter(s => s.id !== id));
  const moveStep = (i: number, dir: 1 | -1) => {
    const next = [...steps]; const t = i + dir;
    if (t < 0 || t >= next.length) return;
    [next[i], next[t]] = [next[t], next[i]]; setSteps(next);
  };

  const handleSave = async () => {
    if (!chainName.trim()) { toast({ title: 'Nom requis', description: 'Donnez un nom à la chaîne.', variant: 'destructive' }); return; }
    if (steps.length === 0) { toast({ title: 'Chaîne vide', description: 'Ajoutez au moins une vidéo.', variant: 'destructive' }); return; }
    setIsSaving(true);
    try {
      const { error } = await supabase.from('video_chains').insert({ name: chainName.trim(), video_ids: steps.map(s => s.id) });
      if (error) throw error;
      toast({ title: '✅ Chaîne sauvegardée', description: `"${chainName}" créée avec ${steps.length} vidéo${steps.length > 1 ? 's' : ''}.` });
      setChainName(''); setSteps([]);
      queryClient.invalidateQueries({ queryKey: ['video_chains'] });
    } catch (err: any) { toast({ title: 'Erreur', description: err.message, variant: 'destructive' }); }
    finally { setIsSaving(false); }
  };

  const deleteChain = async (id: string, name: string) => {
    try {
      const { error } = await supabase.from('video_chains').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Chaîne supprimée', description: `"${name}" supprimée.` });
      queryClient.invalidateQueries({ queryKey: ['video_chains'] });
    } catch (err: any) { toast({ title: 'Erreur', description: err.message, variant: 'destructive' }); }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* ── Colonne gauche ── */}
      <div className="flex flex-col gap-4">
        {/* Nom de la chaîne */}
        <div className="rounded-xl border p-4" style={cardStyle}>
          <label className="text-xs block mb-1.5" style={{ color: 'rgba(187,165,122,0.6)' }}>
            Nom de la chaîne de vidéos / Objective Key Results
          </label>
          <input type="text" placeholder="Ex: Onboarding Réception — Printemps 2025"
            value={chainName} onChange={e => setChainName(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none border placeholder:text-white/20" style={inputStyle} />
        </div>

        {/* Builder séquentiel */}
        <div className="rounded-xl border p-4 flex flex-col gap-3" style={cardStyle}>
          <p className="text-xs font-medium" style={{ color: 'rgba(187,165,122,0.6)' }}>Chaîne de vidéos tutoriels</p>
          {steps.length === 0 ? (
            <div className="rounded-lg border-dashed border p-6 flex flex-col items-center justify-center text-center"
              style={{ borderColor: 'rgba(187,165,122,0.2)' }}>
              <Plus className="h-6 w-6 mb-2 opacity-25" style={{ color: '#BBA57A' }} />
              <p className="text-xs" style={{ color: 'rgba(187,165,122,0.4)' }}>Cliquez sur une vidéo à droite pour l'ajouter</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {steps.map((step, i) => {
                const cfg = getCatCfg(step.video.category);
                return (
                  <div key={step.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5 border"
                    style={{ backgroundColor: 'rgba(15,12,36,0.5)', borderColor: 'rgba(187,165,122,0.15)' }}>
                    <div className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: 'rgba(187,165,122,0.15)', color: '#BBA57A' }}>{i + 1}</div>
                    <div className="h-7 w-7 rounded-md flex items-center justify-center text-sm flex-shrink-0"
                      style={{ backgroundColor: cfg.iconBg }}>{cfg.emoji}</div>
                    <p className="flex-1 text-sm text-white truncate">{step.video.title}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cfg.iconBg, color: cfg.color, border: `1px solid ${cfg.color}40` }}>
                      {step.video.category}
                    </span>
                    <div className="flex flex-col gap-0.5 flex-shrink-0">
                      <button onClick={() => moveStep(i, -1)} disabled={i === 0}
                        className="h-4 w-4 flex items-center justify-center rounded opacity-40 hover:opacity-100 disabled:opacity-10 transition-opacity"
                        style={{ color: '#BBA57A' }}>
                        <ChevronDown className="h-3 w-3 rotate-180" />
                      </button>
                      <button onClick={() => moveStep(i, 1)} disabled={i === steps.length - 1}
                        className="h-4 w-4 flex items-center justify-center rounded opacity-40 hover:opacity-100 disabled:opacity-10 transition-opacity"
                        style={{ color: '#BBA57A' }}>
                        <ChevronDown className="h-3 w-3" />
                      </button>
                    </div>
                    <button onClick={() => removeStep(step.id)}
                      className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-red-500/20 transition-colors flex-shrink-0">
                      <X className="h-3.5 w-3.5 text-red-400" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          <button onClick={handleSave} disabled={isSaving || steps.length === 0 || !chainName.trim()}
            className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={{
              backgroundColor: steps.length === 0 ? 'rgba(187,165,122,0.08)' : 'rgba(187,165,122,0.2)',
              color: steps.length === 0 ? 'rgba(187,165,122,0.3)' : '#BBA57A',
              border: `1px solid ${steps.length === 0 ? 'rgba(187,165,122,0.1)' : 'rgba(187,165,122,0.4)'}`,
            }}>
            {isSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Sauvegarde…</> : <><Save className="h-4 w-4" /> Sauvegarder la chaîne</>}
          </button>
        </div>

        {/* Chaînes existantes */}
        {chains.length > 0 && (
          <div className="rounded-xl border p-4 flex flex-col gap-3" style={cardStyle}>
            <p className="text-xs font-medium" style={{ color: 'rgba(187,165,122,0.6)' }}>Chaînes créées ({chains.length})</p>
            {chains.map(chain => (
              <div key={chain.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5 border"
                style={{ backgroundColor: 'rgba(15,12,36,0.5)', borderColor: 'rgba(187,165,122,0.12)' }}>
                <Target className="h-4 w-4 flex-shrink-0" style={{ color: '#BBA57A' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{chain.name}</p>
                  <p className="text-xs" style={{ color: 'rgba(187,165,122,0.45)' }}>
                    {chain.video_ids.length} vidéo{chain.video_ids.length > 1 ? 's' : ''}
                  </p>
                </div>
                <button onClick={() => deleteChain(chain.id, chain.name)}
                  className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-red-500/20 transition-colors flex-shrink-0">
                  <Trash2 className="h-3.5 w-3.5 text-red-400 opacity-60 hover:opacity-100" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Colonne droite : sélecteur vidéos ── */}
      <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ ...cardStyle, maxHeight: '75vh' }}>
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium" style={{ color: 'rgba(187,165,122,0.6)' }}>Sélectionner des vidéos</p>
          <span className="text-xs" style={{ color: 'rgba(187,165,122,0.35)' }}>
            {steps.length} ajoutée{steps.length > 1 ? 's' : ''}
          </span>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'rgba(187,165,122,0.4)' }} />
          <input type="text" placeholder="Filtrer par titre ou catégorie…" value={videoSearch} onChange={e => setVideoSearch(e.target.value)}
            className="w-full rounded-lg pl-9 pr-3 py-2 text-sm outline-none border placeholder:text-white/20" style={inputStyle} />
        </div>
        <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
          {filteredVideos.map(v => {
            const cfg = getCatCfg(v.category);
            const added = steps.some(s => s.id === v.id);
            return (
              <button key={v.id} onClick={() => !added && addStep(v)} disabled={added}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 border text-left transition-all"
                style={{
                  backgroundColor: added ? 'rgba(74,222,128,0.06)' : 'rgba(15,12,36,0.5)',
                  borderColor: added ? 'rgba(74,222,128,0.25)' : 'rgba(187,165,122,0.12)',
                  opacity: added ? 0.7 : 1, cursor: added ? 'default' : 'pointer',
                }}>
                <div className="h-8 w-8 rounded-md flex items-center justify-center text-sm flex-shrink-0"
                  style={{ backgroundColor: cfg.iconBg }}>{cfg.emoji}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{v.title}</p>
                  <p className="text-xs truncate" style={{ color: 'rgba(187,165,122,0.5)' }}>{v.category}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: cfg.iconBg, color: cfg.color, border: `1px solid ${cfg.color}40` }}>
                    {v.category}
                  </span>
                  {added
                    ? <CheckCircle2 className="h-4 w-4" style={{ color: '#4ade80' }} />
                    : <Plus className="h-4 w-4" style={{ color: 'rgba(187,165,122,0.4)' }} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Tab : Attribution ────────────────────────────────────────────────────────

function TabAttribution() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<AssignMode>('individual');
  const [assignmentName, setAssignmentName] = useState('');
  const [selectedStaffIds, setSelectedStaffIds] = useState<Set<string>>(new Set());
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);
  const [staffSearch, setStaffSearch] = useState('');
  const [deadlineMode, setDeadlineMode] = useState<'date' | 'duration'>('date');
  const [deadline, setDeadline] = useState('');
  const [duration, setDuration] = useState(3);
  const [contentMode, setContentMode] = useState<ContentSelectorMode>('videos');
  const [contentSearch, setContentSearch] = useState('');
  const [selectedVideoIds, setSelectedVideoIds] = useState<Set<string>>(new Set());
  const [selectedChainId, setSelectedChainId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const { data: staffList = [] } = useQuery({
    queryKey: ['staff_directory_active'],
    queryFn: async () => {
      const { data, error } = await supabase.from('staff_directory')
        .select('id, full_name, first_name, last_name, service, role').eq('is_active', true).order('full_name');
      if (error) throw error;
      return data as { id: string; full_name: string; first_name: string; last_name: string; service: string; role: string }[];
    },
  });

  const { data: videos = [] } = useVideos();
  const { data: chains = [] } = useChains();

  const filteredStaff = staffList.filter(s =>
    (s.full_name || `${s.first_name} ${s.last_name}`).toLowerCase().includes(staffSearch.toLowerCase())
  );
  const filteredVideos = videos.filter(v =>
    contentSearch === '' ||
    v.title.toLowerCase().includes(contentSearch.toLowerCase()) ||
    v.category.toLowerCase().includes(contentSearch.toLowerCase())
  );
  const filteredChains = chains.filter(c =>
    contentSearch === '' || c.name.toLowerCase().includes(contentSearch.toLowerCase())
  );

  const toggleStaff = (id: string) => setSelectedStaffIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleService = (svc: string) => setSelectedServices(prev => { const n = new Set(prev); if (n.has(svc)) n.delete(svc); else n.add(svc); return n; });
  const toggleVideo = (id: string) => setSelectedVideoIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const handleSend = async () => {
    if (!assignmentName.trim()) { toast({ title: 'Nom requis', variant: 'destructive' }); return; }
    if (contentMode === 'videos' && selectedVideoIds.size === 0) { toast({ title: 'Sélectionnez au moins une vidéo', variant: 'destructive' }); return; }
    if (contentMode === 'okr' && !selectedChainId) { toast({ title: 'Sélectionnez une chaîne OKR', variant: 'destructive' }); return; }
    if (mode === 'individual' && selectedStaffIds.size === 0) { toast({ title: 'Sélectionnez au moins une personne', variant: 'destructive' }); return; }
    if (mode === 'service' && selectedServices.size === 0) { toast({ title: 'Sélectionnez au moins un service', variant: 'destructive' }); return; }
    setIsSending(true);
    try {
      const base = {
        assignment_name: assignmentName.trim(),
        video_ids: contentMode === 'videos' ? Array.from(selectedVideoIds) : [],
        chain_id: contentMode === 'okr' ? selectedChainId : null,
        deadline: deadlineMode === 'date' ? (deadline || null) : null,
        duration_days: deadlineMode === 'duration' ? duration : null,
        status: 'pending',
      };
      const payloads = mode === 'individual'
        ? Array.from(selectedStaffIds).map(id => ({ ...base, assigned_to: id }))
        : Array.from(selectedServices).map(svc => ({ ...base, service: svc }));
      const { error } = await supabase.from('video_assignments').insert(payloads);
      if (error) throw error;
      toast({ title: '✅ Programme envoyé', description: `Assigné à ${payloads.length} ${mode === 'individual' ? 'personne(s)' : 'service(s)'}` });
      setAssignmentName(''); setDeadline('');
      setSelectedStaffIds(new Set()); setSelectedServices(new Set());
      setSelectedVideoIds(new Set()); setSelectedChainId(null);
      queryClient.invalidateQueries({ queryKey: ['video_assignments'] });
    } catch (err: any) { toast({ title: 'Erreur', description: err.message, variant: 'destructive' }); }
    finally { setIsSending(false); }
  };

  // ── FIX 1 : handleSetOnboarding corrigé ──────────────────────────────────
  const handleSetOnboarding = async () => {
    // Détermine les IDs vidéos selon le contentMode
    let videoIdsToSet: string[];
    if (contentMode === 'videos') {
      if (selectedVideoIds.size === 0) {
        toast({ title: 'Sélectionnez au moins une vidéo', variant: 'destructive' }); return;
      }
      videoIdsToSet = Array.from(selectedVideoIds);
    } else {
      // mode 'okr'
      if (!selectedChainId) {
        toast({ title: 'Sélectionnez une chaîne de vidéos', variant: 'destructive' }); return;
      }
      const chain = chains.find(c => c.id === selectedChainId);
      if (!chain || chain.video_ids.length === 0) {
        toast({ title: 'Cette chaîne ne contient aucune vidéo', variant: 'destructive' }); return;
      }
      videoIdsToSet = chain.video_ids;
    }
    setIsSending(true);
    try {
      // 1. Tout mettre à false
      const { error: e1 } = await supabase
        .from('platform_tutorial_videos')
        .update({ is_onboarding: false })
        .neq('id', '00000000-0000-0000-0000-000000000000');
      if (e1) throw e1;
      // 2. Mettre les sélectionnées à true
      const { error: e2 } = await supabase
        .from('platform_tutorial_videos')
        .update({ is_onboarding: true })
        .in('id', videoIdsToSet);
      if (e2) throw e2;
      // 3. Créer une entrée dans video_assignments pour la traçabilité Suivi
      const onboardingBase = {
        assignment_name: assignmentName.trim() || `Écran d'accueil Sokle — ${new Date().toLocaleDateString('fr-FR')}`,
        video_ids: contentMode === 'videos' ? Array.from(selectedVideoIds) : [],
        chain_id: contentMode === 'okr' ? selectedChainId : null,
        deadline: deadlineMode === 'date' ? (deadline || null) : null,
        duration_days: deadlineMode === 'duration' ? duration : null,
        status: 'pending',
      };
      const onboardingPayloads =
        mode === 'service' && selectedServices.size > 0
          ? Array.from(selectedServices).map(svc => ({ ...onboardingBase, service: svc, assigned_to: null }))
          : mode === 'individual' && selectedStaffIds.size > 0
          ? Array.from(selectedStaffIds).map(id => ({ ...onboardingBase, assigned_to: id, service: null }))
          : [{ ...onboardingBase, assigned_to: null, service: null }];
      const { error: e3 } = await supabase.from('video_assignments').insert(onboardingPayloads);
      if (e3) throw e3;
      toast({
        title: '✅ Vidéos d\'accueil mises à jour',
        description: `${videoIdsToSet.length} vidéo${videoIdsToSet.length > 1 ? 's' : ''} définie${videoIdsToSet.length > 1 ? 's' : ''} comme écran d'accueil Sokle`,
      });
      setSelectedVideoIds(new Set());
      setSelectedChainId(null);
      queryClient.invalidateQueries({ queryKey: ['platform_tutorial_videos_admin'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding_videos'] });
      queryClient.invalidateQueries({ queryKey: ['video_assignments'] });
    } catch (err: any) { toast({ title: 'Erreur', description: err.message, variant: 'destructive' }); }
    finally { setIsSending(false); }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* ── Colonne gauche ── */}
      <div className="flex flex-col gap-4">

        {/* Mode d'attribution */}
        <div className="rounded-xl border p-4" style={cardStyle}>
          <p className="text-xs font-medium mb-3" style={{ color: 'rgba(187,165,122,0.6)' }}>Mode d'attribution</p>
          <div className="flex rounded-lg p-0.5" style={{ backgroundColor: 'rgba(15,12,36,0.6)', border: '1px solid rgba(187,165,122,0.12)' }}>
            {([['individual', User, 'Individuelle'], ['service', Layers, 'Par service']] as const).map(([m, Icon, label]) => (
              <button key={m} onClick={() => setMode(m)}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all"
                style={{ backgroundColor: mode === m ? 'rgba(187,165,122,0.18)' : 'transparent', color: mode === m ? '#BBA57A' : 'rgba(187,165,122,0.4)' }}>
                <Icon className="h-4 w-4" />{label}
              </button>
            ))}
          </div>
        </div>

        {/* Nom + cible + deadline */}
        <div className="rounded-xl border p-4 flex flex-col gap-3" style={cardStyle}>
          {/* Nom */}
          <div>
            <label className="text-xs block mb-1.5" style={{ color: 'rgba(187,165,122,0.6)' }}>Nom du programme</label>
            <input type="text" placeholder="Ex: Onboarding Réception — Printemps 2025"
              value={assignmentName} onChange={e => setAssignmentName(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none border placeholder:text-white/20" style={inputStyle} />
          </div>

          {/* Individuel — dropdown multi-select */}
          {mode === 'individual' && (
            <div className="relative">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs" style={{ color: 'rgba(187,165,122,0.6)' }}>Personnes assignées</label>
                <div className="flex items-center gap-2">
                  {selectedStaffIds.size > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: 'rgba(187,165,122,0.15)', color: '#BBA57A' }}>
                      {selectedStaffIds.size} sélectionné{selectedStaffIds.size > 1 ? 'e·s' : 'e'}
                    </span>
                  )}
                  <button onClick={() => setShowStaffDropdown(v => !v)} className="text-xs"
                    style={{ color: 'rgba(187,165,122,0.5)' }}>
                    {showStaffDropdown ? '▴ Fermer' : '▾ Ouvrir'}
                  </button>
                </div>
              </div>
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
              <div className="flex items-center gap-2 rounded-lg px-3 py-2 border cursor-pointer"
                style={inputStyle} onClick={() => setShowStaffDropdown(v => !v)}>
                <User className="h-4 w-4 flex-shrink-0" style={{ color: 'rgba(187,165,122,0.5)' }} />
                <span className="flex-1 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>Rechercher et sélectionner…</span>
                <ChevronDown className="h-4 w-4" style={{ color: 'rgba(187,165,122,0.4)' }} />
              </div>
              {showStaffDropdown && (
                <div className="absolute z-20 mt-1 w-full rounded-xl border overflow-hidden shadow-2xl"
                  style={{ backgroundColor: '#1a1630', borderColor: 'rgba(187,165,122,0.25)' }}>
                  <div className="p-2 flex gap-2">
                    <input autoFocus type="text" placeholder="Rechercher…" value={staffSearch}
                      onChange={e => setStaffSearch(e.target.value)}
                      className="flex-1 rounded-lg px-3 py-1.5 text-sm outline-none border placeholder:text-white/20" style={inputStyle} />
                    <button
                      onClick={() => {
                        const allSel = filteredStaff.every(s => selectedStaffIds.has(s.id));
                        if (allSel) setSelectedStaffIds(prev => { const n = new Set(prev); filteredStaff.forEach(s => n.delete(s.id)); return n; });
                        else setSelectedStaffIds(prev => { const n = new Set(prev); filteredStaff.forEach(s => n.add(s.id)); return n; });
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium flex-shrink-0"
                      style={{ backgroundColor: 'rgba(187,165,122,0.15)', color: '#BBA57A', border: '1px solid rgba(187,165,122,0.25)' }}>
                      {filteredStaff.every(s => selectedStaffIds.has(s.id)) ? 'Désél.' : 'Tout'}
                    </button>
                  </div>
                  <div className="max-h-52 overflow-y-auto">
                    {filteredStaff.map(s => {
                      const isSel = selectedStaffIds.has(s.id);
                      const name = s.full_name || `${s.first_name} ${s.last_name}`;
                      return (
                        <button key={s.id} onClick={() => toggleStaff(s.id)}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left transition-colors"
                          style={{ backgroundColor: isSel ? 'rgba(187,165,122,0.08)' : 'transparent' }}>
                          <div className="h-4 w-4 rounded flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: isSel ? '#BBA57A' : 'transparent', border: `1.5px solid ${isSel ? '#BBA57A' : 'rgba(187,165,122,0.3)'}` }}>
                            {isSel && <CheckCircle2 className="h-3 w-3 text-white" />}
                          </div>
                          <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ backgroundColor: 'rgba(187,165,122,0.15)', color: '#BBA57A' }}>
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
                    <button onClick={() => setShowStaffDropdown(false)} className="w-full py-1.5 rounded-lg text-xs font-medium"
                      style={{ backgroundColor: 'rgba(187,165,122,0.15)', color: '#BBA57A' }}>
                      Confirmer ({selectedStaffIds.size})
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Par service */}
          {mode === 'service' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs" style={{ color: 'rgba(187,165,122,0.6)' }}>Services cibles</label>
                <button
                  onClick={() => { if (selectedServices.size === SERVICES.length) setSelectedServices(new Set()); else setSelectedServices(new Set(SERVICES)); }}
                  className="text-xs" style={{ color: 'rgba(187,165,122,0.5)' }}>
                  {selectedServices.size === SERVICES.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {SERVICES.map(svc => {
                  const isSel = selectedServices.has(svc);
                  return (
                    <button key={svc} onClick={() => toggleService(svc)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5"
                      style={{
                        backgroundColor: isSel ? 'rgba(187,165,122,0.2)' : 'rgba(15,12,36,0.6)',
                        color: isSel ? '#BBA57A' : 'rgba(187,165,122,0.45)',
                        border: `1px solid ${isSel ? 'rgba(187,165,122,0.5)' : 'rgba(187,165,122,0.15)'}`,
                      }}>
                      {isSel && <CheckCircle2 className="h-3 w-3" />}{svc}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Deadline / Durée */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              {(['date', 'duration'] as const).map(m => (
                <button key={m} onClick={() => setDeadlineMode(m)}
                  className="text-xs font-medium flex items-center gap-1.5 transition-all"
                  style={{ color: deadlineMode === m ? '#BBA57A' : 'rgba(187,165,122,0.4)' }}>
                  {m === 'date' ? <><Calendar className="h-3.5 w-3.5" />Date limite</> : <><Clock className="h-3.5 w-3.5" />Durée</>}
                </button>
              ))}
            </div>
            {deadlineMode === 'date' ? (
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'rgba(187,165,122,0.45)' }} />
                <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
                  className="w-full rounded-lg pl-9 pr-3 py-2 text-sm outline-none border"
                  style={{ ...inputStyle, colorScheme: 'dark' }} />
              </div>
            ) : (
              <select value={duration} onChange={e => setDuration(Number(e.target.value))}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none border"
                style={{ ...inputStyle, cursor: 'pointer' }}>
                {DURATION_OPTIONS.map(d => <option key={d} value={d}>{d} jours</option>)}
              </select>
            )}
          </div>
        </div>

        {/* Boutons actions */}
        <div className="flex flex-col gap-2">
          <button onClick={handleSetOnboarding} disabled={isSending || (contentMode === 'videos' ? selectedVideoIds.size === 0 : !selectedChainId)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
            style={{
              backgroundColor: (contentMode === 'videos' ? selectedVideoIds.size > 0 : !!selectedChainId) ? 'rgba(187,165,122,0.2)' : 'rgba(187,165,122,0.07)',
              color: (contentMode === 'videos' ? selectedVideoIds.size > 0 : !!selectedChainId) ? '#BBA57A' : 'rgba(187,165,122,0.3)',
              border: `1px solid ${(contentMode === 'videos' ? selectedVideoIds.size > 0 : !!selectedChainId) ? 'rgba(187,165,122,0.4)' : 'rgba(187,165,122,0.15)'}`,
            }}>
            {isSending
              ? <><Loader2 className="h-4 w-4 animate-spin" /> En cours…</>
              : <><Monitor className="h-4 w-4" /> Changer les vidéos d'entrée sur Sokle</>}
          </button>
          <button disabled
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold cursor-not-allowed"
            style={{
              backgroundColor: 'rgba(96,165,250,0.05)',
              color: 'rgba(96,165,250,0.3)',
              border: '1px solid rgba(96,165,250,0.1)',
            }}>
            <Send className="h-4 w-4" />
            Envoyer le programme par mail ou whatsapp
          </button>
        </div>
      </div>

      {/* ── Colonne droite : sélecteur de contenus ── */}
      <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ ...cardStyle, maxHeight: '75vh' }}>
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium" style={{ color: 'rgba(187,165,122,0.6)' }}>Sélectionner des contenus</p>
          <span className="text-xs" style={{ color: 'rgba(187,165,122,0.35)' }}>
            {contentMode === 'videos' ? `${selectedVideoIds.size} vidéo${selectedVideoIds.size > 1 ? 's' : ''}` : selectedChainId ? '1 chaîne' : '0 chaîne'}
          </span>
        </div>

        {/* Toggle Vidéos / OKR */}
        <div className="flex rounded-lg p-0.5" style={{ backgroundColor: 'rgba(15,12,36,0.6)', border: '1px solid rgba(187,165,122,0.12)' }}>
          {([['videos', Video, 'Vidéos'], ['okr', null, '🔗 Chaîne de vidéos']] as const).map(([m, Icon, label]) => (
            <button key={m} onClick={() => setContentMode(m as ContentSelectorMode)}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all"
              style={{ backgroundColor: contentMode === m ? 'rgba(187,165,122,0.18)' : 'transparent', color: contentMode === m ? '#BBA57A' : 'rgba(187,165,122,0.4)' }}>
              {Icon && <Icon className="h-4 w-4" />}{label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'rgba(187,165,122,0.4)' }} />
          <input type="text"
            placeholder={contentMode === 'videos' ? 'Filtrer par titre ou catégorie…' : 'Filtrer les chaînes…'}
            value={contentSearch} onChange={e => setContentSearch(e.target.value)}
            className="w-full rounded-lg pl-9 pr-3 py-2 text-sm outline-none border placeholder:text-white/20" style={inputStyle} />
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
          {contentMode === 'videos' ? (
            filteredVideos.map(v => {
              const cfg = getCatCfg(v.category);
              const added = selectedVideoIds.has(v.id);
              return (
                <button key={v.id} onClick={() => toggleVideo(v.id)}
                  className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 border text-left transition-all"
                  style={{
                    backgroundColor: added ? 'rgba(74,222,128,0.06)' : 'rgba(15,12,36,0.5)',
                    borderColor: added ? 'rgba(74,222,128,0.25)' : 'rgba(187,165,122,0.12)',
                  }}>
                  <div className="h-8 w-8 rounded-md flex items-center justify-center text-sm flex-shrink-0"
                    style={{ backgroundColor: cfg.iconBg }}>{cfg.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{v.title}</p>
                    <p className="text-xs truncate" style={{ color: 'rgba(187,165,122,0.5)' }}>{v.category}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: cfg.iconBg, color: cfg.color, border: `1px solid ${cfg.color}40` }}>
                      {v.category}
                    </span>
                    {added
                      ? <CheckCircle2 className="h-4 w-4" style={{ color: '#4ade80' }} />
                      : <Plus className="h-4 w-4" style={{ color: 'rgba(187,165,122,0.4)' }} />}
                  </div>
                </button>
              );
            })
          ) : filteredChains.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Target className="h-8 w-8 mb-2 opacity-20" style={{ color: '#BBA57A' }} />
              <p className="text-sm" style={{ color: 'rgba(187,165,122,0.4)' }}>Aucune chaîne OKR créée</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(187,165,122,0.3)' }}>Créez des chaînes dans l'onglet Team Focus</p>
            </div>
          ) : (
            filteredChains.map(chain => {
              const isSel = selectedChainId === chain.id;
              return (
                <button key={chain.id} onClick={() => setSelectedChainId(isSel ? null : chain.id)}
                  className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 border text-left transition-all"
                  style={{
                    backgroundColor: isSel ? 'rgba(187,165,122,0.1)' : 'rgba(15,12,36,0.5)',
                    borderColor: isSel ? 'rgba(187,165,122,0.4)' : 'rgba(187,165,122,0.12)',
                  }}>
                  <div className="h-8 w-8 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'rgba(187,165,122,0.12)' }}>
                    <Target className="h-4 w-4" style={{ color: '#BBA57A' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{chain.name}</p>
                    <p className="text-xs" style={{ color: 'rgba(187,165,122,0.5)' }}>
                      {chain.video_ids.length} vidéo{chain.video_ids.length > 1 ? 's' : ''}
                    </p>
                  </div>
                  {isSel
                    ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: '#4ade80' }} />
                    : <Plus className="h-4 w-4 flex-shrink-0" style={{ color: 'rgba(187,165,122,0.4)' }} />}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tab : Suivi ─────────────────────────────────────────────────────────────

interface VideoAssignment {
  id: string;
  assignment_name: string;
  video_ids: string[];
  chain_id: string | null;
  assigned_to: string | null;
  service: string | null;
  deadline: string | null;
  duration_days: number | null;
  status: string;
  created_at: string;
}

function daysRemaining(a: VideoAssignment): number | null {
  if (a.deadline) {
    const diff = new Date(a.deadline).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
  if (a.duration_days && a.created_at) {
    const end = new Date(a.created_at).getTime() + a.duration_days * 86400000;
    return Math.ceil((end - Date.now()) / (1000 * 60 * 60 * 24));
  }
  return null;
}

function TabSuivi() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [serviceFilter, setServiceFilter] = useState('all');
  const [search, setSearch] = useState('');

  const { data: assignments = [], isLoading: loadingA } = useQuery({
    queryKey: ['video_assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('video_assignments')
        .select('id, assignment_name, video_ids, chain_id, assigned_to, service, deadline, duration_days, status, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as VideoAssignment[];
    },
    staleTime: 1000 * 30,
  });

  const { data: staffMap = {} } = useQuery({
    queryKey: ['staff_map_suivi'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_directory')
        .select('id, full_name, first_name, last_name, service, is_active');
      if (error) throw error;
      const map: Record<string, { name: string; service: string; isActive: boolean }> = {};
      for (const s of data) {
        map[s.id] = {
          name: s.full_name || `${s.first_name ?? ''} ${s.last_name ?? ''}`.trim(),
          service: s.service ?? '',
          isActive: s.is_active ?? true,
        };
      }
      return map;
    },
  });

  const { data: videos = [] } = useVideos();
  const { data: chains = [] } = useChains();

  const videoMap = useMemo(() => {
    const m: Record<string, string> = {};
    videos.forEach(v => { m[v.id] = v.title; });
    return m;
  }, [videos]);

  const chainMap = useMemo(() => {
    const m: Record<string, string> = {};
    chains.forEach(c => { m[c.id] = c.name; });
    return m;
  }, [chains]);

  const filtered = useMemo(() => assignments.filter(a => {
    if (serviceFilter === 'actifs') {
      if (a.status === 'completed') return false;
      const r = daysRemaining(a);
      if (r !== null && r < 0) return false;
    } else if (serviceFilter === 'passes') {
      const r = daysRemaining(a);
      const isOverdue = r !== null && r < 0 && a.status !== 'completed';
      if (!isOverdue && a.status !== 'completed') return false;
    } else if (serviceFilter !== 'all') {
      const svc = a.service ?? staffMap[a.assigned_to ?? '']?.service ?? '';
      if (svc !== serviceFilter) return false;
    }
    if (search) {
      const name = a.assigned_to ? (staffMap[a.assigned_to]?.name ?? '') : (a.service ?? '');
      if (!a.assignment_name.toLowerCase().includes(search.toLowerCase()) &&
          !name.toLowerCase().includes(search.toLowerCase())) return false;
    }
    return true;
  }), [assignments, serviceFilter, search, staffMap]);

  const activeCount = useMemo(() => assignments.filter(a => {
    if (a.status === 'completed') return false;
    const r = daysRemaining(a);
    return r === null || r >= 0;
  }).length, [assignments]);

  const aChanger = useMemo(() => assignments.filter(a => {
    if (a.status === 'completed') return false;
    const r = daysRemaining(a);
    return r !== null && r < 0;
  }).length, [assignments]);

  const handleDeleteAssignment = async (id: string, name: string) => {
    if (!window.confirm(`Supprimer le programme « ${name} » définitivement ?`)) return;
    try {
      const { error } = await supabase.from('video_assignments').delete().eq('id', id);
      if (error) throw error;
      toast({ title: '✅ Programme supprimé', description: `« ${name} » a été supprimé.` });
      queryClient.invalidateQueries({ queryKey: ['video_assignments'] });
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  const unconfiguredStaff = useMemo(() => {
    const assignedIds = new Set(
      assignments.filter(a => a.assigned_to).map(a => a.assigned_to!)
    );
    const assignedServices = new Set(
      assignments.filter(a => a.service).map(a => a.service!)
    );
    const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const normAssignedServices = new Set(Array.from(assignedServices).map(norm));
    return Object.entries(staffMap)
      .filter(([id, s]) => s.isActive && !assignedIds.has(id) && !normAssignedServices.has(norm(s.service)))
      .sort((a, b) => a[1].service.localeCompare(b[1].service));
  }, [staffMap, assignments]);

  const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
    pending:     { label: 'Non démarré', color: 'rgba(187,165,122,0.7)', bg: 'rgba(187,165,122,0.1)' },
    in_progress: { label: 'En cours',   color: '#DEAE35',               bg: 'rgba(222,174,53,0.1)'  },
    completed:   { label: 'Complété',   color: '#4ade80',               bg: 'rgba(74,222,128,0.1)'  },
    overdue:     { label: 'En retard',  color: '#f87171',               bg: 'rgba(248,113,113,0.1)' },
  };

  return (
    <div className="flex flex-col gap-5">
      {/* KPI vidéos */}
      <div className="grid grid-cols-3 gap-3">
        {([
        ['Programmes',  assignments.length, Video,        '#BBA57A'],
        ['Actifs',      activeCount,        CheckCircle2, '#4ade80'],
        ['À changer',   aChanger,           AlertTriangle,'#DEAE35'],
        ] as const).map(([label, count, Icon, color]) => (
          <div key={label} className="rounded-xl border p-4 flex items-center gap-3" style={cardStyle}>
            <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}18` }}>
              <Icon className="h-4 w-4" style={{ color }} />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{count}</p>
              <p className="text-xs" style={{ color: 'rgba(187,165,122,0.55)' }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'rgba(187,165,122,0.4)' }} />
          <input type="text" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)}
            className="rounded-lg pl-9 pr-3 py-1.5 text-sm outline-none border placeholder:text-white/20"
            style={{ ...inputStyle, width: '200px' }} />
        </div>
        <select value={serviceFilter} onChange={e => setServiceFilter(e.target.value)}
          className="rounded-lg px-3 py-1.5 text-xs border outline-none"
          style={{ backgroundColor: 'rgba(15,12,36,0.7)', borderColor: 'rgba(187,165,122,0.25)', color: '#BBA57A', cursor: 'pointer' }}>
          <option value="all">Tous les services</option>
          <option value="actifs">Actifs</option>
          <option value="passes">Passés</option>
          <option value="Direction">Direction</option>
          <option value="Réception">Réception</option>
          <option value="Housekeeping">Housekeeping</option>
          <option value="Maintenance">Maintenance</option>
          <option value="Petit Dejeuner">Petit Dejeuner</option>
        </select>
        <span className="ml-auto text-xs" style={{ color: 'rgba(187,165,122,0.4)' }}>
          {filtered.length} assignation{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tableau */}
      {loadingA ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin" style={{ color: '#BBA57A' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border p-14 flex flex-col items-center justify-center text-center"
          style={{ backgroundColor: 'rgba(30,26,55,0.4)', borderColor: 'rgba(187,165,122,0.12)', borderStyle: 'dashed' }}>
          <BarChart2 className="h-10 w-10 mb-3 opacity-20" style={{ color: '#BBA57A' }} />
          <p className="text-white font-medium mb-1">Aucune assignation</p>
          <p className="text-xs" style={{ color: 'rgba(187,165,122,0.4)' }}>Créez des programmes dans l'onglet Attribution</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden" style={cardStyle}>
          {/* Header */}
          <div className="grid grid-cols-[2fr_2fr_1.5fr_1fr_1fr_36px] gap-4 px-5 py-3"
            style={{ backgroundColor: 'rgba(15,12,36,0.6)', borderBottom: '1px solid rgba(187,165,122,0.12)' }}>
            {['Collaborateur / Service', 'Programme · Contenus', 'Statut', 'Temps restant', 'Deadline', ''].map((h, i) => (
              <span key={i} className="text-xs font-medium" style={{ color: 'rgba(187,165,122,0.45)' }}>{h}</span>
            ))}
          </div>
          {/* Rows */}
          {filtered.map((a, idx) => {
            const personName = a.assigned_to ? (staffMap[a.assigned_to]?.name ?? 'Inconnu') : null;
            const targetLabel = personName ?? (a.service ? `Service : ${a.service}` : '—');
            const sCfg = STATUS_CFG[a.status] ?? STATUS_CFG['pending'];
            const remaining = daysRemaining(a);
            const isOverdue = remaining !== null && remaining < 0 && a.status !== 'completed';
            const contentLabels = a.chain_id
              ? [chainMap[a.chain_id] ?? 'Chaîne OKR']
              : a.video_ids.slice(0, 2).map(id => videoMap[id] ?? id).concat(a.video_ids.length > 2 ? [`+${a.video_ids.length - 2}`] : []);
            const deadlineStr = a.deadline
              ? new Date(a.deadline).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
              : a.duration_days ? `${a.duration_days}j` : '—';

            return (
              <div key={a.id}
              className="grid grid-cols-[2fr_2fr_1.5fr_1fr_1fr_36px] gap-4 px-5 py-3.5 items-center transition-colors hover:bg-white/[0.02]"
              style={{ borderBottom: idx < filtered.length - 1 ? '1px solid rgba(187,165,122,0.07)' : 'none' }}>
                {/* Cible */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: 'rgba(187,165,122,0.12)', color: '#BBA57A' }}>
                    {a.assigned_to ? <User className="h-3.5 w-3.5" /> : <Layers className="h-3.5 w-3.5" />}
                  </div>
                  <span className="text-sm text-white truncate">{targetLabel}</span>
                </div>
                {/* Programme */}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{a.assignment_name}</p>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {contentLabels.map((label, i) => (
                      <span key={i} className="text-xs px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: 'rgba(187,165,122,0.1)', color: 'rgba(187,165,122,0.7)' }}>
                        {a.chain_id ? '🎯' : '🎬'} {label}
                      </span>
                    ))}
                  </div>
                </div>
                {/* Statut */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full w-fit"
                  style={{ backgroundColor: sCfg.bg }}>
                  <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: sCfg.color }} />
                  <span className="text-xs font-medium" style={{ color: sCfg.color }}>{sCfg.label}</span>
                </div>
                {/* Temps restant */}
                <div>
                  {remaining === null ? (
                    <span className="text-xs" style={{ color: 'rgba(187,165,122,0.3)' }}>—</span>
                  ) : isOverdue ? (
                    <span className="flex items-center gap-1 text-xs" style={{ color: '#f87171' }}>
                      <AlertTriangle className="h-3 w-3" />{Math.abs(remaining)}j de retard
                    </span>
                  ) : (
                    <span className="text-xs font-semibold" style={{ color: remaining <= 2 ? '#DEAE35' : '#4ade80' }}>
                      {remaining}j restant{remaining > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                {/* Deadline */}
                <span className="text-sm" style={{ color: isOverdue ? '#f87171' : 'rgba(187,165,122,0.6)' }}>
                  {deadlineStr}
                </span>
                {/* Supprimer */}
                <button
                  onClick={() => handleDeleteAssignment(a.id, a.assignment_name)}
                  className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-red-500/20 transition-colors"
                  title="Supprimer ce programme">
                  <Trash2 className="h-3.5 w-3.5 text-red-400 opacity-50 hover:opacity-100" />
                </button>
              </div>
            );
          })}
        </div>
      )}
      {/* Non configurés */}
      {unconfiguredStaff.length > 0 && (
        <div className="rounded-xl border p-4 flex flex-col gap-3" style={cardStyle}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5" style={{ color: 'rgba(248,113,113,0.7)' }} />
            <p className="text-xs font-medium" style={{ color: 'rgba(248,113,113,0.7)' }}>
              Non configurés — {unconfiguredStaff.length} collaborateur{unconfiguredStaff.length > 1 ? 's' : ''} sans programme
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {unconfiguredStaff.map(([id, s]) => (
              <span key={id} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
                style={{ backgroundColor: 'rgba(248,113,113,0.08)', color: 'rgba(248,113,113,0.65)', border: '1px solid rgba(248,113,113,0.18)' }}>
                <User className="h-3 w-3 flex-shrink-0" />
                {s.name}{s.service ? ` · ${s.service}` : ''}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab : Role & Hierarchy ───────────────────────────────────────────────────

const HIERARCHY_COLORS: Record<string, { color: string; bg: string }> = {
  'Normal':    { color: 'rgba(187,165,122,0.7)', bg: 'rgba(187,165,122,0.1)'  },
  'Manager':   { color: '#DEAE35',               bg: 'rgba(222,174,53,0.12)'  },
  'Direction': { color: '#4ade80',               bg: 'rgba(74,222,128,0.1)'   },
};

interface EditValues {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  service: string;
  hierarchy: string;
}

function TabRoleHierarchy() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<EditValues>({
    first_name: '', last_name: '', email: '', phone: '', service: '', hierarchy: 'Normal',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');

  // ── Source : staff_directory complet (tous, actifs ou non) ──────────────
  const { data: staff = [], isLoading } = useQuery({
    queryKey: ['staff_directory_all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_directory')
        .select('id, first_name, last_name, full_name, email, phone, service, hierarchy, is_active')
        .order('first_name');
      if (error) throw error;
      return data as StaffRow[];
    },
  });

  const filtered = staff.filter(p => {
    if (!search) return true;
    const name = (p.full_name || `${p.first_name ?? ''} ${p.last_name ?? ''}`).toLowerCase();
    return name.includes(search.toLowerCase()) || (p.email ?? '').toLowerCase().includes(search.toLowerCase());
  });

  const openEdit = (p: StaffRow) => {
    setEditingId(p.id);
    setEditValues({
      first_name: p.first_name ?? '',
      last_name:  p.last_name  ?? '',
      email:      p.email      ?? '',
      phone:      p.phone      ?? '',
      service:    p.service    ?? '',
      hierarchy:  p.hierarchy  ?? 'Normal',
    });
  };

  const handleDelete = async (p: StaffRow, displayName: string) => {
    if (!window.confirm(`Supprimer « ${displayName} » définitivement ?\n\nCette action est irréversible.`)) return;
    try {
      const { error } = await supabase.from('staff_directory').delete().eq('id', p.id);
      if (error) throw error;
      toast({ title: '✅ Collaborateur supprimé', description: `« ${displayName} » a été retiré du staff.` });
      queryClient.invalidateQueries({ queryKey: ['staff_directory_all'] });
      queryClient.invalidateQueries({ queryKey: ['staff_directory_active'] });
      queryClient.invalidateQueries({ queryKey: ['staff_directory_count'] });
    } catch (err: any) {
      toast({ title: 'Erreur suppression', description: err.message, variant: 'destructive' });
    }
  };

  const saveEdit = async (id: string) => {
    setIsSaving(true);
    try {
      const fullName = `${editValues.first_name.trim()} ${editValues.last_name.trim()}`.trim();

      // 1. Mettre à jour staff_directory (source de vérité RH)
      const { error: sdErr } = await supabase
        .from('staff_directory')
        .update({
          first_name: editValues.first_name.trim() || null,
          last_name:  editValues.last_name.trim()  || null,
          full_name:  fullName || null,
          email:      editValues.email.trim()  || null,
          phone:      editValues.phone.trim()  || null,
          service:    editValues.service       || null,
          hierarchy:  editValues.hierarchy     || 'Normal',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (sdErr) throw sdErr;

      // 2. Synchroniser tous les champs pertinents dans profiles (via staff_directory_id)
      await supabase
        .from('profiles')
        .update({
          first_name: editValues.first_name.trim() || null,
          last_name:  editValues.last_name.trim()  || null,
          service:    editValues.service           || null,
          hierarchy:  editValues.hierarchy         || 'Normal',
        })
        .eq('staff_directory_id', id);

      toast({ title: '✅ Collaborateur mis à jour' });
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['staff_directory_all'] });
      queryClient.invalidateQueries({ queryKey: ['staff_directory_active'] });
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally { setIsSaving(false); }
  };

  const inputSm: React.CSSProperties = {
    ...inputStyle, padding: '5px 8px', borderRadius: '6px', fontSize: '12px', width: '100%',
  };
  const selectSm: React.CSSProperties = { ...inputSm, cursor: 'pointer' };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm text-white font-medium">Gestion des rôles et hiérarchies</p>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(187,165,122,0.5)' }}>
          Modifiez les informations, le service et la hiérarchie de chaque membre du staff.
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'rgba(187,165,122,0.4)' }} />
        <input type="text" placeholder="Rechercher un collaborateur…" value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-lg pl-9 pr-3 py-2 text-sm outline-none border placeholder:text-white/20"
          style={inputStyle} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#BBA57A' }} />
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden" style={cardStyle}>

          {/* ── Header ── */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_100px] gap-3 px-5 py-3"
            style={{ backgroundColor: 'rgba(15,12,36,0.6)', borderBottom: '1px solid rgba(187,165,122,0.12)' }}>
            {['Collaborateur', 'Email / Téléphone', 'Service', 'Hiérarchie', ''].map((h, i) => (
              <span key={i} className="text-xs font-medium" style={{ color: 'rgba(187,165,122,0.45)' }}>{h}</span>
            ))}
          </div>

          {/* ── Rows ── */}
          {filtered.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center">
              <Users className="h-8 w-8 mb-2 opacity-20" style={{ color: '#BBA57A' }} />
              <p className="text-sm text-white opacity-40">Aucun collaborateur trouvé</p>
            </div>
          ) : filtered.map((p, idx) => {
            const displayName = (p.full_name || `${p.first_name ?? ''} ${p.last_name ?? ''}`).trim() || p.email || '—';
            const isEditing = editingId === p.id;
            const hiCfg = HIERARCHY_COLORS[p.hierarchy ?? 'Normal'] ?? HIERARCHY_COLORS['Normal'];

            return (
              <div key={p.id} style={{ borderBottom: idx < filtered.length - 1 ? '1px solid rgba(187,165,122,0.07)' : 'none' }}>

                {/* ── Ligne normale ── */}
                {!isEditing && (
                  <div className="grid grid-cols-[2fr_1fr_1fr_1fr_100px] gap-3 px-5 py-3 items-center transition-colors hover:bg-white/[0.02]">
                    {/* Identité */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 relative"
                        style={{ backgroundColor: 'rgba(187,165,122,0.12)', color: '#BBA57A' }}>
                        {(displayName[0] || '?').toUpperCase()}
                        {!p.is_active && (
                          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border border-[#1E1A37]"
                            style={{ backgroundColor: 'rgba(248,113,113,0.8)' }} title="Inactif" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">{displayName}</p>
                        <p className="text-xs" style={{ color: 'rgba(187,165,122,0.35)' }}>
                          {p.is_active ? 'Actif' : 'Inactif'}
                        </p>
                      </div>
                    </div>
                    {/* Email / Phone */}
                    <div className="min-w-0">
                      <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.6)' }}>{p.email || '—'}</p>
                      <p className="text-xs truncate" style={{ color: 'rgba(187,165,122,0.4)' }}>{p.phone || '—'}</p>
                    </div>
                    {/* Service */}
                    <span className="text-sm truncate"
                      style={{ color: p.service ? 'rgba(255,255,255,0.8)' : 'rgba(187,165,122,0.3)' }}>
                      {p.service || '—'}
                    </span>
                    {/* Hiérarchie */}
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full w-fit"
                      style={{ backgroundColor: hiCfg.bg, color: hiCfg.color }}>
                      {p.hierarchy ?? 'Normal'}
                    </span>
                    {/* Action */}
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(p)}
                        className="h-7 w-7 rounded-md flex items-center justify-center transition-colors hover:bg-white/10"
                        style={{ color: 'rgba(187,165,122,0.4)' }}>
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(p, displayName)}
                        className="h-7 w-7 rounded-md flex items-center justify-center transition-colors hover:bg-red-500/20"
                        title="Supprimer ce collaborateur">
                        <Trash2 className="h-3.5 w-3.5 text-red-400 opacity-50 hover:opacity-100" />
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Ligne en édition (panel inline) ── */}
                {isEditing && (
                  <div className="px-5 py-4 flex flex-col gap-4"
                    style={{ backgroundColor: 'rgba(15,12,36,0.5)', borderLeft: '2px solid rgba(187,165,122,0.35)' }}>

                    {/* Titre */}
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold" style={{ color: '#BBA57A' }}>Modifier le collaborateur</p>
                      <button onClick={() => setEditingId(null)}
                        className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-red-500/20 transition-colors">
                        <X className="h-3.5 w-3.5 text-red-400" />
                      </button>
                    </div>

                    {/* Champs */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs block mb-1" style={{ color: 'rgba(187,165,122,0.55)' }}>Prénom</label>
                        <input type="text" value={editValues.first_name}
                          onChange={e => setEditValues(v => ({ ...v, first_name: e.target.value }))}
                          className="outline-none" style={inputSm}
                          placeholder="Prénom" />
                      </div>
                      <div>
                        <label className="text-xs block mb-1" style={{ color: 'rgba(187,165,122,0.55)' }}>Nom</label>
                        <input type="text" value={editValues.last_name}
                          onChange={e => setEditValues(v => ({ ...v, last_name: e.target.value }))}
                          className="outline-none" style={inputSm}
                          placeholder="Nom" />
                      </div>
                      <div>
                        <label className="text-xs block mb-1" style={{ color: 'rgba(187,165,122,0.55)' }}>Email</label>
                        <input type="email" value={editValues.email}
                          onChange={e => setEditValues(v => ({ ...v, email: e.target.value }))}
                          className="outline-none" style={inputSm}
                          placeholder="email@hotel.com" />
                      </div>
                      <div>
                        <label className="text-xs block mb-1" style={{ color: 'rgba(187,165,122,0.55)' }}>Téléphone</label>
                        <input type="text" value={editValues.phone}
                          onChange={e => setEditValues(v => ({ ...v, phone: e.target.value }))}
                          className="outline-none" style={inputSm}
                          placeholder="+33 6 00 00 00 00" />
                      </div>
                      <div>
                        <label className="text-xs block mb-1" style={{ color: 'rgba(187,165,122,0.55)' }}>Service</label>
                        <select value={editValues.service}
                          onChange={e => setEditValues(v => ({ ...v, service: e.target.value }))}
                          className="outline-none" style={selectSm}>
                          <option value="">— Aucun —</option>
                          {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs block mb-1" style={{ color: 'rgba(187,165,122,0.55)' }}>Hiérarchie</label>
                        <select value={editValues.hierarchy}
                          onChange={e => setEditValues(v => ({ ...v, hierarchy: e.target.value }))}
                          className="outline-none" style={selectSm}>
                          {HIERARCHY_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Bouton save */}
                    <div className="flex justify-end">
                      <button onClick={() => saveEdit(p.id)} disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
                        style={{ backgroundColor: 'rgba(187,165,122,0.2)', color: '#BBA57A', border: '1px solid rgba(187,165,122,0.4)' }}>
                        {isSaving
                          ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sauvegarde…</>
                          : <><Save className="h-3.5 w-3.5" /> Sauvegarder</>
                        }
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'role-hierarchy', label: 'Role & Hierarchy', icon: Shield   },
  { id: 'video-briefs',   label: 'Video Briefs',     icon: Video    },
  { id: 'team-focus',     label: 'Team Focus',       icon: Target   },
  { id: 'attribution',    label: 'Attribution',      icon: Users    },
  { id: 'suivi',          label: 'Suivi',            icon: BarChart2},
];

export default function TeamManagement() {
  const [activeTab, setActiveTab] = useState<TabId>('role-hierarchy');
  const [editVideoId, setEditVideoId] = useState<string | null>(null);

  const { data: videos = [] } = useVideos();
  const { data: chains = [] } = useChains();

  const { data: staffCount = 0 } = useQuery({
    queryKey: ['staff_directory_count'],
    queryFn: async () => {
      const { count, error } = await supabase.from('staff_directory').select('*', { count: 'exact', head: true });
      if (error) throw error; return count ?? 0;
    },
  });

  const categoryCount = useMemo(() => new Set(videos.map(v => v.category)).size, [videos]);

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <Users className="h-6 w-6" style={{ color: '#BBA57A' }} />
            <h1 className="text-2xl font-semibold text-white">Team Management</h1>
          </div>
          <p className="text-sm" style={{ color: 'rgba(187,165,122,0.5)' }}>
            Vidéos · Chaînes OKR · Attribution · Rôles & hiérarchie
          </p>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <KpiCard label="Vidéos disponibles" value={videos.length} icon={Video}  accent="#BBA57A" />
          <KpiCard label="Catégories"          value={categoryCount}  icon={Star}   accent="#DEAE35" />
          <KpiCard label="Chaînes de vidéos"   value={chains.length}  icon={Target} accent="#E0D3B4" />
          <KpiCard label="Collaborateurs"      value={staffCount}     icon={User}   accent="#4ade80" />
        </div>

        {/* Tab Nav */}
        <div className="flex items-center gap-1 p-1 rounded-xl mb-6 w-fit"
          style={{ backgroundColor: 'rgba(15,12,36,0.6)', border: '1px solid rgba(187,165,122,0.12)' }}>
          {TABS.map(tab => (
            <TabButton key={tab.id} label={tab.label} icon={tab.icon}
              active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} />
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'video-briefs'   && <TabVideoBriefs onEditVideo={(id) => { setEditVideoId(id); }} />}
        {activeTab === 'team-focus'     && <TabTeamFocus />}
        {activeTab === 'attribution'    && <TabAttribution />}
        {activeTab === 'suivi'          && <TabSuivi />}
        {activeTab === 'role-hierarchy' && <TabRoleHierarchy />}

      </div>

      {/* Bouton flottant upload vidéo */}
      <UploadTutorialVideo
        forceOpen={!!editVideoId}
        initialVideoId={editVideoId}
        onForceClose={() => setEditVideoId(null)}
      />

    </AdminLayout>
  );
}

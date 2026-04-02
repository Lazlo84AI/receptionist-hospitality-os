import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, ExternalLink, FileText, FileImage, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts';
import { supabase } from '@/integrations/supabase/client';

interface DocumentData {
  id: string;
  document_title: string;
  document_name: string;
  document_url: string;
  topic: string;
  formation_steps: string;
  created_at: string;
}

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentData | null;
}

// Composant interne pour le viewer de documents
interface DocumentViewerProps {
  document: DocumentData;
  fileType: string;
}

const DocumentViewer = ({ document, fileType }: DocumentViewerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  console.log('🔍 DocumentViewer Debug:', {
    fileType,
    document_url: document.document_url,
    document_name: document.document_name,
    retryCount
  });

  const getViewerUrl = (type: string, url: string) => {
    switch (type) {
      case 'pdf':
        if (url.includes('supabase.co/storage')) {
          if (retryCount === 0) {
            return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
          } else if (retryCount === 1) {
            return `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(url)}`;
          } else {
            return url;
          }
        } else {
          if (retryCount === 0) {
            return url;
          } else if (retryCount === 1) {
            return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
          } else {
            return `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(url)}`;
          }
        }
      case 'word':
        if (retryCount === 0) {
          return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
        } else {
          return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
        }
      default:
        return url;
    }
  };

  const viewerUrl = getViewerUrl(fileType, document.document_url);

  console.log('🔗 Viewer URL générée:', viewerUrl);

  const handleIframeLoad = () => {
    console.log('✅ Iframe chargée avec succès');
    setIsLoading(false);
    setHasError(false);
  };

  const handleIframeError = () => {
    console.log('❌ Erreur de chargement iframe');
    setIsLoading(false);
    setHasError(true);
  };

  const handleRetry = () => {
    console.log('🔄 Retry #' + (retryCount + 1));
    setIsLoading(true);
    setHasError(false);
    setRetryCount(prev => prev + 1);
  };

  useEffect(() => {
    if (retryCount === 0) {
      fetch(document.document_url, { method: 'HEAD', mode: 'no-cors' })
        .then(() => console.log('🔗 URL accessible en HEAD request'))
        .catch(err => console.log('⚠️ URL inaccessible:', err.message));
    }
  }, [document.document_url, retryCount]);

  if (hasError) {
    return (
      <div className="h-full bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
        <div className="text-center text-gray-500 max-w-md">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-400" />
          <p className="text-lg font-medium mb-2 text-red-600">Erreur de chargement</p>
          <p className="text-sm mb-4">
            Impossible d'afficher le document dans le viewer intégré.
          </p>
          <div className="space-y-2">
            <Button
              variant="outline"
              onClick={handleRetry}
              className="mr-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer{retryCount > 0 && ` (${retryCount + 1})`}
            </Button>
            <Button
              onClick={() => window.open(document.document_url, '_blank')}
              className="bg-[#BBA57A] hover:bg-[#A89569] text-white"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Ouvrir dans un nouvel onglet
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white rounded-lg border border-gray-200 overflow-hidden relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="text-center">
            <Loader2 className="h-8 w-8 mx-auto mb-2 text-[#BBA57A] animate-spin" />
            <p className="text-sm text-gray-600">Chargement du document...</p>
            <p className="text-xs text-gray-500 mt-1">
              {fileType === 'pdf' ? 'PDF' : 'Document Word'}
            </p>
          </div>
        </div>
      )}

      <iframe
        key={`${document.id}-${retryCount}`}
        src={viewerUrl}
        className="w-full h-full border-0"
        title={`Viewer - ${document.document_title}`}
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      />
    </div>
  );
};

// ─── Types pour le radar ────────────────────────────────────────────────────
interface RadarPoint {
  label: string;
  currentScore: number;
  projectedScore: number;
}

// ─── Composant panneau radar (lecture seule) ────────────────────────────────
const FormationRadarPanel = ({ radarData }: { radarData: RadarPoint[] }) => {
  return (
    <div className="flex flex-col h-full bg-[#1E1A37] rounded-lg p-4 overflow-y-auto">
      <h3 className="text-white font-semibold text-sm mb-1">Impact sur tes compétences</h3>
      <p className="text-[#BBA57A] text-xs mb-4">Si tu obtiens 100% au QCM</p>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height={260}>
          <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
            <PolarGrid stroke="#BBA57A" opacity={0.25} />
            <PolarAngleAxis
              dataKey="label"
              tick={{ fill: '#BBA57A', fontSize: 10 }}
            />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#BBA57A', fontSize: 9 }} />

            {/* Couche gold — scores projetés après formation à 100% */}
            <Radar
              name="Après cette formation"
              dataKey="projectedScore"
              stroke="#BBA57A"
              fill="#BBA57A"
              fillOpacity={0.35}
            />

            {/* Couche bleue — scores actuels */}
            <Radar
              name="Scores actuels"
              dataKey="currentScore"
              stroke="#3B82F6"
              fill="#3B82F6"
              fillOpacity={0.45}
            />

            <Legend
              formatter={(value) => (
                <span style={{ color: '#E0D3B4', fontSize: '11px' }}>{value}</span>
              )}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Barres de delta */}
      <div className="mt-3 space-y-2">
        {radarData.map((point) => {
          const delta = point.projectedScore - point.currentScore;
          return (
            <div key={point.label} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[#E0D3B4] text-xs truncate max-w-[120px]">{point.label}</span>
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-[#3B82F6] font-medium">{point.currentScore}</span>
                  {delta > 0 && (
                    <>
                      <span className="text-gray-500">→</span>
                      <span className="text-[#BBA57A] font-bold">{point.projectedScore}</span>
                      <span className="text-[#DEAE35] text-xs">(+{delta})</span>
                    </>
                  )}
                </div>
              </div>
              <div className="h-1.5 bg-[#2A2448] rounded-full overflow-hidden relative">
                {/* Barre bleue actuelle */}
                <div
                  className="absolute h-full bg-[#3B82F6] rounded-full"
                  style={{ width: `${point.currentScore}%` }}
                />
                {/* Barre gold projetée (delta) */}
                {delta > 0 && (
                  <div
                    className="absolute h-full bg-[#BBA57A] rounded-full opacity-70"
                    style={{ left: `${point.currentScore}%`, width: `${delta}%` }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Modal principal ─────────────────────────────────────────────────────────
export const DocumentViewerModal = ({
  isOpen,
  onClose,
  document
}: DocumentViewerModalProps) => {

  const isMobile = useIsMobile();

  // ── États radar ──────────────────────────────────────────────────────────
  const [radarData, setRadarData] = useState<RadarPoint[]>([]);
  const [radarLoading, setRadarLoading] = useState(true);
  const [hasFormationMapping, setHasFormationMapping] = useState(false);

  // ── Fetch des données radar quand le document change ──────────────────────
  useEffect(() => {
    if (!document?.document_name || !isOpen) return;

    const fetchRadarData = async () => {
      setRadarLoading(true);
      setHasFormationMapping(false);
      setRadarData([]);

      try {
        // 1. Utilisateur connecté
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 2. Service de l'utilisateur
        const { data: staffData } = await supabase
          .from('staff_directory')
          .select('service')
          .eq('id', user.id)
          .single();

        const userService = staffData?.service;
        if (!userService) return;

        // 3. Axes du service (labels du radar)
        const { data: profileAxes } = await (supabase as any)
          .from('service_competency_profiles')
          .select('competency_key, label')
          .eq('service', userService);

        if (!profileAxes || profileAxes.length === 0) return;

        // 4. Scores actuels de l'employé
        const { data: compScores } = await (supabase as any)
          .from('competency_scores')
          .select('competency_key, current_score')
          .eq('employee_id', user.id);

        // 5. Poids de la formation pour ce document
        const { data: mappings } = await (supabase as any)
          .from('formation_criteria_mapping')
          .select('competency_key, weight')
          .eq('document_name', document.document_name);

        // Construction des maps
        const scoreMap: Record<string, number> = {};
        (compScores || []).forEach((row: any) => {
          scoreMap[row.competency_key] = Number(row.current_score) || 0;
        });

        const weightMap: Record<string, number> = {};
        (mappings || []).forEach((row: any) => {
          weightMap[row.competency_key] = Number(row.weight) || 0;
        });

        // DEBUG — à retirer après validation
        console.log('📄 document_name utilisé pour la query:', document.document_name);
        console.log('📊 Mappings trouvés:', mappings);
        console.log('🎯 Axes du service:', profileAxes);
        console.log('💯 Scores actuels:', compScores);

        // Vérifier si au moins un mapping existe
        const hasMappings = (mappings || []).length > 0;
        setHasFormationMapping(hasMappings);

        if (!hasMappings) return;

        // Construction des points radar
        const points: RadarPoint[] = profileAxes.map((axis: any) => {
          const current = scoreMap[axis.competency_key] ?? 0;
          const gain = weightMap[axis.competency_key] ?? 0;
          return {
            label: axis.label,
            currentScore: current,
            projectedScore: Math.min(100, current + gain),
          };
        });

        setRadarData(points);
      } catch (err) {
        console.error('❌ Erreur fetch radar DocumentViewerModal:', err);
      } finally {
        setRadarLoading(false);
      }
    };

    fetchRadarData();
  }, [document?.document_name, isOpen]);

  if (!document) return null;

  // Détection du type de fichier
  const getFileType = (filename: string) => {
    const extension = filename.toLowerCase().split('.').pop();
    switch (extension) {
      case 'pdf':
        return { type: 'pdf', icon: FileText, label: 'PDF' };
      case 'doc':
      case 'docx':
        return { type: 'word', icon: FileImage, label: 'Word' };
      default:
        return { type: 'unknown', icon: FileText, label: 'Document' };
    }
  };

  const getStepBadge = (steps: string) => {
    const stepLower = steps.toLowerCase();
    if (stepLower.includes('document original')) {
      return { label: 'Formation', color: 'bg-[#E0D3B4] text-[#BBA57A] border-[#BBA57A]' };
    } else if (stepLower.includes('session d\'entraînement')) {
      return { label: 'Entraînement', color: 'bg-[#BBA57A] text-white border-[#BBA57A]' };
    } else if (stepLower.includes('qcm généré')) {
      return { label: 'QCM Évaluation', color: 'bg-[#E0D3B4] text-[#BBA57A] border-[#BBA57A]' };
    } else if (stepLower.includes('mise en pratique')) {
      return { label: 'Mise en pratique', color: 'bg-[#BBA57A] text-white border-[#BBA57A]' };
    }
    return { label: 'Formation', color: 'bg-[#E0D3B4] text-[#BBA57A] border-[#BBA57A]' };
  };

  const fileInfo = getFileType(document.document_name);
  const stepInfo = getStepBadge(document.formation_steps);
  const IconComponent = fileInfo.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {isMobile ? (
        <div className="fixed inset-0 z-50 bg-black/50 overflow-hidden">
          <div className="h-full overflow-x-auto overflow-y-hidden">
            <div className="min-w-[150vw] w-[150vw] h-full flex items-center justify-center px-4">
              <div className="w-[140vw] h-[90vh] bg-white rounded-lg shadow-xl overflow-hidden relative">
                <ModalContent />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <DialogContent className="max-w-5xl h-[98vh] p-0 gap-0">
          <ModalContent />
        </DialogContent>
      )}
    </Dialog>
  );

  function ModalContent() {
    return (
      <>
        {/* Header */}
        <div className={cn(
          "border-b bg-gradient-to-r from-warm-cream to-soft-pewter/20",
          isMobile ? "px-4 py-2" : "px-6 py-1"
        )}>
          <div className="flex items-start justify-between">
            <div className={cn("flex-1", isMobile ? "pr-2" : "pr-4")}>
              <h2 className={cn(
                "font-semibold text-palace-navy mb-1 leading-tight",
                isMobile ? "text-base" : "text-lg"
              )}>
                {document.document_title}
              </h2>

              {!isMobile && (
                <>
                  <div className="flex items-center gap-3 mb-1">
                    <Badge className={cn("text-sm px-3 py-1 border", stepInfo.color)}>
                      {stepInfo.label}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <IconComponent className="h-4 w-4" />
                      <span>{fileInfo.label}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <span>{document.topic}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {document.document_name} • {new Date(document.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-600 hover:text-palace-navy flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Corps du modal */}
        <div className={cn(
          "flex-1 overflow-hidden flex flex-col",
          isMobile ? "p-2" : "p-4"
        )}>

          {/* Bouton Ouvrir */}
          <div className="flex justify-center mb-3">
            <Button
              variant="outline"
              size="lg"
              onClick={() => window.open(document.document_url, '_blank')}
              className="bg-[#BBA57A] hover:bg-[#A89569] text-white border-[#BBA57A] hover:border-[#A89569] px-6 py-2 font-medium"
            >
              <ExternalLink className="h-5 w-5 mr-2" />
              Ouvrir
            </Button>
          </div>

          {isMobile && (
            <div className="text-center mb-2">
              <p className="text-xs text-gray-500">
                👆 Glissez horizontalement pour explorer le document
              </p>
            </div>
          )}

          {/* Zone principale : PDF + Radar côte à côte (desktop uniquement) */}
          {!isMobile ? (
            <div className="flex-1 flex gap-4 min-h-0">

              {/* PDF — 40% si radar présent, 100% sinon */}
              <div className={cn(
                "flex flex-col min-h-0",
                hasFormationMapping ? "w-[40%]" : "flex-1"
              )}>
                <DocumentViewer
                  document={document}
                  fileType={fileInfo.type}
                />
              </div>

              {/* Radar — 60%, uniquement si mappings existent */}
              {hasFormationMapping && !radarLoading && radarData.length > 0 && (
                <div className="w-[60%] min-h-0">
                  <FormationRadarPanel radarData={radarData} />
                </div>
              )}

              {/* Loader radar */}
              {hasFormationMapping && radarLoading && (
                <div className="w-[60%] flex items-center justify-center bg-[#1E1A37] rounded-lg">
                  <div className="text-center">
                    <Loader2 className="h-6 w-6 mx-auto mb-2 text-[#BBA57A] animate-spin" />
                    <p className="text-[#BBA57A] text-sm">Chargement des compétences...</p>
                  </div>
                </div>
              )}

            </div>
          ) : (
            // Mobile : PDF plein écran (inchangé)
            <div className="flex-1">
              <DocumentViewer
                document={document}
                fileType={fileInfo.type}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        {!isMobile && (
          <div className="px-6 py-1 border-t bg-gray-50 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Document : {document.document_name}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Fermer
              </Button>
            </div>
          </div>
        )}
      </>
    );
  }
};

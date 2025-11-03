import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, ExternalLink, FileText, FileImage, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

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

  // DEBUG: Logs pour diagnostiquer
  console.log('🔍 DocumentViewer Debug:', {
    fileType,
    document_url: document.document_url,
    document_name: document.document_name,
    retryCount
  });

  // URLs pour les différents viewers
  const getViewerUrl = (type: string, url: string) => {
    switch (type) {
      case 'pdf':
        // Pour Supabase Storage, TOUJOURS utiliser un viewer externe
        if (url.includes('supabase.co/storage')) {
          if (retryCount === 0) {
            return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`; // Google PDF Viewer
          } else if (retryCount === 1) {
            return `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(url)}`; // PDF.js viewer
          } else {
            return url; // Dernier recours: URL directe
          }
        } else {
          // Pour autres sources, essayer URL directe d'abord
          if (retryCount === 0) {
            return url; // URL directe
          } else if (retryCount === 1) {
            return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
          } else {
            return `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(url)}`;
          }
        }
      case 'word':
        // Google Docs Viewer avec fallback vers Office Online
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

  // DEBUG: Log de l'URL finale
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

  // Test de connectivité de l'URL (pour diagnostic)
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
      
      {/* ZONE PDF PLEINE LARGEUR - SANS CENTRAGE */}
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

export const DocumentViewerModal = ({ 
  isOpen, 
  onClose, 
  document 
}: DocumentViewerModalProps) => {
  
  const isMobile = useIsMobile();
  
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

  // Détermination du type d'étape pour le badge
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
        <DialogContent className="max-w-4xl h-[98vh] p-0 gap-0">
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
            <div className={cn(
              "flex-1",
              isMobile ? "pr-2" : "pr-4"
            )}>
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

        {/* Corps du modal - Zone PDF FORMAT A4 PORTRAIT */}
        <div className={cn(
          "flex-1 overflow-hidden flex flex-col",
          isMobile ? "p-2" : "p-6"
        )}>
          
          {/* Bouton Ouvrir centré au-dessus du PDF */}
          <div className="flex justify-center mb-4">
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
          
          {/* Indicateur de scroll sur mobile */}
          {isMobile && (
            <div className="text-center mb-2">
              <p className="text-xs text-gray-500">
                👆 Glissez horizontalement pour explorer le document
              </p>
            </div>
          )}
          
          {/* Zone PDF normale */}
          <div className="flex-1">
            <DocumentViewer 
              document={document}
              fileType={fileInfo.type}
            />
          </div>
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
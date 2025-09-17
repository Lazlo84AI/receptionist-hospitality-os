import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ExternalLink, ZoomIn, ZoomOut, RotateCw, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AttachmentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachment: {
    id: string;
    filename: string;
    file_url: string | null;
    file_size: number | null;
    mime_type: string | null;
    attachment_type: 'image' | 'document' | 'audio' | 'video' | 'other';
    created_at: string;
  } | null;
}

type PreviewType = 'image' | 'pdf' | 'youtube' | 'external_link' | 'unsupported';

const AttachmentPreviewModal: React.FC<AttachmentPreviewModalProps> = ({
  isOpen,
  onClose,
  attachment
}) => {
  const [previewType, setPreviewType] = useState<PreviewType>('unsupported');
  const [imageZoom, setImageZoom] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Détection du type de preview
  useEffect(() => {
    if (!attachment) {
      console.log('📎 Preview: Pas d\'attachment');
      setPreviewType('unsupported');
      return;
    }
    
    // Cas spécial : fichier uploadé sans URL (fichier local)
    if (!attachment.file_url && attachment.mime_type) {
      console.log('📎 Preview: Fichier sans URL, utilisation du mime_type:', attachment.mime_type);
      
      if (attachment.mime_type.startsWith('image/')) {
        console.log('📎 Détecté comme IMAGE (sans URL)');
        setPreviewType('unsupported'); // Temporaire jusqu\'à correction upload
        return;
      }
    }

    if (!attachment.file_url) {
      console.log('📎 Preview: Pas d\'URL pour attachment:', attachment);
      setPreviewType('unsupported');
      return;
    }

    const url = attachment.file_url;
    const mimeType = attachment.mime_type || '';
    const filename = attachment.filename.toLowerCase();
    
    console.log('📎 Preview Debug:', {
      url,
      mimeType,
      filename,
      attachment
    });

    // Images
    if (mimeType.startsWith('image/') || 
        filename.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
      console.log('📎 Détecté comme IMAGE');
      setPreviewType('image');
    }
    // PDF
    else if (mimeType === 'application/pdf' || filename.endsWith('.pdf')) {
      console.log('📎 Détecté comme PDF');
      setPreviewType('pdf');
    }
    // YouTube
    else if (url.includes('youtube.com') || url.includes('youtu.be')) {
      console.log('📎 Détecté comme YOUTUBE');
      setPreviewType('youtube');
    }
    // Lien externe
    else if (url.startsWith('http')) {
      console.log('📎 Détecté comme LIEN EXTERNE');
      setPreviewType('external_link');
    }
    else {
      console.log('📎 Type NON SUPPORTÉ');
      setPreviewType('unsupported');
    }
  }, [attachment]);

  // Reset des états lors du changement d'attachment
  useEffect(() => {
    setImageZoom(1);
    setImageRotation(0);
    setLoading(true);
    setError(null);
  }, [attachment]);

  // Utilitaires pour YouTube
  const getYouTubeEmbedUrl = (url: string): string => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
  };

  // Gestionnaire d'erreur pour les images
  const handleImageError = () => {
    setError('Impossible de charger l\'image');
    setLoading(false);
  };

  // Gestionnaire de chargement des images
  const handleImageLoad = () => {
    setLoading(false);
    setError(null);
  };

  // Reset zoom/rotation
  const resetImageTransform = () => {
    setImageZoom(1);
    setImageRotation(0);
  };

  if (!attachment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-none max-h-none w-screen h-screen p-0 bg-black/95 backdrop-blur-sm">
        {/* Header avec contrôles */}
        <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-black/50">
          <div className="flex items-center gap-4 text-white">
            <h3 className="text-lg font-medium truncate max-w-md">
              {attachment.filename}
            </h3>
            <span className="text-sm text-white/70">
              {attachment.attachment_type} • {attachment.file_size ? `${(attachment.file_size / 1024).toFixed(1)} KB` : 'Link'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Contrôles spécifiques aux images */}
            {previewType === 'image' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setImageZoom(prev => Math.min(prev + 0.25, 3))}
                  className="text-white hover:bg-white/20"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setImageZoom(prev => Math.max(prev - 0.25, 0.25))}
                  className="text-white hover:bg-white/20"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setImageRotation(prev => prev + 90)}
                  className="text-white hover:bg-white/20"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetImageTransform}
                  className="text-white hover:bg-white/20 text-xs"
                >
                  Reset
                </Button>
              </>
            )}

            {/* Bouton ouvrir dans un nouvel onglet */}
            {attachment.file_url && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(attachment.file_url!, '_blank')}
                className="text-white hover:bg-white/20"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}

            {/* Bouton fermer */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="w-full h-full flex items-center justify-center p-16">
          {/* Loading */}
          {loading && previewType !== 'external_link' && (
            <div className="text-white text-center">
              <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Chargement...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-white text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <Button onClick={onClose} variant="outline" className="text-black">
                Fermer
              </Button>
            </div>
          )}

          {/* Preview Image */}
          {previewType === 'image' && attachment.file_url && (
            <img
              src={attachment.file_url}
              alt={attachment.filename}
              onLoad={handleImageLoad}
              onError={handleImageError}
              className={cn(
                "max-w-full max-h-full object-contain transition-all duration-300 cursor-grab active:cursor-grabbing",
                loading && "opacity-0"
              )}
              style={{
                transform: `scale(${imageZoom}) rotate(${imageRotation}deg)`,
              }}
              draggable={false}
            />
          )}

          {/* Preview PDF */}
          {previewType === 'pdf' && attachment.file_url && (
            <iframe
              src={attachment.file_url}
              className="w-full h-full border-0 rounded-lg"
              onLoad={() => setLoading(false)}
              title={attachment.filename}
            />
          )}

          {/* Preview YouTube */}
          {previewType === 'youtube' && attachment.file_url && (
            <div className="w-full h-full max-w-6xl max-h-4xl aspect-video">
              <iframe
                src={getYouTubeEmbedUrl(attachment.file_url)}
                className="w-full h-full border-0 rounded-lg"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={() => setLoading(false)}
                title={attachment.filename}
              />
            </div>
          )}

          {/* Preview Lien Externe */}
          {previewType === 'external_link' && attachment.file_url && (
            <div className="bg-white rounded-lg p-8 max-w-md text-center shadow-2xl">
              <div className="mb-6">
                <ExternalLink className="h-12 w-12 mx-auto text-gray-600 mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Lien externe
                </h4>
                <p className="text-sm text-gray-600 break-all">
                  {attachment.file_url}
                </p>
              </div>
              <Button
                onClick={() => window.open(attachment.file_url!, '_blank')}
                className="w-full"
              >
                Ouvrir dans un nouvel onglet
              </Button>
            </div>
          )}

          {/* Unsupported */}
          {previewType === 'unsupported' && (
            <div className="text-white text-center max-w-md">
              <Paperclip className="h-16 w-16 mx-auto text-white/50 mb-6" />
              <h3 className="text-xl font-medium mb-4">Aperçu non disponible</h3>
              
              {!attachment.file_url && attachment.mime_type ? (
                <div className="space-y-3">
                  <p className="text-white/70 mb-4">
                    Ce fichier ({attachment.mime_type}) a été uploadé mais son URL n'est pas encore disponible.
                  </p>
                  <p className="text-sm text-white/60">
                    Taille: {attachment.file_size ? `${(attachment.file_size / 1024).toFixed(1)} KB` : 'Inconnue'}
                  </p>
                </div>
              ) : (
                <p className="text-white/70 mb-4">
                  Aperçu non disponible pour ce type de fichier
                </p>
              )}
              
              <Button onClick={onClose} variant="outline" className="text-black">
                Fermer
              </Button>
            </div>
          )}
        </div>

        {/* Instructions en bas pour les images */}
        {previewType === 'image' && !loading && !error && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/70 text-sm text-center">
            <p>Utilisez les boutons pour zoomer, pivoter ou réinitialiser l'image</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AttachmentPreviewModal;
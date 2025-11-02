import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, ExternalLink, BookOpen, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KnowledgeFormation {
  id: string;
  document_title: string;
  document_name: string;
  document_url: string;
  topic: string;
  summary: string | null;
  formation_steps: string;
  kanban_status: string;
  created_at: string;
}

interface FormationViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  formation: KnowledgeFormation | null;
}

export const FormationViewerModal = ({ isOpen, onClose, formation }: FormationViewerModalProps) => {
  const [isLoading, setIsLoading] = useState(true);

  if (!formation) return null;

  const getStepLabel = (step: string) => {
    const stepLower = step.toLowerCase();
    if (stepLower.includes('qcm généré par ia')) return 'QCM Évaluation';
    if (stepLower.includes('session d\'entraînement')) return 'Entraînement';
    if (stepLower.includes('mise en pratique')) return 'Mise en pratique';
    if (stepLower.includes('document original')) return 'Formation';
    return 'Formation';
  };

  const getStepColor = (step: string) => {
    const stepLower = step.toLowerCase();
    if (stepLower.includes('qcm généré par ia')) return 'bg-purple-100 text-purple-700';
    if (stepLower.includes('session d\'entraînement')) return 'bg-blue-100 text-blue-700';
    if (stepLower.includes('mise en pratique')) return 'bg-green-100 text-green-700';
    return 'bg-orange-100 text-orange-700';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] p-0">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl font-semibold text-gray-900 mb-2">
                {formation.document_title}
              </DialogTitle>
              
              <div className="flex items-center gap-3 mb-3">
                <Badge className={cn("text-sm px-3 py-1", getStepColor(formation.formation_steps))}>
                  {getStepLabel(formation.formation_steps)}
                </Badge>
                
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <BookOpen className="h-4 w-4" />
                  <span>{formation.topic}</span>
                </div>
                
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{new Date(formation.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>

              {formation.summary && (
                <p className="text-sm text-gray-600 leading-relaxed">
                  {formation.summary}
                </p>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="ml-4"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Document Viewer */}
        <div className="flex-1 p-6">
          {formation.document_url ? (
            <div className="h-full">
              {/* PDF Embed */}
              <div className="relative h-full bg-gray-50 rounded-lg overflow-hidden">
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Chargement du document...</p>
                    </div>
                  </div>
                )}
                
                <iframe
                  src={formation.document_url}
                  className="w-full h-full border-0"
                  title={formation.document_title}
                  onLoad={() => setIsLoading(false)}
                  onError={() => setIsLoading(false)}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center mt-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Document: {formation.document_name}</span>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(formation.document_url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ouvrir dans un nouvel onglet
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={onClose}
                  >
                    Fermer
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aucun document disponible</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
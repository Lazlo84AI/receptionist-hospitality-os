import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, BookOpen, ArrowRight } from 'lucide-react';
import { useKnowledgeFormations } from '@/hooks/useKnowledgeFormations';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface QCMCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QCMCreationModal({ isOpen, onClose }: QCMCreationModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormationId, setSelectedFormationId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { data: knowledgeFormations, isLoading } = useKnowledgeFormations();
  const { toast } = useToast();

  // Filtrer pour n'afficher que les formations (pas les QCMs)
  const formations = knowledgeFormations?.filter(
    formation => formation.formation_steps === 'formation'
  ) || [];

  // Filtrer par recherche
  const filteredFormations = formations.filter(formation =>
    formation.document_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    formation.thematic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedFormation = formations.find(f => f.id === selectedFormationId);

  const handleCreateQCM = async () => {
    if (!selectedFormation) {
      toast({
        title: "No formation selected",
        description: "Please select a training document first",
        variant: "destructive",
      });
      return;
    }

    // Fire-and-forget — A2 prend ~3min, on n'attend pas la réponse
    fetch('https://sokle.app.n8n.cloud/webhook/generate-qcm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        document_name: selectedFormation.document_name,
        document_url: selectedFormation.document_url,
        thematic: selectedFormation.thematic
      })
    }).catch(() => {}); // timeout attendu, on ignore

    toast({
      title: "✅ Génération lancée",
      description: `Les questions pour "${selectedFormation.document_name}" sont en cours de création (2-3 min)`,
    });

    setSelectedFormationId(null);
    setSearchQuery('');
    onClose();
  };

  const handleClose = () => {
    if (!isGenerating) {
      setSelectedFormationId(null);
      setSearchQuery('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <BookOpen className="h-5 w-5 text-hotel-navy" />
            Create QCM from Training
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Select a training document to generate an assessment quiz
          </p>
        </DialogHeader>

        {/* Search Bar */}
        <div className="pt-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search trainings by title or thematic..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isGenerating}
            />
          </div>
        </div>

        {/* Formations List */}
        <div className="flex-1 overflow-y-auto py-2 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-hotel-navy" />
            </div>
          ) : filteredFormations.length > 0 ? (
            filteredFormations.map((formation) => (
              <Card
                key={formation.id}
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:shadow-md",
                  selectedFormationId === formation.id
                    ? "border-2 border-hotel-navy bg-hotel-navy/5"
                    : "border border-gray-200 hover:border-hotel-navy/50"
                )}
                onClick={() => !isGenerating && setSelectedFormationId(formation.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Radio Button */}
                    <div className="flex-shrink-0">
                      <div
                        className={cn(
                          "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all",
                          selectedFormationId === formation.id
                            ? "border-hotel-navy bg-hotel-navy"
                            : "border-gray-300"
                        )}
                      >
                        {selectedFormationId === formation.id && (
                          <div className="h-2.5 w-2.5 rounded-full bg-white" />
                        )}
                      </div>
                    </div>

                    {/* Formation Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base mb-1 truncate">
                        {formation.document_name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-xs bg-[#E0D3B4] text-[#BBA57A] border-[#BBA57A]"
                        >
                          {formation.thematic}
                        </Badge>
                        {formation.status && (
                          <span className="text-xs text-muted-foreground">
                            Status: {formation.status}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Selection Indicator */}
                    {selectedFormationId === formation.id && (
                      <div className="flex-shrink-0">
                        <ArrowRight className="h-5 w-5 text-hotel-navy" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mb-3" />
              <p className="text-sm text-gray-600 mb-1">
                {searchQuery ? "No trainings found" : "No training documents available"}
              </p>
              {searchQuery && (
                <p className="text-xs text-muted-foreground">
                  Try adjusting your search
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer with Action Button */}
        <div className="pt-4 border-t flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {selectedFormation ? (
              <span>
                Selected: <strong>{selectedFormation.document_name}</strong>
              </span>
            ) : (
              <span>No training selected</span>
            )}
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateQCM}
              disabled={!selectedFormationId || isGenerating}
              className="min-w-[140px] bg-hotel-navy hover:bg-hotel-navy/90 text-white"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  Create QCM
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
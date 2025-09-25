import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl?: string;
  title?: string;
  onTestLearn?: () => void;
}

const PdfViewerModal = ({ 
  isOpen, 
  onClose, 
  pdfUrl = "/api/placeholder-training.pdf", 
  title = "Training Material",
  onTestLearn 
}: PdfViewerModalProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(12); // Mock total pages
  const [zoomLevel, setZoomLevel] = useState(100);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(200, prev + 25));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(50, prev - 25));
  };

  const handleTestWhatYouLearn = () => {
    if (onTestLearn) {
      onTestLearn();
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-none w-screen h-screen m-0 p-0 bg-gray-900 border-0">
        <div className="flex flex-col h-full">
          {/* Header avec contrôles */}
          <div className="flex items-center justify-between bg-white border-b px-6 py-4">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-palace-navy">{title}</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Page {currentPage} of {totalPages}</span>
              </div>
            </div>
            
            {/* Contrôles PDF */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 50}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              
              <span className="text-sm text-muted-foreground min-w-[60px] text-center">
                {zoomLevel}%
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 200}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
              </Button>
              
              {/* Croix de fermeture */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="ml-4 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Zone de visualisation PDF */}
          <div className="flex-1 flex items-center justify-center bg-gray-100 relative overflow-auto">
            {/* Mock PDF Content */}
            <div 
              className="bg-white shadow-lg border max-w-4xl mx-auto my-8"
              style={{ 
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'center top'
              }}
            >
              <div className="aspect-[8.5/11] w-full max-w-[600px] bg-white p-8 text-sm leading-relaxed">
                {/* Mock PDF Content */}
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-palace-navy mb-2">
                      Hotel Reception Training Manual
                    </h1>
                    <p className="text-muted-foreground">Page {currentPage}</p>
                  </div>

                  {currentPage === 1 && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold text-palace-navy">Chapter 1: Guest Welcome Procedures</h2>
                      <p>
                        Welcome to the comprehensive guide for hotel reception staff. This manual will provide you 
                        with essential knowledge and best practices for delivering exceptional guest experiences.
                      </p>
                      <h3 className="text-lg font-medium mt-6">Key Principles:</h3>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Always greet guests within 10 seconds of their arrival</li>
                        <li>Maintain eye contact and a warm smile</li>
                        <li>Use the guest's name whenever possible</li>
                        <li>Anticipate guest needs proactively</li>
                      </ul>
                    </div>
                  )}

                  {currentPage === 2 && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold text-palace-navy">Chapter 2: Check-in Process</h2>
                      <p>
                        The check-in process is a critical touchpoint that sets the tone for the entire guest stay. 
                        Follow these steps to ensure a smooth and efficient experience.
                      </p>
                      <h3 className="text-lg font-medium mt-6">Standard Check-in Steps:</h3>
                      <ol className="list-decimal list-inside space-y-2 ml-4">
                        <li>Verify guest identity with photo ID</li>
                        <li>Confirm reservation details</li>
                        <li>Collect payment information</li>
                        <li>Explain hotel amenities and policies</li>
                        <li>Provide room keys and directions</li>
                      </ol>
                    </div>
                  )}

                  {currentPage > 2 && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold text-palace-navy">Chapter {currentPage}: Advanced Topics</h2>
                      <p>
                        This section covers advanced scenarios and special situations that reception staff may encounter.
                        Understanding these procedures will help you handle complex guest requests with confidence.
                      </p>
                      <div className="bg-blue-50 p-4 rounded-lg mt-6">
                        <p className="text-blue-800 font-medium">💡 Pro Tip:</p>
                        <p className="text-blue-700 text-sm mt-1">
                          Always document unusual situations in the guest notes for future reference.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation flottante */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-white shadow-lg rounded-full px-6 py-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage <= 1}
                className="rounded-full"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <span className="text-sm font-medium min-w-[80px] text-center">
                {currentPage} / {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
                className="rounded-full"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Footer avec bouton "Test what you learn" */}
          <div className="bg-white border-t px-6 py-4 flex justify-end">
            <Button
              onClick={handleTestWhatYouLearn}
              className="bg-champagne-gold hover:bg-champagne-gold/80 text-palace-navy px-8"
              size="lg"
            >
              Test what you learn
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PdfViewerModal;
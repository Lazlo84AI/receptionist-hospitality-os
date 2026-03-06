import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OnboardingSlide {
  id: number;
  title: string;
  videoUrl: string;
}

interface OnboardingCarouselProps {
  open: boolean;
  onClose: () => void;
}

const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: 1,
    title: "POURQUOI PAS DE CARTES AU DEBUT ? [OU] COMMENT LANCER ET CLOTURER SON SHIFT !",
    videoUrl: "https://youtu.be/ZSWklFm1oxE"
  },
  {
    id: 2,
    title: "COMMENT CREER UNE CARTE : A LA VOIX OU VIA L'INTERFACE",
    videoUrl: "https://youtu.be/ZSWklFm1oxE" // Placeholder
  },
  {
    id: 3,
    title: "VOUS AVEZ UNE QUESTION ? : SOUMETTEZ LA A L'ASSISTANT",
    videoUrl: "https://youtu.be/ZSWklFm1oxE" // Placeholder
  },
  {
    id: 4,
    title: "PROGRESSEZ DANS VOTRE TRAVAIL : APPRENEZ AVEC LE FORMATEUR",
    videoUrl: "https://youtu.be/ZSWklFm1oxE" // Placeholder
  }
];

function getEmbedUrl(url: string): string {
  const ytMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?modestbranding=1&rel=0`;
  }
  const ytShortMatch = url.match(/youtu\.be\/([^?]+)/);
  if (ytShortMatch) {
    return `https://www.youtube.com/embed/${ytShortMatch[1]}?modestbranding=1&rel=0`;
  }
  const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
  if (loomMatch) {
    return `https://www.loom.com/embed/${loomMatch[1]}`;
  }
  return url;
}

export function OnboardingCarousel({ open, onClose }: OnboardingCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const slide = ONBOARDING_SLIDES[currentSlide];
  const isLastSlide = currentSlide === ONBOARDING_SLIDES.length - 1;

  const handleNext = () => {
    if (isLastSlide) {
      // Dernière slide : fermer et rediriger vers Shift Management
      onClose();
      navigate('/shift', { state: { openShiftStart: true } });
    } else {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  // Reset au slide 1 quand le modal s'ouvre
  useEffect(() => {
    if (open) {
      setCurrentSlide(0);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full p-0 bg-white" hideClose>
        <div className="flex flex-col h-[90vh]">
          {/* Header avec titre et pagination */}
          <div className="px-6 py-4 border-b border-gray-200">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
              Tutoriel {currentSlide + 1} / {ONBOARDING_SLIDES.length}
            </p>
            <h2 className="text-lg font-bold text-hotel-navy jost-semibold leading-tight">
              {slide.title}
            </h2>
          </div>

          {/* Player vidéo */}
          <div className="flex-1 bg-black relative">
            <iframe
              src={getEmbedUrl(slide.videoUrl)}
              title={slide.title}
              allowFullScreen
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>

          {/* Footer avec navigation */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            {/* Indicateurs de progression (dots) */}
            <div className="flex items-center space-x-2">
              {ONBOARDING_SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    idx === currentSlide ? 'bg-[#BBA57A]' : 'bg-gray-300'
                  }`}
                  aria-label={`Aller au tutoriel ${idx + 1}`}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center space-x-3">
              {/* Bouton Précédent */}
              {currentSlide > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  className="flex items-center space-x-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Précédent</span>
                </Button>
              )}

              {/* Bouton Suivant / Commencez */}
              <Button
                onClick={handleNext}
                className="bg-[#BBA57A] hover:bg-[#A89469] text-white flex items-center space-x-2"
              >
                <span>{isLastSlide ? 'Start the Shift' : 'Suivant'}</span>
                {!isLastSlide && <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

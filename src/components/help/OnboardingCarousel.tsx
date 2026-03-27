import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface OnboardingSlide {
  id: string;
  title: string;
  videoUrl: string;
  sort_order: number;
}

interface OnboardingCarouselProps {
  open: boolean;
  onClose: () => void;
}

function getEmbedUrl(url: string): string {
  const ytMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?modestbranding=1&rel=0`;
  const ytShortMatch = url.match(/youtu\.be\/([^?]+)/);
  if (ytShortMatch) return `https://www.youtube.com/embed/${ytShortMatch[1]}?modestbranding=1&rel=0`;
  const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
  if (loomMatch) return `https://www.loom.com/embed/${loomMatch[1]}`;
  return url;
}

export function OnboardingCarousel({ open, onClose }: OnboardingCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  // ── Lecture des vidéos is_onboarding = true depuis Supabase ──────────────
  const { data: slides = [], isLoading } = useQuery({
    queryKey: ['onboarding_videos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_tutorial_videos')
        .select('id, title, url, sort_order')
        .eq('is_active', true)
        .eq('is_onboarding', true)
        .order('sort_order');
      if (error) throw error;
      return (data ?? []).map(v => ({
        id: v.id,
        title: v.title,
        videoUrl: v.url,
        sort_order: v.sort_order,
      })) as OnboardingSlide[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const slide = slides[currentSlide];
  const isLastSlide = currentSlide === slides.length - 1;

  const handleNext = () => {
    if (isLastSlide) {
      onClose();
      navigate('/shift', { state: { openShiftStart: true } });
    } else {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) setCurrentSlide(currentSlide - 1);
  };

  useEffect(() => {
    if (open) setCurrentSlide(0);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full p-0 bg-white" hideClose>
        <div className="flex flex-col h-[90vh]">

          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                <p className="text-sm text-gray-400">Chargement des tutoriels…</p>
              </div>
            ) : slides.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Aucun tutoriel d'accueil configuré.</p>
            ) : (
              <>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                  Tutoriel {currentSlide + 1} / {slides.length}
                </p>
                <h2 className="text-lg font-bold text-hotel-navy jost-semibold leading-tight">
                  {slide?.title}
                </h2>
              </>
            )}
          </div>

          {/* Player vidéo */}
          <div className="flex-1 bg-black relative">
            {!isLoading && slide && (
              <iframe
                key={slide.id}
                src={getEmbedUrl(slide.videoUrl)}
                title={slide.title}
                allowFullScreen
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            )}
            {!isLoading && slides.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-white/40 text-sm">Configurez les vidéos d'accueil dans Team Management → Attribution</p>
              </div>
            )}
          </div>

          {/* Footer navigation */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            {/* Dots */}
            <div className="flex items-center space-x-2">
              {slides.map((_, idx) => (
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
              {currentSlide > 0 && (
                <Button variant="outline" onClick={handlePrevious} className="flex items-center space-x-2">
                  <ChevronLeft className="h-4 w-4" />
                  <span>Précédent</span>
                </Button>
              )}
              <Button
                onClick={slides.length === 0 ? onClose : handleNext}
                className="bg-[#BBA57A] hover:bg-[#A89469] text-white flex items-center space-x-2"
              >
                <span>{slides.length === 0 ? 'Fermer' : (isLastSlide ? 'Start the Shift' : 'Suivant')}</span>
                {slides.length > 0 && !isLastSlide && <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}

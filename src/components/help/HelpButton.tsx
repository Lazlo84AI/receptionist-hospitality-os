import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { VideoTutorialModal } from './VideoTutorialModal';

interface TutorialVideo {
  id: string;
  title: string;
  category: string;
  url: string;
  objectif_fonctionnel: string | null;
  sort_order: number;
}

export function HelpButton() {
  const [selectedVideo, setSelectedVideo] = useState<TutorialVideo | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const { data: videos = [] } = useQuery({
    queryKey: ['platform_tutorial_videos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_tutorial_videos')
        .select('id, title, category, url, objectif_fonctionnel, sort_order')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;

      // Déduplication par titre — on garde la première occurrence
      const seen = new Set<string>();
      const deduped = (data as TutorialVideo[]).filter((v) => {
        if (seen.has(v.title)) return false;
        seen.add(v.title);
        return true;
      });
      return deduped;
    },
  });

  // Pas de groupement — liste plate dédupliquée par titre

  const handleVideoClick = (video: TutorialVideo) => {
    setPopoverOpen(false);
    setSelectedVideo(video);
  };

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <button
            className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Tutoriels vidéo"
          >
            <HelpCircle className="h-6 w-6" style={{ color: '#BBA57A' }} />
          </button>
        </PopoverTrigger>

        <PopoverContent align="end" className="w-72 p-0 shadow-lg">
          {/* Header du popover */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-hotel-navy jost-semibold">
              🎬 Tutoriels Sokle
            </p>
          </div>

          {/* Liste des vidéos groupées */}
          <div className="max-h-80 overflow-y-auto py-2">
            {videos.length === 0 ? (
              <p className="px-4 py-3 text-sm text-gray-400 italic">
                Aucun tutoriel disponible
              </p>
            ) : (
              videos.map((video) => (
                <button
                  key={video.id}
                  onClick={() => handleVideoClick(video)}
                  className="w-full text-left px-4 py-2 hover:bg-[#BBA57A]/10 transition-colors group"
                >
                  <p className="text-sm text-gray-800 group-hover:text-hotel-navy font-medium leading-snug">
                    {video.title}
                  </p>
                  {video.objectif_fonctionnel && (
                    <p className="text-xs text-gray-400 mt-0.5 leading-snug">
                      {video.objectif_fonctionnel}
                    </p>
                  )}
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Modal vidéo */}
      {selectedVideo && (
        <VideoTutorialModal
          open={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
          title={selectedVideo.title}
          url={selectedVideo.url}
        />
      )}
    </>
  );
}

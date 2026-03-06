import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface VideoTutorialModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  url: string;
}

function getEmbedUrl(url: string): string {
  // Loom
  const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
  if (loomMatch) {
    return `https://www.loom.com/embed/${loomMatch[1]}`;
  }
  // YouTube long form
  const ytMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?modestbranding=1&rel=0`;
  }
  // YouTube short
  const ytShortMatch = url.match(/youtu\.be\/([^?]+)/);
  if (ytShortMatch) {
    return `https://www.youtube.com/embed/${ytShortMatch[1]}?modestbranding=1&rel=0`;
  }
  // Already an embed URL
  return url;
}

export function VideoTutorialModal({ open, onClose, title, url }: VideoTutorialModalProps) {
  const embedUrl = getEmbedUrl(url);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full p-4">
        <DialogHeader>
          <DialogTitle className="text-hotel-navy jost-semibold">{title}</DialogTitle>
        </DialogHeader>
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={embedUrl}
            title={title}
            allowFullScreen
            className="absolute inset-0 w-full h-full rounded-md"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

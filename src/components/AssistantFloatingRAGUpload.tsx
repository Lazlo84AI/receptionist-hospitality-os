import { useState, useRef, useEffect } from 'react';
import { Upload, X, Loader2, FileText, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

// Composant SVG des mains jointes
const PrayingHandsIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 375 374.999991" 
    className={className}
    style={style}
  >
    <path 
      fill="currentColor" 
      d="M 323.261719 261.605469 L 284.40625 228.800781 C 285.667969 226.453125 286.464844 223.855469 286.695312 221.117188 C 287.136719 215.835938 285.503906 210.707031 282.101562 206.6875 C 279.613281 203.722656 276.371094 201.605469 272.734375 200.511719 C 278.132812 193.296875 278.070312 183.039062 272.027344 175.863281 C 269.402344 172.746094 265.949219 170.566406 262.074219 169.527344 C 266.390625 162.457031 265.953125 153.105469 260.316406 146.410156 C 257.195312 142.714844 252.898438 140.335938 248.128906 139.628906 C 250.3125 133.253906 249.207031 125.914062 244.558594 120.398438 C 241.164062 116.367188 236.378906 113.90625 231.09375 113.457031 C 225.78125 112.992188 220.675781 114.636719 216.640625 118.03125 L 215.90625 118.652344 L 193.640625 108.265625 C 181.984375 102.210938 171.78125 106.96875 166.847656 114.351562 C 165.203125 116.804688 164.195312 119.457031 163.671875 122.128906 L 158.816406 118.027344 C 150.460938 110.992188 137.941406 112.066406 130.902344 120.398438 C 126.253906 125.914062 125.148438 133.253906 127.339844 139.628906 C 122.566406 140.335938 118.28125 142.710938 115.148438 146.414062 C 111.75 150.449219 110.125 155.574219 110.566406 160.851562 C 110.835938 163.984375 111.804688 166.933594 113.386719 169.527344 C 109.632812 170.539062 106.128906 172.664062 103.433594 175.855469 C 97.386719 183.035156 97.328125 193.292969 102.730469 200.507812 C 99.195312 201.582031 95.914062 203.644531 93.363281 206.671875 C 87.984375 213.039062 87.363281 221.839844 91.078125 228.792969 L 52.203125 261.601562 C 50.183594 263.300781 49.933594 266.3125 51.632812 268.324219 C 52.578125 269.441406 53.921875 270.019531 55.289062 270.019531 C 56.375 270.019531 57.464844 269.652344 58.359375 268.898438 L 97.367188 235.980469 L 113.011719 249.171875 C 116.605469 252.203125 121.066406 253.828125 125.730469 253.828125 C 126.296875 253.828125 126.871094 253.796875 127.445312 253.75 C 132.71875 253.300781 137.5 250.839844 140.882812 246.816406 C 144.289062 242.792969 145.921875 237.671875 145.480469 232.386719 C 145.246094 229.589844 144.414062 226.960938 143.121094 224.574219 C 147.0625 223.621094 150.761719 221.496094 153.570312 218.171875 C 157.433594 213.585938 158.765625 207.753906 157.875 202.25 C 157.878906 202.25 157.882812 202.25 157.886719 202.25 C 163.453125 202.25 168.9375 199.941406 172.691406 195.507812 C 176.199219 191.980469 178.011719 187.179688 177.789062 181.996094 C 177.78125 181.824219 177.722656 181.660156 177.710938 181.492188 C 178.496094 181.589844 179.269531 181.71875 180.066406 181.71875 C 180.632812 181.71875 181.210938 181.695312 181.785156 181.640625 C 187.066406 181.191406 191.84375 178.726562 194.957031 175.003906 C 198.484375 171.496094 200.304688 166.707031 200.089844 161.519531 C 199.894531 156.804688 197.988281 152.371094 194.882812 148.886719 L 222.789062 125.324219 C 224.875 123.574219 227.519531 122.710938 230.277344 122.96875 C 233.023438 123.195312 235.5 124.472656 237.25 126.550781 C 240.890625 130.871094 240.339844 137.367188 236.019531 141.011719 L 232.410156 144.066406 C 232.40625 144.070312 232.40625 144.070312 232.40625 144.070312 C 230.398438 145.769531 230.144531 148.78125 231.851562 150.796875 C 233.546875 152.804688 236.558594 153.054688 238.574219 151.355469 L 238.597656 151.332031 C 240.667969 149.597656 243.324219 148.777344 246.027344 148.988281 C 248.777344 149.21875 251.261719 150.488281 253.015625 152.566406 C 256.660156 156.894531 256.105469 163.382812 251.78125 167.027344 L 244.128906 173.503906 C 244.128906 173.503906 244.121094 173.507812 244.117188 173.507812 C 242.109375 175.214844 241.855469 178.226562 243.558594 180.234375 C 245.257812 182.246094 248.269531 182.5 250.285156 180.796875 L 250.289062 180.796875 C 252.371094 179.03125 255.09375 178.214844 257.757812 178.425781 C 260.496094 178.660156 262.96875 179.929688 264.722656 182.007812 C 268.363281 186.332031 267.808594 192.824219 263.496094 196.46875 L 254.207031 204.304688 L 254.203125 204.3125 C 252.1875 206.011719 251.929688 209.023438 253.628906 211.035156 C 255.328125 213.050781 258.335938 213.3125 260.355469 211.609375 L 260.367188 211.597656 C 262.449219 209.847656 265.074219 209.03125 267.832031 209.242188 C 270.574219 209.476562 273.042969 210.746094 274.800781 212.835938 C 276.5625 214.921875 277.402344 217.574219 277.171875 220.308594 C 276.9375 223.046875 275.667969 225.53125 273.589844 227.285156 L 230.210938 263.902344 C 212.507812 278.84375 197.910156 277.265625 175.980469 272.902344 C 174.546875 272.601562 173.082031 272.996094 171.964844 273.9375 L 106.652344 329.070312 C 104.640625 330.765625 104.386719 333.777344 106.089844 335.796875 C 107.03125 336.910156 108.378906 337.488281 109.738281 337.488281 C 110.824219 337.488281 111.914062 337.121094 112.816406 336.363281 L 176.375 282.707031 C 185.433594 284.453125 193.726562 285.667969 201.734375 285.375 L 262.6875 336.378906 C 263.589844 337.125 264.671875 337.488281 265.753906 337.488281 C 267.117188 337.488281 268.472656 336.90625 269.417969 335.78125 C 271.105469 333.757812 270.84375 330.75 268.820312 329.0625 L 214.335938 283.46875 C 221.566406 281.421875 228.785156 277.601562 236.367188 271.203125 L 278.117188 235.972656 L 317.105469 268.894531 C 318.003906 269.652344 319.09375 270.019531 320.183594 270.019531 C 321.542969 270.019531 322.890625 269.445312 323.835938 268.332031 C 325.527344 266.316406 325.277344 263.304688 323.261719 261.605469 Z M 175.285156 131.921875 C 171.671875 128.871094 172.328125 123.324219 174.789062 119.65625 C 176 117.84375 180.628906 112.273438 189.429688 116.820312 L 207.878906 125.429688 L 187.734375 142.441406 L 175.328125 131.96875 L 175.292969 131.941406 C 175.289062 131.9375 175.292969 131.925781 175.285156 131.921875 Z M 133.601562 240.648438 C 131.847656 242.734375 129.375 244.003906 126.640625 244.234375 C 123.878906 244.480469 121.242188 243.621094 119.167969 241.871094 L 101.875 227.296875 C 97.558594 223.628906 97.007812 217.144531 100.660156 212.832031 C 104.277344 208.535156 110.6875 207.96875 115.015625 211.546875 L 132.398438 226.203125 C 134.476562 227.953125 135.746094 230.429688 135.976562 233.175781 C 136.207031 235.921875 135.359375 238.570312 133.601562 240.648438 Z M 146.28125 212.007812 C 142.632812 216.328125 136.152344 216.882812 131.828125 213.246094 L 121.285156 204.355469 C 121.273438 204.34375 121.269531 204.324219 121.253906 204.3125 L 121.25 204.304688 L 111.964844 196.476562 C 107.648438 192.820312 107.09375 186.332031 110.730469 182.015625 C 112.492188 179.929688 114.972656 178.660156 117.710938 178.425781 C 120.457031 178.199219 123.109375 179.035156 125.191406 180.796875 L 125.195312 180.800781 C 125.207031 180.8125 125.222656 180.8125 125.234375 180.820312 L 145.042969 197.558594 C 149.367188 201.203125 149.917969 207.695312 146.28125 212.007812 Z M 165.675781 189.042969 C 162.019531 193.363281 155.539062 193.917969 151.210938 190.265625 L 131.289062 173.441406 C 131.285156 173.4375 131.277344 173.4375 131.269531 173.433594 L 123.667969 167.019531 C 121.585938 165.265625 120.316406 162.789062 120.085938 160.046875 C 119.851562 157.304688 120.695312 154.644531 122.445312 152.566406 C 124.203125 150.488281 126.679688 149.21875 129.417969 148.988281 C 132.109375 148.734375 134.789062 149.585938 136.863281 151.316406 L 136.90625 151.355469 L 164.441406 174.589844 C 166.710938 176.507812 168.140625 179.425781 168.269531 182.394531 C 168.367188 184.886719 167.546875 187.148438 165.675781 189.042969 Z M 187.953125 168.542969 C 186.203125 170.621094 183.730469 171.890625 180.992188 172.125 C 178.238281 172.378906 175.597656 171.519531 173.527344 169.773438 C 173.292969 169.578125 173.082031 169.570312 172.886719 169.683594 C 172.171875 168.847656 171.441406 168.011719 170.597656 167.296875 L 143.058594 144.058594 C 143.039062 144.039062 143.019531 144.027344 143.003906 144.011719 L 139.4375 141.007812 C 135.117188 137.355469 134.5625 130.867188 138.199219 126.550781 C 141.851562 122.238281 148.34375 121.679688 152.660156 125.316406 L 159.1875 130.828125 C 159.191406 130.828125 159.191406 130.832031 159.195312 130.839844 L 169.5625 139.589844 L 172.769531 142.296875 L 172.773438 142.296875 L 186.746094 154.097656 C 189.019531 156.011719 190.441406 158.933594 190.570312 161.910156 C 190.671875 164.390625 189.839844 166.632812 187.953125 168.542969 Z M 187.953125 168.542969"
    />
    <path 
      fill="currentColor" 
      d="M 206.84375 76.238281 C 209.484375 76.238281 211.617188 74.105469 211.617188 71.46875 L 211.617188 46.363281 C 211.617188 43.722656 209.484375 41.589844 206.84375 41.589844 C 204.207031 41.589844 202.070312 43.722656 202.070312 46.363281 L 202.070312 71.46875 C 202.070312 74.105469 204.207031 76.238281 206.84375 76.238281 Z M 206.84375 76.238281"
    />
    <path 
      fill="currentColor" 
      d="M 270.074219 89.960938 C 271.546875 89.960938 272.992188 89.285156 273.933594 88.015625 L 288.78125 67.777344 C 290.335938 65.65625 289.878906 62.667969 287.753906 61.105469 C 285.617188 59.539062 282.636719 60.011719 281.082031 62.132812 L 266.234375 82.367188 C 264.679688 84.492188 265.136719 87.480469 267.261719 89.039062 C 268.109375 89.660156 269.097656 89.960938 270.074219 89.960938 Z M 270.074219 89.960938"
    />
    <path 
      fill="currentColor" 
      d="M 139.761719 88.015625 C 140.691406 89.289062 142.144531 89.960938 143.613281 89.960938 C 144.589844 89.960938 145.578125 89.660156 146.433594 89.035156 C 148.558594 87.480469 149.015625 84.492188 147.453125 82.367188 L 132.597656 62.132812 C 131.042969 60.011719 128.058594 59.550781 125.929688 61.109375 C 123.808594 62.667969 123.347656 65.65625 124.910156 67.777344 Z M 139.761719 88.015625"
    />
  </svg>
);

// Interface pour les documents
interface Document {
  id: string;
  document_name: string;
  file_name: string;
  thematic: string;
  document_url: string;
  status: string;
}

export function AssistantFloatingRAGUpload() {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState('');
  const [thematic, setThematic] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // NOUVEAUX ÉTATS pour le mode UPDATE
  const [mode, setMode] = useState<'new' | 'update'>('new');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // NOUVELLE FONCTION : Fetch documents depuis Supabase
  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('assistant_documents')
        .select('id, document_name, file_name, thematic, document_url, status')
        .eq('status', 'completed')
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error('Erreur fetch documents:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les documents",
          variant: "destructive",
        });
        return;
      }

      setDocuments(data || []);
    } catch (error) {
      console.error('Erreur fetch documents:', error);
    }
  };

  // useEffect pour charger les documents quand on passe en mode UPDATE
  useEffect(() => {
    if (isOpen && mode === 'update') {
      fetchDocuments();
    }
  }, [isOpen, mode]);

  // Filtrage des documents selon la recherche
  const filteredDocuments = documents.filter(doc =>
    doc.document_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileChange = (file: File) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Type de fichier non supporté",
        description: "Veuillez sélectionner un PDF, Word ou TXT",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Aucun fichier",
        description: "Veuillez sélectionner un fichier à charger",
        variant: "destructive",
      });
      return;
    }

    if (!documentName.trim()) {
      toast({
        title: "Nom du document manquant",
        description: "Veuillez saisir un nom pour le document",
        variant: "destructive",
      });
      return;
    }

    if (!thematic) {
      toast({
        title: "Thématique manquante",
        description: "Veuillez sélectionner une thématique",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // ÉTAPE 1: Upload du fichier dans Supabase Storage
      toast({
        title: "📤 Étape 1/3",
        description: "Upload du fichier dans Supabase...",
      });

      const fileExtension = selectedFile.name.split('.').pop();
      const uniqueFileName = `${documentName.trim()}_${Date.now()}.${fileExtension}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('assistant')
        .upload(uniqueFileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Erreur upload Supabase: ${uploadError.message}`);
      }

      // ÉTAPE 2: Récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('assistant')
        .getPublicUrl(uniqueFileName);

      toast({
        title: "💾 Étape 2/3",
        description: "Enregistrement dans la base de données...",
      });

      // ÉTAPE 3: Insérer dans assistant_documents
      const { data: docData, error: insertError } = await supabase
        .from('assistant_documents')
        .insert([{
          document_name: documentName.trim(),
          file_name: uniqueFileName,
          document_url: publicUrl,
          thematic: thematic,
          status: 'processing'
        }])
        .select()
        .single();

      if (insertError) {
        throw new Error(`Erreur insertion DB: ${insertError.message}`);
      }

      toast({
        title: "⚡ Étape 3/3",
        description: "Envoi au moteur de vectorisation...",
      });

      // ÉTAPE 4: Appel webhook N8N avec les métadonnées
      const response = await fetch('https://sokle.app.n8n.cloud/webhook/assitant-rag-loading', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: docData.id,
          document_name: documentName.trim(),
          document_url: publicUrl,
          thematic: thematic
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur webhook N8N: ${response.status}`);
      }

      toast({
        title: "✅ Succès !",
        description: `"${selectedFile.name}" est en cours de traitement dans le RAG`,
      });

      // Reset
      setSelectedFile(null);
      setDocumentName('');
      setThematic('');
      setIsOpen(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Erreur upload:', error);
      toast({
        title: "❌ Erreur",
        description: error.message || "Impossible de charger le fichier dans le RAG",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setIsOpen(false);
      setSelectedFile(null);
      setDocumentName('');
      setThematic('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      {/* Bouton flottant avec emoji 🙏 - Style Navy + Gold + Yellow halo */}
      <div className="fixed bottom-6 right-6 z-[9999]">
        <Button
          onClick={() => setIsOpen(true)}
          className={cn(
            "h-24 w-24 rounded-full transition-all duration-500",
            "bg-[#1E1A37] hover:bg-[#1E1A37]/90",
            "border-2 border-[#DEAE35]/50 hover:border-[#DEAE35]",
            "shadow-lg relative"
          )}
          size="icon"
          title="Charger un document dans le RAG"
        >
          <PrayingHandsIcon style={{ color: '#BBA57A', width: '48px', height: '48px' }} />
        </Button>
        
        {/* Animation pulsante jaune (halo) */}
        <div className="absolute -bottom-12 -right-12 h-48 w-48 rounded-full border-2 border-[#DEAE35]/20 animate-ping pointer-events-none" />
      </div>

      {/* Modal de chargement */}
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px] md:max-w-[700px] lg:max-w-[800px] max-h-[90vh] overflow-y-auto w-[95vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl font-semibold">
              <PrayingHandsIcon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#BBA57A' }} />
              <span className="line-clamp-2 sm:line-clamp-1">Charger un nouveau document dans le RAG</span>
            </DialogTitle>
          </DialogHeader>

          {/* Encart règle importante */}
          <div className="bg-[#BBA57A]/10 border-2 border-[#BBA57A] rounded-lg p-3 sm:p-4 mt-2 sm:mt-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <span className="text-xl sm:text-2xl flex-shrink-0">🟨</span>
              <div>
                <p className="font-semibold text-[#1E1A37] mb-1 sm:mb-2 text-sm sm:text-base">
                  Règle importante — à respecter absolument <span className="text-red-500">*</span>
                </p>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  Si vous souhaitez mettre à jour un document dans le RAG, vous devez impérativement conserver exactement le même nom de fichier que celui utilisé lors de l'ajout initial. Le plus simple est de nommer le PDF dès le départ avec le nom définitif du document dans le RAG.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6 pt-3 sm:pt-4">
            {/* Document Upload */}
            <div className="space-y-2">
              <Label htmlFor="document" className="text-sm sm:text-base font-medium text-foreground">
                Document <span className="text-red-500">*</span>
              </Label>
              <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-lg p-4 sm:p-6 md:p-8 text-center transition-all duration-200",
                isDragOver 
                  ? "border-[#BBA57A] bg-[#BBA57A]/10 scale-105" 
                  : "border-gray-300 hover:border-[#BBA57A]/50",
                isUploading && "opacity-50 cursor-not-allowed"
              )}
            >
              {selectedFile ? (
                /* Fichier sélectionné */
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-[#1E1A37] flex-shrink-0" />
                    <div className="text-center sm:text-left flex-1 min-w-0">
                      <p className="font-medium text-xs sm:text-sm text-gray-900 truncate px-2 sm:px-0">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                      disabled={isUploading}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Fichier prêt. Cliquez sur "Charger" pour l'envoyer au RAG.
                  </p>
                </div>
              ) : (
                /* Zone d'upload vide */
                <div className="space-y-3 sm:space-y-4">
                  <Upload className="h-10 w-10 sm:h-12 sm:w-12 text-[#BBA57A] mx-auto" />
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-900 mb-1">
                      Glissez-déposez votre fichier ici
                    </p>
                    <p className="text-xs text-gray-500 mb-3">
                      ou cliquez pour parcourir (PDF, DOC, DOCX, TXT)
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="hover:border-[#BBA57A] hover:text-[#BBA57A] text-xs sm:text-sm"
                    >
                      Parcourir les fichiers
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Input file caché */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="hidden"
            />
            </div>

            {/* Nom du document */}
            <div className="space-y-2">
              <Label htmlFor="documentName" className="text-sm sm:text-base font-medium text-foreground">
                Nom du document <span className="text-red-500">*</span>
              </Label>
              <Input
                id="documentName"
                type="text"
                placeholder="Saisissez le nom du document"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                disabled={isUploading}
                className="transition-all duration-200 hover:border-[#BBA57A] focus:border-[#BBA57A] focus:ring-2 focus:ring-[#BBA57A]/20 text-sm sm:text-base"
              />
            </div>

            {/* Thématique */}
            <div className="space-y-2">
              <Label htmlFor="thematic" className="text-sm sm:text-base font-medium text-foreground">
                Thématique
              </Label>
              <Select value={thematic} onValueChange={setThematic} disabled={isUploading}>
                <SelectTrigger className="transition-all duration-200 hover:border-[#BBA57A] focus:border-[#BBA57A] focus:ring-2 focus:ring-[#BBA57A]/20 text-sm sm:text-base">
                  <SelectValue placeholder="Select an option ..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="housekeeping">Housekeeping (Gouvernance)</SelectItem>
                  <SelectItem value="reception">Reception (Accueil)</SelectItem>
                  <SelectItem value="maintenance">Maintenance (Maintenance)</SelectItem>
                  <SelectItem value="security">Security (Sécurité)</SelectItem>
                  <SelectItem value="fb">F&B (Restauration)</SelectItem>
                  <SelectItem value="customer_experience">Customer experience (expérience client)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Boutons d'action */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t sticky bottom-0 bg-white pb-2 sm:pb-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isUploading}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || !documentName.trim() || !thematic || isUploading}
                className="min-w-full sm:min-w-[140px] bg-[#BBA57A] hover:bg-[#BBA57A]/90 text-white order-1 sm:order-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Chargement...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Charger
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

import { useState, useRef } from 'react';
import { Brain, Plus, Upload, Loader2, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { QCMCreationModal } from '@/components/modals/QCMCreationModal';

export function UploadTraining() {
  const [isOpen, setIsOpen] = useState(false);
  const [isQCMModalOpen, setIsQCMModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    thematic: '',
    file: null as File | null
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (file: File) => {
    // Check file type (PDF or Word)
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Unsupported file type",
        description: "Please select a PDF or Word document (.pdf, .docx, .doc)",
        variant: "destructive",
      });
      return;
    }

    setFormData(prev => ({ ...prev, file }));
  };

  const handleInputFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileChange(files[0]);
    }
  };

  const removeFile = () => {
    setFormData(prev => ({ ...prev, file: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const generateUniqueFileName = (originalName: string) => {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop();
    
    // Nettoyer le nom de fichier : supprimer les caractères spéciaux
    const nameWithoutExtension = originalName
      .replace(/\.[^/.]+$/, "") // Supprimer l'extension
      .normalize("NFD") // Décomposer les caractères accentués
      .replace(/[\u0300-\u036f]/g, "") // Supprimer les accents
      .replace(/[^a-zA-Z0-9]/g, "_") // Remplacer tous les caractères non alphanumériques par _
      .replace(/_+/g, "_") // Remplacer les _ multiples par un seul
      .replace(/^_|_$/g, ""); // Supprimer les _ au début et à la fin
    
    return `${nameWithoutExtension}_${timestamp}_${randomSuffix}.${extension}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.thematic.trim() || !formData.file) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields and select a file",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // 1. Upload file to Supabase Storage
      const uniqueFileName = generateUniqueFileName(formData.file.name);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('Trainings')
        .upload(uniqueFileName, formData.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Upload error: ${uploadError.message}`);
      }

      // 2. Build public URL for the file
      const { data: { publicUrl } } = supabase.storage
        .from('Trainings')
        .getPublicUrl(uniqueFileName);

      // 3. Insert into knowledge_queries table
      const { data: insertData, error: insertError } = await supabase
        .from('knowledge_queries')
        .insert([{
          document_title: formData.title.trim() + ' - formation',
          document_name: formData.title.trim(),
          file_name: uniqueFileName,
          document_url: publicUrl,
          thematic: formData.thematic.trim(),
          status: 'pending'
        }])
        .select()
        .single();

      if (insertError) {
        throw new Error(`Database insertion error: ${insertError.message}`);
      }

      // 4. Call N8N webhook
      try {
        const webhookResponse = await fetch('https://sokle.app.n8n.cloud/webhook/new-training-to-record', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            document_name: formData.title.trim(),
            thematic: formData.thematic.trim(),
            file_url: publicUrl
          })
        });

        if (!webhookResponse.ok) {
          console.warn('Webhook failed but training was saved successfully');
        }
      } catch (webhookError) {
        console.warn('Webhook error (training was still saved):', webhookError);
      }

      // 5. Success - reset and close
      toast({
        title: "Training created successfully",
        description: `"${formData.title}" has been added to the knowledge base`,
        variant: "default",
      });

      setFormData({ title: '', thematic: '', file: null });
      setIsOpen(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Error creating training:', error);
      toast({
        title: "Error",
        description: error.message || "An error occurred while creating the training",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setIsOpen(false);
      setFormData({ title: '', thematic: '', file: null });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      {/* Floating Action Buttons - Brain System */}
      <div className="fixed bottom-6 right-6 z-[9999]">
        
        {/* Bouton "+" - Création de formation */}
        <Button
          onClick={() => {
            setIsOpen(true);
            setIsExpanded(false);
          }}
          className={cn(
            "absolute h-16 w-16 rounded-full transition-all duration-300",
            "bg-hotel-navy hover:bg-hotel-navy/90 border-2 border-hotel-yellow/50 hover:border-hotel-yellow",
            "shadow-lg",
            isExpanded 
              ? "bottom-[170px] opacity-100 translate-y-0" 
              : "bottom-0 opacity-0 translate-y-20 pointer-events-none"
          )}
        >
          <Plus className="text-hotel-gold-dark" style={{ width: '24px', height: '24px' }} />
        </Button>

        {/* Bouton "?" - Création de QCM */}
        <Button
          onClick={() => {
            setIsQCMModalOpen(true);
            setIsExpanded(false);
          }}
          className={cn(
            "absolute h-16 w-16 rounded-full transition-all duration-300",
            "bg-hotel-navy hover:bg-hotel-navy/90 border-2 border-hotel-yellow/50 hover:border-hotel-yellow",
            "shadow-lg",
            isExpanded 
              ? "bottom-[90px] opacity-100 translate-y-0" 
              : "bottom-0 opacity-0 translate-y-20 pointer-events-none"
          )}
        >
          <span className="text-hotel-gold-dark text-2xl font-bold">?</span>
        </Button>

        {/* Main Button - Brain / Close */}
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "h-24 w-24 rounded-full transition-all duration-500",
            "bg-hotel-navy hover:bg-hotel-navy/90 border-2 border-hotel-yellow/50 hover:border-hotel-yellow",
            "shadow-lg relative"
          )}
        >
          <div className="relative flex items-center justify-center">
            {isExpanded ? (
              <X className="text-hotel-gold-dark" style={{ width: '28px', height: '28px' }} />
            ) : (
              <>
                <Brain className="text-hotel-gold-dark" style={{ width: '28px', height: '28px' }} />
                <Plus className="absolute text-hotel-gold-dark" style={{ width: '14px', height: '14px' }} />
              </>
            )}
          </div>
        </Button>
        
        {/* Animation pulsante */}
        <div className="absolute -bottom-12 -right-12 h-48 w-48 rounded-full border-2 border-hotel-yellow/20 animate-ping pointer-events-none" />
      </div>

      {/* Training Creation Modal */}
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              <Brain className="h-5 w-5 text-hotel-navy" />
              Create Training Document
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            {/* Training Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium text-foreground">
                Training Title *
              </Label>
              <Input
                id="title"
                type="text"
                placeholder="e.g., Guest Reception Procedures"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                disabled={isUploading}
                className="transition-all duration-200 hover:border-hotel-yellow focus:border-hotel-yellow focus:ring-2 focus:ring-hotel-yellow/20"
              />
            </div>

            {/* Thematic */}
            <div className="space-y-2">
              <Label htmlFor="thematic" className="text-sm font-medium text-foreground">
                Thematic *
              </Label>
              <Input
                id="thematic"
                type="text"
                placeholder="e.g., Guest Reception, Housekeeping, Maintenance..."
                value={formData.thematic}
                onChange={(e) => setFormData(prev => ({ ...prev, thematic: e.target.value }))}
                disabled={isUploading}
                className="transition-all duration-200 hover:border-hotel-yellow focus:border-hotel-yellow focus:ring-2 focus:ring-hotel-yellow/20"
              />
            </div>

            {/* File Upload with Drag & Drop */}
            <div className="space-y-2">
              <Label htmlFor="file" className="text-sm font-medium text-foreground">
                Document (PDF or Word) *
              </Label>
              
              {/* Drag & Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200",
                  isDragOver 
                    ? "border-hotel-yellow bg-hotel-yellow/10" 
                    : "border-gray-300 hover:border-hotel-yellow/50",
                  isUploading && "opacity-50 cursor-not-allowed"
                )}
              >
                {formData.file ? (
                  /* File selected display */
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-3">
                      <FileText className="h-8 w-8 text-hotel-navy" />
                      <div className="text-left">
                        <p className="font-medium text-sm">{formData.file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeFile}
                        disabled={isUploading}
                        className="ml-auto"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      File ready for upload. Click "Create Training" to proceed.
                    </p>
                  </div>
                ) : (
                  /* Drag & Drop prompt */
                  <div className="space-y-4">
                    <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                    <div>
                      <p className="text-sm font-medium mb-1">
                        Drag and drop your file here
                      </p>
                      <p className="text-xs text-muted-foreground mb-3">
                        or click to browse (PDF, DOC, DOCX only)
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="hover:border-hotel-yellow hover:text-hotel-yellow"
                      >
                        Browse Files
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                onChange={handleInputFileChange}
                disabled={isUploading}
                className="hidden"
              />
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUploading || !formData.title.trim() || !formData.thematic.trim() || !formData.file}
                className="min-w-[160px] bg-hotel-navy hover:bg-hotel-navy/90 text-white"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Create Training'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* QCM Creation Modal */}
      <QCMCreationModal
        isOpen={isQCMModalOpen}
        onClose={() => setIsQCMModalOpen(false)}
      />
    </>
  );
}
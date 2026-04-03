import { useState, useRef, useEffect } from 'react';
import { Brain, Plus, Upload, Loader2, FileText, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { QCMCreationModal } from '@/components/modals/QCMCreationModal';

interface KnowledgeDoc {
  id: string;
  document_name: string;
  thematic: string;
  file_name: string;
  document_url: string;
}

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

  // ── Update mode states ──
  const [mode, setMode] = useState<'new' | 'update'>('new');
  const [trainingDocs, setTrainingDocs] = useState<KnowledgeDoc[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDoc | null>(null);
  const [updateFile, setUpdateFile] = useState<File | null>(null);
  const [updateDragOver, setUpdateDragOver] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const updateFileInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch existing training docs from knowledge_queries ──
  const fetchTrainingDocs = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('knowledge_queries')
        .select('id, document_name, thematic, file_name, document_url')
        .eq('formation_steps', 'formation')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur fetch training docs:', error);
        return;
      }

      // Déduplication par document_name
      const unique = Object.values(
        (data || []).reduce((acc: Record<string, KnowledgeDoc>, doc: KnowledgeDoc) => {
          if (!acc[doc.document_name]) acc[doc.document_name] = doc;
          return acc;
        }, {})
      ) as KnowledgeDoc[];

      setTrainingDocs(unique);
    } catch (err) {
      console.error('fetchTrainingDocs error:', err);
    }
  };

  useEffect(() => {
    if (isOpen && mode === 'update') {
      fetchTrainingDocs();
    }
  }, [isOpen, mode]);

  const filteredDocs = trainingDocs.filter(doc =>
    doc.document_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── New doc file handlers (unchanged) ──
  const handleFileChange = (file: File) => {
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
    if (file) handleFileChange(file);
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
    if (files.length > 0) handleFileChange(files[0]);
  };

  const removeFile = () => {
    setFormData(prev => ({ ...prev, file: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Update mode file handlers ──
  const handleUpdateFileChange = (file: File) => {
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
    setUpdateFile(file);
  };

  const handleUpdateInputFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpdateFileChange(file);
  };

  const handleUpdateDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setUpdateDragOver(true);
  };

  const handleUpdateDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setUpdateDragOver(false);
  };

  const handleUpdateDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setUpdateDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) handleUpdateFileChange(files[0]);
  };

  const removeUpdateFile = () => {
    setUpdateFile(null);
    if (updateFileInputRef.current) updateFileInputRef.current.value = '';
  };

  const generateUniqueFileName = (originalName: string) => {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop();
    const nameWithoutExtension = originalName
      .replace(/\.[^/.]+$/, "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");
    return `${nameWithoutExtension}_${timestamp}_${randomSuffix}.${extension}`;
  };

  // ── Submit new training (unchanged logic) ──
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
      const uniqueFileName = generateUniqueFileName(formData.file.name);

      const { error: uploadError } = await supabase.storage
        .from('Trainings')
        .upload(uniqueFileName, formData.file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw new Error(`Upload error: ${uploadError.message}`);

      const { data: { publicUrl } } = supabase.storage.from('Trainings').getPublicUrl(uniqueFileName);

      const { error: insertError } = await supabase
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

      if (insertError) throw new Error(`Database insertion error: ${insertError.message}`);

      try {
        const webhookResponse = await fetch('https://sokle.app.n8n.cloud/webhook/new-training-to-record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            document_name: formData.title.trim(),
            thematic: formData.thematic.trim(),
            file_url: publicUrl
          })
        });
        if (!webhookResponse.ok) console.warn('Webhook failed but training was saved successfully');
      } catch (webhookError) {
        console.warn('Webhook error (training was still saved):', webhookError);
      }

      toast({
        title: "Training created successfully",
        description: `"${formData.title}" has been added to the knowledge base`,
      });

      setFormData({ title: '', thematic: '', file: null });
      setIsOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (error: any) {
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

  // ── Update existing training ──
  const handleUpdate = async () => {
    if (!selectedDoc || !updateFile) {
      toast({
        title: "Sélection incomplète",
        description: "Veuillez sélectionner une formation et un nouveau fichier",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const uniqueFileName = generateUniqueFileName(updateFile.name);

      const { error: uploadError } = await supabase.storage
        .from('Trainings')
        .upload(uniqueFileName, updateFile, { cacheControl: '3600', upsert: false });

      if (uploadError) throw new Error(`Upload error: ${uploadError.message}`);

      const { data: { publicUrl } } = supabase.storage.from('Trainings').getPublicUrl(uniqueFileName);

      const webhookResponse = await fetch('https://sokle.app.n8n.cloud/webhook/new-training-to-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_name: selectedDoc.document_name,
          thematic: selectedDoc.thematic,
          file_url: publicUrl
        })
      });

      if (!webhookResponse.ok) {
        console.warn('Webhook responded with non-ok status, update may still be processing');
      }

      toast({
        title: "✅ Mise à jour lancée !",
        description: `"${selectedDoc.document_name}" est en cours de retraitement`,
      });

      setSelectedDoc(null);
      setUpdateFile(null);
      setSearchQuery('');
      setIsOpen(false);
      if (updateFileInputRef.current) updateFileInputRef.current.value = '';

    } catch (error: any) {
      console.error('Error updating training:', error);
      toast({
        title: "Error",
        description: error.message || "An error occurred while updating the training",
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
      setMode('new');
      setSelectedDoc(null);
      setUpdateFile(null);
      setSearchQuery('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (updateFileInputRef.current) updateFileInputRef.current.value = '';
    }
  };

  return (
    <>
      {/* Floating Action Buttons - Brain System */}
      <div className="fixed bottom-6 right-6 z-[9999]">

        {/* Bouton "+" - Création de formation */}
        <Button
          onClick={() => { setIsOpen(true); setIsExpanded(false); }}
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
          onClick={() => { setIsQCMModalOpen(true); setIsExpanded(false); }}
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

      {/* Training Modal */}
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              <Brain className="h-5 w-5 text-hotel-navy" />
              {mode === 'new' ? 'Create Training Document' : 'Find the training to update'}
            </DialogTitle>
          </DialogHeader>

          {/* ── Mode toggle ── */}
          <div className="flex gap-2 mt-2">
            <Button
              type="button"
              onClick={() => {
                setMode('new');
                setSelectedDoc(null);
                setSearchQuery('');
                setUpdateFile(null);
              }}
              disabled={isUploading}
              className={cn(
                "flex-1",
                mode === 'new'
                  ? "bg-hotel-yellow hover:bg-hotel-yellow/90 text-hotel-navy font-semibold"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              Create Training Document
            </Button>
            <Button
              type="button"
              onClick={() => {
                setMode('update');
                setFormData({ title: '', thematic: '', file: null });
              }}
              disabled={isUploading}
              className={cn(
                "flex-1",
                mode === 'update'
                  ? "bg-hotel-yellow hover:bg-hotel-yellow/90 text-hotel-navy font-semibold"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              Find the training to update
            </Button>
          </div>

          {/* ══ MODE NEW ══ */}
          {mode === 'new' && (
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

              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="file" className="text-sm font-medium text-foreground">
                  Document (PDF or Word) *
                </Label>
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
                    <div className="space-y-4">
                      <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                      <div>
                        <p className="text-sm font-medium mb-1">Drag and drop your file here</p>
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
                <Button type="button" variant="outline" onClick={handleClose} disabled={isUploading}>
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
          )}

          {/* ══ MODE UPDATE ══ */}
          {mode === 'update' && (
            <div className="space-y-4 pt-4">

              {/* Warning banner */}
              <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">⚠️</span>
                  <p className="text-sm text-gray-700">
                    ATTENTION : Pour mettre à jour des connaissances - vous devez sélectionner le fichier à modifier ou remplacer. Le remplacement écrasera toutes les données vectorisées du document précédent.
                  </p>
                </div>
              </div>

              {!selectedDoc ? (
                <>
                  {/* Search bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Rechercher une formation..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Scrollable list */}
                  <div className="max-h-[360px] overflow-y-auto space-y-2 border rounded-lg p-2">
                    {filteredDocs.length === 0 ? (
                      <p className="text-center text-gray-500 py-8 text-sm">
                        {searchQuery ? 'Aucune formation trouvée' : 'Aucune formation disponible'}
                      </p>
                    ) : (
                      filteredDocs.map((doc) => (
                        <div
                          key={doc.id}
                          onClick={() => setSelectedDoc(doc)}
                          className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 hover:border-hotel-yellow transition-all duration-200"
                        >
                          <p className="font-medium text-sm text-gray-900 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-hotel-navy flex-shrink-0" />
                            {doc.document_name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 ml-6">Thématique : {doc.thematic}</p>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  {/* Selected doc info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="font-semibold text-blue-900 mb-2">Document à mettre à jour :</p>
                    <p className="text-sm text-gray-900 flex items-center gap-2">
                      <FileText className="h-4 w-4 flex-shrink-0" />
                      {selectedDoc.document_name}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Thématique : {selectedDoc.thematic}</p>
                  </div>

                  {/* New file upload zone */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Nouveau fichier à charger *</Label>
                    <div
                      onDragOver={handleUpdateDragOver}
                      onDragLeave={handleUpdateDragLeave}
                      onDrop={handleUpdateDrop}
                      className={cn(
                        "border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200",
                        updateDragOver
                          ? "border-hotel-yellow bg-hotel-yellow/10"
                          : "border-gray-300 hover:border-hotel-yellow/50",
                        isUploading && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {updateFile ? (
                        <div className="flex items-center justify-center gap-3">
                          <FileText className="h-8 w-8 text-hotel-navy" />
                          <div className="text-left">
                            <p className="font-medium text-sm">{updateFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(updateFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={removeUpdateFile}
                            disabled={isUploading}
                            className="ml-auto"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                          <div>
                            <p className="text-sm font-medium mb-1">Glissez-déposez le nouveau fichier</p>
                            <p className="text-xs text-muted-foreground mb-3">ou cliquez pour parcourir</p>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => updateFileInputRef.current?.click()}
                              disabled={isUploading}
                              className="hover:border-hotel-yellow hover:text-hotel-yellow"
                            >
                              Parcourir
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                    <input
                      ref={updateFileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                      onChange={handleUpdateInputFileChange}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </div>

                  {/* Back link */}
                  <button
                    type="button"
                    onClick={() => { setSelectedDoc(null); setUpdateFile(null); }}
                    disabled={isUploading}
                    className="text-sm text-hotel-navy hover:underline disabled:opacity-50"
                  >
                    ← Choisir un autre document
                  </button>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                      disabled={isUploading}
                      className="flex-1"
                    >
                      Annuler
                    </Button>
                    <Button
                      type="button"
                      onClick={handleUpdate}
                      disabled={!updateFile || isUploading}
                      className="flex-1 bg-hotel-navy hover:bg-hotel-navy/90 text-white"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Mise à jour...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Mettre à jour
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
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

import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X, File, Image, FileText, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sendTaskUpdatedEvent } from '@/lib/webhookService';
import { useProfiles, useLocations } from '@/hooks/useSupabaseData';
import { useToast } from '@/hooks/use-toast';

interface AttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: any;
  onUpdate?: () => void;
  onSave?: (attachmentData: UploadedFile[]) => void; // ✅ Nouveau prop
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: 'file' | 'link';
  url?: string;
  fileType?: string; // MIME type for files
}

export const AttachmentModal: React.FC<AttachmentModalProps> = ({ 
  isOpen, 
  onClose,
  task,
  onUpdate,
  onSave
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [linkUrl, setLinkUrl] = useState('');
  
  const { profiles } = useProfiles();
  const { locations } = useLocations();
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files: FileList) => {
    Array.from(files).forEach(file => {
      const newFile: UploadedFile = {
        id: Date.now().toString() + Math.random(),
        name: file.name,
        size: file.size,
        type: 'file' as const,
        fileType: file.type,
        url: URL.createObjectURL(file)
      };
      setAttachments(prev => [...prev, newFile]);
    });
  };

  const handleAddLink = () => {
    if (linkUrl.trim()) {
      const newAttachment: UploadedFile = {
        id: Date.now().toString() + Math.random(),
        name: linkUrl.length > 50 ? linkUrl.substring(0, 47) + '...' : linkUrl,
        size: 0,
        type: 'link' as const,
        url: linkUrl
      };
      setAttachments(prev => [...prev, newAttachment]);
      setLinkUrl('');
    }
  };

  const removeFile = (fileId: string) => {
    setAttachments(prev => prev.filter(file => file.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (attachment: UploadedFile) => {
    if (attachment.type === 'link') return <Paperclip className="h-6 w-6" />;
    if (attachment.fileType?.startsWith('image/')) return <Image className="h-6 w-6" />;
    if (attachment.fileType?.includes('pdf') || attachment.fileType?.includes('document')) return <FileText className="h-6 w-6" />;
    return <File className="h-6 w-6" />;
  };

  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleClickBrowse = () => {
    inputRef.current?.click();
  };

  const handleSubmit = async () => {
    if (task && attachments.length > 0) {
      try {
        const attachmentsData = attachments.map(attachment => ({
          id: attachment.id,
          name: attachment.name,
          size: attachment.size,
          type: attachment.type,
          url: attachment.type === 'link' ? attachment.url : `drive-path-to-be-defined/${attachment.name}` // URL réelle pour links, chemin drive pour files
        }));

        // Send webhook event for task update with attachments
        const webhookResult = await sendTaskUpdatedEvent(
          task.id,
          task,
          task,
          profiles,
          locations,
          {
            attachments: attachmentsData
          }
        );

        if (webhookResult.success) {
          toast({
            title: "Attachments Added",
            description: "Attachments have been added and notification sent successfully",
          });
          // Call onUpdate to trigger data refresh
          if (onUpdate) {
            onUpdate();
          }
        } else {
          toast({
            title: "Webhook Error",
            description: webhookResult.error || "Failed to send attachment notification",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error sending webhook:', error);
        toast({
          title: "Attachment Error",
          description: "Failed to send attachment notification",
          variant: "destructive",
        });
      }
    }
    
    // Reset and close
    setAttachments([]);
    setLinkUrl('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            Add attachment
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Drag and Drop Zone */}
          <div 
            className={cn(
              "border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center space-y-4 hover:border-primary/50 transition-colors cursor-pointer",
              dragActive && "border-primary bg-primary/5"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={handleClickBrowse}
          >
            <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
            <div className="space-y-2">
              <p className="text-sm font-medium">Drag and drop your files here</p>
              <p className="text-xs text-muted-foreground">or click to browse</p>
            </div>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              multiple
              onChange={handleChange}
            />
          </div>

          {/* OR Separator */}
          <div className="flex items-center gap-4">
            <div className="flex-1 border-t border-muted-foreground/20"></div>
            <span className="text-sm text-muted-foreground font-medium">OR</span>
            <div className="flex-1 border-t border-muted-foreground/20"></div>
          </div>

          {/* Link Section */}
          <div className="space-y-3">
            <div className="text-center">
              <p className="text-sm font-medium">PASTE A LINK TO THIS DOCUMENT</p>
              <p className="text-xs text-muted-foreground mt-1">Internet URL, company drive link, etc.</p>
            </div>
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="https://example.com/document or drive.company.com/file..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && linkUrl.trim()) {
                    handleAddLink();
                  }
                }}
              />
              <Button
                onClick={handleAddLink}
                disabled={!linkUrl.trim()}
                size="sm"
              >
                Add Link
              </Button>
            </div>
          </div>

          {/* Attachments List */}
          {attachments.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Selected attachments:</p>
              {attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                  <div className="flex items-center gap-2">
                    <div className="text-muted-foreground">
                      {getFileIcon(attachment)}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-sm font-medium truncate">
                        {attachment.type === 'link' ? 'Link: ' : ''}{attachment.name}
                      </span>
                      {attachment.type === 'link' ? (
                        <span className="text-xs text-muted-foreground truncate">{attachment.url}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(attachment.size)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(attachment.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                setAttachments([]);
                setLinkUrl('');
                onClose();
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (onSave && attachments.length > 0) {
                  console.log('📎 Envoi des attachments au parent:', attachments);
                  onSave(attachments);
                }
                setAttachments([]);
                setLinkUrl('');
                onClose();
              }}
              disabled={attachments.length === 0}
            >
              Add {attachments.length > 0 && `(${attachments.length})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
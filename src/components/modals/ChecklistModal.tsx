import { useState } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (title: string) => void;
}

export function ChecklistModal({ isOpen, onClose, onAdd }: ChecklistModalProps) {
  const [title, setTitle] = useState('Checklist');

  const handleAdd = () => {
    if (title.trim()) {
      onAdd(title.trim());
      setTitle('Checklist');
      onClose();
    }
  };

  const handleCancel = () => {
    setTitle('Checklist');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="flex-row items-center justify-between space-y-0 pb-4 border-b">
          <h2 className="text-lg font-bold text-foreground">
            Ajouter une checklist
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div>
            <Label htmlFor="checklistTitle">Titre</Label>
            <Input
              id="checklistTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1"
              autoFocus
              onFocus={(e) => e.target.select()}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={handleCancel}>
              Annuler
            </Button>
            <Button onClick={handleAdd}>
              Ajouter
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
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
        <DialogHeader className="pb-4 border-b">
          <h2 className="text-lg font-bold text-foreground">
            Add a Checklist
          </h2>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div>
            <Label htmlFor="checklistTitle">Title</Label>
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
              Cancel
            </Button>
            <Button onClick={handleAdd}>
              Add
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
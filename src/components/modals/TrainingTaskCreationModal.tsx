import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, Plus } from 'lucide-react';

interface TrainingTaskCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated?: () => void;
}

const TrainingTaskCreationModal = ({ isOpen, onClose, onTaskCreated }: TrainingTaskCreationModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a training title",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create training task
      const { data, error } = await supabase
        .from('task')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          category: 'training',
          priority: priority,
          status: 'pending',
          location: location.trim() || 'Online Training',
          service: 'direction', // Default service for training
          origin_type: 'team',
          created_by: user.id,
          assigned_to: [user.id], // Self-assigned initially
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Training task created successfully!",
        variant: "default",
      });

      // Reset form
      setTitle('');
      setDescription('');
      setPriority('normal');
      setLocation('');
      
      // Close modal and refresh data
      onClose();
      if (onTaskCreated) {
        onTaskCreated();
      }

    } catch (error) {
      console.error('Error creating training task:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create training task",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setTitle('');
      setDescription('');
      setPriority('normal');
      setLocation('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Create Training Task
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Training Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Customer Service Excellence"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the training objectives and content..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={(value: 'normal' | 'urgent') => setPriority(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="location">Training Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Training Room A, Online, Conference Hall"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                'Creating...'
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Training
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TrainingTaskCreationModal;
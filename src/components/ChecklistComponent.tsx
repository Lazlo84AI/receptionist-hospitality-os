import { useState } from 'react';
import { CheckSquare, Trash2, User, Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useProfiles } from '@/hooks/useSupabaseData';

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  assignedTo?: { name: string; avatar: string };
  dueDate?: Date;
}

interface ChecklistComponentProps {
  title: string;
  onDelete: () => void;
}

export function ChecklistComponent({ title, onDelete }: ChecklistComponentProps) {
  const { profiles } = useProfiles();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState<{ name: string; avatar: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [showAssignPopover, setShowAssignPopover] = useState(false);
  const [showDatePopover, setShowDatePopover] = useState(false);

  const completedCount = items.filter(item => item.completed).length;
  const progressPercentage = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  // Transform profiles to member format
  const members = profiles.map(profile => ({
    name: profile.first_name && profile.last_name 
      ? `${profile.first_name} ${profile.last_name}` 
      : profile.email || 'Unknown',
    avatar: profile.first_name && profile.last_name
      ? `${profile.first_name[0]}${profile.last_name[0]}`
      : profile.email ? profile.email[0].toUpperCase() : 'U'
  }));

  const handleAddItem = () => {
    if (newItemText.trim()) {
      const newItem: ChecklistItem = {
        id: Date.now().toString(),
        text: newItemText.trim(),
        completed: false,
        assignedTo: selectedAssignee || undefined,
        dueDate: selectedDate
      };
      setItems([...items, newItem]);
      setNewItemText('');
      setSelectedAssignee(null);
      setSelectedDate(undefined);
      setIsAdding(false);
    }
  };

  const handleCancel = () => {
    setNewItemText('');
    setSelectedAssignee(null);
    setSelectedDate(undefined);
    setIsAdding(false);
  };

  const toggleItem = (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  return (
    <div className="border border-border rounded-lg p-4 mb-4 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium text-foreground">{title}</h3>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onDelete}
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">{progressPercentage}%</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Existing Items */}
      <div className="space-y-2 mb-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 p-2 rounded border border-border hover:bg-muted/50">
            <Checkbox
              checked={item.completed}
              onCheckedChange={() => toggleItem(item.id)}
            />
            <span className={cn(
              "flex-1 text-sm",
              item.completed ? "line-through text-muted-foreground" : "text-foreground"
            )}>
              {item.text}
            </span>
            
            {/* Assignee Avatar */}
            {item.assignedTo && (
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {item.assignedTo.avatar}
                </AvatarFallback>
              </Avatar>
            )}
            
            {/* Due Date */}
            {item.dueDate && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {item.dueDate.toLocaleDateString()}
              </div>
            )}
            
            {/* Delete Item */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteItem(item.id)}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      {/* Add New Item */}
      <div className="space-y-3">
        <Input
          placeholder="Add an item"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          onFocus={() => setIsAdding(true)}
          className={cn(
            "transition-colors",
            isAdding && "border-yellow-400 focus:border-yellow-400 focus:ring-yellow-400"
          )}
        />
        
        {isAdding && (
          <div className="space-y-3">
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleAddItem}
                disabled={!newItemText.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Add
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleCancel}
                className="text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
            </div>
            
            {/* Contextual Options */}
            <div className="flex items-center gap-3">
              {/* Assign Member */}
              <Popover open={showAssignPopover} onOpenChange={setShowAssignPopover}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className={cn(
                      "flex items-center gap-2 h-8",
                      selectedAssignee ? "bg-muted" : ""
                    )}
                  >
                    <User className="h-3 w-3" />
                    {selectedAssignee ? selectedAssignee.name : "Assign"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="start">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-foreground mb-2">Assign to</div>
                    {members.map((member) => (
                      <div
                        key={member.avatar}
                        className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                        onClick={() => {
                          setSelectedAssignee(member);
                          setShowAssignPopover(false);
                        }}
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                            {member.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-foreground">{member.name}</span>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Due Date */}
              <Popover open={showDatePopover} onOpenChange={setShowDatePopover}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className={cn(
                      "flex items-center gap-2 h-8",
                      selectedDate ? "bg-muted" : ""
                    )}
                  >
                    <Clock className="h-3 w-3" />
                    {selectedDate ? selectedDate.toLocaleDateString() : "Due date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      setShowDatePopover(false);
                    }}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

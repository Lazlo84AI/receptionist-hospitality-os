import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Clock, Users, AlertTriangle, CheckCircle, Play, Square } from 'lucide-react';
import { useActiveShift } from '@/hooks/useShifts';
import { useTasks } from '@/hooks/useTasks';
import { getCurrentShiftReceptionist } from '@/hooks/useUsers';
import { useLatestHandover } from '@/hooks/useShifts';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TaskValidation {
  taskId: string;
  validated: boolean;
}

export function ShiftManagement() {
  const { toast } = useToast();
  const [testingMode, setTestingMode] = useState(false);
  const [handoverNotes, setHandoverNotes] = useState('');
  const [voiceNoteUrl, setVoiceNoteUrl] = useState('');
  const [taskValidations, setTaskValidations] = useState<TaskValidation[]>([]);
  const [showHandoverDialog, setShowHandoverDialog] = useState(false);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [selectedShiftType, setSelectedShiftType] = useState<string>('');

  const { receptionist } = getCurrentShiftReceptionist();
  const { activeShift, loading: shiftLoading, refetch: refetchShift } = useActiveShift(receptionist?.id);
  const { tasks, loading: tasksLoading } = useTasks();
  const { latestHandover, loading: handoverLoading } = useLatestHandover();

  // Filter pending and in-progress tasks
  const pendingTasks = tasks.filter(task => 
    ['pending', 'in_progress'].includes(task.status) && 
    (task.department === receptionist?.department || !task.department)
  );

  useEffect(() => {
    setTaskValidations(pendingTasks.map(task => ({ taskId: task.id, validated: false })));
  }, [pendingTasks.length]);

  const allTasksValidated = taskValidations.length > 0 && taskValidations.every(tv => tv.validated);

  const getCurrentShiftType = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 14) return 'morning';
    if (hour >= 14 && hour < 22) return 'afternoon';
    return 'night';
  };

  const getShiftEndTime = () => {
    if (!activeShift) return null;
    const startTime = new Date(activeShift.start_time);
    const endTime = new Date(startTime);
    
    if (testingMode) {
      endTime.setMinutes(startTime.getMinutes() + 30); // 30 minutes for testing
    } else {
      endTime.setHours(startTime.getHours() + 8); // 8 hour shift
    }
    
    return endTime;
  };

  const getTimeUntilShiftEnd = () => {
    const endTime = getShiftEndTime();
    if (!endTime) return null;
    
    const now = new Date();
    const timeDiff = endTime.getTime() - now.getTime();
    return Math.max(0, timeDiff);
  };

  const shouldShowHandoverPrompt = () => {
    const timeUntilEnd = getTimeUntilShiftEnd();
    if (!timeUntilEnd) return false;
    
    const fifteenMinutes = testingMode ? 5 * 60 * 1000 : 15 * 60 * 1000; // 5 min in testing, 15 min normal
    return timeUntilEnd <= fifteenMinutes;
  };

  const handleTaskValidation = (taskId: string, validated: boolean) => {
    setTaskValidations(prev => 
      prev.map(tv => tv.taskId === taskId ? { ...tv, validated } : tv)
    );
  };

  const handleStartShift = async () => {
    if (!receptionist) {
      toast({ title: "Error", description: "No receptionist found", variant: "destructive" });
      return;
    }

    try {
      const shiftData = {
        receptionist_id: receptionist.id,
        shift_type: testingMode ? selectedShiftType : getCurrentShiftType(),
        start_time: new Date().toISOString(),
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('shifts')
        .insert([shiftData])
        .select()
        .single();

      if (error) throw error;

      // Update to_shift_id in latest handover if exists
      if (latestHandover && !latestHandover.to_shift_id) {
        await supabase
          .from('shift_handovers')
          .update({ to_shift_id: data.id })
          .eq('id', latestHandover.id);
      }

      // Send to webhook
      await fetch('http://localhost:5678/webhook-test/get_data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'shift_started', data: shiftData })
      });

      toast({ title: "Success", description: "Shift started successfully" });
      refetchShift();
      setShowStartDialog(false);
    } catch (error) {
      console.error('Error starting shift:', error);
      toast({ title: "Error", description: "Failed to start shift", variant: "destructive" });
    }
  };

  const handleEndShift = async () => {
    if (!activeShift || !receptionist) return;

    try {
      const endTime = new Date().toISOString();
      
      // Update current shift
      const { error: shiftError } = await supabase
        .from('shifts')
        .update({ 
          status: 'completed', 
          end_time: endTime,
          handover_notes: handoverNotes,
          voice_handover_url: voiceNoteUrl || null,
          updated_at: endTime
        })
        .eq('id', activeShift.id);

      if (shiftError) throw shiftError;

      // Create handover entry
      const handoverData = {
        from_shift_id: activeShift.id,
        handover_data: {
          pending_tasks: pendingTasks.map(task => ({
            id: task.id,
            title: task.title,
            status: task.status,
            priority: task.priority
          })),
          task_count: pendingTasks.length,
          shift_summary: {
            total_tasks: tasks.length,
            completed_tasks: tasks.filter(t => t.status === 'completed').length
          }
        },
        additional_notes: handoverNotes || null,
        voice_notes_url: voiceNoteUrl || null,
        created_at: endTime
      };

      const { error: handoverError } = await supabase
        .from('shift_handovers')
        .insert([handoverData]);

      if (handoverError) throw handoverError;

      // Send to webhook
      await fetch('http://localhost:5678/webhook-test/get_data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'shift_ended', data: handoverData })
      });

      toast({ title: "Success", description: "Shift ended and handover created" });
      refetchShift();
      setShowHandoverDialog(false);
      setHandoverNotes('');
      setVoiceNoteUrl('');
    } catch (error) {
      console.error('Error ending shift:', error);
      toast({ title: "Error", description: "Failed to end shift", variant: "destructive" });
    }
  };

  if (shiftLoading || tasksLoading || handoverLoading) {
    return <div className="flex items-center justify-center p-8">Loading shift data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Testing Mode Toggle */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="testing-mode"
              checked={testingMode}
              onCheckedChange={setTestingMode}
            />
            <Label htmlFor="testing-mode">Testing Mode (Quick Shifts)</Label>
          </div>
        </Card>
      )}

      {/* Current Shift Status */}
      <Card className="p-6">
        <div className="flex items-center space-x-4">
          {activeShift ? (
            <>
              <div className="flex items-center space-x-2">
                <Play className="h-5 w-5 text-green-500" />
                <span className="font-medium">Active Shift</span>
                <Badge variant="secondary">{activeShift.shift_type}</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Started: {new Date(activeShift.start_time).toLocaleString()}
              </div>
            </>
          ) : (
            <>
              <Square className="h-5 w-5 text-gray-400" />
              <span className="font-medium">No Active Shift</span>
            </>
          )}
        </div>
      </Card>

      {/* Latest Handover Notes */}
      {latestHandover && !activeShift && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Previous Shift Handover
          </h3>
          {latestHandover.additional_notes && (
            <div className="mb-4">
              <Label className="text-sm font-medium">Notes:</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {latestHandover.additional_notes}
              </p>
            </div>
          )}
          {latestHandover.voice_notes_url && (
            <div className="mb-4">
              <Label className="text-sm font-medium">Voice Note:</Label>
              <audio controls className="mt-2 w-full">
                <source src={latestHandover.voice_notes_url} />
              </audio>
            </div>
          )}
          <div className="text-sm text-muted-foreground">
            Tasks to review: {latestHandover.handover_data?.task_count || 0}
          </div>
        </Card>
      )}

      {/* Task Validation */}
      {pendingTasks.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Tasks Requiring Validation ({pendingTasks.length})
          </h3>
          <div className="space-y-3">
            {pendingTasks.map((task) => {
              const validation = taskValidations.find(tv => tv.taskId === task.id);
              return (
                <div key={task.id} className="flex items-center space-x-3 p-3 border rounded">
                  <Checkbox
                    checked={validation?.validated || false}
                    onCheckedChange={(checked) => 
                      handleTaskValidation(task.id, checked as boolean)
                    }
                  />
                  <div className="flex-1">
                    <div className="font-medium">{task.title}</div>
                    <div className="text-sm text-muted-foreground">
                      <Badge variant={task.priority === 'urgent' ? 'destructive' : 'secondary'}>
                        {task.priority}
                      </Badge>
                      <span className="ml-2">{task.status}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Shift Actions */}
      <div className="flex space-x-4">
        {!activeShift ? (
          <Button
            onClick={() => setShowStartDialog(true)}
            disabled={!allTasksValidated && pendingTasks.length > 0}
            className="flex items-center space-x-2"
          >
            <Play className="h-4 w-4" />
            <span>Start Shift</span>
          </Button>
        ) : (
          <>
            {shouldShowHandoverPrompt() && (
              <Button
                onClick={() => setShowHandoverDialog(true)}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Clock className="h-4 w-4" />
                <span>Prepare Handover</span>
              </Button>
            )}
            <Button
              onClick={() => setShowHandoverDialog(true)}
              variant="destructive"
              className="flex items-center space-x-2"
            >
              <Square className="h-4 w-4" />
              <span>End Shift</span>
            </Button>
          </>
        )}
      </div>

      {/* Start Shift Dialog */}
      <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start New Shift</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {testingMode && (
              <div>
                <Label htmlFor="shift-type">Shift Type</Label>
                <Select value={selectedShiftType} onValueChange={setSelectedShiftType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select shift type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning (6:00 - 14:00)</SelectItem>
                    <SelectItem value="afternoon">Afternoon (14:00 - 22:00)</SelectItem>
                    <SelectItem value="night">Night (22:00 - 6:00)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex space-x-2">
              <Button onClick={handleStartShift} className="flex-1">
                <Play className="h-4 w-4 mr-2" />
                Start Shift
              </Button>
              <Button variant="outline" onClick={() => setShowStartDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Handover Dialog */}
      <Dialog open={showHandoverDialog} onOpenChange={setShowHandoverDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Shift Handover</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="handover-notes">Handover Notes for Next Shift</Label>
              <Textarea
                id="handover-notes"
                value={handoverNotes}
                onChange={(e) => setHandoverNotes(e.target.value)}
                placeholder="Add any important information for the next shift..."
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="voice-note">Voice Note URL (Optional)</Label>
              <Input
                id="voice-note"
                value={voiceNoteUrl}
                onChange={(e) => setVoiceNoteUrl(e.target.value)}
                placeholder="https://example.com/voice-note.mp3"
              />
            </div>
            <div className="bg-muted p-4 rounded">
              <h4 className="font-medium mb-2">Summary to Handover:</h4>
              <ul className="text-sm space-y-1">
                <li>• {pendingTasks.length} pending/in-progress tasks</li>
                <li>• {tasks.filter(t => t.status === 'completed').length} completed tasks today</li>
                <li>• Shift duration: {activeShift ? Math.round((Date.now() - new Date(activeShift.start_time).getTime()) / (1000 * 60 * 60 * 100)) / 10 : 0} hours</li>
              </ul>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleEndShift} className="flex-1">
                <CheckCircle className="h-4 w-4 mr-2" />
                End Shift & Create Handover
              </Button>
              <Button variant="outline" onClick={() => setShowHandoverDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
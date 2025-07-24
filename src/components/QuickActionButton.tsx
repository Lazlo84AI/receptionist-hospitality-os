import { useState } from 'react';
import { Plus, ClipboardList, AlertTriangle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CreateTaskModal } from './modals/CreateTaskModal';

export function QuickActionButton() {
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);

  const handleTaskAction = () => {
    setShowQuickActions(false);
    setShowCreateTask(true);
  };

  return (
    <>
      {/* Floating Action Button */}
      <Button
        onClick={() => setShowQuickActions(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-50"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Quick Actions Modal */}
      <Dialog open={showQuickActions} onOpenChange={setShowQuickActions}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-center">Quick Actions</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Button
              onClick={handleTaskAction}
              className="w-full h-16 justify-start text-left bg-card hover:bg-muted border border-border text-foreground"
              variant="outline"
            >
              <ClipboardList className="h-6 w-6 mr-4 text-accent" />
              <div>
                <div className="font-medium">Create Task</div>
                <div className="text-sm text-muted-foreground">Add a new task or assignment</div>
              </div>
            </Button>
            
            <Button
              className="w-full h-16 justify-start text-left bg-card hover:bg-muted border border-border text-foreground opacity-50 cursor-not-allowed"
              variant="outline"
              disabled
            >
              <AlertTriangle className="h-6 w-6 mr-4 text-muted-foreground" />
              <div>
                <div className="font-medium">Create Incident</div>
                <div className="text-sm text-muted-foreground">Report an incident (Coming soon)</div>
              </div>
            </Button>

            <Button
              className="w-full h-16 justify-start text-left bg-card hover:bg-muted border border-border text-foreground opacity-50 cursor-not-allowed"
              variant="outline"
              disabled
            >
              <Users className="h-6 w-6 mr-4 text-muted-foreground" />
              <div>
                <div className="font-medium">Create Special Client Request</div>
                <div className="text-sm text-muted-foreground">Add client request (Coming soon)</div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Task Modal */}
      <CreateTaskModal 
        isOpen={showCreateTask} 
        onClose={() => setShowCreateTask(false)} 
      />
    </>
  );
}
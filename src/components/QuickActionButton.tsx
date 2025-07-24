import { useState } from 'react';
import { Plus, ClipboardList, AlertTriangle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CreateTaskModal } from './modals/CreateTaskModal';
import { CreateIncidentModal } from './modals/CreateIncidentModal';
import { CreateSpecialRequestModal } from './modals/CreateSpecialRequestModal';

export function QuickActionButton() {
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showCreateIncident, setShowCreateIncident] = useState(false);
  const [showCreateSpecialRequest, setShowCreateSpecialRequest] = useState(false);

  const handleTaskAction = () => {
    setShowQuickActions(false);
    setShowCreateTask(true);
  };

  const handleIncidentAction = () => {
    setShowQuickActions(false);
    setShowCreateIncident(true);
  };

  const handleSpecialRequestAction = () => {
    setShowQuickActions(false);
    setShowCreateSpecialRequest(true);
  };

  return (
    <>
      {/* Quick Action Button in Header */}
      <Button
        onClick={() => setShowQuickActions(true)}
        className="h-10 w-10 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 bg-champagne-gold hover:bg-champagne-gold/90 text-palace-navy"
        size="icon"
      >
        <Plus className="h-5 w-5" />
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
              onClick={handleIncidentAction}
              className="w-full h-16 justify-start text-left bg-card hover:bg-muted border border-border text-foreground"
              variant="outline"
            >
              <AlertTriangle className="h-6 w-6 mr-4 text-accent" />
              <div>
                <div className="font-medium">Create Incident</div>
                <div className="text-sm text-muted-foreground">Report an incident or issue</div>
              </div>
            </Button>

            <Button
              onClick={handleSpecialRequestAction}
              className="w-full h-16 justify-start text-left bg-card hover:bg-muted border border-border text-foreground"
              variant="outline"
            >
              <Users className="h-6 w-6 mr-4 text-accent" />
              <div>
                <div className="font-medium">Create Special Client Request</div>
                <div className="text-sm text-muted-foreground">Add client request</div>
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

      {/* Create Incident Modal */}
      <CreateIncidentModal 
        isOpen={showCreateIncident} 
        onClose={() => setShowCreateIncident(false)} 
      />

      {/* Create Special Request Modal */}
      <CreateSpecialRequestModal 
        isOpen={showCreateSpecialRequest} 
        onClose={() => setShowCreateSpecialRequest(false)} 
      />
    </>
  );
}
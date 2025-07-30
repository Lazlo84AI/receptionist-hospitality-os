import { Heart, User, CheckCircle, Clock, Star, Eye, Calendar, Users, TrendingUp, MessageCircle, Send, X, Trash2, Plus, Search, Paperclip } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ReminderModal } from './modals/ReminderModal';
import { useTasks, useProfiles } from '@/hooks/useSupabaseData';
import { TaskItem } from '@/types/database';

// Helper function to calculate days since creation
const getDaysSince = (createdAt: string): number => {
  const now = new Date();
  const created = new Date(createdAt);
  return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
};

// Transform database TaskItem (client request) to UI format
const transformClientRequest = (request: TaskItem) => ({
  id: request.id,
  clientName: request.guestName || 'Unknown Guest',
  room: request.roomNumber || 'Unknown Room',
  request: request.title,
  occasion: request.description || '',
  status: request.status === 'pending' ? 'To Process' : 
          request.status === 'in_progress' ? 'In Progress' : 
          request.status === 'completed' ? 'Completed' : 'Cancelled',
  gouvernante: request.assignedTo || 'Unassigned',
  avatar: request.assignedTo ? request.assignedTo.split(' ').map(n => n[0]).join('') : 'UN',
  daysSince: getDaysSince(request.created_at),
  priority: request.priority === 'urgent' ? 'URGENCE' : 'NORMAL',
  created_at: request.created_at,
  updated_at: request.updated_at
});

export function ClientRequestsCard() {
  const { tasks, loading, error } = useTasks();
  const { profiles } = useProfiles();
  
  // Filter client requests from all tasks
  const clientRequests = tasks
    .filter(task => task.type === 'client_request')
    .map(transformClientRequest)
    .slice(0, 4); // Show only top 4 requests

  const [selectedRequest, setSelectedRequest] = useState<ReturnType<typeof transformClientRequest> | null>(null);
  const [comment, setComment] = useState('');
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showActivities, setShowActivities] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  // Mock activities (could be fetched from database)
  const activities = [
    {
      id: 1,
      type: 'comment',
      user: 'Staff Member',
      action: 'a ajouté un commentaire',
      content: 'Préparation en cours',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      avatar: 'SM'
    }
  ];

  if (loading) {
    return (
      <div className="bg-card rounded-lg border shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Client Requests</h2>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-lg border shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Client Requests</h2>
        </div>
        <div className="text-center text-muted-foreground">
          Error loading client requests: {error}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="luxury-card p-6 col-span-full lg:col-span-2">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-soft-pewter/10 rounded-lg">
              <Heart className="h-6 w-6 text-soft-pewter" />
            </div>
            <div>
              <h2 className="text-xl font-playfair font-semibold text-palace-navy">
                Client Requests
              </h2>
              <p className="text-sm text-soft-pewter">
                Special occasions & preparations
              </p>
            </div>
          </div>
          <span className="text-sm text-soft-pewter font-medium">
            {clientRequests.length} requests
          </span>
        </div>

        {clientRequests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No client requests found
          </div>
        ) : (
          <div className="space-y-4">
            {clientRequests.map((clientRequest) => (
              <div 
                key={clientRequest.id}
                className="p-4 bg-muted/30 rounded-lg border border-border/50 hover-luxury cursor-pointer transition-all duration-300"
                onClick={() => setSelectedRequest(clientRequest)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-palace-navy">
                        {clientRequest.clientName}
                      </h3>
                      <Button variant="ghost" size="sm" className="shrink-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-sm text-soft-pewter mb-2">
                      {clientRequest.room} • {clientRequest.request}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge 
                        variant={clientRequest.status === 'To Process' ? 'secondary' : 'outline'}
                        className={clientRequest.status === 'To Process' ? 'bg-green-500 text-white' : ''}
                      >
                        {clientRequest.status}
                      </Badge>
                      {clientRequest.priority === 'URGENCE' && (
                        <Badge className="bg-urgence-red text-white animate-pulse">
                          {clientRequest.priority}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-soft-pewter" />
                    <span className="text-sm text-soft-pewter">
                      {clientRequest.gouvernante}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-soft-pewter" />
                    <span className="text-sm font-medium text-palace-navy">
                      {clientRequest.daysSince} day{clientRequest.daysSince > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-border/20">
          <div className="flex items-center justify-between text-sm">
            <span className="text-soft-pewter">Today's Status:</span>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-xs">{clientRequests.filter(r => r.status === 'To Process').length} to process</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 rounded-full bg-soft-pewter" />
                <span className="text-xs">{clientRequests.filter(r => r.status === 'In Progress').length} in progress</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-xs">{clientRequests.filter(r => r.status === 'Completed').length} completed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Request Detail Modal */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl luxury-card">
          <DialogHeader>
            <DialogTitle className="font-playfair text-xl text-palace-navy">
              Client Request Details
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg text-palace-navy mb-3">
                  {selectedRequest.clientName}
                </h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge 
                    variant={selectedRequest.status === 'To Process' ? 'secondary' : 'outline'}
                    className={selectedRequest.status === 'To Process' ? 'bg-green-500 text-white' : ''}
                  >
                    {selectedRequest.status}
                  </Badge>
                  {selectedRequest.priority === 'URGENCE' && (
                    <Badge className="bg-urgence-red text-white animate-pulse">
                      {selectedRequest.priority}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-palace-navy">Room:</span>
                  <p className="mt-1">{selectedRequest.room}</p>
                </div>
                <div>
                  <span className="font-medium text-palace-navy">Assigned to:</span>
                  <p className="mt-1">{selectedRequest.gouvernante}</p>
                </div>
              </div>

              <div>
                <span className="font-medium text-palace-navy">Request:</span>
                <p className="mt-2 text-soft-pewter">{selectedRequest.request}</p>
              </div>

              {selectedRequest.occasion && (
                <div>
                  <span className="font-medium text-palace-navy">Occasion:</span>
                  <p className="mt-2 text-soft-pewter">{selectedRequest.occasion}</p>
                </div>
              )}

              {/* Comment section */}
              <div className="border-t pt-6">
                <div className="flex items-center space-x-2 mb-4">
                  <MessageCircle className="h-5 w-5 text-palace-navy" />
                  <h4 className="font-semibold text-palace-navy">Comments</h4>
                </div>
                
                <div className="mb-4">
                  <Textarea
                    placeholder="Add a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>

                {/* Activity history */}
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 mb-4">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-soft-pewter text-white text-xs">
                        {activity.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-palace-navy">
                            {activity.user} {activity.action}
                          </span>
                          <span className="text-xs text-soft-pewter">
                            {Math.floor((Date.now() - activity.timestamp.getTime()) / (1000 * 60 * 60))}h ago
                          </span>
                        </div>
                        <p className="text-sm">{activity.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reminder Modal */}
      <ReminderModal
        isOpen={showReminderModal}
        onClose={() => setShowReminderModal(false)}
      />
    </>
  );
}
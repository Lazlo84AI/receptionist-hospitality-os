import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  X, 
  User, 
  MapPin, 
  Calendar, 
  AlertTriangle, 
  Users, 
  Clock, 
  Wrench,
  MessageSquare,
  Bell,
  CheckSquare,
  Paperclip,
  TrendingUp,
  Plus,
  Edit3,
  Edit,
  Heart,
  UserCircle,
  Eye,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReminderModal } from './ReminderModal';
import { ChecklistModal } from './ChecklistModal';
import { MembersModal } from './MembersModal';
import { EscalationModal } from './EscalationModal';
import { AttachmentModal } from './AttachmentModal';
import AttachmentPreviewModal from './AttachmentPreviewModal'; // ✅ Import du modal preview
import { TaskFullEditView } from '@/components/modules/TaskFullEditView'; // NOUVEAU: Import TaskFullEditView
import { ChecklistComponent } from '@/components/ChecklistComponent';
import { TaskItem } from '@/types/database';
import { sendTaskUpdatedEvent } from '@/lib/webhookService';
import { useProfiles, useLocations } from '@/hooks/useSupabaseData';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useTaskComments } from "@/hooks/useTaskComments";
import { useTaskAttachments } from "@/hooks/useTaskDetails"; // ✅ Import du hook attachments
import { addTaskComment } from '@/lib/actions/addTaskComment';
import { supabase } from '@/integrations/supabase/client';

interface EnhancedTaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskItem | null;
  onUpdateTask?: (task: TaskItem) => void;
  forceDetailView?: boolean; // Nouveau prop pour forcer le mode detail
}

// Hook pour récupérer les reminders d'une tâche
const useTaskReminders = (taskId?: string) => {
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReminders = async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('task_id', taskId)
        .eq('is_active', true)
        .order('remind_at', { ascending: true });

      if (error) throw error;
      setReminders(data || []);
    } catch (error) {
      console.error('Error fetching reminders:', error);
      setReminders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, [taskId]);

  return { reminders, loading, refetch: fetchReminders };
};


// Hook pour récupérer les commentaires depuis la table comments
const useTaskCommentsFixed = (taskId?: string) => {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false }); // ← Du plus récent au plus ancien

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, [taskId]);

  return { comments, loading, refetch };
};

// Fonction pour afficher la date et l'heure complètes
const getTimeElapsed = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Fonction pour obtenir les initiales d'un nom
const getInitials = (name: string): string => {
  if (!name) return 'UN';
  return name.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

const getTypeConfig = (type: string) => {
  switch (type) {
    case 'incident':
      return { 
        icon: AlertTriangle, 
        color: 'bg-red-100 text-red-600',
        label: 'Incident' 
      };
    case 'client_request':
      return { 
        icon: Heart, 
        color: 'bg-green-100 text-green-600',
        label: 'Client Request' 
      };
    case 'follow_up':
      return { 
        icon: Clock, 
        color: 'bg-gray-600 text-white',
        label: 'Follow-up' 
      };
    case 'internal_task':
    case 'personal_task':
      return { 
        icon: UserCircle, 
        color: 'bg-yellow-100 text-yellow-600',
        label: 'Personal Task' 
      };
    default:
      return { 
        icon: UserCircle, 
        color: 'bg-yellow-100 text-yellow-600',
        label: 'Task' 
      };
  }
};

const EnhancedTaskDetailModal: React.FC<EnhancedTaskDetailModalProps> = ({ 
  isOpen, 
  onClose, 
  task,
  onUpdateTask,
  forceDetailView = false
}) => {
  const { comments, refetch: refetchComments } = useTaskCommentsFixed(task?.id);
  const { reminders, refetch: refetchReminders } = useTaskReminders(task?.id); // AJOUT: Hook reminders
  const { attachments: taskAttachments, loading: attachmentsLoading, refetch: refetchAttachments } = useTaskAttachments(task?.id); // ✅ Hook attachments
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [isEscalationOpen, setIsEscalationOpen] = useState(false);
  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false); // ✅ État modal preview
  const [selectedAttachment, setSelectedAttachment] = useState<any>(null); // ✅ Attachment sélectionné
  const [isTaskFullEditOpen, setIsTaskFullEditOpen] = useState(false); // NOUVEAU: État TaskFullEditView
  const [checklists, setChecklists] = useState<{ id: string; title: string; tasks: { id: string; text: string; completed: boolean }[] }[]>([]);
  // SUPPRIME: const [reminders, setReminders] car maintenant via hook
  
  // Hook pour récupérer les données utilisateur pour les commentaires
  const [commentUsers, setCommentUsers] = useState<Record<string, any>>({});

  const { profiles } = useProfiles();
  const { locations } = useLocations();
  const { user } = useAuth();
  const { toast } = useToast();

  // Charger les checklists existantes depuis les données de la tâche
  useEffect(() => {
    if (task?.checklistItems && Array.isArray(task.checklistItems)) {
      console.log('📋 Chargement des checklists existantes:', task.checklistItems);
      const existingChecklists = task.checklistItems.map((checklist: any) => ({
        id: checklist.id || Date.now().toString(),
        title: checklist.title || 'Checklist',
        tasks: checklist.items || [] // Les items de la checklist
      }));
      setChecklists(existingChecklists);
    } else {
      console.log('📋 Aucune checklist trouvée pour cette tâche');
      setChecklists([]);
    }
  }, [task?.checklistItems]);

  // Récupérer les informations des utilisateurs pour les commentaires
  useEffect(() => {
    const fetchCommentUsers = async () => {
      if (!comments.length) return;

      const userIds = [...new Set(comments.map(c => c.user_id))];
      console.log('🔍 Fetching users for IDs:', userIds);
      
      // 1. CHERCHER D'ABORD dans staff_directory (priorité)
      const { data: staffUsers, error: staffError } = await supabase
        .from('staff_directory')
        .select('id, first_name, last_name, full_name, email, department')
        .in('id', userIds);

      console.log('💼 Staff directory fetched:', staffUsers);
      
      // 2. Ensuite dans profiles si pas trouvé
      const { data: profileUsers, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, full_name, email')
        .in('id', userIds);

      console.log('👥 Profiles fetched:', profileUsers);

      const usersMap = userIds.reduce((acc: any, userId: string) => {
        // Chercher d'abord dans staff_directory
        let user = staffUsers?.find(u => u.id === userId);
        
        // Si pas trouvé, chercher dans profiles
        if (!user) {
          user = profileUsers?.find(u => u.id === userId);
        }
        
        if (user) {
          const displayName = user.full_name || 
                            `${user.first_name || ''} ${user.last_name || ''}`.trim() || 
                            user.email ||
                            'Staff Member';
          
          acc[userId] = {
            name: displayName,
            initials: getInitials(displayName)
          };
          console.log(`✅ User ${userId} found: ${displayName}`);
        } else {
          // Cas d'erreur - ne devrait pas arriver
          console.error(`❌ User ${userId} not found in staff_directory NOR profiles!`);
          acc[userId] = {
            name: 'Unknown Staff',
            initials: 'US'
          };
        }
        
        return acc;
      }, {});

      console.log('📝 Final users map:', usersMap);
      setCommentUsers(usersMap);
    };

    fetchCommentUsers();
  }, [comments]);

  if (!task) return null;

  const typeConfig = getTypeConfig(task.type);
  const TypeIcon = typeConfig.icon;

  async function onAddComment() {
    const value = text.trim();
    if (!value || !task?.id) return;
    
    console.log('📝 Adding comment:', value);
    setSaving(true);
    
    try {
      await addTaskComment({ task_id: task.id, content: value });
      
      // ✅ Vider le champ de texte AVANT de refetch
      setText("");
      
      // ✅ Rafraîchir les commentaires
      await refetchComments();
      
      console.log('✅ Comment added successfully');
      
      toast({
        title: "Comment Added",
        description: "Your comment has been added successfully",
        variant: "default",
      });
      
    } catch (e) {
      console.error('❌ Error adding comment:', e);
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      // ✅ TOUJOURS réactiver le bouton
      setSaving(false);
    }
  }

  const handleAddChecklist = async (title: string) => {
    const newChecklist = {
      id: Date.now().toString(),
      title,
      tasks: []
    };
    
    try {
      if (task) {
        // Send webhook event for task update with checklist
        const webhookResult = await sendTaskUpdatedEvent(
          task.id,
          task,
          task,
          profiles,
          locations,
          {
            checklists: [{ id: newChecklist.id, title: newChecklist.title, items: [] }]
          }
        );

        if (webhookResult.success) {
          toast({
            title: "Checklist Added",
            description: "Checklist has been added and notification sent successfully",
          });
          // Call onUpdateTask to trigger data refresh
          if (onUpdateTask) {
            onUpdateTask(task);
          }
        } else {
          toast({
            title: "Webhook Error",
            description: webhookResult.error || "Failed to send checklist notification",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Error sending webhook:', error);
      toast({
        title: "Checklist Error",
        description: "Failed to send checklist notification",
        variant: "destructive",
      });
    }

    setChecklists([...checklists, newChecklist]);
  };

  // ✅ Fonction pour ouvrir le modal preview
  const openPreview = (attachment: any) => {
    setSelectedAttachment(attachment);
    setIsPreviewOpen(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-lg font-semibold">
              Task Details
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Static Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-6">
                {/* Picto plus gros à gauche */}
                <div className={cn("p-4 rounded-full", typeConfig.color)}>
                  <TypeIcon className="h-8 w-8" />
                </div>
                
                {/* Contenu principal aligné verticalement */}
                <div className="flex-1 flex flex-col justify-center">
                  {/* Première ligne : Titre + Bouton Edit */}
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-semibold leading-tight">{task.title}</h3>
                    {/* Bouton Edit plus gros */}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-soft-pewter hover:text-palace-navy ml-4 p-2"
                      onClick={() => {
                        setIsTaskFullEditOpen(true); // Ouvrir TaskFullEditView
                      }}
                    >
                      <Edit className="h-6 w-6" />
                    </Button>
                  </div>
                  
                  {/* Deuxième ligne : Status + Catégorie + Priorité */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge 
                      variant={task.status === 'completed' ? 'default' : 'secondary'}
                      className={cn(
                        task.status === 'pending' && 'to-process-badge',
                        task.status === 'in_progress' && 'in-progress-badge',
                        task.status === 'completed' && 'resolved-badge'
                      )}
                    >
                      {task.status === 'pending' && 'To Process'}
                      {task.status === 'in_progress' && 'In Progress'}
                      {task.status === 'completed' && 'Completed'}
                    </Badge>
                    <Badge variant="outline" className="type-badge">
                      {typeConfig.label}
                    </Badge>
                    {task.priority === 'urgent' && (
                      <Badge className="urgent-badge">
                        URGENT
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {task.assignedTo && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Assigned to</p>
                    <p className="text-foreground">{task.assignedTo}</p>
                  </div>
                )}
                
                {(task.roomNumber || task.location) && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Location</p>
                    <p className="text-foreground">
                      {task.roomNumber ? `Room ${task.roomNumber}` : task.location}
                    </p>
                  </div>
                )}

                {task.guestName && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Guest</p>
                    <p className="text-foreground">{task.guestName}</p>
                  </div>
                )}
              </div>

              {task.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                  <p className="text-foreground leading-relaxed">{task.description}</p>
                </div>
              )}
            </div>

            {/* Enhancement Actions */}
            <div className="border-t pt-6">
              <h4 className="font-medium text-foreground mb-4">Task Enhancement</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsReminderOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Bell className="h-4 w-4" />
                  Reminder
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsChecklistOpen(true)}
                  className="flex items-center gap-2"
                >
                  <CheckSquare className="h-4 w-4" />
                  Checklist
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMembersOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Members
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEscalationOpen(true)}
                  className="flex items-center gap-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  Escalation
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAttachmentOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Paperclip className="h-4 w-4" />
                  Attachment
                </Button>
              </div>
            </div>

            {/* Checklists */}
            {checklists.length > 0 && (
              <div className="border-t pt-6">
                <h4 className="font-medium text-foreground mb-4">Checklists</h4>
                <div className="space-y-4">
                  {checklists.map((checklist) => (
                    <Card key={checklist.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{checklist.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ChecklistComponent 
                          title={checklist.title}
                          onDelete={() => setChecklists(checklists.filter(c => c.id !== checklist.id))}
                          initialItems={checklist.tasks?.map((task: any) => ({
                            id: task.id,
                            text: task.text,
                            completed: task.completed || false,
                            assignedTo: task.assignedTo,
                            dueDate: task.dueDate
                          })) || []}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Reminders */}
            {reminders.length > 0 && (
              <div className="border-t pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <h4 className="font-medium text-foreground">Configured Reminders</h4>
                </div>
                
                <div className="space-y-3">
                  {reminders.map((reminder) => (
                    <div key={reminder.id} className="bg-muted/30 rounded-lg p-4">
                      <p className="text-foreground mb-2 font-medium">{reminder.title}</p>
                      <p className="text-sm text-muted-foreground mb-1">{reminder.message || reminder.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Scheduled for {new Date(reminder.remind_at || reminder.reminder_time).toLocaleString('en-US')}
                      </p>
                      {reminder.frequency !== 'once' && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Frequency: {reminder.frequency}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments */}
            {taskAttachments && taskAttachments.length > 0 && (
              <div className="border-t pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Paperclip className="h-5 w-5 text-muted-foreground" />
                  <h4 className="font-medium text-foreground">Attachments ({taskAttachments.length})</h4>
                </div>
                <div className="space-y-2">
                  {taskAttachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/40 transition-colors">
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{attachment.filename}</p>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <span>{attachment.attachment_type}</span>
                          {attachment.file_size && <span>• {(attachment.file_size / 1024).toFixed(1)} KB</span>}
                          <span>• {new Date(attachment.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      {/* ✅ Bouton oeil pour preview */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openPreview(attachment)}
                        className="text-muted-foreground hover:text-primary transition-colors"
                        title="Aperçu"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {/* Bouton ouvrir lien externe */}
                      {attachment.file_url && (
                        <a 
                          href={attachment.file_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-xs transition-colors"
                          title="Ouvrir dans un nouvel onglet"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments & Activity */}
            <div className="border-t pt-6">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                <h4 className="font-medium text-foreground">Comments & Activity</h4>
              </div>
              
              {/* Comment input */}
              <div className="space-y-2 mb-4">
                <Textarea
                  placeholder="Add a comment..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onAddComment(); }
                  }}
                  className="min-h-[80px] transition-all duration-300 hover:border-yellow-400 hover:shadow-sm hover:shadow-yellow-100 focus:border-yellow-400 focus:shadow-sm focus:shadow-yellow-100"
                  disabled={saving}
                />
                <div className="flex justify-end">
                  <Button 
                    onClick={onAddComment}
                    disabled={saving || !text.trim()}
                    size="sm"
                  >
                    {saving ? "Adding..." : "Add Comment"}
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Posted comments - VRAIES DONNÉES */}
              <div className="space-y-3" data-comments-container>
                {comments.length === 0 && (
                  <p className="text-muted-foreground text-sm italic">No comments yet</p>
                )}
                {comments.map((comment) => {
                  const userInfo = commentUsers[comment.user_id] || { name: 'Unknown User', initials: 'UN' };
                  return (
                    <div key={comment.id} className="flex space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-medium">{userInfo.initials}</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-foreground">{userInfo.name}</span>
                          <span className="text-sm text-muted-foreground">{getTimeElapsed(comment.created_at)}</span>
                        </div>
                        <p className="text-foreground">{comment.content}</p>
                      </div>
                      <div className="flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-primary transition-colors p-1"
                          onClick={() => {
                            // TODO: Implémenter l'édition de commentaire
                            console.log('Edit comment:', comment.id);
                          }}
                          title="Modifier ce commentaire"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Activity - VRAIES DONNÉES */}
            <div className="border-t pt-6">
              <h4 className="font-medium text-foreground mb-4">Recent Activity</h4>
              
              <div className="space-y-3 text-sm">
                {[].length === 0 && (
                  <p className="text-muted-foreground italic">Activity tracking temporarily disabled</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Footer avec bouton Validate */}
          <div className="p-6 border-t bg-background flex justify-end mt-6">
            <Button
              onClick={async () => {
                try {
                  // Envoyer webhook pour confirmer tous les changements
                  if (onUpdateTask) {
                    onUpdateTask(task);
                  }
                  
                  toast({
                    title: "Changes Validated",
                    description: "All task enhancements have been confirmed successfully",
                    variant: "default",
                  });
                  
                  onClose();
                } catch (error) {
                  console.error('Error validating changes:', error);
                  toast({
                    title: "Validation Error",
                    description: "Failed to validate changes. Please try again.",
                    variant: "destructive",
                  });
                }
              }}
              className="bg-[#BBA88A] hover:bg-[#DEAE53] text-[#1E1A37] px-6 py-2 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-200 font-medium"
            >
              Validate
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sub-modals */}
      <ReminderModal 
        isOpen={isReminderOpen}
        onClose={() => setIsReminderOpen(false)}
        taskTitle={task.title}
        task={task}
        onUpdate={() => {
          if (onUpdateTask) onUpdateTask(task);
          refetchReminders(); // AJOUT: Rafraîchir les reminders
        }}
      />
      
      <ChecklistModal 
        isOpen={isChecklistOpen}
        onClose={() => setIsChecklistOpen(false)}
        onAdd={handleAddChecklist}
      />
      
      <MembersModal 
        isOpen={isMembersOpen}
        onClose={() => setIsMembersOpen(false)}
        task={task}
        onUpdate={() => onUpdateTask && onUpdateTask(task)}
      />
      
      <EscalationModal 
        isOpen={isEscalationOpen}
        onClose={() => setIsEscalationOpen(false)}
        task={task}
        onUpdate={() => onUpdateTask && onUpdateTask(task)}
      />
      
      <AttachmentModal 
        isOpen={isAttachmentOpen}
        onClose={() => setIsAttachmentOpen(false)}
        task={task}
        onUpdate={() => {
          if (onUpdateTask) onUpdateTask(task);
          refetchAttachments(); // ✅ Rafraîchir les attachments
        }}
      />
      
      {/* ✅ Modal Preview */}
      <AttachmentPreviewModal 
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setSelectedAttachment(null);
        }}
        attachment={selectedAttachment}
      />
      
      {/* NOUVEAU: TaskFullEditView Modal */}
      <TaskFullEditView 
        isOpen={isTaskFullEditOpen}
        onClose={() => setIsTaskFullEditOpen(false)}
        task={task}
        onSave={(updatedTask) => {
          if (onUpdateTask) {
            onUpdateTask(updatedTask);
          }
          setIsTaskFullEditOpen(false);
        }}
      />
    </>
  );
};

export default EnhancedTaskDetailModal;
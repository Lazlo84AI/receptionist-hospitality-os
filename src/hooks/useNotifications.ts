import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationType =
  | 'task_assigned'
  | 'task_comment'
  | 'training_assigned'
  | 'quiz_assigned';

export interface AppNotification {
  id: string;
  user_id: string;
  notification_type: NotificationType;
  title: string;
  body: string | null;
  priority: string | null;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  read_at: string | null;
  action_required: boolean;
  action_taken: string | null;
  created_at: string;
}

interface UseNotificationsReturn {
  unreadNotifications: AppNotification[];
  readNotifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const READ_HISTORY_LIMIT = 30;

// ─── Cache module-level : survit aux remounts du hook ───────────────────────
// Stocke les IDs marqués lus localement même si le composant se démonte
const locallyReadIds = new Set<string>();

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNotifications(): UseNotificationsReturn {
  const [unreadNotifications, setUnreadNotifications] = useState<AppNotification[]>([]);
  const [readNotifications, setReadNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch initial : 2 requêtes parallèles (non lues + 30 dernières lues)
  const fetchNotifications = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const [unreadRes, readRes] = await Promise.all([
        supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_read', false)
          .order('created_at', { ascending: false }),
        supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_read', true)
          .order('read_at', { ascending: false, nullsFirst: false })
          .limit(READ_HISTORY_LIMIT),
      ]);

      if (unreadRes.error) console.error('useNotifications unread fetch error:', unreadRes.error);
      if (readRes.error)   console.error('useNotifications read fetch error:',   readRes.error);

      const unreadRaw = (unreadRes.data ?? []) as AppNotification[];
      const readRaw   = (readRes.data   ?? []) as AppNotification[];

      // Cache local : si une notif "unread" DB est en réalité lue localement → la basculer
      const unreadFinal: AppNotification[] = [];
      const cachedReads: AppNotification[] = [];
      unreadRaw.forEach(n => {
        if (locallyReadIds.has(n.id)) {
          cachedReads.push({ ...n, is_read: true });
        } else {
          unreadFinal.push(n);
        }
      });

      setUnreadNotifications(unreadFinal);
      // Fusion : lus DB + lus cache, trim à 30
      const readMerged = [...cachedReads, ...readRaw].slice(0, READ_HISTORY_LIMIT);
      setReadNotifications(readMerged);
    } catch (err) {
      console.error('useNotifications unexpected error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Marquer une notif comme lue — optimiste : on la déplace unread → tête de read
  const markAsRead = useCallback(async (id: string): Promise<void> => {
    locallyReadIds.add(id);
    const now = new Date().toISOString();
    setUnreadNotifications(prevUnread => {
      const target = prevUnread.find(n => n.id === id);
      if (!target) return prevUnread;
      const updated = { ...target, is_read: true, read_at: now };
      setReadNotifications(prevRead =>
        [updated, ...prevRead.filter(n => n.id !== id)].slice(0, READ_HISTORY_LIMIT)
      );
      return prevUnread.filter(n => n.id !== id);
    });
    // Persistance DB en arrière-plan (best-effort, log si échec)
    // .select('id') : permet de détecter un UPDATE à 0 ligne (auth/RLS silencieux)
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: now })
      .eq('id', id)
      .select('id');
    if (error) console.error('markAsRead DB error:', error);
    else if (!data?.length) console.warn('markAsRead: 0 ligne touchée (auth/RLS ?)', id);
  }, []);

  // Tout marquer comme lu — optimiste : bascule en bloc unread → tête de read
  const markAllAsRead = useCallback(async () => {
    const now = new Date().toISOString();
    setUnreadNotifications(prevUnread => {
      prevUnread.forEach(n => locallyReadIds.add(n.id));
      const moved = prevUnread.map(n => ({ ...n, is_read: true, read_at: now }));
      setReadNotifications(prevRead =>
        [...moved, ...prevRead].slice(0, READ_HISTORY_LIMIT)
      );
      return [];
    });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: now })
        .eq('user_id', user.id)
        .eq('is_read', false)
        .select('id');
      if (error) console.error('markAllAsRead DB error:', error);
      else console.info(`markAllAsRead: ${data?.length ?? 0} ligne(s) touchée(s)`);
    } catch (err) {
      console.error('markAllAsRead unexpected error:', err);
    }
  }, []);

  // Realtime — subscription aux nouvelles notifs de l'utilisateur
  useEffect(() => {
    let userId: string | null = null;

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userId = user.id;

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

      channelRef.current = supabase
        .channel(`notifications:${userId}`)
        .on(
          'postgres_changes' as any,
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload: any) => {
            const newNotif = payload.new as AppNotification;
            // Nouvelle notif → toujours en tête des non lues
            if (!newNotif.is_read) {
              setUnreadNotifications(prev => [newNotif, ...prev]);
            } else {
              setReadNotifications(prev => [newNotif, ...prev].slice(0, READ_HISTORY_LIMIT));
            }
          }
        )
        .subscribe();
    };

    fetchNotifications();
    setupRealtime();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [fetchNotifications]);

  const unreadCount = unreadNotifications.length;

  return { unreadNotifications, readNotifications, unreadCount, loading, markAsRead, markAllAsRead };
}

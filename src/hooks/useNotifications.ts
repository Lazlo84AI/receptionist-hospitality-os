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
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

// ─── Cache module-level : survit aux remounts du hook ───────────────────────
// Stocke les IDs marqués lus localement même si le composant se démonte
const locallyReadIds = new Set<string>();

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch initial — 50 dernières notifs
  const fetchNotifications = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('useNotifications fetch error:', error);
        return;
      }

      // Appliquer le cache local : IDs déjà marqués lus localement
      const merged = (data ?? []).map(n =>
        locallyReadIds.has(n.id) ? { ...n, is_read: true } : n
      );
      setNotifications(merged as AppNotification[]);
    } catch (err) {
      console.error('useNotifications unexpected error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Marquer une notif comme lue — optimiste + cache module-level
  const markAsRead = useCallback(async (id: string): Promise<void> => {
    // 1. Enregistrer dans le cache global (survit aux remounts)
    locallyReadIds.add(id);
    // 2. Mise à jour locale immédiate
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
    );
    // 3. Persistance en DB
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id);
  }, []);

  // Tout marquer comme lu
  const markAllAsRead = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (!error) {
        // Vider le cache local (tout est lu)
        locallyReadIds.clear();
        setNotifications(prev =>
          prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
        );
      }
    } catch (err) {
      console.error('markAllAsRead error:', err);
    }
  }, []);

  // Realtime — subscription aux nouvelles notifs de l'utilisateur
  useEffect(() => {
    let userId: string | null = null;

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userId = user.id;

      // Cleanup canal précédent si existe
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
            setNotifications(prev => [newNotif, ...prev]);
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

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead };
}

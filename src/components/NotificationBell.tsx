import { useState, useRef, useEffect } from 'react';
import { Bell, X, CheckCheck, BookOpen, ClipboardList, CheckSquare, MessageSquare, ChevronDown, ChevronRight } from 'lucide-react';
import { useNotifications, AppNotification, NotificationType } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const NOTIFICATION_ICON: Record<NotificationType, React.ReactNode> = {
  training_assigned: <BookOpen className="h-4 w-4" style={{ color: '#BBA57A' }} />,
  quiz_assigned:     <ClipboardList className="h-4 w-4" style={{ color: '#DEAE35' }} />,
  task_assigned:     <CheckSquare className="h-4 w-4" style={{ color: '#6CB4EE' }} />,
  task_comment:      <MessageSquare className="h-4 w-4" style={{ color: '#9CA3AF' }} />,
};

const NOTIFICATION_ROUTE: Partial<Record<string, (entityId: string) => string>> = {
  training_assignment: (_id) => `/admin/training`,
};

function timeAgo(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: fr });
  } catch {
    return '';
  }
}

// ─── NotificationItem ─────────────────────────────────────────────────────────

function NotificationItem({
  notif,
  onRead,
}: {
  notif: AppNotification;
  onRead: (id: string) => Promise<void>;
}) {
  const navigate = useNavigate();

  const handleClick = async () => {
    // Marquer comme lu en DB avant de naviguer
    if (!notif.is_read) await onRead(notif.id);
    if (notif.entity_type === 'task' && notif.entity_id) {
      navigate('/shift', { state: { openTaskId: notif.entity_id } });
    } else if (notif.entity_type === 'training_assignment') {
      // Ouvrir directement le premier document du programme sur /training
      // entity_id peut être null sur les anciennes notifs → on navigue quand même
      navigate('/training', { state: { openTrainingAssignmentId: notif.entity_id ?? null } });
    }
  };

  return (
    <button
      onClick={handleClick}
      className="w-full text-left px-4 py-3 flex items-start gap-3 transition-colors duration-150 hover:bg-black/5"
      style={{
        backgroundColor: notif.is_read ? 'transparent' : 'rgba(187,165,122,0.08)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      {/* Icône type */}
      <div className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
        style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}>
        {NOTIFICATION_ICON[notif.notification_type as NotificationType] ?? (
          <Bell className="h-4 w-4 text-gray-400" />
        )}
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 leading-tight truncate">
          {notif.title}
        </p>
        {notif.body && (
          <p className="text-xs text-gray-500 mt-0.5 leading-snug line-clamp-2">
            {notif.body}
          </p>
        )}
        <p className="text-[10px] mt-1" style={{ color: '#BBA57A' }}>
          {timeAgo(notif.created_at)}
        </p>
      </div>

      {/* Pastille non-lu */}
      {!notif.is_read && (
        <span
          className="flex-shrink-0 mt-1.5 w-2 h-2 rounded-full"
          style={{ backgroundColor: '#DEAE35' }}
        />
      )}
    </button>
  );
}

// ─── NotificationBell ─────────────────────────────────────────────────────────

export function NotificationBell() {
  const { unreadNotifications, readNotifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [readSectionOpen, setReadSectionOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Fermer au clic extérieur
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  return (
    <div className="relative">
      {/* Bouton cloche */}
      <button
        ref={buttonRef}
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-full transition-colors duration-200 hover:bg-white/10 focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" style={{ color: 'rgba(255,255,255,0.65)' }} />

        {/* Badge compteur */}
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full
                       flex items-center justify-center text-[10px] font-bold text-white"
            style={{ backgroundColor: '#EF4444' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel popover */}
      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-12 w-80 rounded-xl shadow-2xl overflow-hidden z-50"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid rgba(0,0,0,0.1)',
          }}
        >
          {/* Header panel */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: 'rgba(0,0,0,0.08)', backgroundColor: '#FAFAFA' }}
          >
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" style={{ color: '#1E1A37' }} />
              <span className="text-sm font-semibold" style={{ color: '#1E1A37' }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: '#EF4444' }}
                >
                  {unreadCount}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-[11px] px-2 py-1 rounded transition-colors hover:bg-black/5"
                  style={{ color: '#BBA57A' }}
                  title="Tout marquer comme lu"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span>Tout lire</span>
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded transition-colors hover:bg-black/5"
                style={{ color: '#9CA3AF' }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Liste des notifs : section non lues + section repliable lues */}
          <div className="overflow-y-auto" style={{ maxHeight: '420px' }}>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div
                  className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: '#BBA57A', borderTopColor: 'transparent' }}
                />
              </div>
            ) : (
              <>
                {/* Section non lues */}
                {unreadNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <Bell className="h-8 w-8 text-gray-300" />
                    <p className="text-sm text-gray-400">Aucune nouvelle notification</p>
                  </div>
                ) : (
                  unreadNotifications.map(notif => (
                    <NotificationItem
                      key={notif.id}
                      notif={notif}
                      onRead={markAsRead}
                    />
                  ))
                )}

                {/* Section repliable : Récemment lues */}
                {readNotifications.length > 0 && (
                  <>
                    <button
                      onClick={() => setReadSectionOpen(o => !o)}
                      className="w-full flex items-center gap-2 px-4 py-2 border-t transition-colors hover:bg-black/5"
                      style={{ borderColor: 'rgba(0,0,0,0.08)', backgroundColor: '#FAFAFA' }}
                    >
                      {readSectionOpen ? (
                        <ChevronDown className="h-3.5 w-3.5" style={{ color: '#9CA3AF' }} />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" style={{ color: '#9CA3AF' }} />
                      )}
                      <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>
                        Récemment lues
                      </span>
                      <span className="text-[10px] ml-auto" style={{ color: '#BBA57A' }}>
                        {readNotifications.length}
                      </span>
                    </button>
                    {readSectionOpen && readNotifications.map(notif => (
                      <NotificationItem
                        key={notif.id}
                        notif={notif}
                        onRead={markAsRead}
                      />
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

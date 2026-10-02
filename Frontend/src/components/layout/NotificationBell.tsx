import { useCallback, useEffect, useState } from 'react';
import { LuBell, LuBellOff, LuCheckCheck } from 'react-icons/lu';
import { Link, useNavigate } from 'react-router-dom';
import { notificationsApi } from '../../lib/endpoints';
import { formatRelative } from '../../lib/format';
import { useDismiss } from '../../lib/hooks';
import type { NotificationItem } from '../../lib/types';
import { Skeleton } from '../ui/Feedback';

export const NOTIFICATIONS_CHANGED = 'teenwork:notifications-changed';

export function notifyNotificationsChanged() {
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));
}

export function useUnreadCount() {
  const [count, setCount] = useState(0);

  const refresh = useCallback(() => {
    notificationsApi
      .unreadCount()
      .then((r) => setCount(r.count))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, 60_000);
    window.addEventListener(NOTIFICATIONS_CHANGED, refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.clearInterval(id);
      window.removeEventListener(NOTIFICATIONS_CHANGED, refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [refresh]);

  return count;
}

export function NotificationBell({ allPath }: { allPath: string }) {
  const count = useUnreadCount();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const close = useCallback(() => setOpen(false), []);
  const ref = useDismiss<HTMLDivElement>(open, close);

  useEffect(() => {
    if (!open) return;
    setItems(null);
    notificationsApi
      .list({ page: 1, pageSize: 6 })
      .then((r) => setItems(r.items))
      .catch(() => setItems([]));
  }, [open]);

  const openItem = async (n: NotificationItem) => {
    setOpen(false);
    if (!n.isRead) {
      await notificationsApi.markRead(n.id).catch(() => undefined);
      notifyNotificationsChanged();
    }
    if (n.link) navigate(n.link);
  };

  const markAll = async () => {
    await notificationsApi.markAllRead().catch(() => undefined);
    setItems((list) => list?.map((n) => ({ ...n, isRead: true })) ?? null);
    notifyNotificationsChanged();
  };

  return (
    <div className="dropdown" ref={ref}>
      <button
        type="button"
        className="icon-button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={count > 0 ? `Notificações (${count} não lidas)` : 'Notificações'}
      >
        <LuBell />
        {count > 0 && <span className="icon-button__dot">{count > 9 ? '9+' : count}</span>}
      </button>
      {open && (
        <div className="dropdown__menu notif-panel" role="dialog" aria-label="Notificações recentes">
          <div className="notif-panel__header">
            <strong>Notificações</strong>
            {count > 0 && (
              <button type="button" className="link-button" onClick={markAll}>
                <LuCheckCheck /> Marcar todas como lidas
              </button>
            )}
          </div>
          <div className="notif-panel__list">
            {items === null ? (
              <div className="stack" style={{ padding: 16 }}>
                <Skeleton width="70%" />
                <Skeleton />
                <Skeleton width="50%" />
              </div>
            ) : items.length === 0 ? (
              <div className="empty-state empty-state--compact">
                <div className="empty-state__icon">
                  <LuBellOff />
                </div>
                <p className="empty-state__text">Nenhuma notificação por aqui ainda.</p>
              </div>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  role="button"
                  tabIndex={0}
                  className={`notification notification--compact${n.isRead ? '' : ' notification--unread'}`}
                  onClick={() => openItem(n)}
                  onKeyDown={(e) => e.key === 'Enter' && openItem(n)}
                >
                  <div className="notification__body">
                    <div className="notification__title">{n.title}</div>
                    <div className="notification__message">{n.message}</div>
                    <div className="notification__time">{formatRelative(n.createdAt)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="notif-panel__footer">
            <Link to={allPath} className="link-button" onClick={() => setOpen(false)}>
              Ver todas as notificações
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

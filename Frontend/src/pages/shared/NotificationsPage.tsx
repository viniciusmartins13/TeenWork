import { useState } from 'react';
import { LuBell, LuBellOff, LuCheckCheck, LuFileText, LuSparkles, LuTrash2, LuUserPlus, LuX } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import { notifyNotificationsChanged } from '../../components/layout/NotificationBell';
import { Button } from '../../components/ui/Button';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/Feedback';
import { PageHeader } from '../../components/ui/Page';
import { Pagination } from '../../components/ui/Pagination';
import { Tabs } from '../../components/ui/Tabs';
import { useToast } from '../../context/ToastContext';
import { notificationsApi } from '../../lib/endpoints';
import { formatRelative } from '../../lib/format';
import { useApi, useDocumentTitle } from '../../lib/hooks';
import type { NotificationItem, NotificationType } from '../../lib/types';

const icons: Record<NotificationType, JSXIcon> = {
  System: LuSparkles,
  ApplicationReceived: LuUserPlus,
  ApplicationStatusChanged: LuFileText,
  ApplicationCancelled: LuX,
};
type JSXIcon = typeof LuBell;

export function NotificationsPage() {
  useDocumentTitle('Notificações');
  const toast = useToast();
  const navigate = useNavigate();
  const [unreadOnly, setUnreadOnly] = useState<'all' | 'unread'>('all');
  const [page, setPage] = useState(1);
  const list = useApi(
    (signal) => notificationsApi.list({ page, pageSize: 15, unreadOnly: unreadOnly === 'unread' }, signal),
    [page, unreadOnly],
  );

  const patch = (id: number, changes: Partial<NotificationItem>) =>
    list.setData((d) => (d ? { ...d, items: d.items.map((n) => (n.id === id ? { ...n, ...changes } : n)) } : d));

  const open = async (n: NotificationItem) => {
    if (!n.isRead) {
      await notificationsApi.markRead(n.id).catch(() => undefined);
      patch(n.id, { isRead: true });
      notifyNotificationsChanged();
    }
    if (n.link) navigate(n.link);
  };

  const markAll = async () => {
    try {
      await notificationsApi.markAllRead();
      list.setData((d) => (d ? { ...d, items: d.items.map((n) => ({ ...n, isRead: true })) } : d));
      notifyNotificationsChanged();
      toast.success('Tudo lido!');
    } catch (err) {
      toast.error('Não foi possível atualizar', (err as Error).message);
    }
  };

  const remove = async (n: NotificationItem) => {
    try {
      await notificationsApi.remove(n.id);
      list.setData((d) => (d ? { ...d, items: d.items.filter((x) => x.id !== n.id), totalItems: d.totalItems - 1 } : d));
      notifyNotificationsChanged();
    } catch (err) {
      toast.error('Não foi possível excluir', (err as Error).message);
    }
  };

  const hasUnread = list.data?.items.some((n) => !n.isRead);

  return (
    <>
      <PageHeader
        eyebrow="Avisos"
        title="Notificações"
        subtitle="Atualizações sobre candidaturas e sua conta."
        actions={
          hasUnread && (
            <Button variant="secondary" icon={<LuCheckCheck />} onClick={markAll}>
              Marcar todas como lidas
            </Button>
          )
        }
      />
      <div style={{ marginBottom: 20 }}>
        <Tabs
          label="Filtro"
          value={unreadOnly}
          onChange={(v) => {
            setUnreadOnly(v);
            setPage(1);
          }}
          items={[
            { value: 'all', label: 'Todas' },
            { value: 'unread', label: 'Não lidas' },
          ]}
        />
      </div>

      <section className="card" style={{ overflow: 'hidden' }}>
        {list.loading && !list.data ? (
          <div className="stack" style={{ padding: 24 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="row">
                <Skeleton width={36} height={36} style={{ borderRadius: 11 }} />
                <div className="stack stack--sm" style={{ flex: 1 }}>
                  <Skeleton width="40%" />
                  <Skeleton width="80%" />
                </div>
              </div>
            ))}
          </div>
        ) : list.error ? (
          <ErrorState error={list.error} onRetry={list.reload} />
        ) : list.data && list.data.items.length > 0 ? (
          list.data.items.map((n) => {
            const Icon = icons[n.type] ?? LuBell;
            return (
              <div key={n.id} className={`notification${n.isRead ? '' : ' notification--unread'}`}>
                <span className="notification__icon" aria-hidden="true">
                  <Icon />
                </span>
                <button
                  type="button"
                  className="notification__body"
                  style={{ border: 0, background: 'none', padding: 0, textAlign: 'left', cursor: n.link || !n.isRead ? 'pointer' : 'default' }}
                  onClick={() => open(n)}
                >
                  <div className="notification__title">{n.title}</div>
                  <div className="notification__message">{n.message}</div>
                  <div className="notification__time">{formatRelative(n.createdAt)}</div>
                </button>
                <Button variant="ghost" size="sm" iconOnly icon={<LuTrash2 />} aria-label="Excluir notificação" onClick={() => remove(n)} />
              </div>
            );
          })
        ) : (
          <EmptyState
            icon={<LuBellOff />}
            title={unreadOnly === 'unread' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}
            text="Avisaremos aqui quando houver novidades nas suas candidaturas."
          />
        )}
      </section>
      {list.data && (
        <Pagination
          page={list.data.page}
          totalPages={list.data.totalPages}
          totalItems={list.data.totalItems}
          pageSize={list.data.pageSize}
          noun={['notificação', 'notificações']}
          onChange={setPage}
        />
      )}
    </>
  );
}

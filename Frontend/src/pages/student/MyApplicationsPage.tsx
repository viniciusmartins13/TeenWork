import { useState } from 'react';
import { LuFileText, LuMessageSquareText, LuSearch, LuX } from 'react-icons/lu';
import { Link } from 'react-router-dom';
import { ApplicationTrail } from '../../components/applications/ApplicationTrail';
import { Avatar } from '../../components/ui/Avatar';
import { ApplicationStatusBadge } from '../../components/ui/Badge';
import { Button, ButtonLink } from '../../components/ui/Button';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/Feedback';
import { ConfirmDialog } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/Page';
import { Pagination } from '../../components/ui/Pagination';
import { Tabs } from '../../components/ui/Tabs';
import { useToast } from '../../context/ToastContext';
import { applicationsApi, dashboardApi } from '../../lib/endpoints';
import { formatDate, formatRelative, jobTypeLabels, workModelLabels } from '../../lib/format';
import { useApi, useDocumentTitle } from '../../lib/hooks';
import type { ApplicationStatus, MyApplication } from '../../lib/types';

type Filter = 'all' | ApplicationStatus;

export function MyApplicationsPage() {
  useDocumentTitle('Minhas candidaturas');
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage] = useState(1);
  const [toCancel, setToCancel] = useState<MyApplication | null>(null);

  const counts = useApi((signal) => dashboardApi.student(signal), []);
  const list = useApi(
    (signal) => applicationsApi.mine({ page, pageSize: 10, status: filter === 'all' ? undefined : filter }, signal),
    [page, filter],
  );

  const c = counts.data?.applicationsByStatus;
  const tabs = [
    { value: 'all' as Filter, label: 'Todas', count: counts.data?.totalApplications },
    { value: 'Pending' as Filter, label: 'Pendentes', count: c?.pending },
    { value: 'UnderReview' as Filter, label: 'Em análise', count: c?.underReview },
    { value: 'Accepted' as Filter, label: 'Aprovadas', count: c?.accepted },
    { value: 'Rejected' as Filter, label: 'Recusadas', count: c?.rejected },
    { value: 'Cancelled' as Filter, label: 'Canceladas', count: c?.cancelled },
  ];

  const cancel = async () => {
    if (!toCancel) return;
    try {
      await applicationsApi.cancel(toCancel.id);
      toast.success('Candidatura cancelada', 'Você pode se candidatar de novo enquanto a vaga estiver aberta.');
      setToCancel(null);
      list.reload();
      counts.reload();
    } catch (err) {
      toast.error('Não foi possível cancelar', (err as Error).message);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Acompanhamento"
        title="Minhas candidaturas"
        subtitle="Veja em que etapa está cada processo seletivo e as mensagens das empresas."
        actions={
          <ButtonLink to="/aluno/vagas" variant="primary" icon={<LuSearch />}>
            Buscar vagas
          </ButtonLink>
        }
      />

      <div style={{ marginBottom: 20 }}>
        <Tabs
          label="Filtrar por status"
          items={tabs}
          value={filter}
          onChange={(v) => {
            setFilter(v);
            setPage(1);
          }}
        />
      </div>

      {list.loading && !list.data ? (
        <div className="job-list">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card application-card">
              <div className="row">
                <Skeleton width={48} height={48} style={{ borderRadius: 12 }} />
                <div className="stack stack--sm" style={{ flex: 1 }}>
                  <Skeleton className="skeleton--title" width="50%" />
                  <Skeleton width="30%" />
                </div>
              </div>
              <Skeleton height={36} />
            </div>
          ))}
        </div>
      ) : list.error ? (
        <div className="card">
          <ErrorState error={list.error} onRetry={list.reload} />
        </div>
      ) : list.data && list.data.items.length > 0 ? (
        <>
          <div className="job-list">
            {list.data.items.map((a) => (
              <article key={a.id} className="card application-card">
                <div className="application-card__head">
                  <Avatar name={a.companyName} src={a.companyLogo} square size="lg" />
                  <div className="application-card__main">
                    <h3 className="application-card__title">
                      <Link to={`/aluno/vagas/${a.jobId}`}>{a.jobTitle}</Link>
                    </h3>
                    <div className="meta-list" style={{ marginTop: 4 }}>
                      <span>{a.companyName}</span>
                      <span>
                        {jobTypeLabels[a.jobType]} · {workModelLabels[a.workModel]}
                      </span>
                      <span>
                        {a.city}, {a.state}
                      </span>
                    </div>
                  </div>
                  <ApplicationStatusBadge status={a.status} />
                </div>

                <ApplicationTrail status={a.status} />

                {a.companyFeedback && (
                  <div className="application-card__feedback">
                    <LuMessageSquareText aria-hidden="true" />
                    <div>
                      <strong>Mensagem de {a.companyName}:</strong> {a.companyFeedback}
                    </div>
                  </div>
                )}

                <div className="application-card__foot">
                  <span className="text-sm text-muted">
                    Enviada em {formatDate(a.createdAt)}
                    {a.updatedAt !== a.createdAt && ` · atualizada ${formatRelative(a.updatedAt)}`}
                  </span>
                  <div className="row">
                    <ButtonLink to={`/aluno/vagas/${a.jobId}`} variant="ghost" size="sm">
                      Ver vaga
                    </ButtonLink>
                    {a.canCancel && (
                      <Button variant="danger-ghost" size="sm" icon={<LuX />} onClick={() => setToCancel(a)}>
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
          <Pagination
            page={list.data.page}
            totalPages={list.data.totalPages}
            totalItems={list.data.totalItems}
            pageSize={list.data.pageSize}
            noun={['candidatura', 'candidaturas']}
            onChange={setPage}
          />
        </>
      ) : (
        <div className="card">
          <EmptyState
            icon={<LuFileText />}
            title={filter === 'all' ? 'Você ainda não se candidatou' : 'Nada por aqui neste status'}
            text={
              filter === 'all'
                ? 'Explore as vagas abertas e envie sua primeira candidatura — leva só um minuto.'
                : 'Quando alguma candidatura estiver neste status, ela aparecerá aqui.'
            }
            actions={<ButtonLink to="/aluno/vagas" variant="primary">Encontrar vagas</ButtonLink>}
          />
        </div>
      )}

      <ConfirmDialog
        open={!!toCancel}
        title="Cancelar candidatura?"
        description={toCancel ? `Sua candidatura para "${toCancel.jobTitle}" será cancelada e a empresa será avisada.` : undefined}
        confirmLabel="Sim, cancelar"
        cancelLabel="Manter candidatura"
        onConfirm={cancel}
        onClose={() => setToCancel(null)}
      />
    </>
  );
}

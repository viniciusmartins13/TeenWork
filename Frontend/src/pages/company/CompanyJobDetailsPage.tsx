import { useState } from 'react';
import { LuCalendarClock, LuClock, LuLock, LuPause, LuPencil, LuPlay, LuUsers, LuWallet } from 'react-icons/lu';
import { useParams } from 'react-router-dom';
import { CandidateCard } from '../../components/applications/CandidateCard';
import { JobChips } from '../../components/jobs/JobBits';
import { JobStatusBadge } from '../../components/ui/Badge';
import { Button, ButtonLink } from '../../components/ui/Button';
import { EmptyState, ErrorState, PageLoader, Skeleton } from '../../components/ui/Feedback';
import { ConfirmDialog } from '../../components/ui/Modal';
import { Card, PageHeader } from '../../components/ui/Page';
import { Pagination } from '../../components/ui/Pagination';
import { Tabs } from '../../components/ui/Tabs';
import { useToast } from '../../context/ToastContext';
import { jobsApi } from '../../lib/endpoints';
import { deadlineLabel, formatSalary, splitLines } from '../../lib/format';
import { useApi, useDocumentTitle } from '../../lib/hooks';
import type { ApplicationStatus, JobStatus } from '../../lib/types';

type Filter = 'all' | ApplicationStatus;

export function CompanyJobDetailsPage() {
  const { id } = useParams();
  const jobId = Number(id);
  const toast = useToast();
  const job = useApi((signal) => jobsApi.get(jobId, signal), [jobId]);
  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage] = useState(1);
  const [confirmClose, setConfirmClose] = useState(false);
  const apps = useApi(
    (signal) => jobsApi.applications(jobId, { page, pageSize: 10, status: filter === 'all' ? undefined : filter }, signal),
    [jobId, page, filter],
  );
  useDocumentTitle(job.data?.title ?? 'Vaga');

  if (job.loading && !job.data) return <PageLoader label="Carregando vaga…" />;
  if (job.error || !job.data) return <ErrorState error={job.error} onRetry={job.reload} />;
  const j = job.data;

  const setStatus = async (status: JobStatus) => {
    try {
      const updated = await jobsApi.setStatus(j.id, status);
      job.setData(() => updated);
      toast.success(status === 'Active' ? 'Vaga ativada' : status === 'Inactive' ? 'Vaga pausada' : 'Vaga encerrada');
    } catch (err) {
      toast.error('Não foi possível alterar o status', (err as Error).message);
    }
  };

  return (
    <>
      <PageHeader
        back={{ to: '/empresa/vagas', label: 'Minhas vagas' }}
        title={j.title}
        subtitle={<JobChips city={j.city} state={j.state} workModel={j.workModel} jobType={j.jobType} deadline={j.deadline} />}
        actions={
          <>
            {j.status === 'Active' ? (
              <Button variant="secondary" icon={<LuPause />} onClick={() => setStatus('Inactive')}>
                Pausar
              </Button>
            ) : (
              <Button variant="secondary" icon={<LuPlay />} onClick={() => setStatus('Active')}>
                Ativar
              </Button>
            )}
            {j.status !== 'Closed' && (
              <Button variant="secondary" icon={<LuLock />} onClick={() => setConfirmClose(true)}>
                Encerrar
              </Button>
            )}
            <ButtonLink to={`/empresa/vagas/${j.id}/editar`} variant="primary" icon={<LuPencil />}>
              Editar
            </ButtonLink>
          </>
        }
      />

      <div className="detail-layout">
        <section>
          <div className="row row--between row--wrap" style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 20 }}>Candidatos</h2>
            <Tabs
              label="Filtrar candidatos"
              value={filter}
              onChange={(v) => {
                setFilter(v);
                setPage(1);
              }}
              items={[
                { value: 'all', label: 'Todos' },
                { value: 'Pending', label: 'Pendentes' },
                { value: 'UnderReview', label: 'Em análise' },
                { value: 'Accepted', label: 'Aprovados' },
                { value: 'Rejected', label: 'Recusados' },
              ]}
            />
          </div>
          {apps.loading && !apps.data ? (
            <div className="job-list">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card candidate-card">
                  <Skeleton width={56} height={56} circle />
                  <div className="stack stack--sm">
                    <Skeleton width="40%" className="skeleton--title" />
                    <Skeleton width="70%" />
                  </div>
                </div>
              ))}
            </div>
          ) : apps.error ? (
            <div className="card">
              <ErrorState error={apps.error} onRetry={apps.reload} />
            </div>
          ) : apps.data && apps.data.items.length > 0 ? (
            <>
              <div className="job-list">
                {apps.data.items.map((a) => (
                  <CandidateCard
                    key={a.id}
                    application={a}
                    showJob={false}
                    onStatusChanged={(appId, status) =>
                      apps.setData((d) => (d ? { ...d, items: d.items.map((x) => (x.id === appId ? { ...x, status } : x)) } : d))
                    }
                  />
                ))}
              </div>
              <Pagination
                page={apps.data.page}
                totalPages={apps.data.totalPages}
                totalItems={apps.data.totalItems}
                pageSize={apps.data.pageSize}
                noun={['candidato', 'candidatos']}
                onChange={setPage}
              />
            </>
          ) : (
            <div className="card">
              <EmptyState
                icon={<LuUsers />}
                title={filter === 'all' ? 'Nenhum candidato ainda' : 'Ninguém neste status'}
                text={filter === 'all' ? 'Quando estudantes se candidatarem, eles aparecerão aqui.' : 'Escolha outro filtro para ver os demais candidatos.'}
              />
            </div>
          )}
        </section>

        <aside className="sticky-aside">
          <Card title="Resumo da vaga">
            <dl className="summary-list">
              <div>
                <dt>Status</dt>
                <dd>
                  <JobStatusBadge status={j.status} />
                </dd>
              </div>
              <div>
                <dt>
                  <LuUsers /> Candidaturas
                </dt>
                <dd>{j.applicationsCount ?? 0}</dd>
              </div>
              <div>
                <dt>
                  <LuWallet /> Remuneração
                </dt>
                <dd>{formatSalary(j.salary, j.jobType)}</dd>
              </div>
              <div>
                <dt>
                  <LuClock /> Carga
                </dt>
                <dd>{j.workload || '—'}</dd>
              </div>
              <div>
                <dt>
                  <LuCalendarClock /> Prazo
                </dt>
                <dd>{deadlineLabel(j.deadline) ?? 'Sem prazo'}</dd>
              </div>
            </dl>
          </Card>
          <Card title="Descrição">
            <p className="pre-line text-sm" style={{ color: 'var(--ink-2)' }}>
              {j.description}
            </p>
            {splitLines(j.requirements).length > 0 && (
              <>
                <div className="divider" />
                <strong className="text-sm">Requisitos</strong>
                <ul className="text-sm" style={{ paddingLeft: 18, color: 'var(--ink-2)' }}>
                  {splitLines(j.requirements).map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </>
            )}
          </Card>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmClose}
        tone="brand"
        confirmVariant="primary"
        title="Encerrar esta vaga?"
        description="A vaga para de receber candidaturas. Os candidatos atuais continuam disponíveis."
        confirmLabel="Encerrar vaga"
        onClose={() => setConfirmClose(false)}
        onConfirm={async () => {
          await setStatus('Closed');
          setConfirmClose(false);
        }}
      />
    </>
  );
}

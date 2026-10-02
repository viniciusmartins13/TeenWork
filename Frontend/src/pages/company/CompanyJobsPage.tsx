import { useState } from 'react';
import { LuBriefcase, LuEllipsisVertical, LuEye, LuLock, LuPause, LuPencil, LuPlay, LuPlus, LuSearch, LuTrash2, LuUsers } from 'react-icons/lu';
import { Link, useNavigate } from 'react-router-dom';
import { JobStatusBadge } from '../../components/ui/Badge';
import { Button, ButtonLink } from '../../components/ui/Button';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/Feedback';
import { ConfirmDialog } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/Page';
import { Pagination } from '../../components/ui/Pagination';
import { Tabs } from '../../components/ui/Tabs';
import { useToast } from '../../context/ToastContext';
import { companiesApi, jobsApi } from '../../lib/endpoints';
import { formatDate, jobTypeLabels, workModelLabels } from '../../lib/format';
import { useApi, useDebounce, useDismiss, useDocumentTitle } from '../../lib/hooks';
import type { CompanyJob, JobStatus } from '../../lib/types';

type Filter = 'all' | JobStatus;

export function CompanyJobsPage() {
  useDocumentTitle('Minhas vagas');
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState<CompanyJob | null>(null);
  const [toClose, setToClose] = useState<CompanyJob | null>(null);
  const q = useDebounce(search.trim(), 350);

  const jobs = useApi(
    (signal) => companiesApi.myJobs({ page, pageSize: 10, search: q || undefined, status: filter === 'all' ? undefined : filter }, signal),
    [page, q, filter],
  );

  const changeStatus = async (job: CompanyJob, status: JobStatus) => {
    try {
      await jobsApi.setStatus(job.id, status);
      toast.success(status === 'Active' ? 'Vaga ativada' : status === 'Inactive' ? 'Vaga pausada' : 'Vaga encerrada');
      jobs.reload();
    } catch (err) {
      toast.error('Não foi possível alterar o status', (err as Error).message);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Gestão"
        title="Minhas vagas"
        subtitle="Publique, edite, pause ou encerre suas oportunidades."
        actions={
          <ButtonLink to="/empresa/vagas/nova" variant="primary" icon={<LuPlus />}>
            Publicar vaga
          </ButtonLink>
        }
      />

      <div className="row row--between row--wrap" style={{ marginBottom: 20 }}>
        <Tabs
          label="Filtrar vagas"
          value={filter}
          onChange={(v) => {
            setFilter(v);
            setPage(1);
          }}
          items={[
            { value: 'all', label: 'Todas' },
            { value: 'Active', label: 'Ativas' },
            { value: 'Inactive', label: 'Pausadas' },
            { value: 'Closed', label: 'Encerradas' },
          ]}
        />
        <div className="input-group" style={{ width: 'min(320px, 100%)' }}>
          <span className="input-group__icon">
            <LuSearch />
          </span>
          <input
            className="input"
            placeholder="Buscar pelo título"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            aria-label="Buscar vaga"
          />
        </div>
      </div>

      <section className="card">
        {jobs.loading && !jobs.data ? (
          <div className="stack" style={{ padding: 24 }}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} height={40} />
            ))}
          </div>
        ) : jobs.error ? (
          <ErrorState error={jobs.error} onRetry={jobs.reload} />
        ) : jobs.data && jobs.data.items.length > 0 ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Vaga</th>
                  <th>Status</th>
                  <th>Candidatos</th>
                  <th>Prazo</th>
                  <th>Publicada</th>
                  <th>
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {jobs.data.items.map((job) => (
                  <tr key={job.id}>
                    <td style={{ minWidth: 240 }}>
                      <Link to={`/empresa/vagas/${job.id}`} className="table__title">
                        {job.title}
                      </Link>
                      <div className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>
                        {jobTypeLabels[job.jobType]} · {workModelLabels[job.workModel]} · {job.city}, {job.state}
                      </div>
                    </td>
                    <td>
                      <JobStatusBadge status={job.status} expired={job.isExpired} />
                    </td>
                    <td>
                      <Link to={`/empresa/vagas/${job.id}`} className="row" style={{ gap: 6 }}>
                        <LuUsers /> <span className="table__num">{job.applicationsCount}</span>
                        {job.pendingApplicationsCount > 0 && (
                          <span className="badge badge--warning" style={{ height: 22 }}>
                            {job.pendingApplicationsCount} nova(s)
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="text-muted" style={{ whiteSpace: 'nowrap' }}>
                      {job.deadline ? formatDate(job.deadline) : 'Sem prazo'}
                    </td>
                    <td className="text-muted" style={{ whiteSpace: 'nowrap' }}>
                      {formatDate(job.createdAt)}
                    </td>
                    <td>
                      <JobActions job={job} onStatus={changeStatus} onClose={() => setToClose(job)} onDelete={() => setToDelete(job)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={<LuBriefcase />}
            title={filter === 'all' && !q ? 'Você ainda não publicou vagas' : 'Nenhuma vaga encontrada'}
            text={filter === 'all' && !q ? 'Publique sua primeira oportunidade e comece a receber candidaturas de estudantes.' : 'Ajuste a busca ou escolha outro filtro.'}
            actions={<ButtonLink to="/empresa/vagas/nova" variant="primary" icon={<LuPlus />}>Publicar vaga</ButtonLink>}
          />
        )}
      </section>
      {jobs.data && (
        <Pagination
          page={jobs.data.page}
          totalPages={jobs.data.totalPages}
          totalItems={jobs.data.totalItems}
          pageSize={jobs.data.pageSize}
          noun={['vaga', 'vagas']}
          onChange={setPage}
        />
      )}

      <ConfirmDialog
        open={!!toClose}
        tone="brand"
        confirmVariant="primary"
        title="Encerrar vaga?"
        description="A vaga deixa de receber candidaturas, mas você continua vendo os candidatos. É possível reativá-la depois."
        confirmLabel="Encerrar vaga"
        onClose={() => setToClose(null)}
        onConfirm={async () => {
          if (toClose) await changeStatus(toClose, 'Closed');
          setToClose(null);
        }}
      />
      <ConfirmDialog
        open={!!toDelete}
        title="Excluir vaga definitivamente?"
        description={
          toDelete && toDelete.applicationsCount > 0
            ? 'Esta vaga já tem candidaturas e não pode ser excluída. Encerre a vaga para parar de receber novos candidatos.'
            : `"${toDelete?.title}" será excluída. Essa ação não pode ser desfeita.`
        }
        confirmLabel="Excluir"
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return;
          try {
            await jobsApi.remove(toDelete.id);
            toast.success('Vaga excluída');
            setToDelete(null);
            jobs.reload();
          } catch (err) {
            toast.error('Não foi possível excluir', (err as Error).message);
          }
        }}
      />
    </>
  );
}

function JobActions({ job, onStatus, onClose, onDelete }: {
  job: CompanyJob;
  onStatus: (job: CompanyJob, status: JobStatus) => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useDismiss<HTMLDivElement>(open, () => setOpen(false));
  const act = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  return (
    <div className="table__actions">
      <Button variant="ghost" size="sm" iconOnly icon={<LuPencil />} aria-label={`Editar ${job.title}`} onClick={() => navigate(`/empresa/vagas/${job.id}/editar`)} />
      <div className="dropdown" ref={ref}>
        <Button variant="ghost" size="sm" iconOnly icon={<LuEllipsisVertical />} aria-label="Mais ações" aria-expanded={open} onClick={() => setOpen((o) => !o)} />
        {open && (
          <div className="dropdown__menu" role="menu">
            <button type="button" className="dropdown__item" onClick={() => act(() => navigate(`/empresa/vagas/${job.id}`))}>
              <LuEye /> Ver vaga e candidatos
            </button>
            {job.status !== 'Active' && (
              <button type="button" className="dropdown__item" onClick={() => act(() => onStatus(job, 'Active'))}>
                <LuPlay /> Ativar vaga
              </button>
            )}
            {job.status === 'Active' && (
              <button type="button" className="dropdown__item" onClick={() => act(() => onStatus(job, 'Inactive'))}>
                <LuPause /> Pausar vaga
              </button>
            )}
            {job.status !== 'Closed' && (
              <button type="button" className="dropdown__item" onClick={() => act(onClose)}>
                <LuLock /> Encerrar vaga
              </button>
            )}
            <div className="dropdown__separator" />
            <button type="button" className="dropdown__item dropdown__item--danger" onClick={() => act(onDelete)}>
              <LuTrash2 /> Excluir
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

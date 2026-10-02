import { useState } from 'react';
import { LuSearch, LuUsers } from 'react-icons/lu';
import { useSearchParams } from 'react-router-dom';
import { CandidateCard } from '../../components/applications/CandidateCard';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/Feedback';
import { PageHeader } from '../../components/ui/Page';
import { Pagination } from '../../components/ui/Pagination';
import { Tabs } from '../../components/ui/Tabs';
import { applicationsApi, companiesApi } from '../../lib/endpoints';
import { useApi, useDebounce, useDocumentTitle } from '../../lib/hooks';
import type { ApplicationStatus } from '../../lib/types';

type Filter = 'all' | ApplicationStatus;
const validFilters: Filter[] = ['all', 'Pending', 'UnderReview', 'Accepted', 'Rejected', 'Cancelled'];

export function CandidatesPage() {
  useDocumentTitle('Candidatos');
  const [params, setParams] = useSearchParams();
  const initialStatus = params.get('status') as Filter | null;
  const [filter, setFilter] = useState<Filter>(initialStatus && validFilters.includes(initialStatus) ? initialStatus : 'all');
  const [jobId, setJobId] = useState(params.get('vaga') ?? '');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebounce(search.trim(), 350);

  const jobs = useApi((signal) => companiesApi.myJobs({ page: 1, pageSize: 50 }, signal), []);
  const apps = useApi(
    (signal) =>
      applicationsApi.received(
        { page, pageSize: 10, status: filter === 'all' ? undefined : filter, jobId: jobId ? Number(jobId) : undefined, search: q || undefined },
        signal,
      ),
    [page, filter, jobId, q],
  );

  const syncUrl = (next: { status?: Filter; vaga?: string }) => {
    const p = new URLSearchParams(params);
    if (next.status !== undefined) {
      if (next.status === 'all') p.delete('status');
      else p.set('status', next.status);
    }
    if (next.vaga !== undefined) {
      if (next.vaga) p.set('vaga', next.vaga);
      else p.delete('vaga');
    }
    setParams(p, { replace: true });
  };

  return (
    <>
      <PageHeader eyebrow="Seleção" title="Candidatos" subtitle="Todas as candidaturas recebidas nas suas vagas, em um só lugar." />

      <div className="card search-bar" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)' }}>
        <div className="input-group">
          <span className="input-group__icon">
            <LuSearch />
          </span>
          <input
            className="input"
            placeholder="Buscar por nome, escola ou curso"
            value={search}
            maxLength={100}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            aria-label="Buscar candidato"
          />
        </div>
        <select
          className="select"
          value={jobId}
          onChange={(e) => {
            setJobId(e.target.value);
            setPage(1);
            syncUrl({ vaga: e.target.value });
          }}
          aria-label="Filtrar por vaga"
        >
          <option value="">Todas as vagas</option>
          {jobs.data?.items.map((j) => (
            <option key={j.id} value={j.id}>
              {j.title} ({j.applicationsCount})
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 20 }}>
        <Tabs
          label="Filtrar por status"
          value={filter}
          onChange={(v) => {
            setFilter(v);
            setPage(1);
            syncUrl({ status: v });
          }}
          items={[
            { value: 'all', label: 'Todos' },
            { value: 'Pending', label: 'Pendentes' },
            { value: 'UnderReview', label: 'Em análise' },
            { value: 'Accepted', label: 'Aprovados' },
            { value: 'Rejected', label: 'Recusados' },
            { value: 'Cancelled', label: 'Cancelados' },
          ]}
        />
      </div>

      {apps.loading && !apps.data ? (
        <div className="job-list">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card candidate-card">
              <Skeleton width={56} height={56} circle />
              <div className="stack stack--sm">
                <Skeleton width="35%" className="skeleton--title" />
                <Skeleton width="65%" />
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
            noun={['candidatura', 'candidaturas']}
            onChange={setPage}
          />
        </>
      ) : (
        <div className="card">
          <EmptyState
            icon={<LuUsers />}
            title="Nenhum candidato encontrado"
            text={filter === 'all' && !jobId && !q ? 'Assim que estudantes se candidatarem às suas vagas, eles aparecerão aqui.' : 'Ajuste os filtros para ver outros candidatos.'}
          />
        </div>
      )}
    </>
  );
}

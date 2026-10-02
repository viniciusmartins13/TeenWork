import { useState } from 'react';
import { LuBriefcase, LuBuilding2, LuExternalLink, LuGlobe, LuMapPin, LuSearch } from 'react-icons/lu';
import { Link, useParams } from 'react-router-dom';
import { JobCard, JobGridSkeleton } from '../../components/jobs/JobCard';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { EmptyState, ErrorState, PageLoader, Skeleton } from '../../components/ui/Feedback';
import { Card, PageHeader } from '../../components/ui/Page';
import { Pagination } from '../../components/ui/Pagination';
import { companiesApi, jobsApi } from '../../lib/endpoints';
import { location, plural } from '../../lib/format';
import { useApi, useDebounce, useDocumentTitle } from '../../lib/hooks';

export function CompaniesPage() {
  useDocumentTitle('Empresas');
  const [search, setSearch] = useState('');
  const [onlyHiring, setOnlyHiring] = useState(true);
  const [page, setPage] = useState(1);
  const q = useDebounce(search.trim(), 350);
  const companies = useApi(
    (signal) => companiesApi.search({ page, pageSize: 12, search: q || undefined, onlyHiring }, signal),
    [page, q, onlyHiring],
  );

  return (
    <>
      <PageHeader eyebrow="Quem está contratando" title="Empresas" subtitle="Conheça as empresas parceiras e suas vagas abertas." />
      <div className="card search-bar" style={{ gridTemplateColumns: 'minmax(0,1fr) auto' }}>
        <div className="input-group">
          <span className="input-group__icon">
            <LuSearch />
          </span>
          <input
            className="input"
            placeholder="Buscar empresa por nome ou setor"
            value={search}
            maxLength={100}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            aria-label="Buscar empresa"
          />
        </div>
        <button
          type="button"
          className="toggle-chip"
          style={{ height: 44 }}
          aria-pressed={onlyHiring}
          onClick={() => {
            setOnlyHiring((v) => !v);
            setPage(1);
          }}
        >
          <LuBriefcase /> Com vagas abertas
        </button>
      </div>

      {companies.loading && !companies.data ? (
        <div className="company-grid">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="card company-card">
              <Skeleton width={56} height={56} style={{ borderRadius: 14 }} />
              <Skeleton className="skeleton--title" width="60%" />
              <Skeleton />
              <Skeleton width="70%" />
            </div>
          ))}
        </div>
      ) : companies.error ? (
        <div className="card">
          <ErrorState error={companies.error} onRetry={companies.reload} />
        </div>
      ) : companies.data && companies.data.items.length > 0 ? (
        <>
          <div className="company-grid">
            {companies.data.items.map((c) => (
              <Link key={c.id} to={`/aluno/empresas/${c.id}`} className="card card--interactive company-card">
                <div className="row row--between" style={{ alignItems: 'flex-start' }}>
                  <Avatar name={c.companyName} src={c.logo} square size="lg" />
                  {c.activeJobsCount > 0 ? (
                    <Badge tone="success" dot>
                      {plural(c.activeJobsCount, 'vaga aberta', 'vagas abertas')}
                    </Badge>
                  ) : (
                    <Badge>Sem vagas no momento</Badge>
                  )}
                </div>
                <div>
                  <div className="company-card__name">{c.companyName}</div>
                  <div className="meta-list" style={{ marginTop: 4 }}>
                    {c.industry && <span>{c.industry}</span>}
                    {location(c.city, c.state) && (
                      <span>
                        <LuMapPin /> {location(c.city, c.state)}
                      </span>
                    )}
                  </div>
                </div>
                {c.description && <p className="company-card__desc">{c.description}</p>}
              </Link>
            ))}
          </div>
          <Pagination
            page={companies.data.page}
            totalPages={companies.data.totalPages}
            totalItems={companies.data.totalItems}
            pageSize={companies.data.pageSize}
            noun={['empresa', 'empresas']}
            onChange={setPage}
          />
        </>
      ) : (
        <div className="card">
          <EmptyState icon={<LuBuilding2 />} title="Nenhuma empresa encontrada" text="Tente outro termo ou desmarque o filtro de vagas abertas." />
        </div>
      )}
    </>
  );
}

export function CompanyPublicPage() {
  const { id } = useParams();
  const companyId = Number(id);
  const company = useApi((signal) => companiesApi.get(companyId, signal), [companyId]);
  const jobs = useApi((signal) => jobsApi.search({ companyId, pageSize: 50, sort: 'recent' }, signal), [companyId]);
  useDocumentTitle(company.data?.companyName ?? 'Empresa');

  if (company.loading && !company.data) return <PageLoader />;
  if (company.error || !company.data) return <ErrorState error={company.error} onRetry={company.reload} />;
  const c = company.data;

  return (
    <>
      <Link to="/aluno/empresas" className="back-link">
        ← Todas as empresas
      </Link>
      <section className="card profile-hero" style={{ marginBottom: 24 }}>
        <div className="profile-hero__cover" />
        <div className="profile-hero__body">
          <Avatar name={c.companyName} src={c.logo} square size="xxl" ring />
          <div className="profile-hero__info">
            <h1 className="profile-hero__name">{c.companyName}</h1>
            <div className="meta-list" style={{ marginTop: 6 }}>
              {c.industry && <span>{c.industry}</span>}
              {location(c.city, c.state) && (
                <span>
                  <LuMapPin /> {location(c.city, c.state)}
                </span>
              )}
              <span>
                <LuBriefcase /> {plural(c.activeJobsCount, 'vaga aberta', 'vagas abertas')}
              </span>
            </div>
          </div>
          {c.website && (
            <a href={c.website} target="_blank" rel="noopener noreferrer" className="btn btn--secondary">
              <LuGlobe /> Visitar site <LuExternalLink />
            </a>
          )}
        </div>
      </section>

      <div className="stack stack--lg">
        {c.description && (
          <Card title="Sobre a empresa" icon={<LuBuilding2 />}>
            <p className="pre-line" style={{ color: 'var(--ink-2)' }}>
              {c.description}
            </p>
          </Card>
        )}
        <div>
          <h2 style={{ fontSize: 20, marginBottom: 16 }}>Vagas abertas</h2>
          {jobs.loading && !jobs.data ? (
            <JobGridSkeleton count={3} />
          ) : jobs.error ? (
            <div className="card">
              <ErrorState error={jobs.error} onRetry={jobs.reload} />
            </div>
          ) : jobs.data && jobs.data.items.length > 0 ? (
            <div className="job-grid">
              {jobs.data.items.map((job) => (
                <JobCard key={job.id} job={job} to={`/aluno/vagas/${job.id}`} />
              ))}
            </div>
          ) : (
            <div className="card">
              <EmptyState compact icon={<LuBriefcase />} title="Nenhuma vaga aberta agora" text="Salve esta empresa na memória e volte em breve!" />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

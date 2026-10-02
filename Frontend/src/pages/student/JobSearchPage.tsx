import { useEffect, useMemo, useState } from 'react';
import { LuFilter, LuMapPin, LuSearch, LuSearchX, LuX } from 'react-icons/lu';
import { useSearchParams } from 'react-router-dom';
import { JobCard, JobGridSkeleton } from '../../components/jobs/JobCard';
import { Button } from '../../components/ui/Button';
import { EmptyState, ErrorState } from '../../components/ui/Feedback';
import { Pagination } from '../../components/ui/Pagination';
import { PageHeader } from '../../components/ui/Page';
import { jobsApi } from '../../lib/endpoints';
import { jobTypeLabels, sortOptions, workModelLabels } from '../../lib/format';
import { useApi, useDebounce, useDocumentTitle } from '../../lib/hooks';
import type { JobType, WorkModel } from '../../lib/types';

const PAGE_SIZE = 12;

export function JobSearchPage() {
  useDocumentTitle('Buscar vagas');
  const [params, setParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [searchText, setSearchText] = useState(params.get('search') ?? '');
  const debouncedSearch = useDebounce(searchText, 400);

  const page = Math.max(1, Number(params.get('page')) || 1);
  const filters = {
    search: params.get('search') ?? '',
    location: params.get('local') ?? '',
    workModel: params.get('modalidade') ?? '',
    jobType: params.get('tipo') ?? '',
    area: params.get('area') ?? '',
    minSalary: params.get('min') ?? '',
    sort: params.get('ordem') ?? 'recent',
  };

  const update = (changes: Record<string, string>, keepPage = false) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (!keepPage) next.delete('page');
    setParams(next, { replace: true });
  };

  // Busca por texto com debounce.
  useEffect(() => {
    if ((params.get('search') ?? '') !== debouncedSearch.trim()) update({ search: debouncedSearch.trim() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Mantém o campo sincronizado quando a busca vem do topo da página.
  useEffect(() => {
    const fromUrl = params.get('search') ?? '';
    if (fromUrl !== searchText.trim()) setSearchText(fromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.get('search')]);

  const [city, state] = filters.location ? filters.location.split('|') : ['', ''];
  const query = {
    page,
    pageSize: PAGE_SIZE,
    search: filters.search || undefined,
    city: city || undefined,
    state: state || undefined,
    workModel: filters.workModel || undefined,
    jobType: filters.jobType || undefined,
    area: filters.area || undefined,
    minSalary: filters.minSalary ? Number(filters.minSalary) : undefined,
    sort: filters.sort,
  };

  const options = useApi((signal) => jobsApi.filters(signal), []);
  const results = useApi((signal) => jobsApi.search(query, signal), [JSON.stringify(query)]);

  const activeCount = useMemo(
    () => [filters.location, filters.workModel, filters.jobType, filters.area, filters.minSalary].filter(Boolean).length,
    [filters.location, filters.workModel, filters.jobType, filters.area, filters.minSalary],
  );

  const clearAll = () => {
    setSearchText('');
    setParams(new URLSearchParams(), { replace: true });
  };

  return (
    <>
      <PageHeader
        eyebrow="Oportunidades"
        title="Encontre sua vaga"
        subtitle="Jovem Aprendiz, estágio, primeiro emprego e cursos — filtre do seu jeito."
      />

      <div className="card search-bar" role="search">
        <div className="input-group">
          <span className="input-group__icon">
            <LuSearch />
          </span>
          <input
            className="input"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Cargo, empresa ou palavra-chave"
            aria-label="Buscar por cargo, empresa ou palavra-chave"
            maxLength={100}
          />
        </div>
        <div className="input-group">
          <span className="input-group__icon">
            <LuMapPin />
          </span>
          <select
            className="select"
            style={{ paddingLeft: 40 }}
            value={filters.location}
            onChange={(e) => update({ local: e.target.value })}
            aria-label="Localização"
          >
            <option value="">Todas as cidades</option>
            {options.data?.locations.map((l) => (
              <option key={`${l.city}|${l.state}`} value={`${l.city}|${l.state}`}>
                {l.city}, {l.state} ({l.jobsCount})
              </option>
            ))}
          </select>
        </div>
        <Button variant="secondary" className="filters-toggle" icon={<LuFilter />} onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters}>
          Filtros {activeCount > 0 && `(${activeCount})`}
        </Button>
      </div>

      <div className="search-layout">
        <aside className={`card filters${showFilters ? ' filters--open' : ''}`} aria-label="Filtros">
          <div className="filters__head">
            <span className="filters__title">
              <LuFilter /> Filtros
            </span>
            {(activeCount > 0 || filters.search) && (
              <button type="button" className="link-button" onClick={clearAll}>
                Limpar
              </button>
            )}
          </div>

          <div className="filters__group">
            <span className="filters__label">Modalidade</span>
            <div className="chip-list">
              {(Object.keys(workModelLabels) as WorkModel[]).map((wm) => (
                <button
                  key={wm}
                  type="button"
                  className="toggle-chip"
                  aria-pressed={filters.workModel === wm}
                  onClick={() => update({ modalidade: filters.workModel === wm ? '' : wm })}
                >
                  {workModelLabels[wm]}
                </button>
              ))}
            </div>
          </div>

          <div className="filters__group">
            <label className="filters__label" htmlFor="f-tipo">
              Tipo de vaga
            </label>
            <select id="f-tipo" className="select" value={filters.jobType} onChange={(e) => update({ tipo: e.target.value })}>
              <option value="">Todos os tipos</option>
              {(Object.keys(jobTypeLabels) as JobType[]).map((t) => (
                <option key={t} value={t}>
                  {jobTypeLabels[t]}
                </option>
              ))}
            </select>
          </div>

          <div className="filters__group">
            <label className="filters__label" htmlFor="f-area">
              Área
            </label>
            <select id="f-area" className="select" value={filters.area} onChange={(e) => update({ area: e.target.value })}>
              <option value="">Todas as áreas</option>
              {options.data?.areas.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div className="filters__group">
            <label className="filters__label" htmlFor="f-salario">
              Salário mínimo
            </label>
            <select id="f-salario" className="select" value={filters.minSalary} onChange={(e) => update({ min: e.target.value })}>
              <option value="">Qualquer valor</option>
              {[500, 800, 1000, 1200, 1500, 2000].map((v) => (
                <option key={v} value={v}>
                  A partir de R$ {v.toLocaleString('pt-BR')}
                </option>
              ))}
            </select>
          </div>
        </aside>

        <section aria-live="polite">
          <div className="results-bar">
            <span className="results-bar__count">
              {results.data ? (
                <>
                  <strong>{results.data.totalItems}</strong> {results.data.totalItems === 1 ? 'vaga encontrada' : 'vagas encontradas'}
                </>
              ) : (
                'Buscando vagas…'
              )}
            </span>
            <div className="row">
              {filters.search && (
                <span className="chip chip--brand">
                  “{filters.search}”
                  <button type="button" className="btn btn--ghost btn--icon btn--sm" style={{ width: 20, minHeight: 20 }} onClick={() => setSearchText('')} aria-label="Remover busca">
                    <LuX />
                  </button>
                </span>
              )}
              <select className="select" value={filters.sort} onChange={(e) => update({ ordem: e.target.value === 'recent' ? '' : e.target.value })} aria-label="Ordenar">
                {sortOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {results.loading && !results.data ? (
            <JobGridSkeleton />
          ) : results.error ? (
            <div className="card">
              <ErrorState error={results.error} onRetry={results.reload} />
            </div>
          ) : results.data && results.data.items.length > 0 ? (
            <>
              <div className="job-grid" style={{ opacity: results.loading ? 0.6 : 1, transition: 'opacity .2s' }}>
                {results.data.items.map((job) => (
                  <JobCard key={job.id} job={job} to={`/aluno/vagas/${job.id}`} />
                ))}
              </div>
              <Pagination
                page={results.data.page}
                totalPages={results.data.totalPages}
                totalItems={results.data.totalItems}
                pageSize={results.data.pageSize}
                noun={['vaga', 'vagas']}
                onChange={(p) => {
                  update({ page: String(p) }, true);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </>
          ) : (
            <div className="card">
              <EmptyState
                icon={<LuSearchX />}
                title="Nenhuma vaga encontrada"
                text="Tente outras palavras-chave ou remova alguns filtros para ver mais oportunidades."
                actions={
                  <Button variant="primary" onClick={clearAll}>
                    Limpar filtros
                  </Button>
                }
              />
            </div>
          )}
        </section>
      </div>
    </>
  );
}

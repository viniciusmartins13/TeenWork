import { useState } from 'react';
import {
  LuBuilding2,
  LuCalendar,
  LuCalendarClock,
  LuCheck,
  LuCircleCheck,
  LuClock,
  LuExternalLink,
  LuGlobe,
  LuLock,
  LuSend,
  LuUsers,
  LuWallet,
} from 'react-icons/lu';
import { Link, useParams } from 'react-router-dom';
import { ApplyModal } from '../../components/applications/ApplicationModals';
import { ApplicationTrail } from '../../components/applications/ApplicationTrail';
import { JobChips, SaveButton } from '../../components/jobs/JobBits';
import { Avatar } from '../../components/ui/Avatar';
import { ApplicationStatusBadge } from '../../components/ui/Badge';
import { Button, ButtonLink } from '../../components/ui/Button';
import { ErrorState, PageLoader } from '../../components/ui/Feedback';
import { Card } from '../../components/ui/Page';
import { jobsApi } from '../../lib/endpoints';
import { deadlineLabel, formatDate, formatRelative, formatSalary, location, plural, splitLines } from '../../lib/format';
import { useApi, useDocumentTitle } from '../../lib/hooks';

export function JobDetailsPage() {
  const { id } = useParams();
  const jobId = Number(id);
  const job = useApi((signal) => jobsApi.get(jobId, signal), [jobId]);
  const [applyOpen, setApplyOpen] = useState(false);
  useDocumentTitle(job.data?.title ?? 'Vaga');

  if (job.loading && !job.data) return <PageLoader label="Carregando vaga…" />;
  if (job.error || !job.data) return <ErrorState error={job.error} onRetry={job.reload} />;
  const j = job.data;

  const applied = j.myApplication && j.myApplication.status !== 'Cancelled';
  const requirements = splitLines(j.requirements);
  const benefits = splitLines(j.benefits);

  const applyArea = applied ? (
    <div className="stack">
      <div className="row row--between">
        <span className="text-sm text-muted">Sua candidatura</span>
        <ApplicationStatusBadge status={j.myApplication!.status} />
      </div>
      <ApplicationTrail status={j.myApplication!.status} />
      <ButtonLink to="/aluno/candidaturas" variant="soft" block>
        Acompanhar candidatura
      </ButtonLink>
    </div>
  ) : j.isOpenForApplications ? (
    <div className="stack">
      <Button variant="primary" size="lg" block icon={<LuSend />} onClick={() => setApplyOpen(true)}>
        {j.myApplication?.status === 'Cancelled' ? 'Candidatar-se novamente' : 'Candidatar-se'}
      </Button>
      <p className="text-sm text-muted" style={{ textAlign: 'center' }}>
        A empresa verá seu perfil, habilidades e experiências.
      </p>
    </div>
  ) : (
    <div className="form-alert form-alert--warning">
      <LuLock aria-hidden="true" />
      <div>Esta vaga não está recebendo candidaturas no momento.</div>
    </div>
  );

  return (
    <>
      <Link to="/aluno/vagas" className="back-link">
        ← Voltar para a busca
      </Link>

      <div className="detail-layout">
        <div className="stack stack--lg">
          <section className="card detail-hero">
            <div className="detail-hero__top">
              <Avatar name={j.company.companyName} src={j.company.logo} square size="xl" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <h1 className="detail-hero__title">{j.title}</h1>
                <Link to={`/aluno/empresas/${j.company.id}`} className="detail-hero__company" style={{ display: 'inline-block' }}>
                  {j.company.companyName}
                </Link>
                <div className="meta-list" style={{ marginTop: 8 }}>
                  <span>
                    <LuClock /> Publicada {formatRelative(j.createdAt)}
                  </span>
                  <span>
                    <LuUsers /> {plural(j.vacancies, 'vaga', 'vagas')}
                  </span>
                </div>
              </div>
            </div>
            <JobChips city={j.city} state={j.state} workModel={j.workModel} jobType={j.jobType} deadline={j.deadline} />
            <div className="detail-hero__actions">
              {!applied && j.isOpenForApplications && (
                <Button variant="primary" icon={<LuSend />} onClick={() => setApplyOpen(true)}>
                  Candidatar-se
                </Button>
              )}
              {applied && (
                <span className="badge badge--success" style={{ height: 36, padding: '0 14px' }}>
                  <LuCircleCheck /> Você já se candidatou
                </span>
              )}
              <SaveButton jobId={j.id} saved={j.isSaved} withLabel />
            </div>
          </section>

          <section className="card card--pad">
            <div className="content-section">
              <h2>Sobre a vaga</h2>
              <p className="pre-line" style={{ color: 'var(--ink-2)' }}>
                {j.description}
              </p>
            </div>
            {requirements.length > 0 && (
              <div className="content-section">
                <h2>Requisitos</h2>
                <ul className="check-list">
                  {requirements.map((r) => (
                    <li key={r}>
                      <LuCheck aria-hidden="true" /> {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {benefits.length > 0 && (
              <div className="content-section">
                <h2>Benefícios</h2>
                <ul className="check-list">
                  {benefits.map((b) => (
                    <li key={b}>
                      <LuCheck aria-hidden="true" /> {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <Card title="Sobre a empresa" icon={<LuBuilding2 />}>
            <div className="stack">
              <div className="row">
                <Avatar name={j.company.companyName} src={j.company.logo} square size="lg" />
                <div>
                  <div style={{ fontWeight: 700 }}>{j.company.companyName}</div>
                  <div className="text-sm text-muted">
                    {[j.company.industry, location(j.company.city, j.company.state)].filter(Boolean).join(' · ')}
                  </div>
                </div>
              </div>
              {j.company.description && <p className="pre-line text-sm" style={{ color: 'var(--ink-2)' }}>{j.company.description}</p>}
              <div className="row row--wrap">
                <ButtonLink to={`/aluno/empresas/${j.company.id}`} variant="secondary" size="sm">
                  Ver todas as vagas da empresa
                </ButtonLink>
                {j.company.website && (
                  <a href={j.company.website} target="_blank" rel="noopener noreferrer" className="btn btn--ghost btn--sm">
                    <LuGlobe /> Site <LuExternalLink />
                  </a>
                )}
              </div>
            </div>
          </Card>
        </div>

        <aside className="sticky-aside">
          <section className="card card--pad">{applyArea}</section>
          <Card title="Resumo">
            <dl className="summary-list">
              <div>
                <dt>
                  <LuWallet /> Remuneração
                </dt>
                <dd>{formatSalary(j.salary, j.jobType)}</dd>
              </div>
              <div>
                <dt>
                  <LuClock /> Carga horária
                </dt>
                <dd>{j.workload || 'A combinar'}</dd>
              </div>
              <div>
                <dt>
                  <LuUsers /> Vagas
                </dt>
                <dd>{j.vacancies}</dd>
              </div>
              <div>
                <dt>
                  <LuCalendarClock /> Inscrições
                </dt>
                <dd>{deadlineLabel(j.deadline) ?? 'Sem prazo definido'}</dd>
              </div>
              <div>
                <dt>
                  <LuCalendar /> Publicada em
                </dt>
                <dd>{formatDate(j.createdAt)}</dd>
              </div>
            </dl>
          </Card>
        </aside>
      </div>

      <ApplyModal
        open={applyOpen}
        jobId={j.id}
        jobTitle={j.title}
        companyName={j.company.companyName}
        onClose={() => setApplyOpen(false)}
        onApplied={(application) => {
          setApplyOpen(false);
          job.setData((current) =>
            current ? { ...current, myApplication: { id: application.id, status: application.status, createdAt: application.createdAt } } : current,
          );
        }}
      />
    </>
  );
}

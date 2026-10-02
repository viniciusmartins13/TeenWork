import { LuArrowRight, LuBriefcase, LuCircleCheck, LuHourglass, LuPlus, LuUsers } from 'react-icons/lu';
import { Link } from 'react-router-dom';
import { Avatar } from '../../components/ui/Avatar';
import { ApplicationStatusBadge } from '../../components/ui/Badge';
import { ButtonLink } from '../../components/ui/Button';
import { EmptyState, ErrorState, PageLoader } from '../../components/ui/Feedback';
import { Card, StatCard } from '../../components/ui/Page';
import { dashboardApi } from '../../lib/endpoints';
import { formatRelative, greeting } from '../../lib/format';
import { useApi, useDocumentTitle } from '../../lib/hooks';

export function CompanyDashboardPage() {
  useDocumentTitle('Painel da empresa');
  const dash = useApi((signal) => dashboardApi.company(signal), []);

  if (dash.loading && !dash.data) return <PageLoader label="Carregando seu painel…" />;
  if (dash.error || !dash.data) return <ErrorState error={dash.error} onRetry={dash.reload} />;
  const d = dash.data;
  const maxApps = Math.max(1, ...d.topJobs.map((j) => j.applicationsCount));

  return (
    <>
      <section className="welcome">
        <div>
          <h1>
            {greeting()}, {d.companyName}!
          </h1>
          <p>
            {d.applicationsByStatus.pending > 0
              ? `Há ${d.applicationsByStatus.pending} candidatura${d.applicationsByStatus.pending > 1 ? 's' : ''} aguardando sua análise.`
              : 'Tudo em dia por aqui. Que tal publicar uma nova oportunidade?'}
          </p>
        </div>
        <div className="row row--wrap">
          <ButtonLink to="/empresa/vagas/nova" variant="white" icon={<LuPlus />}>
            Publicar vaga
          </ButtonLink>
          {d.applicationsByStatus.pending > 0 && (
            <ButtonLink to="/empresa/candidatos?status=Pending" variant="glass">
              Ver pendentes
            </ButtonLink>
          )}
        </div>
      </section>

      <div className="stats-grid">
        <StatCard icon={<LuBriefcase />} label="Vagas publicadas" value={d.totalJobs} />
        <StatCard icon={<LuCircleCheck />} label="Vagas ativas" value={d.activeJobs} tone="success" />
        <StatCard icon={<LuUsers />} label="Candidaturas recebidas" value={d.totalApplications} tone="sky" />
        <StatCard icon={<LuHourglass />} label="Aguardando análise" value={d.applicationsByStatus.pending} tone="warning" />
      </div>

      <div className="dash-grid">
        <Card
          title="Candidaturas recentes"
          icon={<LuUsers />}
          padded={false}
          actions={
            <Link to="/empresa/candidatos" className="link-button">
              Ver todas <LuArrowRight />
            </Link>
          }
        >
          {d.recentApplications.length === 0 ? (
            <EmptyState
              compact
              icon={<LuUsers />}
              title="Nenhuma candidatura ainda"
              text={d.activeJobs === 0 ? 'Publique sua primeira vaga para começar a receber candidatos.' : 'Assim que estudantes se candidatarem, eles aparecem aqui.'}
              actions={d.activeJobs === 0 && <ButtonLink to="/empresa/vagas/nova" variant="primary">Publicar vaga</ButtonLink>}
            />
          ) : (
            d.recentApplications.map((a) => (
              <Link key={a.id} to={`/empresa/candidatos/${a.id}`} className="list-item">
                <Avatar name={a.studentName} src={a.studentPhoto} size="sm" />
                <div className="list-item__main">
                  <div className="list-item__title">{a.studentName}</div>
                  <div className="list-item__meta">
                    {a.jobTitle} · {formatRelative(a.createdAt)}
                  </div>
                </div>
                <ApplicationStatusBadge status={a.status} />
              </Link>
            ))
          )}
        </Card>

        <div className="stack stack--lg">
          <Card title="Vagas com mais candidatos" icon={<LuBriefcase />}>
            {d.topJobs.length === 0 ? (
              <p className="text-sm text-muted">Suas vagas aparecerão aqui com o número de candidaturas.</p>
            ) : (
              <div className="bar-list">
                {d.topJobs.map((j) => (
                  <div key={j.id} className="bar-list__item">
                    <div className="bar-list__row">
                      <Link to={`/empresa/vagas/${j.id}`}>{j.title}</Link>
                      <strong>{j.applicationsCount}</strong>
                    </div>
                    <div className="meter">
                      <div className="meter__fill" style={{ width: `${(j.applicationsCount / maxApps) * 100}%` }} />
                    </div>
                    {j.pendingCount > 0 && <span className="text-sm text-muted">{j.pendingCount} pendente(s)</span>}
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Card title="Status das candidaturas">
            <div className="stack stack--sm">
              {(
                [
                  ['Pendentes', d.applicationsByStatus.pending],
                  ['Em análise', d.applicationsByStatus.underReview],
                  ['Aprovadas', d.applicationsByStatus.accepted],
                  ['Recusadas', d.applicationsByStatus.rejected],
                  ['Canceladas pelo aluno', d.applicationsByStatus.cancelled],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="row row--between text-sm">
                  <span className="text-muted">{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
              <div className="divider" style={{ margin: '8px 0' }} />
              <div className="row row--between text-sm">
                <span className="text-muted">Vagas pausadas / encerradas</span>
                <strong>
                  {d.inactiveJobs} / {d.closedJobs}
                </strong>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

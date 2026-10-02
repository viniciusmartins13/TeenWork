import { LuArrowRight, LuBookmark, LuCircleCheck, LuCircleDashed, LuFileText, LuSearch, LuSparkles, LuTriangleAlert } from 'react-icons/lu';
import { Link } from 'react-router-dom';
import { JobCard, JobGridSkeleton } from '../../components/jobs/JobCard';
import { Avatar } from '../../components/ui/Avatar';
import { ApplicationStatusBadge } from '../../components/ui/Badge';
import { ButtonLink } from '../../components/ui/Button';
import { EmptyState, ErrorState, PageLoader } from '../../components/ui/Feedback';
import { Card, StatCard } from '../../components/ui/Page';
import { dashboardApi, studentsApi } from '../../lib/endpoints';
import { firstName, formatRelative, greeting, missingProfileLabels } from '../../lib/format';
import { useApi, useDocumentTitle } from '../../lib/hooks';

export function StudentDashboardPage() {
  useDocumentTitle('Início');
  const dash = useApi((signal) => dashboardApi.student(signal), []);
  const recommended = useApi((signal) => studentsApi.recommended(6, signal), []);

  if (dash.loading && !dash.data) return <PageLoader label="Montando seu painel…" />;
  if (dash.error || !dash.data) return <ErrorState error={dash.error} onRetry={dash.reload} />;
  const d = dash.data;
  const inProgress = d.applicationsByStatus.pending + d.applicationsByStatus.underReview;

  return (
    <>
      <section className="welcome">
        <div>
          <h1>
            {greeting()}, {firstName(d.name)}! 👋
          </h1>
          <p>
            {inProgress > 0
              ? `Você tem ${inProgress} candidatura${inProgress > 1 ? 's' : ''} em andamento. Continue explorando novas oportunidades.`
              : 'Que tal encontrar sua próxima oportunidade hoje? Novas vagas aparecem toda semana.'}
          </p>
        </div>
        <div className="row row--wrap">
          <ButtonLink to="/aluno/vagas" variant="white" icon={<LuSearch />}>
            Buscar vagas
          </ButtonLink>
        </div>
      </section>

      <div className="stats-grid">
        <StatCard icon={<LuFileText />} label="Candidaturas enviadas" value={d.totalApplications} />
        <StatCard icon={<LuCircleDashed />} label="Em andamento" value={inProgress} tone="warning" />
        <StatCard icon={<LuCircleCheck />} label="Aprovações" value={d.applicationsByStatus.accepted} tone="success" />
        <StatCard icon={<LuBookmark />} label="Vagas salvas" value={d.savedJobsCount} tone="sky" />
      </div>

      <div className="dash-grid">
        <div className="stack stack--lg">
          <Card
            title="Recomendadas para você"
            icon={<LuSparkles />}
            actions={
              <Link to="/aluno/vagas" className="link-button">
                Ver todas <LuArrowRight />
              </Link>
            }
          >
            {recommended.loading ? (
              <JobGridSkeleton count={2} />
            ) : recommended.error ? (
              <ErrorState compact error={recommended.error} onRetry={recommended.reload} />
            ) : recommended.data && recommended.data.length > 0 ? (
              <div className="job-grid">
                {recommended.data.map((job) => (
                  <JobCard key={job.id} job={job} to={`/aluno/vagas/${job.id}`} />
                ))}
              </div>
            ) : (
              <EmptyState
                compact
                icon={<LuSparkles />}
                title="Sem recomendações por enquanto"
                text="Complete seu perfil com cidade e habilidades para receber vagas mais certeiras."
                actions={<ButtonLink to="/aluno/perfil" variant="primary">Completar perfil</ButtonLink>}
              />
            )}
          </Card>

          <Card
            title="Candidaturas recentes"
            icon={<LuFileText />}
            padded={false}
            actions={
              <Link to="/aluno/candidaturas" className="link-button">
                Ver todas <LuArrowRight />
              </Link>
            }
          >
            {d.recentApplications.length === 0 ? (
              <EmptyState
                compact
                icon={<LuFileText />}
                title="Nenhuma candidatura ainda"
                text="Quando você se candidatar, o andamento aparece aqui."
                actions={<ButtonLink to="/aluno/vagas" variant="primary">Encontrar vagas</ButtonLink>}
              />
            ) : (
              d.recentApplications.map((a) => (
                <Link key={a.id} to={`/aluno/vagas/${a.jobId}`} className="list-item">
                  <Avatar name={a.companyName} src={a.companyLogo} square size="sm" />
                  <div className="list-item__main">
                    <div className="list-item__title">{a.jobTitle}</div>
                    <div className="list-item__meta">
                      {a.companyName} · {formatRelative(a.createdAt)}
                    </div>
                  </div>
                  <ApplicationStatusBadge status={a.status} />
                </Link>
              ))
            )}
          </Card>
        </div>

        <div className="stack stack--lg">
          <Card title="Seu perfil">
            <div className="profile-progress">
              <div className="row">
                <Avatar name={d.name} src={d.profileImage} size="lg" />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 650 }}>{d.name}</div>
                  <div className="text-muted text-sm">{[d.course, d.school].filter(Boolean).join(' · ') || 'Curso e escola não informados'}</div>
                </div>
              </div>
              <div className="row row--between">
                <span className="text-sm text-muted">Perfil completo</span>
                <span className="profile-progress__value">{d.profileCompletion.percentage}%</span>
              </div>
              <div className="meter" role="progressbar" aria-valuenow={d.profileCompletion.percentage} aria-valuemin={0} aria-valuemax={100}>
                <div className="meter__fill" style={{ width: `${d.profileCompletion.percentage}%` }} />
              </div>
              {d.profileCompletion.missingItems.length > 0 ? (
                <>
                  <p className="text-sm text-muted">Perfis completos chamam mais atenção das empresas. Falta pouco:</p>
                  <ul className="missing-list">
                    {d.profileCompletion.missingItems.map((item) => (
                      <li key={item}>
                        <LuTriangleAlert aria-hidden="true" /> {missingProfileLabels[item] ?? item}
                      </li>
                    ))}
                  </ul>
                  <ButtonLink to="/aluno/perfil" variant="soft" block>
                    Completar meu perfil
                  </ButtonLink>
                </>
              ) : (
                <p className="text-sm" style={{ color: 'var(--success-700)', fontWeight: 600 }}>
                  Perfil 100% completo. Excelente! 🎉
                </p>
              )}
            </div>
          </Card>

          <Card title="Resumo das candidaturas">
            <div className="stack stack--sm">
              {(
                [
                  ['Pendentes', d.applicationsByStatus.pending],
                  ['Em análise', d.applicationsByStatus.underReview],
                  ['Aprovadas', d.applicationsByStatus.accepted],
                  ['Recusadas', d.applicationsByStatus.rejected],
                  ['Canceladas', d.applicationsByStatus.cancelled],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="row row--between text-sm">
                  <span className="text-muted">{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

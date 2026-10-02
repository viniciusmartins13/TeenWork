import {
  LuArrowRight,
  LuBell,
  LuBuilding2,
  LuCheck,
  LuFileText,
  LuGraduationCap,
  LuSearch,
  LuSend,
  LuSparkles,
  LuUserRound,
} from 'react-icons/lu';
import { Link } from 'react-router-dom';
import { JobCard, JobGridSkeleton } from '../../components/jobs/JobCard';
import { JobChips } from '../../components/jobs/JobBits';
import { ApplicationTrail } from '../../components/applications/ApplicationTrail';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/ui/Feedback';
import { useAuth } from '../../context/AuthContext';
import { companiesApi, jobsApi } from '../../lib/endpoints';
import { formatSalary } from '../../lib/format';
import { useApi, useDocumentTitle } from '../../lib/hooks';

export function LandingPage() {
  useDocumentTitle('');
  const { user } = useAuth();
  const jobs = useApi((signal) => jobsApi.search({ page: 1, pageSize: 6, sort: 'recent' }, signal), []);
  const companies = useApi((signal) => companiesApi.search({ page: 1, pageSize: 1, onlyHiring: true }, signal), []);

  const featured = jobs.data?.items[0];
  const jobLink = (id: number) =>
    user?.role === 'STUDENT' ? `/aluno/vagas/${id}` : `/entrar?redirect=${encodeURIComponent(`/aluno/vagas/${id}`)}`;

  return (
    <PublicLayout>
      <section className="hero">
        <div className="container hero__grid">
          <div>
            <span className="hero__eyebrow">
              <span>Novo</span> Vagas feitas para quem está no ensino médio
            </span>
            <h1 className="hero__title">
              O seu <em>primeiro emprego</em> começa por aqui.
            </h1>
            <p className="hero__lead">
              Jovem Aprendiz, estágio, primeiro emprego e cursos gratuitos em um só lugar. Monte seu perfil, candidate-se
              em poucos cliques e acompanhe cada etapa até a resposta da empresa.
            </p>
            <div className="hero__ctas">
              <Link to="/cadastro" className="btn btn--primary btn--lg">
                <LuGraduationCap /> Sou estudante
              </Link>
              <Link to="/cadastro?tipo=empresa" className="btn btn--secondary btn--lg">
                <LuBuilding2 /> Quero contratar
              </Link>
            </div>
            <div className="hero__stats">
              <div className="hero__stat">
                <strong>{jobs.data ? jobs.data.totalItems : '—'}</strong>
                <span>vagas abertas agora</span>
              </div>
              <div className="hero__stat">
                <strong>{companies.data ? companies.data.totalItems : '—'}</strong>
                <span>empresas contratando</span>
              </div>
              <div className="hero__stat">
                <strong>R$ 0</strong>
                <span>para estudantes, sempre</span>
              </div>
            </div>
          </div>

          <div className="hero__visual" aria-hidden={featured ? undefined : true}>
            {featured ? (
              <>
                <div className="hero__card hero__card--job">
                  <span className="hero__float">
                    <LuSparkles /> Vaga mais recente
                  </span>
                  <div className="hero__card-label">Em destaque</div>
                  <div className="row" style={{ alignItems: 'flex-start', marginBottom: 16 }}>
                    <Avatar name={featured.companyName} src={featured.companyLogo} square size="lg" />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 17 }}>{featured.title}</div>
                      <div className="text-muted text-sm">{featured.companyName}</div>
                    </div>
                  </div>
                  <JobChips city={featured.city} state={featured.state} workModel={featured.workModel} jobType={featured.jobType} />
                  <div className="row row--between" style={{ marginTop: 16 }}>
                    <strong>{formatSalary(featured.salary, featured.jobType)}</strong>
                    <Link to={jobLink(featured.id)} className="btn btn--primary btn--sm">
                      Ver vaga <LuArrowRight />
                    </Link>
                  </div>
                </div>
                <div className="hero__card hero__card--trail">
                  <div className="hero__card-label">Acompanhe sua candidatura</div>
                  <ApplicationTrail status="UnderReview" />
                </div>
              </>
            ) : (
              <div className="hero__card hero__card--trail" style={{ marginLeft: 0 }}>
                <div className="hero__card-label">Como sua candidatura avança</div>
                <ApplicationTrail status="Accepted" />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="section" id="como-funciona">
        <div className="container">
          <div className="section__head section__head--center">
            <div className="section__eyebrow">Como funciona</div>
            <h2 className="section__title">Do perfil à aprovação em quatro passos</h2>
            <p className="section__lead">Sem currículo complicado: seu perfil no TeenWork já mostra quem você é.</p>
          </div>
          <div className="path">
            {[
              { icon: <LuUserRound />, title: 'Crie seu perfil', text: 'Conte sua escola, seu curso, suas habilidades e projetos.' },
              { icon: <LuSearch />, title: 'Encontre vagas', text: 'Filtre por cidade, modalidade, tipo de vaga, área e salário.' },
              { icon: <LuSend />, title: 'Candidate-se', text: 'Envie sua candidatura com uma mensagem para a empresa.' },
              { icon: <LuBell />, title: 'Acompanhe', text: 'Receba notificações a cada mudança no processo seletivo.' },
            ].map((step) => (
              <div className="path__step" key={step.title}>
                <span className="path__num">{step.icon}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--tint">
        <div className="container audiences">
          <div className="audience audience--student" id="estudantes">
            <span className="badge badge--info audience__tag">Para estudantes</span>
            <h3>Comece sua carreira com quem acredita em você</h3>
            <ul>
              {[
                'Vagas de Jovem Aprendiz, estágio, primeiro emprego e cursos gratuitos',
                'Recomendações com base na sua cidade, curso e habilidades',
                'Salve vagas para ver depois e acompanhe todas as candidaturas',
                'Veja a mensagem da empresa quando ela responder',
              ].map((t) => (
                <li key={t}>
                  <LuCheck aria-hidden="true" /> {t}
                </li>
              ))}
            </ul>
            <Link to="/cadastro" className="btn btn--primary">
              Criar meu perfil grátis <LuArrowRight />
            </Link>
          </div>
          <div className="audience audience--company" id="empresas">
            <span className="badge badge--sky audience__tag">Para empresas</span>
            <h3>Encontre jovens talentos prontos para aprender</h3>
            <ul>
              {[
                'Publique vagas em minutos e pause ou encerre quando quiser',
                'Receba candidaturas com perfil completo, habilidades e experiências',
                'Organize candidatos por status: pendente, em análise, aprovado ou recusado',
                'Painel com números das suas vagas e candidaturas',
              ].map((t) => (
                <li key={t}>
                  <LuCheck aria-hidden="true" /> {t}
                </li>
              ))}
            </ul>
            <Link to="/cadastro?tipo=empresa" className="btn btn--white">
              Cadastrar minha empresa <LuArrowRight />
            </Link>
          </div>
        </div>
      </section>

      <section className="section" id="vagas">
        <div className="container">
          <div className="row row--between row--wrap" style={{ marginBottom: 32, alignItems: 'flex-end' }}>
            <div className="section__head" style={{ marginBottom: 0 }}>
              <div className="section__eyebrow">Oportunidades</div>
              <h2 className="section__title">Vagas abertas agora</h2>
            </div>
            <Link to={user?.role === 'STUDENT' ? '/aluno/vagas' : '/entrar?redirect=/aluno/vagas'} className="btn btn--secondary">
              Ver todas as vagas <LuArrowRight />
            </Link>
          </div>
          {jobs.loading ? (
            <JobGridSkeleton count={3} />
          ) : jobs.error ? (
            <div className="card">
              <EmptyState
                icon={<LuFileText />}
                title="Não conseguimos carregar as vagas"
                text="O servidor pode estar iniciando. Atualize a página em alguns segundos."
              />
            </div>
          ) : jobs.data && jobs.data.items.length > 0 ? (
            <div className="job-grid">
              {jobs.data.items.map((job) => (
                <JobCard key={job.id} job={job} to={jobLink(job.id)} showSave={false} />
              ))}
            </div>
          ) : (
            <div className="card">
              <EmptyState
                icon={<LuFileText />}
                title="Nenhuma vaga aberta no momento"
                text="Novas oportunidades aparecem toda semana. Crie seu perfil para ser um dos primeiros a se candidatar."
                actions={
                  <Link to="/cadastro" className="btn btn--primary">
                    Criar perfil
                  </Link>
                }
              />
            </div>
          )}
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="cta-band">
            <h2>Pronto para dar o primeiro passo?</h2>
            <p>Leva menos de dois minutos para criar sua conta e começar a se candidatar.</p>
            <div className="row row--wrap">
              <Link to="/cadastro" className="btn btn--white btn--lg">
                Criar conta de estudante
              </Link>
              <Link to="/cadastro?tipo=empresa" className="btn btn--glass btn--lg">
                Sou empresa
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

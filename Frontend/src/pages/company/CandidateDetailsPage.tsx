import { useState } from 'react';
import { LuCircleCheck, LuCircleX, LuMail, LuMapPin, LuMessageSquareText, LuRotateCcw, LuSearch } from 'react-icons/lu';
import { Link, useParams } from 'react-router-dom';
import { ApplicationStatusModal } from '../../components/applications/ApplicationModals';
import { ApplicationTrail } from '../../components/applications/ApplicationTrail';
import { Avatar } from '../../components/ui/Avatar';
import { ApplicationStatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ErrorState, PageLoader } from '../../components/ui/Feedback';
import { Card } from '../../components/ui/Page';
import { applicationsApi } from '../../lib/endpoints';
import { formatDate, location } from '../../lib/format';
import { useApi, useDocumentTitle } from '../../lib/hooks';
import type { ApplicationStatus } from '../../lib/types';
import { StudentProfileView } from '../student/StudentProfilePage';

export function CandidateDetailsPage() {
  const { id } = useParams();
  const applicationId = Number(id);
  const app = useApi((signal) => applicationsApi.get(applicationId, signal), [applicationId]);
  const [target, setTarget] = useState<ApplicationStatus | null>(null);
  useDocumentTitle(app.data?.student.name ?? 'Candidato');

  if (app.loading && !app.data) return <PageLoader label="Carregando candidatura…" />;
  if (app.error || !app.data) return <ErrorState error={app.error} onRetry={app.reload} />;
  const a = app.data;
  const s = a.student;
  const locked = a.status === 'Cancelled';

  return (
    <>
      <Link to="/empresa/candidatos" className="back-link">
        ← Todos os candidatos
      </Link>

      <section className="card profile-hero" style={{ marginBottom: 24 }}>
        <div className="profile-hero__cover" />
        <div className="profile-hero__body">
          <Avatar name={s.name} src={s.profileImage} size="xxl" ring />
          <div className="profile-hero__info">
            <h1 className="profile-hero__name">{s.name}</h1>
            <p className="profile-hero__headline">{[s.course, s.school].filter(Boolean).join(' · ') || 'Estudante'}</p>
            <div className="meta-list" style={{ marginTop: 6 }}>
              {location(s.city, s.state) && (
                <span>
                  <LuMapPin /> {location(s.city, s.state)}
                </span>
              )}
              <span>
                <LuMail /> {s.email}
              </span>
            </div>
          </div>
          <a href={`mailto:${s.email}?subject=${encodeURIComponent(`Sua candidatura: ${a.job.title}`)}`} className="btn btn--secondary">
            <LuMail /> Enviar e-mail
          </a>
        </div>
      </section>

      <section className="card card--pad" style={{ marginBottom: 24 }}>
        <div className="row row--between row--wrap" style={{ marginBottom: 20 }}>
          <div>
            <div className="text-sm text-muted">Candidatura para</div>
            <Link to={`/empresa/vagas/${a.job.id}`} style={{ fontWeight: 700, fontSize: 18 }}>
              {a.job.title}
            </Link>
            <div className="text-sm text-muted">Enviada em {formatDate(a.createdAt)}</div>
          </div>
          <ApplicationStatusBadge status={a.status} />
        </div>
        <ApplicationTrail status={a.status} />

        {a.coverLetter && (
          <div className="application-card__feedback" style={{ marginTop: 20 }}>
            <LuMessageSquareText aria-hidden="true" />
            <div>
              <strong>Mensagem do(a) estudante:</strong>
              <p className="pre-line" style={{ marginTop: 4 }}>
                {a.coverLetter}
              </p>
            </div>
          </div>
        )}
        {a.companyFeedback && (
          <p className="text-sm text-muted" style={{ marginTop: 12 }}>
            <strong>Seu último retorno:</strong> {a.companyFeedback}
          </p>
        )}

        <div className="row row--wrap" style={{ marginTop: 20 }}>
          {locked ? (
            <span className="text-sm text-muted">O(a) estudante cancelou esta candidatura.</span>
          ) : (
            <>
              {a.status === 'Pending' && (
                <Button variant="soft" icon={<LuSearch />} onClick={() => setTarget('UnderReview')}>
                  Colocar em análise
                </Button>
              )}
              {a.status !== 'Accepted' && (
                <Button variant="success" icon={<LuCircleCheck />} onClick={() => setTarget('Accepted')}>
                  Aprovar
                </Button>
              )}
              {a.status !== 'Rejected' && (
                <Button variant="danger-ghost" icon={<LuCircleX />} onClick={() => setTarget('Rejected')}>
                  Recusar
                </Button>
              )}
              {(a.status === 'Accepted' || a.status === 'Rejected') && (
                <Button variant="ghost" icon={<LuRotateCcw />} onClick={() => setTarget('UnderReview')}>
                  Voltar para análise
                </Button>
              )}
            </>
          )}
        </div>
      </section>

      <StudentProfileView profile={s} />

      <div style={{ marginTop: 24 }} />
      <Card title="Observação">
        <p className="text-sm text-muted">
          Os dados deste perfil são compartilhados com sua empresa apenas porque o(a) estudante se candidatou à vaga. Use-os somente
          para o processo seletivo.
        </p>
      </Card>

      <ApplicationStatusModal
        open={target !== null}
        applicationId={a.id}
        studentName={s.name}
        target={target}
        onClose={() => setTarget(null)}
        onChanged={() => {
          setTarget(null);
          app.reload();
        }}
      />
    </>
  );
}

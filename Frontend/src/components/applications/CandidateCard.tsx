import { useState } from 'react';
import { LuCircleCheck, LuCircleX, LuEye, LuMapPin, LuSearch } from 'react-icons/lu';
import { Link } from 'react-router-dom';
import { formatRelative, location } from '../../lib/format';
import type { ApplicationStatus, ReceivedApplication } from '../../lib/types';
import { Avatar } from '../ui/Avatar';
import { ApplicationStatusBadge } from '../ui/Badge';
import { Button, ButtonLink } from '../ui/Button';
import { ApplicationStatusModal } from './ApplicationModals';

interface CandidateCardProps {
  application: ReceivedApplication;
  showJob?: boolean;
  onStatusChanged: (id: number, status: ApplicationStatus) => void;
}

export function CandidateCard({ application: a, showJob = true, onStatusChanged }: CandidateCardProps) {
  const [target, setTarget] = useState<ApplicationStatus | null>(null);
  const locked = a.status === 'Cancelled';
  const detailPath = `/empresa/candidatos/${a.id}`;

  return (
    <article className="card candidate-card">
      <Avatar name={a.studentName} src={a.studentPhoto} size="lg" />
      <div style={{ minWidth: 0 }}>
        <div className="row row--wrap" style={{ gap: 8 }}>
          <Link to={detailPath} className="candidate-card__name">
            {a.studentName}
          </Link>
          <ApplicationStatusBadge status={a.status} />
        </div>
        <div className="meta-list" style={{ marginTop: 4 }}>
          {[a.course, a.school].filter(Boolean).length > 0 && <span>{[a.course, a.school].filter(Boolean).join(' · ')}</span>}
          {location(a.city, a.state) && (
            <span>
              <LuMapPin /> {location(a.city, a.state)}
            </span>
          )}
          <span>{formatRelative(a.createdAt)}</span>
        </div>
        {showJob && (
          <div className="text-sm" style={{ marginTop: 4 }}>
            Vaga: <Link to={`/empresa/vagas/${a.jobId}`}>{a.jobTitle}</Link>
          </div>
        )}
        {a.skills.length > 0 && (
          <div className="chip-list" style={{ marginTop: 8 }}>
            {a.skills.slice(0, 5).map((s) => (
              <span key={s} className="chip">
                {s}
              </span>
            ))}
            {a.skills.length > 5 && <span className="chip">+{a.skills.length - 5}</span>}
          </div>
        )}
      </div>
      <div className="candidate-card__actions">
        <ButtonLink to={detailPath} variant="ghost" size="sm" icon={<LuEye />}>
          Perfil
        </ButtonLink>
        {!locked && a.status === 'Pending' && (
          <Button variant="soft" size="sm" icon={<LuSearch />} onClick={() => setTarget('UnderReview')}>
            Analisar
          </Button>
        )}
        {!locked && a.status !== 'Accepted' && (
          <Button variant="success" size="sm" icon={<LuCircleCheck />} onClick={() => setTarget('Accepted')}>
            Aprovar
          </Button>
        )}
        {!locked && a.status !== 'Rejected' && (
          <Button variant="danger-ghost" size="sm" icon={<LuCircleX />} onClick={() => setTarget('Rejected')}>
            Recusar
          </Button>
        )}
      </div>
      <ApplicationStatusModal
        open={target !== null}
        applicationId={a.id}
        studentName={a.studentName}
        target={target}
        onClose={() => setTarget(null)}
        onChanged={(status) => {
          setTarget(null);
          onStatusChanged(a.id, status);
        }}
      />
    </article>
  );
}

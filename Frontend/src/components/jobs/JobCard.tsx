import { LuCircleCheck } from 'react-icons/lu';
import { Link } from 'react-router-dom';
import { formatRelative, formatSalary } from '../../lib/format';
import type { JobSummary } from '../../lib/types';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Feedback';
import { JobChips, SaveButton } from './JobBits';

interface JobCardProps {
  job: JobSummary;
  to: string;
  onSavedChange?: (saved: boolean) => void;
  showSave?: boolean;
}

export function JobCard({ job, to, onSavedChange, showSave = true }: JobCardProps) {
  return (
    <article className="card card--interactive job-card">
      <div className="job-card__head">
        <Avatar name={job.companyName} src={job.companyLogo} square size="lg" />
        <div style={{ minWidth: 0 }}>
          <h3 className="job-card__title">
            <Link to={to}>{job.title}</Link>
          </h3>
          <p className="job-card__company">{job.companyName}</p>
        </div>
      </div>
      {showSave && (
        <div className="job-card__save">
          <SaveButton jobId={job.id} saved={job.isSaved} onChange={onSavedChange} />
        </div>
      )}
      <JobChips city={job.city} state={job.state} workModel={job.workModel} jobType={job.jobType} deadline={job.deadline} />
      <div className="job-card__foot">
        <span className="job-card__salary">{formatSalary(job.salary, job.jobType)}</span>
        {job.hasApplied ? (
          <Badge tone="success">
            <LuCircleCheck aria-hidden="true" /> Candidatura enviada
          </Badge>
        ) : (
          <span className="job-card__date">{formatRelative(job.createdAt)}</span>
        )}
      </div>
    </article>
  );
}

export function JobCardSkeleton() {
  return (
    <div className="card job-card" aria-hidden="true">
      <div className="job-card__head">
        <Skeleton width={56} height={56} style={{ borderRadius: 14 }} />
        <div className="stack stack--sm" style={{ flex: 1 }}>
          <Skeleton className="skeleton--title" width="80%" />
          <Skeleton width="45%" />
        </div>
      </div>
      <div className="row">
        <Skeleton width={90} height={28} />
        <Skeleton width={80} height={28} />
        <Skeleton width={110} height={28} />
      </div>
      <div className="job-card__foot">
        <Skeleton width={110} />
        <Skeleton width={60} />
      </div>
    </div>
  );
}

export function JobGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="job-grid" role="status" aria-label="Carregando vagas">
      {Array.from({ length: count }, (_, i) => (
        <JobCardSkeleton key={i} />
      ))}
    </div>
  );
}

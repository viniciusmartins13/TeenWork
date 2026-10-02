import type { ReactNode } from 'react';
import { applicationStatusLabels, jobStatusLabels } from '../../lib/format';
import type { ApplicationStatus, JobStatus } from '../../lib/types';

type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'sky' | 'solid';

export function Badge({ tone = 'neutral', dot, children }: { tone?: Tone; dot?: boolean; children: ReactNode }) {
  return (
    <span className={`badge${tone !== 'neutral' ? ` badge--${tone}` : ''}`}>
      {dot && <span className="badge__dot" aria-hidden="true" />}
      {children}
    </span>
  );
}

const applicationTones: Record<ApplicationStatus, Tone> = {
  Pending: 'warning',
  UnderReview: 'info',
  Accepted: 'success',
  Rejected: 'danger',
  Cancelled: 'neutral',
};

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <Badge tone={applicationTones[status]} dot>
      {applicationStatusLabels[status]}
    </Badge>
  );
}

const jobTones: Record<JobStatus, Tone> = {
  Active: 'success',
  Inactive: 'warning',
  Closed: 'neutral',
};

export function JobStatusBadge({ status, expired }: { status: JobStatus; expired?: boolean }) {
  if (status === 'Active' && expired) {
    return (
      <Badge tone="neutral" dot>
        Prazo encerrado
      </Badge>
    );
  }
  return (
    <Badge tone={jobTones[status]} dot>
      {jobStatusLabels[status]}
    </Badge>
  );
}

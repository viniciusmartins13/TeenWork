import { useState } from 'react';
import { LuBookmark } from 'react-icons/lu';
import { JobCard, JobGridSkeleton } from '../../components/jobs/JobCard';
import { ButtonLink } from '../../components/ui/Button';
import { EmptyState, ErrorState } from '../../components/ui/Feedback';
import { PageHeader } from '../../components/ui/Page';
import { Pagination } from '../../components/ui/Pagination';
import { studentsApi } from '../../lib/endpoints';
import { useApi, useDocumentTitle } from '../../lib/hooks';

export function SavedJobsPage() {
  useDocumentTitle('Vagas salvas');
  const [page, setPage] = useState(1);
  const saved = useApi((signal) => studentsApi.savedJobs({ page, pageSize: 12 }, signal), [page]);

  return (
    <>
      <PageHeader eyebrow="Favoritas" title="Vagas salvas" subtitle="As oportunidades que você guardou para ver com calma." />
      {saved.loading && !saved.data ? (
        <JobGridSkeleton />
      ) : saved.error ? (
        <div className="card">
          <ErrorState error={saved.error} onRetry={saved.reload} />
        </div>
      ) : saved.data && saved.data.items.length > 0 ? (
        <>
          <div className="job-grid">
            {saved.data.items.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                to={`/aluno/vagas/${job.id}`}
                onSavedChange={(isSaved) => {
                  if (!isSaved) {
                    saved.setData((d) =>
                      d ? { ...d, items: d.items.filter((j) => j.id !== job.id), totalItems: d.totalItems - 1 } : d,
                    );
                  }
                }}
              />
            ))}
          </div>
          <Pagination
            page={saved.data.page}
            totalPages={saved.data.totalPages}
            totalItems={saved.data.totalItems}
            pageSize={saved.data.pageSize}
            noun={['vaga', 'vagas']}
            onChange={setPage}
          />
        </>
      ) : (
        <div className="card">
          <EmptyState
            icon={<LuBookmark />}
            title="Nenhuma vaga salva"
            text="Toque no ícone de marcador em qualquer vaga para guardá-la aqui."
            actions={<ButtonLink to="/aluno/vagas" variant="primary">Explorar vagas</ButtonLink>}
          />
        </div>
      )}
    </>
  );
}

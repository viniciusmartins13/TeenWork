import { useState } from 'react';
import { LuBookmark, LuBookmarkCheck, LuBriefcase, LuCalendarClock, LuMapPin, LuMonitor } from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { jobsApi } from '../../lib/endpoints';
import { deadlineLabel, daysUntil, jobTypeLabels, workModelLabels } from '../../lib/format';
import type { JobType, WorkModel } from '../../lib/types';

export function JobChips({ city, state, workModel, jobType, deadline }: {
  city: string;
  state: string;
  workModel: WorkModel;
  jobType: JobType;
  deadline?: string | null;
}) {
  const deadlineText = deadlineLabel(deadline);
  const urgent = deadline ? daysUntil(deadline) <= 7 && daysUntil(deadline) >= 0 : false;
  return (
    <div className="chip-list">
      <span className="chip chip--brand">
        <LuBriefcase aria-hidden="true" /> {jobTypeLabels[jobType]}
      </span>
      <span className="chip">
        <LuMonitor aria-hidden="true" /> {workModelLabels[workModel]}
      </span>
      <span className="chip">
        <LuMapPin aria-hidden="true" /> {city}, {state}
      </span>
      {deadlineText && urgent && (
        <span className="chip" style={{ background: 'var(--warning-50)', color: 'var(--warning-700)' }}>
          <LuCalendarClock aria-hidden="true" /> {deadlineText}
        </span>
      )}
    </div>
  );
}

interface SaveButtonProps {
  jobId: number;
  saved: boolean;
  onChange?: (saved: boolean) => void;
  withLabel?: boolean;
}

/** Botão de salvar vaga (somente estudantes). Atualização otimista. */
export function SaveButton({ jobId, saved, onChange, withLabel }: SaveButtonProps) {
  const { user } = useAuth();
  const toast = useToast();
  const [isSaved, setIsSaved] = useState(saved);
  const [busy, setBusy] = useState(false);

  if (user?.role !== 'STUDENT') return null;

  const toggle = async () => {
    const next = !isSaved;
    setIsSaved(next);
    setBusy(true);
    try {
      if (next) await jobsApi.save(jobId);
      else await jobsApi.unsave(jobId);
      onChange?.(next);
      toast.success(next ? 'Vaga salva' : 'Vaga removida das salvas');
    } catch (err) {
      setIsSaved(!next);
      toast.error('Não foi possível atualizar', (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const label = isSaved ? 'Remover das vagas salvas' : 'Salvar vaga';

  if (withLabel) {
    return (
      <button type="button" className={`btn ${isSaved ? 'btn--soft' : 'btn--secondary'}`} onClick={toggle} disabled={busy} aria-pressed={isSaved}>
        {isSaved ? <LuBookmarkCheck /> : <LuBookmark />}
        {isSaved ? 'Salva' : 'Salvar'}
      </button>
    );
  }

  return (
    <button type="button" className="save-button" onClick={toggle} disabled={busy} aria-pressed={isSaved} aria-label={label} title={label}>
      {isSaved ? <LuBookmarkCheck /> : <LuBookmark />}
    </button>
  );
}

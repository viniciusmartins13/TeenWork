import { LuCheck, LuX } from 'react-icons/lu';
import type { ApplicationStatus } from '../../lib/types';

type StepState = 'done' | 'current' | 'upcoming' | 'success' | 'danger' | 'muted';

/** Trilha visual da candidatura: Enviada → Em análise → Resultado. */
export function ApplicationTrail({ status }: { status: ApplicationStatus }) {
  const steps: { label: string; state: StepState }[] = (() => {
    switch (status) {
      case 'Pending':
        return [
          { label: 'Enviada', state: 'done' },
          { label: 'Em análise', state: 'current' },
          { label: 'Resultado', state: 'upcoming' },
        ];
      case 'UnderReview':
        return [
          { label: 'Enviada', state: 'done' },
          { label: 'Em análise', state: 'done' },
          { label: 'Resultado', state: 'current' },
        ];
      case 'Accepted':
        return [
          { label: 'Enviada', state: 'done' },
          { label: 'Em análise', state: 'done' },
          { label: 'Aprovada!', state: 'success' },
        ];
      case 'Rejected':
        return [
          { label: 'Enviada', state: 'done' },
          { label: 'Em análise', state: 'done' },
          { label: 'Não selecionada', state: 'danger' },
        ];
      default:
        return [
          { label: 'Enviada', state: 'done' },
          { label: 'Cancelada', state: 'muted' },
        ];
    }
  })();

  return (
    <ol className="trail" aria-label="Andamento da candidatura" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {steps.map((step) => (
        <li
          key={step.label}
          className={`trail__step trail__step--${step.state === 'success' || step.state === 'danger' || step.state === 'muted' ? `${step.state} trail__step--done` : step.state}`}
          aria-current={step.state === 'current' ? 'step' : undefined}
        >
          <span className="trail__dot" aria-hidden="true">
            {(step.state === 'done' || step.state === 'success') && <LuCheck />}
            {(step.state === 'danger' || step.state === 'muted') && <LuX />}
          </span>
          <span className="trail__label">{step.label}</span>
        </li>
      ))}
    </ol>
  );
}

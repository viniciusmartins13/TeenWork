import { useEffect, useState } from 'react';
import { LuCircleCheck, LuCircleX, LuSearch, LuSend } from 'react-icons/lu';
import { useToast } from '../../context/ToastContext';
import { ApiError } from '../../lib/api';
import { applicationsApi, jobsApi } from '../../lib/endpoints';
import type { ApplicationStatus, MyApplication } from '../../lib/types';
import { Button } from '../ui/Button';
import { FormAlert, TextAreaField } from '../ui/Field';
import { Modal } from '../ui/Modal';

interface ApplyModalProps {
  open: boolean;
  jobId: number;
  jobTitle: string;
  companyName: string;
  onClose: () => void;
  onApplied: (application: MyApplication) => void;
}

export function ApplyModal({ open, jobId, jobTitle, companyName, onClose, onApplied }: ApplyModalProps) {
  const toast = useToast();
  const [coverLetter, setCoverLetter] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
    }
  }, [open]);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const application = await jobsApi.apply(jobId, coverLetter);
      toast.success('Candidatura enviada!', `A ${companyName} já pode ver seu perfil.`);
      setCoverLetter('');
      onApplied(application);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível enviar a candidatura.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      locked={busy}
      icon={<LuSend />}
      title="Enviar candidatura"
      description={
        <>
          Você está se candidatando a <strong>{jobTitle}</strong> em {companyName}. A empresa verá seu perfil completo.
        </>
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button variant="primary" icon={<LuSend />} onClick={submit} loading={busy}>
            Enviar candidatura
          </Button>
        </>
      }
    >
      <div className="stack">
        {error && <FormAlert>{error}</FormAlert>}
        <TextAreaField
          label="Mensagem para a empresa"
          optional
          maxLength={2000}
          rows={6}
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          placeholder="Conte por que você se interessou pela vaga, o que já sabe fazer e o que quer aprender."
          hint="Dica: uma mensagem curta e sincera ajuda a se destacar."
        />
      </div>
    </Modal>
  );
}

interface StatusModalProps {
  open: boolean;
  applicationId: number;
  studentName: string;
  target: ApplicationStatus | null;
  onClose: () => void;
  onChanged: (status: ApplicationStatus) => void;
}

const statusCopy: Partial<Record<ApplicationStatus, { title: string; action: string; placeholder: string }>> = {
  UnderReview: {
    title: 'Colocar em análise',
    action: 'Colocar em análise',
    placeholder: 'Ex.: Recebemos seu perfil e vamos avaliar nos próximos dias.',
  },
  Accepted: {
    title: 'Aprovar candidatura',
    action: 'Aprovar',
    placeholder: 'Ex.: Parabéns! Entraremos em contato por e-mail para agendar a entrevista.',
  },
  Rejected: {
    title: 'Recusar candidatura',
    action: 'Recusar',
    placeholder: 'Ex.: Agradecemos o interesse! Seu perfil ficará salvo para próximas oportunidades.',
  },
  Pending: {
    title: 'Voltar para pendente',
    action: 'Marcar como pendente',
    placeholder: '',
  },
};

export function ApplicationStatusModal({ open, applicationId, studentName, target, onClose, onChanged }: StatusModalProps) {
  const toast = useToast();
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFeedback('');
      setError(null);
    }
  }, [open, target]);

  if (!target) return null;
  const copy = statusCopy[target] ?? statusCopy.Pending!;

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await applicationsApi.setStatus(applicationId, target, feedback);
      toast.success('Status atualizado', `${studentName} foi notificado(a).`);
      onChanged(target);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const icon = target === 'Accepted' ? <LuCircleCheck /> : target === 'Rejected' ? <LuCircleX /> : <LuSearch />;

  return (
    <Modal
      open={open}
      onClose={onClose}
      locked={busy}
      icon={icon}
      iconTone={target === 'Rejected' ? 'danger' : 'brand'}
      title={copy.title}
      description={`O(a) estudante ${studentName} receberá uma notificação com a atualização.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button
            variant={target === 'Rejected' ? 'danger' : target === 'Accepted' ? 'success' : 'primary'}
            onClick={submit}
            loading={busy}
          >
            {copy.action}
          </Button>
        </>
      }
    >
      <div className="stack">
        {error && <FormAlert>{error}</FormAlert>}
        {target !== 'Pending' && (
          <TextAreaField
            label="Mensagem para o(a) estudante"
            optional
            maxLength={1000}
            rows={4}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder={copy.placeholder}
          />
        )}
      </div>
    </Modal>
  );
}

import { useEffect, useState, type FormEvent } from 'react';
import { LuFileText, LuMapPin, LuSave, LuSend, LuWallet } from 'react-icons/lu';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { ErrorState, PageLoader } from '../../components/ui/Feedback';
import { FormAlert, SelectField, TextAreaField, TextField } from '../../components/ui/Field';
import { Card, PageHeader } from '../../components/ui/Page';
import { useToast } from '../../context/ToastContext';
import { ApiError } from '../../lib/api';
import { companiesApi, jobsApi } from '../../lib/endpoints';
import { brazilianStates, commonAreas, jobTypeLabels, workModelLabels } from '../../lib/format';
import { useDocumentTitle } from '../../lib/hooks';
import type { JobPayload, JobType, WorkModel } from '../../lib/types';

interface FormState {
  title: string;
  description: string;
  requirements: string;
  benefits: string;
  area: string;
  city: string;
  state: string;
  workModel: WorkModel;
  jobType: JobType;
  salary: string;
  workload: string;
  vacancies: string;
  deadline: string;
}

const emptyForm: FormState = {
  title: '',
  description: '',
  requirements: '',
  benefits: '',
  area: '',
  city: '',
  state: '',
  workModel: 'OnSite',
  jobType: 'YoungApprentice',
  salary: '',
  workload: '',
  vacancies: '1',
  deadline: '',
};

export function JobFormPage() {
  const { id } = useParams();
  const editingId = id ? Number(id) : null;
  useDocumentTitle(editingId ? 'Editar vaga' : 'Publicar vaga');
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(!!editingId);
  const [loadError, setLoadError] = useState<ApiError | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    if (editingId) {
      setLoading(true);
      jobsApi
        .get(editingId, controller.signal)
        .then((j) => {
          if (!j.isOwner) {
            setLoadError(new ApiError(403, 'Esta vaga pertence a outra empresa.'));
            return;
          }
          setForm({
            title: j.title,
            description: j.description,
            requirements: j.requirements ?? '',
            benefits: j.benefits ?? '',
            area: j.area,
            city: j.city,
            state: j.state,
            workModel: j.workModel,
            jobType: j.jobType,
            salary: j.salary != null ? String(j.salary) : '',
            workload: j.workload ?? '',
            vacancies: String(j.vacancies),
            deadline: j.deadline ?? '',
          });
        })
        .catch((err) => {
          if ((err as Error).name !== 'AbortError') setLoadError(err as ApiError);
        })
        .finally(() => setLoading(false));
    } else {
      // Nova vaga: pré-preenche a localização com a da empresa.
      companiesApi
        .me(controller.signal)
        .then((c) => setForm((f) => ({ ...f, city: f.city || c.city || '', state: f.state || c.state || '' })))
        .catch(() => undefined);
    }
    return () => controller.abort();
  }, [editingId]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key])
      setErrors((current) => {
        const copy = { ...current };
        delete copy[key];
        return copy;
      });
  };

  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.title.trim().length < 5) e.title = 'O título deve ter pelo menos 5 caracteres.';
    if (form.description.trim().length < 30) e.description = 'Descreva a vaga com pelo menos 30 caracteres.';
    if (!form.area.trim()) e.area = 'Informe a área.';
    if (!form.city.trim()) e.city = 'Informe a cidade.';
    if (!form.state) e.state = 'Selecione o estado.';
    const salary = form.salary ? Number(form.salary.replace(',', '.')) : null;
    if (salary !== null && (Number.isNaN(salary) || salary < 0 || salary > 100000)) e.salary = 'Informe um valor entre 0 e 100.000.';
    const vacancies = Number(form.vacancies);
    if (!Number.isInteger(vacancies) || vacancies < 1 || vacancies > 100) e.vacancies = 'Entre 1 e 100 vagas.';
    if (form.deadline && form.deadline < todayIso) e.deadline = 'O prazo não pode estar no passado.';
    return e;
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    setFormError(null);
    if (Object.keys(e).length) {
      setFormError('Revise os campos destacados.');
      return;
    }

    const payload: JobPayload = {
      title: form.title.trim(),
      description: form.description.trim(),
      requirements: form.requirements.trim() || null,
      benefits: form.benefits.trim() || null,
      area: form.area.trim(),
      city: form.city.trim(),
      state: form.state,
      workModel: form.workModel,
      jobType: form.jobType,
      salary: form.salary ? Number(form.salary.replace(',', '.')) : null,
      workload: form.workload.trim() || null,
      vacancies: Number(form.vacancies),
      deadline: form.deadline || null,
    };

    setBusy(true);
    try {
      const saved = editingId ? await jobsApi.update(editingId, payload) : await jobsApi.create(payload);
      toast.success(editingId ? 'Vaga atualizada' : 'Vaga publicada!', editingId ? undefined : 'Ela já aparece na busca dos estudantes.');
      navigate(`/empresa/vagas/${saved.id}`, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fieldErrors());
        setFormError(err.message);
      } else setFormError('Não foi possível salvar a vaga.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <PageLoader label="Carregando vaga…" />;
  if (loadError) return <ErrorState error={loadError} />;

  return (
    <>
      <PageHeader
        back={{ to: editingId ? `/empresa/vagas/${editingId}` : '/empresa/vagas', label: 'Voltar' }}
        eyebrow={editingId ? 'Edição' : 'Nova oportunidade'}
        title={editingId ? 'Editar vaga' : 'Publicar vaga'}
        subtitle="Vagas claras e completas recebem candidaturas mais qualificadas."
      />

      <form className="stack stack--lg" onSubmit={submit} noValidate style={{ maxWidth: 860 }}>
        {formError && <FormAlert>{formError}</FormAlert>}

        <Card title="Informações principais" icon={<LuFileText />}>
          <div className="form-grid">
            <TextField
              label="Título da vaga"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              error={errors.title}
              maxLength={150}
              placeholder="Ex.: Jovem Aprendiz Administrativo"
              fieldClassName="span-all"
            />
            <SelectField
              label="Tipo de vaga"
              value={form.jobType}
              onChange={(e) => set('jobType', e.target.value as JobType)}
              error={errors.jobType}
              options={(Object.keys(jobTypeLabels) as JobType[]).map((t) => ({ value: t, label: jobTypeLabels[t] }))}
            />
            <SelectField
              label="Modalidade"
              value={form.workModel}
              onChange={(e) => set('workModel', e.target.value as WorkModel)}
              error={errors.workModel}
              options={(Object.keys(workModelLabels) as WorkModel[]).map((w) => ({ value: w, label: workModelLabels[w] }))}
            />
            <TextField
              label="Área"
              list="areas-list"
              value={form.area}
              onChange={(e) => set('area', e.target.value)}
              error={errors.area}
              maxLength={80}
              placeholder="Ex.: Administração"
              fieldClassName="span-all"
            />
            <datalist id="areas-list">
              {commonAreas.map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>
          </div>
        </Card>

        <Card title="Local" icon={<LuMapPin />}>
          <div className="form-grid" style={{ gridTemplateColumns: 'minmax(0,1fr) 140px' }}>
            <TextField label="Cidade" value={form.city} onChange={(e) => set('city', e.target.value)} error={errors.city} maxLength={100} />
            <SelectField
              label="UF"
              value={form.state}
              onChange={(e) => set('state', e.target.value)}
              error={errors.state}
              placeholder="—"
              options={brazilianStates.map((s) => ({ value: s, label: s }))}
            />
          </div>
        </Card>

        <Card title="Remuneração, carga e prazo" icon={<LuWallet />}>
          <div className="form-grid">
            <TextField
              label="Salário / bolsa mensal (R$)"
              optional
              inputMode="decimal"
              value={form.salary}
              onChange={(e) => set('salary', e.target.value.replace(/[^\d.,]/g, ''))}
              error={errors.salary}
              placeholder="Ex.: 1200"
              hint="Deixe em branco para “A combinar”. Para cursos gratuitos, deixe vazio."
            />
            <TextField
              label="Carga horária"
              optional
              value={form.workload}
              onChange={(e) => set('workload', e.target.value)}
              error={errors.workload}
              maxLength={60}
              placeholder="Ex.: 20h semanais"
            />
            <TextField
              label="Número de vagas"
              type="number"
              min={1}
              max={100}
              value={form.vacancies}
              onChange={(e) => set('vacancies', e.target.value)}
              error={errors.vacancies}
            />
            <TextField
              label="Inscrições até"
              optional
              type="date"
              min={todayIso}
              value={form.deadline}
              onChange={(e) => set('deadline', e.target.value)}
              error={errors.deadline}
            />
          </div>
        </Card>

        <Card title="Descrição" icon={<LuFileText />}>
          <div className="stack">
            <TextAreaField
              label="Sobre a vaga"
              rows={7}
              maxLength={4000}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              error={errors.description}
              placeholder="Conte o dia a dia, o que a pessoa vai aprender e como é a equipe."
            />
            <TextAreaField
              label="Requisitos"
              optional
              rows={5}
              maxLength={3000}
              value={form.requirements}
              onChange={(e) => set('requirements', e.target.value)}
              error={errors.requirements}
              hint="Um requisito por linha — eles aparecem em lista para o estudante."
            />
            <TextAreaField
              label="Benefícios"
              optional
              rows={4}
              maxLength={2000}
              value={form.benefits}
              onChange={(e) => set('benefits', e.target.value)}
              error={errors.benefits}
              hint="Um benefício por linha."
            />
          </div>
        </Card>

        <div className="form-actions">
          <Button variant="ghost" onClick={() => navigate(-1)} disabled={busy}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" size="lg" loading={busy} icon={editingId ? <LuSave /> : <LuSend />}>
            {editingId ? 'Salvar alterações' : 'Publicar vaga'}
          </Button>
        </div>
      </form>
    </>
  );
}

import { useState, type FormEvent, type ReactNode } from 'react';
import {
  LuBookOpen,
  LuBriefcase,
  LuCode,
  LuExternalLink,
  LuGraduationCap,
  LuHeartHandshake,
  LuMail,
  LuMapPin,
  LuPencil,
  LuPlus,
  LuSparkles,
  LuTrash2,
  LuUser,
} from 'react-icons/lu';
import { Button } from '../../components/ui/Button';
import { EmptyState, ErrorState, PageLoader } from '../../components/ui/Feedback';
import { FormAlert, SelectField, TextAreaField, TextField } from '../../components/ui/Field';
import { ImageUpload } from '../../components/ui/ImageUpload';
import { ConfirmDialog, Modal } from '../../components/ui/Modal';
import { Card } from '../../components/ui/Page';
import { TagInput } from '../../components/ui/TagInput';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ApiError } from '../../lib/api';
import { mediaApi, studentsApi } from '../../lib/endpoints';
import { brazilianStates, experienceTypeLabels, formatMonthYear, location } from '../../lib/format';
import { useApi, useDocumentTitle } from '../../lib/hooks';
import type { Experience, ExperienceType, StudentProfile } from '../../lib/types';

const skillSuggestions = [
  'Comunicação', 'Trabalho em equipe', 'Excel', 'Atendimento ao cliente', 'Organização', 'Inglês básico',
  'HTML', 'CSS', 'JavaScript', 'Canva', 'Redes sociais', 'Pacote Office', 'Proatividade',
];

const experienceIcons: Record<ExperienceType, ReactNode> = {
  Job: <LuBriefcase />,
  Internship: <LuBriefcase />,
  Volunteer: <LuHeartHandshake />,
  Project: <LuCode />,
  Course: <LuBookOpen />,
};

/** Exibição do perfil do estudante (também usada pela empresa ao ver um candidato). */
export function StudentProfileView({ profile, editable, onEdit, onAddExperience, onEditExperience, onDeleteExperience }: {
  profile: StudentProfile;
  editable?: boolean;
  onEdit?: () => void;
  onAddExperience?: () => void;
  onEditExperience?: (e: Experience) => void;
  onDeleteExperience?: (e: Experience) => void;
}) {
  return (
    <div className="profile-layout" style={{ marginTop: 0 }}>
      <div className="stack stack--lg">
        <Card title="Sobre" icon={<LuUser />} actions={editable && <Button variant="ghost" size="sm" icon={<LuPencil />} onClick={onEdit}>Editar</Button>}>
          {profile.bio ? (
            <p className="pre-line" style={{ color: 'var(--ink-2)' }}>
              {profile.bio}
            </p>
          ) : (
            <p className="text-muted text-sm">
              {editable ? 'Conte um pouco sobre você, seus interesses e o que busca. É a primeira coisa que as empresas leem.' : 'O(a) estudante ainda não escreveu uma apresentação.'}
            </p>
          )}
        </Card>

        <Card
          title="Experiências e projetos"
          icon={<LuBriefcase />}
          actions={editable && <Button variant="soft" size="sm" icon={<LuPlus />} onClick={onAddExperience}>Adicionar</Button>}
        >
          {profile.experiences.length === 0 ? (
            <EmptyState
              compact
              icon={<LuSparkles />}
              title="Nenhuma experiência cadastrada"
              text={editable ? 'Projetos da escola, trabalhos voluntários e cursos também contam — e muito!' : undefined}
              actions={editable && <Button variant="primary" icon={<LuPlus />} onClick={onAddExperience}>Adicionar experiência</Button>}
            />
          ) : (
            <ul className="timeline">
              {profile.experiences.map((exp) => (
                <li key={exp.id} className="timeline__item">
                  <span className="timeline__icon" aria-hidden="true">
                    {experienceIcons[exp.type]}
                  </span>
                  <div className="timeline__body">
                    <div className="row row--between" style={{ alignItems: 'flex-start' }}>
                      <div>
                        <div className="timeline__title">{exp.title}</div>
                        <div className="timeline__meta">
                          {exp.organization} · {experienceTypeLabels[exp.type]}
                        </div>
                        <div className="timeline__meta">
                          {formatMonthYear(exp.startDate)} — {exp.isCurrent ? 'atual' : formatMonthYear(exp.endDate)}
                        </div>
                      </div>
                      {editable && (
                        <div className="row" style={{ gap: 2 }}>
                          <Button variant="ghost" size="sm" iconOnly icon={<LuPencil />} aria-label="Editar experiência" onClick={() => onEditExperience?.(exp)} />
                          <Button variant="danger-ghost" size="sm" iconOnly icon={<LuTrash2 />} aria-label="Excluir experiência" onClick={() => onDeleteExperience?.(exp)} />
                        </div>
                      )}
                    </div>
                    {exp.description && <p className="timeline__text pre-line">{exp.description}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="stack stack--lg">
        <Card title="Habilidades" icon={<LuSparkles />}>
          {profile.skills.length ? (
            <div className="chip-list">
              {profile.skills.map((s) => (
                <span key={s} className="chip chip--brand">
                  {s}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-muted text-sm">Nenhuma habilidade cadastrada.</p>
          )}
        </Card>
        <Card title="Formação" icon={<LuGraduationCap />}>
          <dl className="summary-list">
            <div>
              <dt>Escola</dt>
              <dd>{profile.school || '—'}</dd>
            </div>
            <div>
              <dt>Curso</dt>
              <dd>{profile.course || '—'}</dd>
            </div>
            <div>
              <dt>Série</dt>
              <dd>{profile.schoolYear || '—'}</dd>
            </div>
            <div>
              <dt>Conclusão</dt>
              <dd>{profile.graduationYear ?? '—'}</dd>
            </div>
          </dl>
        </Card>
        <Card title="Contato" icon={<LuMail />}>
          <div className="stack stack--sm text-sm">
            <a href={`mailto:${profile.email}`} className="row" style={{ gap: 8 }}>
              <LuMail /> {profile.email}
            </a>
            {location(profile.city, profile.state) && (
              <span className="row text-muted" style={{ gap: 8 }}>
                <LuMapPin /> {location(profile.city, profile.state)}
              </span>
            )}
            {profile.portfolioUrl && (
              <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="row" style={{ gap: 8 }}>
                <LuExternalLink /> Portfólio
              </a>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export function StudentProfilePage() {
  useDocumentTitle('Meu perfil');
  const { updateUser } = useAuth();
  const toast = useToast();
  const profile = useApi((signal) => studentsApi.me(signal), []);
  const [editOpen, setEditOpen] = useState(false);
  const [experience, setExperience] = useState<Experience | 'new' | null>(null);
  const [toDelete, setToDelete] = useState<Experience | null>(null);

  if (profile.loading && !profile.data) return <PageLoader label="Carregando seu perfil…" />;
  if (profile.error || !profile.data) return <ErrorState error={profile.error} onRetry={profile.reload} />;
  const p = profile.data;

  const headline = [p.course, p.school].filter(Boolean).join(' · ');

  return (
    <>
      <section className="card profile-hero" style={{ marginBottom: 24 }}>
        <div className="profile-hero__cover" />
        <div className="profile-hero__body">
          <ImageUpload
            name={p.name}
            src={p.profileImage}
            label="Alterar foto de perfil"
            onUpload={async (file) => {
              const { url } = await mediaApi.uploadPhoto(file);
              profile.setData((d) => (d ? { ...d, profileImage: url } : d));
              updateUser({ profileImage: url });
              return url;
            }}
            onRemove={async () => {
              await mediaApi.removePhoto();
              profile.setData((d) => (d ? { ...d, profileImage: null } : d));
              updateUser({ profileImage: null });
            }}
          />
          <div className="profile-hero__info">
            <h1 className="profile-hero__name">{p.name}</h1>
            <p className="profile-hero__headline">{headline || 'Adicione seu curso e escola'}</p>
            {location(p.city, p.state) && (
              <div className="meta-list" style={{ marginTop: 6 }}>
                <span>
                  <LuMapPin /> {location(p.city, p.state)}
                </span>
              </div>
            )}
          </div>
          <Button variant="primary" icon={<LuPencil />} onClick={() => setEditOpen(true)}>
            Editar perfil
          </Button>
        </div>
      </section>

      <StudentProfileView
        profile={p}
        editable
        onEdit={() => setEditOpen(true)}
        onAddExperience={() => setExperience('new')}
        onEditExperience={(e) => setExperience(e)}
        onDeleteExperience={(e) => setToDelete(e)}
      />

      <EditProfileModal
        open={editOpen}
        profile={p}
        onClose={() => setEditOpen(false)}
        onSaved={(updated) => {
          profile.setData(() => updated);
          updateUser({ name: updated.name });
          setEditOpen(false);
        }}
      />

      <ExperienceModal
        open={experience !== null}
        experience={experience === 'new' ? null : experience}
        onClose={() => setExperience(null)}
        onSaved={() => {
          setExperience(null);
          profile.reload();
        }}
      />

      <ConfirmDialog
        open={!!toDelete}
        title="Excluir experiência?"
        description={toDelete ? `"${toDelete.title}" será removida do seu perfil.` : undefined}
        confirmLabel="Excluir"
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return;
          try {
            await studentsApi.removeExperience(toDelete.id);
            toast.success('Experiência excluída');
            setToDelete(null);
            profile.reload();
          } catch (err) {
            toast.error('Não foi possível excluir', (err as Error).message);
          }
        }}
      />
    </>
  );
}

function EditProfileModal({ open, profile, onClose, onSaved }: {
  open: boolean;
  profile: StudentProfile;
  onClose: () => void;
  onSaved: (p: StudentProfile) => void;
}) {
  const toast = useToast();
  const initial = () => ({
    name: profile.name,
    school: profile.school ?? '',
    course: profile.course ?? '',
    schoolYear: profile.schoolYear ?? '',
    graduationYear: profile.graduationYear ? String(profile.graduationYear) : '',
    city: profile.city ?? '',
    state: profile.state ?? '',
    bio: profile.bio ?? '',
    skills: profile.skills,
    portfolioUrl: profile.portfolioUrl ?? '',
  });
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastOpen, setLastOpen] = useState(false);

  // Recarrega o formulário a cada abertura.
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setForm(initial());
      setErrors({});
      setFormError(null);
    }
  }

  const set = <K extends keyof ReturnType<typeof initial>>(key: K, value: ReturnType<typeof initial>[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (form.name.trim().length < 3) next.name = 'O nome deve ter pelo menos 3 caracteres.';
    if (form.portfolioUrl && !/^https?:\/\/.+\..+/i.test(form.portfolioUrl.trim())) next.portfolioUrl = 'Informe um link completo, começando com https://';
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    setFormError(null);
    try {
      const updated = await studentsApi.update({
        name: form.name.trim(),
        school: form.school.trim() || null,
        course: form.course.trim() || null,
        schoolYear: form.schoolYear.trim() || null,
        graduationYear: form.graduationYear ? Number(form.graduationYear) : null,
        city: form.city.trim() || null,
        state: form.state || null,
        bio: form.bio.trim() || null,
        skills: form.skills,
        portfolioUrl: form.portfolioUrl.trim() || null,
      });
      toast.success('Perfil atualizado!');
      onSaved(updated);
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fieldErrors());
      setFormError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const year = new Date().getFullYear();

  return (
    <Modal
      open={open}
      onClose={onClose}
      locked={busy}
      size="lg"
      icon={<LuUser />}
      title="Editar perfil"
      description="Essas informações aparecem para as empresas quando você se candidata."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" form="student-profile-form" loading={busy}>
            Salvar alterações
          </Button>
        </>
      }
    >
      <form id="student-profile-form" className="stack" onSubmit={submit} noValidate>
        {formError && <FormAlert>{formError}</FormAlert>}
        <div className="form-grid">
          <TextField label="Nome completo" value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} maxLength={120} fieldClassName="span-all" />
          <TextField label="Escola" optional value={form.school} onChange={(e) => set('school', e.target.value)} error={errors.school} maxLength={150} />
          <TextField label="Curso" optional value={form.course} onChange={(e) => set('course', e.target.value)} error={errors.course} maxLength={120} />
          <TextField label="Série / módulo" optional value={form.schoolYear} onChange={(e) => set('schoolYear', e.target.value)} error={errors.schoolYear} maxLength={40} placeholder="Ex.: 2º ano" />
          <SelectField
            label="Ano de conclusão"
            optional
            value={form.graduationYear}
            onChange={(e) => set('graduationYear', e.target.value)}
            error={errors.graduationYear}
            placeholder="Selecione"
            options={Array.from({ length: 9 }, (_, i) => String(year - 2 + i)).map((y) => ({ value: y, label: y }))}
          />
          <TextField label="Cidade" optional value={form.city} onChange={(e) => set('city', e.target.value)} error={errors.city} maxLength={100} />
          <SelectField
            label="Estado"
            optional
            value={form.state}
            onChange={(e) => set('state', e.target.value)}
            error={errors.state}
            placeholder="Selecione"
            options={brazilianStates.map((s) => ({ value: s, label: s }))}
          />
          <TextAreaField
            label="Sobre mim"
            optional
            rows={5}
            maxLength={1500}
            value={form.bio}
            onChange={(e) => set('bio', e.target.value)}
            error={errors.bio}
            placeholder="Conte seus interesses, o que já fez e o que quer aprender."
            fieldClassName="span-all"
          />
          <div className="field span-all">
            <label className="field__label" htmlFor="skills-input">
              <span>
                Habilidades <span className="field__optional">(Enter para adicionar)</span>
              </span>
              <span className="field__counter">{form.skills.length}/30</span>
            </label>
            <TagInput id="skills-input" value={form.skills} onChange={(skills) => set('skills', skills)} placeholder="Ex.: Excel, Comunicação…" suggestions={skillSuggestions} />
            {errors.skills && <span className="field__error">{errors.skills}</span>}
          </div>
          <TextField
            label="Link de portfólio"
            optional
            type="url"
            value={form.portfolioUrl}
            onChange={(e) => set('portfolioUrl', e.target.value)}
            error={errors.portfolioUrl}
            placeholder="https://github.com/seu-usuario"
            fieldClassName="span-all"
          />
        </div>
      </form>
    </Modal>
  );
}

function ExperienceModal({ open, experience, onClose, onSaved }: {
  open: boolean;
  experience: Experience | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const empty = () => ({
    title: experience?.title ?? '',
    organization: experience?.organization ?? '',
    type: (experience?.type ?? 'Project') as ExperienceType,
    startDate: experience?.startDate ?? '',
    endDate: experience?.endDate ?? '',
    current: experience ? !experience.endDate : false,
    description: experience?.description ?? '',
  });
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [key, setKey] = useState<string>('');

  const currentKey = open ? `open-${experience?.id ?? 'new'}` : 'closed';
  if (currentKey !== key) {
    setKey(currentKey);
    if (open) {
      setForm(empty());
      setErrors({});
      setFormError(null);
    }
  }

  const set = <K extends keyof ReturnType<typeof empty>>(k: K, v: ReturnType<typeof empty>[K]) => setForm((f) => ({ ...f, [k]: v }));
  const today = new Date().toISOString().slice(0, 10);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!form.title.trim()) next.title = 'Informe o título.';
    if (!form.organization.trim()) next.organization = 'Informe a organização.';
    if (!form.startDate) next.startDate = 'Informe a data de início.';
    else if (form.startDate > today) next.startDate = 'A data de início não pode estar no futuro.';
    if (!form.current && form.endDate && form.startDate && form.endDate < form.startDate) next.endDate = 'A data final deve ser depois do início.';
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload = {
      title: form.title.trim(),
      organization: form.organization.trim(),
      type: form.type,
      startDate: form.startDate,
      endDate: form.current || !form.endDate ? null : form.endDate,
      description: form.description.trim() || null,
    };
    setBusy(true);
    setFormError(null);
    try {
      if (experience) await studentsApi.updateExperience(experience.id, payload);
      else await studentsApi.addExperience(payload);
      toast.success(experience ? 'Experiência atualizada' : 'Experiência adicionada');
      onSaved();
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fieldErrors());
      setFormError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      locked={busy}
      icon={<LuBriefcase />}
      title={experience ? 'Editar experiência' : 'Nova experiência'}
      description="Trabalhos, estágios, voluntariado, projetos escolares e cursos."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" form="experience-form" loading={busy}>
            Salvar
          </Button>
        </>
      }
    >
      <form id="experience-form" className="stack" onSubmit={submit} noValidate>
        {formError && <FormAlert>{formError}</FormAlert>}
        <TextField label="Título" value={form.title} onChange={(e) => set('title', e.target.value)} error={errors.title} maxLength={120} placeholder="Ex.: Site da feira de ciências" />
        <div className="form-grid">
          <TextField label="Organização" value={form.organization} onChange={(e) => set('organization', e.target.value)} error={errors.organization} maxLength={150} placeholder="Escola, empresa ou ONG" />
          <SelectField
            label="Tipo"
            value={form.type}
            onChange={(e) => set('type', e.target.value as ExperienceType)}
            options={(Object.keys(experienceTypeLabels) as ExperienceType[]).map((t) => ({ value: t, label: experienceTypeLabels[t] }))}
          />
          <TextField label="Início" type="date" max={today} value={form.startDate} onChange={(e) => set('startDate', e.target.value)} error={errors.startDate} />
          <TextField label="Fim" type="date" value={form.current ? '' : form.endDate} disabled={form.current} onChange={(e) => set('endDate', e.target.value)} error={errors.endDate} />
        </div>
        <label className="checkbox">
          <input type="checkbox" checked={form.current} onChange={(e) => set('current', e.target.checked)} />
          <span>Ainda faço isso atualmente</span>
        </label>
        <TextAreaField label="Descrição" optional rows={4} maxLength={1500} value={form.description} onChange={(e) => set('description', e.target.value)} error={errors.description} placeholder="O que você fez e aprendeu?" />
      </form>
    </Modal>
  );
}

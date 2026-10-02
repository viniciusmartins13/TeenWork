import { useEffect, useState, type FormEvent } from 'react';
import { LuBuilding2, LuEye, LuGlobe, LuMapPin, LuSave } from 'react-icons/lu';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { ErrorState, PageLoader } from '../../components/ui/Feedback';
import { FormAlert, SelectField, TextAreaField, TextField } from '../../components/ui/Field';
import { ImageUpload } from '../../components/ui/ImageUpload';
import { Card, PageHeader } from '../../components/ui/Page';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ApiError } from '../../lib/api';
import { companiesApi, mediaApi } from '../../lib/endpoints';
import { brazilianStates, formatCnpj, location, onlyDigits, plural } from '../../lib/format';
import { useApi, useDocumentTitle } from '../../lib/hooks';

export function CompanyProfilePage() {
  useDocumentTitle('Perfil da empresa');
  const { updateUser } = useAuth();
  const toast = useToast();
  const company = useApi((signal) => companiesApi.me(signal), []);
  const [form, setForm] = useState({
    companyName: '',
    responsibleName: '',
    cnpj: '',
    industry: '',
    city: '',
    state: '',
    website: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const c = company.data;
    if (!c) return;
    setForm({
      companyName: c.companyName,
      responsibleName: c.responsibleName,
      cnpj: c.cnpj ?? '',
      industry: c.industry ?? '',
      city: c.city ?? '',
      state: c.state ?? '',
      website: c.website ?? '',
      description: c.description ?? '',
    });
  }, [company.data?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (company.loading && !company.data) return <PageLoader />;
  if (company.error || !company.data) return <ErrorState error={company.error} onRetry={company.reload} />;
  const c = company.data;

  const set = <K extends keyof typeof form>(key: K, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (form.companyName.trim().length < 2) next.companyName = 'Informe o nome da empresa.';
    if (form.responsibleName.trim().length < 3) next.responsibleName = 'Informe o nome do responsável.';
    const cnpj = onlyDigits(form.cnpj);
    if (cnpj && cnpj.length !== 14) next.cnpj = 'O CNPJ deve ter 14 dígitos.';
    if (form.website && !/^https?:\/\/.+\..+/i.test(form.website.trim())) next.website = 'Informe o endereço completo, começando com https://';
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    setFormError(null);
    try {
      const updated = await companiesApi.update({
        companyName: form.companyName.trim(),
        responsibleName: form.responsibleName.trim(),
        cnpj: cnpj || null,
        industry: form.industry.trim() || null,
        city: form.city.trim() || null,
        state: form.state || null,
        website: form.website.trim() || null,
        description: form.description.trim() || null,
      });
      company.setData(() => updated);
      updateUser({ companyName: updated.companyName, name: updated.responsibleName });
      toast.success('Perfil da empresa atualizado');
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fieldErrors());
      setFormError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader eyebrow="Sua marca" title="Perfil da empresa" subtitle="Um perfil caprichado passa confiança para estudantes e famílias." />

      <div className="profile-layout" style={{ marginTop: 0 }}>
        <form className="stack stack--lg" onSubmit={submit} noValidate>
          {formError && <FormAlert>{formError}</FormAlert>}
          <Card title="Dados da empresa" icon={<LuBuilding2 />}>
            <div className="form-grid">
              <TextField label="Nome da empresa" value={form.companyName} onChange={(e) => set('companyName', e.target.value)} error={errors.companyName} maxLength={150} fieldClassName="span-all" />
              <TextField label="Responsável pelo recrutamento" value={form.responsibleName} onChange={(e) => set('responsibleName', e.target.value)} error={errors.responsibleName} maxLength={120} />
              <TextField
                label="CNPJ"
                optional
                inputMode="numeric"
                value={formatCnpj(form.cnpj)}
                onChange={(e) => set('cnpj', onlyDigits(e.target.value).slice(0, 14))}
                error={errors.cnpj}
                placeholder="00.000.000/0000-00"
              />
              <TextField label="Setor" optional value={form.industry} onChange={(e) => set('industry', e.target.value)} error={errors.industry} maxLength={80} placeholder="Ex.: Tecnologia, Varejo" />
              <TextField label="Site" optional type="url" value={form.website} onChange={(e) => set('website', e.target.value)} error={errors.website} placeholder="https://" />
              <TextField label="Cidade" optional value={form.city} onChange={(e) => set('city', e.target.value)} error={errors.city} maxLength={100} />
              <SelectField label="Estado" optional value={form.state} onChange={(e) => set('state', e.target.value)} error={errors.state} placeholder="Selecione" options={brazilianStates.map((s) => ({ value: s, label: s }))} />
              <TextAreaField
                label="Sobre a empresa"
                optional
                rows={6}
                maxLength={3000}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                error={errors.description}
                placeholder="O que a empresa faz, como é o ambiente e por que é um bom lugar para começar a carreira."
                fieldClassName="span-all"
              />
            </div>
          </Card>
          <div className="form-actions">
            <Button type="submit" variant="primary" size="lg" icon={<LuSave />} loading={busy}>
              Salvar alterações
            </Button>
          </div>
        </form>

        <aside className="sticky-aside">
          <Card title="Logo">
            <ImageUpload
              name={c.companyName}
              src={c.logo}
              square
              label="Alterar logo"
              onUpload={async (file) => {
                const { url } = await mediaApi.uploadLogo(file);
                company.setData((d) => (d ? { ...d, logo: url } : d));
                updateUser({ companyLogo: url });
                return url;
              }}
              onRemove={async () => {
                await mediaApi.removeLogo();
                company.setData((d) => (d ? { ...d, logo: null } : d));
                updateUser({ companyLogo: null });
              }}
            />
            <p className="text-sm text-muted" style={{ textAlign: 'center', marginTop: 8 }}>
              JPG, PNG ou WEBP até 2 MB. Prefira imagens quadradas.
            </p>
          </Card>
          <Card title="Como os estudantes veem" icon={<LuEye />}>
            <div className="stack stack--sm">
              <div className="row">
                <Avatar name={c.companyName} src={c.logo} square size="lg" />
                <div>
                  <div style={{ fontWeight: 700 }}>{c.companyName}</div>
                  <div className="text-sm text-muted">{c.industry || 'Setor não informado'}</div>
                </div>
              </div>
              <div className="meta-list">
                {location(c.city, c.state) && (
                  <span>
                    <LuMapPin /> {location(c.city, c.state)}
                  </span>
                )}
                {c.website && (
                  <span>
                    <LuGlobe /> Site
                  </span>
                )}
              </div>
              <span className="badge badge--success" style={{ alignSelf: 'flex-start' }}>
                {plural(c.activeJobsCount, 'vaga aberta', 'vagas abertas')}
              </span>
            </div>
          </Card>
        </aside>
      </div>
    </>
  );
}

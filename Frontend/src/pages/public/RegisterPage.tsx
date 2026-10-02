import { useState, type FormEvent } from 'react';
import { LuBuilding2, LuGraduationCap, LuLock, LuMail, LuUserPlus } from 'react-icons/lu';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Button } from '../../components/ui/Button';
import { Checkbox, FormAlert, PasswordField, SelectField, TextField } from '../../components/ui/Field';
import { homePathFor, useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ApiError } from '../../lib/api';
import { brazilianStates, emailPattern, firstName, formatCnpj, onlyDigits, passwordProblems, passwordScore } from '../../lib/format';
import { useDocumentTitle } from '../../lib/hooks';

type AccountType = 'STUDENT' | 'COMPANY';

export function RegisterPage() {
  useDocumentTitle('Criar conta');
  const [params] = useSearchParams();
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [type, setType] = useState<AccountType>(params.get('tipo') === 'empresa' ? 'COMPANY' : 'STUDENT');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    school: '',
    course: '',
    city: '',
    state: '',
    companyName: '',
    cnpj: '',
    acceptTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key])
      setErrors((current) => {
        const copy = { ...current };
        delete copy[key];
        return copy;
      });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 3) e.name = type === 'COMPANY' ? 'Informe o nome do responsável.' : 'Informe seu nome completo.';
    if (!emailPattern.test(form.email.trim())) e.email = 'Informe um e-mail válido.';
    const problems = passwordProblems(form.password);
    if (problems.length) e.password = `A senha precisa de ${problems.join(', ')}.`;
    if (form.confirmPassword !== form.password) e.confirmPassword = 'As senhas não conferem.';
    if (type === 'COMPANY') {
      if (form.companyName.trim().length < 2) e.companyName = 'Informe o nome da empresa.';
      const cnpj = onlyDigits(form.cnpj);
      if (cnpj && cnpj.length !== 14) e.cnpj = 'O CNPJ deve ter 14 dígitos.';
    }
    if (!form.acceptTerms) e.acceptTerms = 'Você precisa aceitar os termos para continuar.';
    return e;
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    setFormError(null);
    if (Object.keys(e).length) return;

    setBusy(true);
    try {
      const user = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        userType: type,
        city: form.city.trim() || undefined,
        state: form.state || undefined,
        school: type === 'STUDENT' ? form.school.trim() || undefined : undefined,
        course: type === 'STUDENT' ? form.course.trim() || undefined : undefined,
        companyName: type === 'COMPANY' ? form.companyName.trim() : undefined,
        cnpj: type === 'COMPANY' ? onlyDigits(form.cnpj) || undefined : undefined,
        acceptTerms: form.acceptTerms,
      });
      toast.success(`Bem-vindo(a), ${firstName(user.name)}!`, 'Sua conta foi criada. Complete seu perfil para se destacar.');
      navigate(homePathFor(user.role), { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fieldErrors());
        setFormError(err.message);
      } else {
        setFormError('Não foi possível criar a conta.');
      }
    } finally {
      setBusy(false);
    }
  };

  const score = passwordScore(form.password);

  return (
    <AuthLayout>
      <h1 className="auth__title">Criar sua conta</h1>
      <p className="auth__subtitle">É grátis e leva menos de dois minutos.</p>

      <div className="type-picker" role="radiogroup" aria-label="Tipo de conta">
        <button type="button" role="radio" aria-checked={type === 'STUDENT'} className="type-option" onClick={() => setType('STUDENT')}>
          <span className="type-option__icon">
            <LuGraduationCap />
          </span>
          <strong>Sou estudante</strong>
          <span>Quero encontrar vagas e cursos</span>
        </button>
        <button type="button" role="radio" aria-checked={type === 'COMPANY'} className="type-option" onClick={() => setType('COMPANY')}>
          <span className="type-option__icon">
            <LuBuilding2 />
          </span>
          <strong>Sou empresa</strong>
          <span>Quero publicar vagas</span>
        </button>
      </div>

      <form className="stack" onSubmit={submit} noValidate>
        {formError && <FormAlert>{formError}</FormAlert>}

        {type === 'COMPANY' && (
          <div className="form-grid">
            <TextField
              label="Nome da empresa"
              value={form.companyName}
              onChange={(e) => set('companyName', e.target.value)}
              error={errors.companyName}
              maxLength={150}
              fieldClassName="span-all"
            />
            <TextField
              label="CNPJ"
              optional
              inputMode="numeric"
              value={formatCnpj(form.cnpj)}
              onChange={(e) => set('cnpj', onlyDigits(e.target.value).slice(0, 14))}
              error={errors.cnpj}
              placeholder="00.000.000/0000-00"
              fieldClassName="span-all"
            />
          </div>
        )}

        <TextField
          label={type === 'COMPANY' ? 'Nome do responsável' : 'Nome completo'}
          autoComplete="name"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          error={errors.name}
          maxLength={120}
        />
        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          icon={<LuMail />}
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
          error={errors.email}
          placeholder={type === 'COMPANY' ? 'rh@empresa.com.br' : 'voce@email.com'}
        />

        {type === 'STUDENT' && (
          <div className="form-grid">
            <TextField label="Escola" optional value={form.school} onChange={(e) => set('school', e.target.value)} error={errors.school} maxLength={150} />
            <TextField label="Curso" optional value={form.course} onChange={(e) => set('course', e.target.value)} error={errors.course} maxLength={120} placeholder="Ex.: Técnico em Informática" />
          </div>
        )}

        <div className="form-grid" style={{ gridTemplateColumns: '1fr 110px' }}>
          <TextField label="Cidade" optional value={form.city} onChange={(e) => set('city', e.target.value)} error={errors.city} maxLength={100} />
          <SelectField
            label="UF"
            value={form.state}
            onChange={(e) => set('state', e.target.value)}
            error={errors.state}
            placeholder="—"
            options={brazilianStates.map((s) => ({ value: s, label: s }))}
          />
        </div>

        <div className="stack stack--sm">
          <PasswordField
            label="Senha"
            autoComplete="new-password"
            icon={<LuLock />}
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            error={errors.password}
            hint="Mínimo de 8 caracteres, com letra maiúscula, minúscula e número."
          />
          {form.password && (
            <div className="password-meter" data-score={score} aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
          )}
        </div>
        <PasswordField
          label="Confirmar senha"
          autoComplete="new-password"
          icon={<LuLock />}
          value={form.confirmPassword}
          onChange={(e) => set('confirmPassword', e.target.value)}
          error={errors.confirmPassword}
        />

        <Checkbox
          checked={form.acceptTerms}
          onChange={(e) => set('acceptTerms', e.target.checked)}
          error={errors.acceptTerms}
          label="Li e aceito os termos de uso e a política de privacidade do TeenWork."
        />

        <Button type="submit" variant="primary" size="lg" block loading={busy} icon={<LuUserPlus />}>
          Criar conta {type === 'COMPANY' ? 'da empresa' : 'de estudante'}
        </Button>
      </form>

      <p className="auth__switch">
        Já tem conta? <Link to="/entrar">Entrar</Link>
      </p>
    </AuthLayout>
  );
}

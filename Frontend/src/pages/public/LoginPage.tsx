import { useState, type FormEvent } from 'react';
import { LuLock, LuLogIn, LuMail, LuSparkles } from 'react-icons/lu';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Button } from '../../components/ui/Button';
import { FormAlert, PasswordField, TextField } from '../../components/ui/Field';
import { homePathFor, useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ApiError } from '../../lib/api';
import { emailPattern, firstName } from '../../lib/format';
import { useDocumentTitle } from '../../lib/hooks';

const demoAccounts = [
  { label: 'Estudante', email: 'ana.souza@teenwork.dev' },
  { label: 'Empresa', email: 'rh@nuvemazul.teenwork.dev' },
];

export function LoginPage() {
  useDocumentTitle('Entrar');
  const { login, sessionExpired } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!emailPattern.test(email.trim())) next.email = 'Informe um e-mail válido.';
    if (!password) next.password = 'Informe sua senha.';
    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      const user = await login(email, password);
      toast.success(`Olá, ${firstName(user.name)}!`, 'Que bom ter você de volta.');
      const redirect = params.get('redirect');
      const home = homePathFor(user.role);
      navigate(redirect && redirect.startsWith(home) ? redirect : home, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.errors.length) setErrors(err.fieldErrors());
      setFormError(err instanceof Error ? err.message : 'Não foi possível entrar.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="auth__title">Entrar no TeenWork</h1>
      <p className="auth__subtitle">Acesse sua conta de estudante ou de empresa.</p>

      <form className="stack" onSubmit={submit} noValidate>
        {sessionExpired && !formError && <FormAlert kind="info">Sua sessão expirou. Entre novamente para continuar.</FormAlert>}
        {formError && <FormAlert>{formError}</FormAlert>}
        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          icon={<LuMail />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          placeholder="voce@email.com"
        />
        <PasswordField
          label="Senha"
          autoComplete="current-password"
          icon={<LuLock />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          placeholder="Sua senha"
        />
        <div style={{ textAlign: 'right', marginTop: -6 }}>
          <Link to="/esqueci-senha" className="text-sm">
            Esqueci minha senha
          </Link>
        </div>
        <Button type="submit" variant="primary" size="lg" block loading={busy} icon={<LuLogIn />}>
          Entrar
        </Button>
      </form>

      <p className="auth__switch">
        Ainda não tem conta? <Link to="/cadastro">Crie grátis</Link>
      </p>

      <div className="demo-box">
        <div className="demo-box__title">
          <LuSparkles /> Contas de demonstração
        </div>
        Senha de todas: <code>TeenWork@2026</code>
        <div className="demo-box__accounts">
          {demoAccounts.map((a) => (
            <button
              key={a.email}
              type="button"
              className="toggle-chip"
              style={{ height: 30, fontSize: 12 }}
              onClick={() => {
                setEmail(a.email);
                setPassword('TeenWork@2026');
              }}
            >
              {a.label}: {a.email}
            </button>
          ))}
        </div>
      </div>
    </AuthLayout>
  );
}

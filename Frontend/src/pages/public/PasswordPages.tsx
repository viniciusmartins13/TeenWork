import { useState, type FormEvent } from 'react';
import { LuArrowLeft, LuKeyRound, LuLock, LuMail, LuMailCheck } from 'react-icons/lu';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Button } from '../../components/ui/Button';
import { FormAlert, PasswordField, TextField } from '../../components/ui/Field';
import { useToast } from '../../context/ToastContext';
import { ApiError } from '../../lib/api';
import { authApi } from '../../lib/endpoints';
import { emailPattern, passwordProblems } from '../../lib/format';
import { useDocumentTitle } from '../../lib/hooks';

export function ForgotPasswordPage() {
  useDocumentTitle('Recuperar senha');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!emailPattern.test(email.trim())) {
      setError('Informe um e-mail válido.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout>
      <Link to="/entrar" className="back-link">
        <LuArrowLeft /> Voltar para o login
      </Link>
      {sent ? (
        <div className="stack">
          <span className="empty-state__icon">
            <LuMailCheck />
          </span>
          <h1 className="auth__title">Confira seu e-mail</h1>
          <p className="text-muted">
            Se <strong>{email}</strong> estiver cadastrado, você receberá um link para criar uma nova senha. O link vale por
            1 hora. Não esqueça de olhar a caixa de spam.
          </p>
          <Button variant="secondary" onClick={() => setSent(false)}>
            Usar outro e-mail
          </Button>
        </div>
      ) : (
        <>
          <h1 className="auth__title">Esqueceu a senha?</h1>
          <p className="auth__subtitle">Digite o e-mail da sua conta e enviaremos um link para redefinir.</p>
          <form className="stack" onSubmit={submit} noValidate>
            <TextField
              label="E-mail"
              type="email"
              autoComplete="email"
              icon={<LuMail />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error ?? undefined}
            />
            <Button type="submit" variant="primary" size="lg" block loading={busy}>
              Enviar link
            </Button>
          </form>
        </>
      )}
    </AuthLayout>
  );
}

export function ResetPasswordPage() {
  useDocumentTitle('Nova senha');
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const email = params.get('email') ?? '';
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    const problems = passwordProblems(password);
    if (problems.length) next.newPassword = `A senha precisa de ${problems.join(', ')}.`;
    if (confirm !== password) next.confirmPassword = 'As senhas não conferem.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    setFormError(null);
    try {
      await authApi.resetPassword({ email, token, newPassword: password, confirmPassword: confirm });
      toast.success('Senha redefinida!', 'Agora é só entrar com a nova senha.');
      navigate('/entrar', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fieldErrors());
      setFormError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="auth__title">Criar nova senha</h1>
      <p className="auth__subtitle">{email ? `Conta: ${email}` : 'Defina uma nova senha para sua conta.'}</p>
      {!email || !token ? (
        <div className="stack">
          <FormAlert>Este link de redefinição está incompleto ou inválido. Solicite um novo.</FormAlert>
          <Link to="/esqueci-senha" className="btn btn--primary">
            Solicitar novo link
          </Link>
        </div>
      ) : (
        <form className="stack" onSubmit={submit} noValidate>
          {formError && <FormAlert>{formError}</FormAlert>}
          <PasswordField
            label="Nova senha"
            autoComplete="new-password"
            icon={<LuLock />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.newPassword}
            hint="Mínimo de 8 caracteres, com letra maiúscula, minúscula e número."
          />
          <PasswordField
            label="Confirmar nova senha"
            autoComplete="new-password"
            icon={<LuLock />}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={errors.confirmPassword}
          />
          <Button type="submit" variant="primary" size="lg" block loading={busy} icon={<LuKeyRound />}>
            Salvar nova senha
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}

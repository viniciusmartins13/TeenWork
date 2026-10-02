import { useState, type FormEvent } from 'react';
import { LuKeyRound, LuLock, LuLogOut, LuShieldCheck, LuUser } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { FormAlert, PasswordField } from '../../components/ui/Field';
import { Card, PageHeader } from '../../components/ui/Page';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ApiError } from '../../lib/api';
import { authApi } from '../../lib/endpoints';
import { formatDate, passwordProblems } from '../../lib/format';
import { useDocumentTitle } from '../../lib/hooks';

const roleLabels = { STUDENT: 'Estudante', COMPANY: 'Empresa', ADMIN: 'Administrador' } as const;

export function SettingsPage() {
  useDocumentTitle('Configurações');
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!form.currentPassword) next.currentPassword = 'Informe sua senha atual.';
    const problems = passwordProblems(form.newPassword);
    if (problems.length) next.newPassword = `A nova senha precisa de ${problems.join(', ')}.`;
    else if (form.newPassword === form.currentPassword) next.newPassword = 'A nova senha deve ser diferente da atual.';
    if (form.confirmPassword !== form.newPassword) next.confirmPassword = 'As senhas não conferem.';
    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      await authApi.changePassword(form);
      toast.success('Senha alterada com sucesso');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fieldErrors());
      setFormError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader eyebrow="Conta" title="Configurações" subtitle="Dados de acesso e segurança da sua conta." />
      <div className="profile-layout" style={{ marginTop: 0 }}>
        <Card title="Alterar senha" icon={<LuKeyRound />}>
          <form className="stack" onSubmit={submit} noValidate style={{ maxWidth: 460 }}>
            {formError && <FormAlert>{formError}</FormAlert>}
            <PasswordField
              label="Senha atual"
              autoComplete="current-password"
              icon={<LuLock />}
              value={form.currentPassword}
              onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
              error={errors.currentPassword}
            />
            <PasswordField
              label="Nova senha"
              autoComplete="new-password"
              icon={<LuLock />}
              value={form.newPassword}
              onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
              error={errors.newPassword}
              hint="Mínimo de 8 caracteres, com letra maiúscula, minúscula e número."
            />
            <PasswordField
              label="Confirmar nova senha"
              autoComplete="new-password"
              icon={<LuLock />}
              value={form.confirmPassword}
              onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              error={errors.confirmPassword}
            />
            <div>
              <Button type="submit" variant="primary" loading={busy}>
                Salvar nova senha
              </Button>
            </div>
          </form>
        </Card>

        <div className="stack stack--lg">
          <Card title="Sua conta" icon={<LuUser />}>
            <dl className="summary-list">
              <div>
                <dt>Nome</dt>
                <dd>{user.name}</dd>
              </div>
              <div>
                <dt>E-mail</dt>
                <dd style={{ wordBreak: 'break-all' }}>{user.email}</dd>
              </div>
              <div>
                <dt>Tipo</dt>
                <dd>{roleLabels[user.role]}</dd>
              </div>
              <div>
                <dt>Membro desde</dt>
                <dd>{formatDate(user.createdAt)}</dd>
              </div>
            </dl>
          </Card>
          <Card title="Privacidade" icon={<LuShieldCheck />}>
            <p className="text-sm text-muted">
              Sua senha é armazenada com criptografia (BCrypt) e nunca fica visível para ninguém. Empresas só veem seu perfil
              completo quando você se candidata a uma vaga delas.
            </p>
            <div className="divider" />
            <Button
              variant="danger-ghost"
              icon={<LuLogOut />}
              onClick={() => {
                logout();
                navigate('/entrar', { replace: true });
              }}
            >
              Sair da conta
            </Button>
          </Card>
        </div>
      </div>
    </>
  );
}

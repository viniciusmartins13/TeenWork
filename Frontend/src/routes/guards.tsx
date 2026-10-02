import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { PageLoader } from '../components/ui/Feedback';
import { homePathFor, useAuth } from '../context/AuthContext';
import type { Role } from '../lib/types';

/** Exige login e (opcionalmente) um perfil específico. */
export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { user, status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <PageLoader label="Verificando sua sessão…" />;
  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/entrar?redirect=${redirect}`} replace />;
  }
  if (user.role !== role) return <Navigate to={homePathFor(user.role)} replace />;
  return <>{children}</>;
}

/** Páginas de login/cadastro: quem já está logado vai para sua área. */
export function PublicOnly({ children }: { children: ReactNode }) {
  const { user, status } = useAuth();
  if (status === 'loading') return <PageLoader />;
  if (user) return <Navigate to={homePathFor(user.role)} replace />;
  return <>{children}</>;
}

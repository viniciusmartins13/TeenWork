import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { CandidateDetailsPage } from './pages/company/CandidateDetailsPage';
import { CandidatesPage } from './pages/company/CandidatesPage';
import { CompanyDashboardPage } from './pages/company/CompanyDashboardPage';
import { CompanyJobDetailsPage } from './pages/company/CompanyJobDetailsPage';
import { CompanyJobsPage } from './pages/company/CompanyJobsPage';
import { CompanyProfilePage } from './pages/company/CompanyProfilePage';
import { JobFormPage } from './pages/company/JobFormPage';
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { NotFoundPage } from './pages/public/NotFoundPage';
import { ForgotPasswordPage, ResetPasswordPage } from './pages/public/PasswordPages';
import { RegisterPage } from './pages/public/RegisterPage';
import { AdminPage } from './pages/shared/AdminPage';
import { NotificationsPage } from './pages/shared/NotificationsPage';
import { SettingsPage } from './pages/shared/SettingsPage';
import { CompaniesPage, CompanyPublicPage } from './pages/student/CompaniesPage';
import { JobDetailsPage } from './pages/student/JobDetailsPage';
import { JobSearchPage } from './pages/student/JobSearchPage';
import { MyApplicationsPage } from './pages/student/MyApplicationsPage';
import { SavedJobsPage } from './pages/student/SavedJobsPage';
import { StudentDashboardPage } from './pages/student/StudentDashboardPage';
import { StudentProfilePage } from './pages/student/StudentProfilePage';
import { PublicOnly, RequireRole } from './routes/guards';

/** Avisa e leva ao login quando o token expira durante o uso. */
function SessionWatcher() {
  const { sessionExpired } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  useEffect(() => {
    if (sessionExpired) {
      toast.warning('Sessão expirada', 'Faça login novamente para continuar.');
      navigate('/entrar', { replace: true });
    }
  }, [sessionExpired, toast, navigate]);
  return null;
}

function AppRoutes() {
  return (
    <>
      <SessionWatcher />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/entrar" element={<PublicOnly><LoginPage /></PublicOnly>} />
        <Route path="/cadastro" element={<PublicOnly><RegisterPage /></PublicOnly>} />
        <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
        <Route path="/redefinir-senha" element={<ResetPasswordPage />} />

        <Route path="/aluno" element={<RequireRole role="STUDENT"><AppLayout /></RequireRole>}>
          <Route index element={<StudentDashboardPage />} />
          <Route path="vagas" element={<JobSearchPage />} />
          <Route path="vagas/:id" element={<JobDetailsPage />} />
          <Route path="candidaturas" element={<MyApplicationsPage />} />
          <Route path="salvas" element={<SavedJobsPage />} />
          <Route path="empresas" element={<CompaniesPage />} />
          <Route path="empresas/:id" element={<CompanyPublicPage />} />
          <Route path="perfil" element={<StudentProfilePage />} />
          <Route path="notificacoes" element={<NotificationsPage />} />
          <Route path="configuracoes" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/aluno" replace />} />
        </Route>

        <Route path="/empresa" element={<RequireRole role="COMPANY"><AppLayout /></RequireRole>}>
          <Route index element={<CompanyDashboardPage />} />
          <Route path="vagas" element={<CompanyJobsPage />} />
          <Route path="vagas/nova" element={<JobFormPage />} />
          <Route path="vagas/:id" element={<CompanyJobDetailsPage />} />
          <Route path="vagas/:id/editar" element={<JobFormPage />} />
          <Route path="candidatos" element={<CandidatesPage />} />
          <Route path="candidatos/:id" element={<CandidateDetailsPage />} />
          <Route path="perfil" element={<CompanyProfilePage />} />
          <Route path="notificacoes" element={<NotificationsPage />} />
          <Route path="configuracoes" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/empresa" replace />} />
        </Route>

        <Route path="/admin" element={<RequireRole role="ADMIN"><AppLayout /></RequireRole>}>
          <Route index element={<AdminPage />} />
          <Route path="configuracoes" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

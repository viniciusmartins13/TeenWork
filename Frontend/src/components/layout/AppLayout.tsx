import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  LuBell,
  LuBookmark,
  LuBriefcase,
  LuBuilding2,
  LuChevronDown,
  LuFileText,
  LuLayoutDashboard,
  LuLogOut,
  LuMenu,
  LuPlus,
  LuSearch,
  LuSettings,
  LuShieldCheck,
  LuUser,
  LuUsers,
  LuX,
} from 'react-icons/lu';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDismiss } from '../../lib/hooks';
import type { Role } from '../../lib/types';
import { Logo } from '../brand/Logo';
import { Avatar } from '../ui/Avatar';
import { NotificationBell, useUnreadCount } from './NotificationBell';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
  badge?: 'notifications';
}

const navByRole: Record<Role, { base: string; label: string; main: NavItem[]; account: NavItem[] }> = {
  STUDENT: {
    base: '/aluno',
    label: 'Área do estudante',
    main: [
      { to: '/aluno', label: 'Início', icon: <LuLayoutDashboard />, end: true },
      { to: '/aluno/vagas', label: 'Buscar vagas', icon: <LuSearch /> },
      { to: '/aluno/candidaturas', label: 'Minhas candidaturas', icon: <LuFileText /> },
      { to: '/aluno/salvas', label: 'Vagas salvas', icon: <LuBookmark /> },
      { to: '/aluno/empresas', label: 'Empresas', icon: <LuBuilding2 /> },
    ],
    account: [
      { to: '/aluno/perfil', label: 'Meu perfil', icon: <LuUser /> },
      { to: '/aluno/notificacoes', label: 'Notificações', icon: <LuBell />, badge: 'notifications' },
      { to: '/aluno/configuracoes', label: 'Configurações', icon: <LuSettings /> },
    ],
  },
  COMPANY: {
    base: '/empresa',
    label: 'Área da empresa',
    main: [
      { to: '/empresa', label: 'Início', icon: <LuLayoutDashboard />, end: true },
      { to: '/empresa/vagas', label: 'Minhas vagas', icon: <LuBriefcase /> },
      { to: '/empresa/candidatos', label: 'Candidatos', icon: <LuUsers /> },
      { to: '/empresa/vagas/nova', label: 'Publicar vaga', icon: <LuPlus /> },
    ],
    account: [
      { to: '/empresa/perfil', label: 'Perfil da empresa', icon: <LuBuilding2 /> },
      { to: '/empresa/notificacoes', label: 'Notificações', icon: <LuBell />, badge: 'notifications' },
      { to: '/empresa/configuracoes', label: 'Configurações', icon: <LuSettings /> },
    ],
  },
  ADMIN: {
    base: '/admin',
    label: 'Administração',
    main: [{ to: '/admin', label: 'Painel', icon: <LuShieldCheck />, end: true }],
    account: [{ to: '/admin/configuracoes', label: 'Configurações', icon: <LuSettings /> }],
  },
};

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const unread = useUnreadCount();
  const [navOpen, setNavOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const menuRef = useDismiss<HTMLDivElement>(menuOpen, closeMenu);

  useEffect(() => {
    setNavOpen(false);
    setMenuOpen(false);
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!user) return null;
  const config = navByRole[user.role];
  const displayName = user.role === 'COMPANY' ? user.companyName || user.name : user.name;
  const avatarSrc = user.role === 'COMPANY' ? user.companyLogo : user.profileImage;
  const profilePath = user.role === 'STUDENT' ? '/aluno/perfil' : user.role === 'COMPANY' ? '/empresa/perfil' : '/admin';
  const settingsPath = `${config.base}/configuracoes`;

  const handleLogout = () => {
    logout();
    navigate('/entrar', { replace: true });
  };

  const renderItem = (item: NavItem) => (
    <NavLink key={item.to} to={item.to} end={item.end} className="nav-link">
      {item.icon}
      <span>{item.label}</span>
      {item.badge === 'notifications' && unread > 0 && <span className="nav-link__badge">{unread > 99 ? '99+' : unread}</span>}
    </NavLink>
  );

  return (
    <div className={`app-shell${navOpen ? ' app-shell--nav-open' : ''}`}>
      <a href="#conteudo" className="skip-link">
        Pular para o conteúdo
      </a>

      <aside className="sidebar" aria-label="Menu principal">
        <div className="sidebar__brand">
          <Logo to={config.base} small />
          <button type="button" className="btn btn--ghost btn--icon btn--sm topbar__menu" onClick={() => setNavOpen(false)} aria-label="Fechar menu">
            <LuX />
          </button>
        </div>
        <div className="sidebar__role">{config.label}</div>
        <nav className="sidebar__nav">
          {config.main.map(renderItem)}
          <div className="sidebar__section">Conta</div>
          {config.account.map(renderItem)}
        </nav>
        <div className="sidebar__footer">
          <Link to={profilePath} className="sidebar__user">
            <Avatar name={displayName} src={avatarSrc} size="sm" square={user.role === 'COMPANY'} />
            <div className="sidebar__user-info">
              <div className="sidebar__user-name">{displayName}</div>
              <div className="sidebar__user-email">{user.email}</div>
            </div>
          </Link>
          <button type="button" className="nav-link" style={{ border: 0, background: 'none', width: '100%' }} onClick={handleLogout}>
            <LuLogOut /> <span>Sair</span>
          </button>
        </div>
      </aside>
      <div className="sidebar-overlay" onClick={() => setNavOpen(false)} aria-hidden="true" />

      <div className="app-main">
        <header className={`topbar${scrolled ? ' topbar--scrolled' : ''}`}>
          <button type="button" className="icon-button topbar__menu" onClick={() => setNavOpen(true)} aria-label="Abrir menu">
            <LuMenu />
          </button>

          {user.role === 'STUDENT' && (
            <form
              className="topbar__search"
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                const q = new FormData(e.currentTarget).get('q')?.toString().trim();
                navigate(q ? `/aluno/vagas?search=${encodeURIComponent(q)}` : '/aluno/vagas');
              }}
            >
              <div className="input-group">
                <span className="input-group__icon">
                  <LuSearch />
                </span>
                <input name="q" className="input" placeholder="Buscar vagas, empresas ou áreas…" aria-label="Buscar vagas" />
              </div>
            </form>
          )}

          <div className="topbar__actions">
            {user.role === 'COMPANY' && (
              <Link to="/empresa/vagas/nova" className="btn btn--primary btn--sm" style={{ minHeight: 40 }}>
                <LuPlus /> <span className="user-button__name">Publicar vaga</span>
              </Link>
            )}
            {user.role !== 'ADMIN' && <NotificationBell allPath={`${config.base}/notificacoes`} />}
            <div className="dropdown" ref={menuRef}>
              <button type="button" className="user-button" onClick={() => setMenuOpen((o) => !o)} aria-expanded={menuOpen} aria-haspopup="menu">
                <Avatar name={displayName} src={avatarSrc} size="xs" square={user.role === 'COMPANY'} />
                <span className="user-button__name">{displayName.split(' ')[0]}</span>
                <LuChevronDown aria-hidden="true" />
              </button>
              {menuOpen && (
                <div className="dropdown__menu" role="menu">
                  <div style={{ padding: '8px 10px 10px' }}>
                    <div style={{ fontWeight: 650, fontSize: 14 }}>{displayName}</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>
                      {user.email}
                    </div>
                  </div>
                  <div className="dropdown__separator" />
                  {user.role !== 'ADMIN' && (
                    <Link to={profilePath} className="dropdown__item" role="menuitem">
                      <LuUser /> Meu perfil
                    </Link>
                  )}
                  <Link to={settingsPath} className="dropdown__item" role="menuitem">
                    <LuSettings /> Configurações
                  </Link>
                  <div className="dropdown__separator" />
                  <button type="button" className="dropdown__item dropdown__item--danger" role="menuitem" onClick={handleLogout}>
                    <LuLogOut /> Sair da conta
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main id="conteudo" className="app-content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

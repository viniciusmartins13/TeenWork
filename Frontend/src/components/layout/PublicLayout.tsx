import type { ReactNode } from 'react';
import { LuArrowRight } from 'react-icons/lu';
import { Link } from 'react-router-dom';
import { homePathFor, useAuth } from '../../context/AuthContext';
import { Logo } from '../brand/Logo';

export function PublicHeader() {
  const { user } = useAuth();
  return (
    <header className="public-header">
      <div className="container public-header__inner">
        <Logo />
        <nav className="public-nav" aria-label="Seções">
          <a href="/#como-funciona">Como funciona</a>
          <a href="/#estudantes">Para estudantes</a>
          <a href="/#empresas">Para empresas</a>
          <a href="/#vagas">Vagas</a>
        </nav>
        <div className="public-header__actions">
          {user ? (
            <Link to={homePathFor(user.role)} className="btn btn--primary">
              Ir para minha área <LuArrowRight />
            </Link>
          ) : (
            <>
              <Link to="/entrar" className="btn btn--ghost">
                Entrar
              </Link>
              <Link to="/cadastro?tipo=empresa" className="btn btn--secondary">
                Sou empresa
              </Link>
              <Link to="/cadastro" className="btn btn--primary">
                Criar conta
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="public-footer">
      <div className="container">
        <div className="public-footer__grid">
          <div className="stack">
            <Logo light />
            <p style={{ maxWidth: 320 }}>
              Conectando estudantes do ensino médio e técnico ao primeiro emprego, Jovem Aprendiz, estágios e cursos.
            </p>
          </div>
          <div>
            <h4>Estudantes</h4>
            <ul>
              <li><Link to="/cadastro">Criar perfil</Link></li>
              <li><Link to="/entrar?redirect=/aluno/vagas">Buscar vagas</Link></li>
              <li><Link to="/entrar?redirect=/aluno/candidaturas">Minhas candidaturas</Link></li>
            </ul>
          </div>
          <div>
            <h4>Empresas</h4>
            <ul>
              <li><Link to="/cadastro?tipo=empresa">Cadastrar empresa</Link></li>
              <li><Link to="/entrar?redirect=/empresa/vagas/nova">Publicar vaga</Link></li>
              <li><Link to="/entrar?redirect=/empresa/candidatos">Ver candidatos</Link></li>
            </ul>
          </div>
          <div>
            <h4>Plataforma</h4>
            <ul>
              <li><a href="/#como-funciona">Como funciona</a></li>
              <li><a href="/swagger" target="_blank" rel="noreferrer">Documentação da API</a></li>
            </ul>
          </div>
        </div>
        <div className="public-footer__bottom">
          <span>© {new Date().getFullYear()} TeenWork — Trabalho de Conclusão de Curso (ETEC · Desenvolvimento de Sistemas).</span>
          <span>Feito com cuidado para quem está começando.</span>
        </div>
      </div>
    </footer>
  );
}

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a href="#conteudo" className="skip-link">
        Pular para o conteúdo
      </a>
      <PublicHeader />
      <main id="conteudo">{children}</main>
      <PublicFooter />
    </>
  );
}

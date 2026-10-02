import type { ReactNode } from 'react';
import { LuBadgeCheck, LuBell, LuRoute, LuSparkles } from 'react-icons/lu';
import { Logo } from '../brand/Logo';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth">
      <aside className="auth__aside">
        <Logo light />
        <div>
          <h2 className="auth__headline">Sua primeira oportunidade está mais perto do que parece.</h2>
          <p className="auth__lead">
            Vagas pensadas para quem está no ensino médio ou técnico — e empresas que querem formar novos talentos.
          </p>
          <ul className="auth__points">
            <li>
              <LuSparkles aria-hidden="true" /> Jovem Aprendiz, estágio, primeiro emprego e cursos
            </li>
            <li>
              <LuRoute aria-hidden="true" /> Acompanhe cada etapa da sua candidatura
            </li>
            <li>
              <LuBell aria-hidden="true" /> Seja avisado quando a empresa responder
            </li>
            <li>
              <LuBadgeCheck aria-hidden="true" /> Gratuito para estudantes
            </li>
          </ul>
        </div>
        <p className="auth__foot">TeenWork · Projeto de TCC — Desenvolvimento de Sistemas</p>
      </aside>
      <main className="auth__main" id="conteudo">
        <div className="auth__form-wrap">
          <div className="auth__mobile-logo">
            <Logo />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

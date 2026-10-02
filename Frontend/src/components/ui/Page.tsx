import type { ReactNode } from 'react';
import { LuArrowLeft } from 'react-icons/lu';
import { Link } from 'react-router-dom';

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  back?: { to: string; label: string };
}

export function PageHeader({ title, subtitle, eyebrow, actions, back }: PageHeaderProps) {
  return (
    <>
      {back && (
        <Link to={back.to} className="back-link">
          <LuArrowLeft aria-hidden="true" /> {back.label}
        </Link>
      )}
      <header className="page-header">
        <div>
          {eyebrow && <div className="page-header__eyebrow">{eyebrow}</div>}
          <h1 className="page-header__title">{title}</h1>
          {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="page-header__actions">{actions}</div>}
      </header>
    </>
  );
}

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  tone?: 'brand' | 'success' | 'warning' | 'sky';
}

export function StatCard({ icon, label, value, tone = 'brand' }: StatCardProps) {
  return (
    <div className={`card stat-card${tone !== 'brand' ? ` stat-card--${tone}` : ''}`}>
      <span className="stat-card__icon" aria-hidden="true">
        {icon}
      </span>
      <span className="stat-card__value">{value}</span>
      <span className="stat-card__label">{label}</span>
    </div>
  );
}

export function Card({ title, icon, actions, children, footer, padded = true }: {
  title?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  padded?: boolean;
}) {
  return (
    <section className="card">
      {title && (
        <div className="card__header">
          <h2 className="card__title">
            {icon}
            {title}
          </h2>
          {actions}
        </div>
      )}
      {padded ? <div className="card__body">{children}</div> : children}
      {footer && <div className="card__footer">{footer}</div>}
    </section>
  );
}

import type { CSSProperties, ReactNode } from 'react';
import { LuRefreshCw, LuWifiOff } from 'react-icons/lu';
import type { ApiError } from '../../lib/api';
import { LogoMark } from '../brand/Logo';
import { Button } from './Button';

export function Skeleton({ width, height, circle, className, style }: {
  width?: number | string;
  height?: number | string;
  circle?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      className={`skeleton${circle ? ' skeleton--circle' : ''}${className ? ` ${className}` : ''}`}
      style={{ width, height: height ?? 12, ...style }}
      aria-hidden="true"
    />
  );
}

export function SkeletonLines({ lines = 3 }: { lines?: number }) {
  return (
    <div className="stack stack--sm" aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? '60%' : '100%'} />
      ))}
    </div>
  );
}

interface EmptyStateProps {
  icon: ReactNode;
  title: ReactNode;
  text?: ReactNode;
  actions?: ReactNode;
  compact?: boolean;
  tone?: 'brand' | 'danger';
}

export function EmptyState({ icon, title, text, actions, compact, tone = 'brand' }: EmptyStateProps) {
  return (
    <div className={`empty-state${compact ? ' empty-state--compact' : ''}${tone === 'danger' ? ' empty-state--danger' : ''}`}>
      <div className="empty-state__icon" aria-hidden="true">
        {icon}
      </div>
      <h3 className="empty-state__title">{title}</h3>
      {text && <p className="empty-state__text">{text}</p>}
      {actions && <div className="empty-state__actions">{actions}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, compact }: { error?: ApiError; onRetry?: () => void; compact?: boolean }) {
  const offline = error?.status === 0;
  return (
    <EmptyState
      tone="danger"
      compact={compact}
      icon={<LuWifiOff />}
      title={offline ? 'Sem conexão com o servidor' : 'Não foi possível carregar'}
      text={error?.message ?? 'Tente novamente em instantes.'}
      actions={
        onRetry && (
          <Button variant="secondary" icon={<LuRefreshCw />} onClick={onRetry}>
            Tentar novamente
          </Button>
        )
      }
    />
  );
}

export function PageLoader({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div className="page-loader" role="status">
      <div style={{ display: 'grid', placeItems: 'center', gap: 16 }}>
        <LogoMark className="page-loader__mark" />
        <span>{label}</span>
      </div>
    </div>
  );
}

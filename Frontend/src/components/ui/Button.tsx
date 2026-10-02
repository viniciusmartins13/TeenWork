import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'soft'
  | 'ghost'
  | 'danger'
  | 'danger-ghost'
  | 'success'
  | 'white'
  | 'glass';

interface CommonProps {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
  icon?: ReactNode;
  iconOnly?: boolean;
}

function classes({ variant = 'secondary', size = 'md', block, iconOnly }: CommonProps, extra?: string) {
  return [
    'btn',
    `btn--${variant}`,
    size !== 'md' && `btn--${size}`,
    block && 'btn--block',
    iconOnly && 'btn--icon',
    extra,
  ]
    .filter(Boolean)
    .join(' ');
}

interface ButtonProps extends CommonProps, ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export function Button({ variant, size, block, icon, iconOnly, loading, disabled, children, className, type, ...rest }: ButtonProps) {
  return (
    <button
      type={type ?? 'button'}
      className={classes({ variant, size, block, iconOnly }, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <span className="spinner" aria-hidden="true" /> : icon}
      {children}
    </button>
  );
}

interface ButtonLinkProps extends CommonProps {
  to: string;
  children?: ReactNode;
  className?: string;
  state?: unknown;
  'aria-label'?: string;
}

export function ButtonLink({ to, variant, size, block, icon, iconOnly, children, className, state, ...rest }: ButtonLinkProps) {
  return (
    <Link to={to} state={state} className={classes({ variant, size, block, iconOnly }, className)} {...rest}>
      {icon}
      {children}
    </Link>
  );
}

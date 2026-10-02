import { useId } from 'react';
import { Link } from 'react-router-dom';

export function LogoMark({ className = 'logo__mark' }: { className?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#0340BD" />
          <stop offset="1" stopColor="#14B2F9" />
        </linearGradient>
        <linearGradient id={`${id}-fg`} gradientUnits="userSpaceOnUse" x1="0" y1="12" x2="0" y2="52">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#DCEBFF" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill={`url(#${id}-bg)`} />
      <g transform="translate(3 0) skewX(-9)" fill="none" stroke={`url(#${id}-fg)`} strokeLinejoin="miter" strokeMiterlimit={2}>
        <path d="M9 17.5h24.5" strokeWidth={8.5} />
        <path d="M21.5 13.5v35" strokeWidth={8.5} />
        <path d="M32.5 13.5l5.2 33 5.8-17 5.8 17 5.2-33" strokeWidth={7.5} />
      </g>
    </svg>
  );
}

interface LogoProps {
  to?: string;
  light?: boolean;
  small?: boolean;
}

export function Logo({ to = '/', light, small }: LogoProps) {
  return (
    <Link to={to} className={`logo${light ? ' logo--light' : ''}${small ? ' logo--sm' : ''}`} aria-label="TeenWork — início">
      <LogoMark />
      <span className="logo__word">TeenWork</span>
    </Link>
  );
}

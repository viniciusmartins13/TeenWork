import { useState } from 'react';
import { assetUrl } from '../../lib/api';
import { initials } from '../../lib/format';

const palette = [
  ['#dfeaff', '#0a46c2'],
  ['#dcf3fe', '#0369a1'],
  ['#e6f7f0', '#067a55'],
  ['#fff5df', '#975a0a'],
  ['#efe7ff', '#5b21b6'],
  ['#fde8f1', '#9d174d'],
];

function colorFor(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return palette[hash % palette.length];
}

interface AvatarProps {
  name?: string | null;
  src?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  square?: boolean;
  ring?: boolean;
}

export function Avatar({ name, src, size = 'md', square, ring }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const url = assetUrl(src);
  const [bg, fg] = colorFor(name ?? '?');
  const cls = ['avatar', size !== 'md' && `avatar--${size}`, square && 'avatar--square', ring && 'avatar--ring']
    .filter(Boolean)
    .join(' ');

  return (
    <span className={cls} style={url && !failed ? undefined : { background: bg, color: fg }} aria-hidden="true">
      {url && !failed ? <img src={url} alt="" onError={() => setFailed(true)} /> : initials(name)}
    </span>
  );
}

import { useRef, useState } from 'react';
import { LuCamera } from 'react-icons/lu';
import { useToast } from '../../context/ToastContext';
import { Avatar } from './Avatar';

interface ImageUploadProps {
  name: string;
  src?: string | null;
  square?: boolean;
  size?: 'xl' | 'xxl';
  label: string;
  onUpload: (file: File) => Promise<string>;
  onRemove?: () => Promise<void>;
}

const MAX_BYTES = 2 * 1024 * 1024;
const ACCEPT = ['image/jpeg', 'image/png', 'image/webp'];

export function ImageUpload({ name, src, square, size = 'xxl', label, onUpload, onRemove }: ImageUploadProps) {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPT.includes(file.type)) {
      toast.error('Formato não suportado', 'Envie uma imagem JPG, PNG ou WEBP.');
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error('Imagem muito grande', 'O tamanho máximo é 2 MB.');
      return;
    }
    setBusy(true);
    try {
      await onUpload(file);
      toast.success('Imagem atualizada');
    } catch (err) {
      toast.error('Não foi possível enviar a imagem', (err as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div className="stack stack--sm" style={{ alignItems: 'center' }}>
      <div className="avatar-upload" style={{ opacity: busy ? 0.6 : 1 }}>
        <Avatar name={name} src={src} size={size} square={square} ring />
        <button type="button" className="avatar-upload__button" onClick={() => input.current?.click()} disabled={busy} aria-label={label} title={label}>
          {busy ? <span className="spinner" /> : <LuCamera />}
        </button>
        <input
          ref={input}
          type="file"
          accept={ACCEPT.join(',')}
          hidden
          onChange={(e) => pick(e.target.files?.[0])}
        />
      </div>
      {src && onRemove && (
        <button
          type="button"
          className="link-button"
          style={{ fontSize: 12, color: 'var(--muted)' }}
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onRemove();
              toast.success('Imagem removida');
            } catch (err) {
              toast.error('Não foi possível remover', (err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          Remover
        </button>
      )}
    </div>
  );
}

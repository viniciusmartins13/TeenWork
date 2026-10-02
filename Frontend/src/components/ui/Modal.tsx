import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { LuTrash2, LuTriangleAlert, LuX } from 'react-icons/lu';
import { Button, type ButtonVariant } from './Button';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  iconTone?: 'brand' | 'danger';
  size?: 'md' | 'lg';
  footer?: ReactNode;
  children?: ReactNode;
  /** Impede fechar durante uma operação em andamento. */
  locked?: boolean;
}

export function Modal({ open, onClose, title, description, icon, iconTone = 'brand', size = 'md', footer, children, locked }: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusFirst = () => {
      const el = panelRef.current?.querySelector<HTMLElement>(
        'input, textarea, select, button:not(.modal__close), [href]',
      );
      (el ?? panelRef.current)?.focus();
    };
    const timer = window.setTimeout(focusFirst, 30);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !locked) onClose();
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), input, textarea, select'),
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      previous?.focus?.();
    };
  }, [open, onClose, locked]);

  if (!open) return null;

  return createPortal(
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !locked) onClose();
      }}
    >
      <div
        ref={panelRef}
        className={`modal${size === 'lg' ? ' modal--lg' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="modal__header">
          <div className="row" style={{ alignItems: 'flex-start', gap: 14 }}>
            {icon && <span className={`modal__icon${iconTone === 'danger' ? ' modal__icon--danger' : ''}`}>{icon}</span>}
            <div>
              <h2 id={titleId} className="modal__title">
                {title}
              </h2>
              {description && <p className="modal__description">{description}</p>}
            </div>
          </div>
          <button type="button" className="btn btn--ghost btn--icon btn--sm modal__close" onClick={onClose} disabled={locked} aria-label="Fechar">
            <LuX />
          </button>
        </div>
        {children && <div className="modal__body">{children}</div>}
        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'brand';
  confirmVariant?: ButtonVariant;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
  children?: ReactNode;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Voltar',
  tone = 'danger',
  confirmVariant,
  onConfirm,
  onClose,
  children,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      locked={busy}
      title={title}
      description={description}
      icon={tone === 'danger' ? <LuTrash2 /> : <LuTriangleAlert />}
      iconTone={tone === 'danger' ? 'danger' : 'brand'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant ?? (tone === 'danger' ? 'danger' : 'primary')} onClick={handleConfirm} loading={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}

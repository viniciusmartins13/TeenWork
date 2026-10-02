import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { LuCheck, LuInfo, LuTriangleAlert, LuX } from 'react-icons/lu';

type ToastKind = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  message?: string;
}

interface ToastApi {
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const icons: Record<ToastKind, ReactNode> = {
  success: <LuCheck />,
  error: <LuX />,
  info: <LuInfo />,
  warning: <LuTriangleAlert />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (kind: ToastKind, title: string, message?: string) => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-3), { id, kind, title, message }]);
      window.setTimeout(() => dismiss(id), kind === 'error' ? 6500 : 4200);
    },
    [dismiss],
  );

  const value = useMemo<ToastApi>(
    () => ({
      success: (t, m) => push('success', t, m),
      error: (t, m) => push('error', t, m),
      info: (t, m) => push('info', t, m),
      warning: (t, m) => push('warning', t, m),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.kind}`} role={toast.kind === 'error' ? 'alert' : 'status'}>
            <span className="toast__icon" aria-hidden="true">
              {icons[toast.kind]}
            </span>
            <div className="toast__content">
              <div className="toast__title">{toast.title}</div>
              {toast.message && <div className="toast__message">{toast.message}</div>}
            </div>
            <button type="button" className="toast__close" onClick={() => dismiss(toast.id)} aria-label="Fechar aviso">
              <LuX />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast precisa estar dentro de <ToastProvider>.');
  return ctx;
}

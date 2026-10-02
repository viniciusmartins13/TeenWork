import { useId, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { LuCircleAlert, LuEye, LuEyeOff } from 'react-icons/lu';

interface FieldShellProps {
  id: string;
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  counter?: ReactNode;
  className?: string;
  children: ReactNode;
}

function FieldShell({ id, label, hint, error, optional, counter, className, children }: FieldShellProps) {
  return (
    <div className={`field${className ? ` ${className}` : ''}`}>
      {label && (
        <label htmlFor={id} className="field__label">
          <span>
            {label} {optional && <span className="field__optional">(opcional)</span>}
          </span>
          {counter && <span className="field__counter">{counter}</span>}
        </label>
      )}
      {children}
      {error ? (
        <span className="field__error" id={`${id}-error`} role="alert">
          <LuCircleAlert aria-hidden="true" /> {error}
        </span>
      ) : (
        hint && (
          <span className="field__hint" id={`${id}-hint`}>
            {hint}
          </span>
        )
      )}
    </div>
  );
}

function describedBy(id: string, error?: string, hint?: ReactNode) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  icon?: ReactNode;
  fieldClassName?: string;
  showCounter?: boolean;
}

export function TextField({ label, hint, error, optional, icon, fieldClassName, showCounter, id, ...input }: TextFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const counter = showCounter && input.maxLength ? `${String(input.value ?? '').length}/${input.maxLength}` : undefined;
  const control = (
    <input
      id={inputId}
      className="input"
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(inputId, error, hint)}
      {...input}
    />
  );
  return (
    <FieldShell id={inputId} label={label} hint={hint} error={error} optional={optional} counter={counter} className={fieldClassName}>
      {icon ? (
        <div className="input-group">
          <span className="input-group__icon">{icon}</span>
          {control}
        </div>
      ) : (
        control
      )}
    </FieldShell>
  );
}

export function PasswordField({ label, hint, error, optional, icon, fieldClassName, id, ...input }: TextFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [visible, setVisible] = useState(false);
  return (
    <FieldShell id={inputId} label={label} hint={hint} error={error} optional={optional} className={fieldClassName}>
      <div className="input-group">
        {icon && <span className="input-group__icon">{icon}</span>}
        <input
          id={inputId}
          className="input"
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(inputId, error, hint)}
          style={icon ? undefined : { paddingLeft: 14 }}
          {...input}
        />
        <span className="input-group__action">
          <button
            type="button"
            className="btn btn--ghost btn--icon btn--sm"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {visible ? <LuEyeOff /> : <LuEye />}
          </button>
        </span>
      </div>
    </FieldShell>
  );
}

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  fieldClassName?: string;
}

export function TextAreaField({ label, hint, error, optional, fieldClassName, id, ...textarea }: TextAreaFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const counter = textarea.maxLength ? `${String(textarea.value ?? '').length}/${textarea.maxLength}` : undefined;
  return (
    <FieldShell id={inputId} label={label} hint={hint} error={error} optional={optional} counter={counter} className={fieldClassName}>
      <textarea
        id={inputId}
        className="textarea"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(inputId, error, hint)}
        {...textarea}
      />
    </FieldShell>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  fieldClassName?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function SelectField({ label, hint, error, optional, fieldClassName, options, placeholder, id, ...select }: SelectFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <FieldShell id={inputId} label={label} hint={hint} error={error} optional={optional} className={fieldClassName}>
      <select
        id={inputId}
        className="select"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(inputId, error, hint)}
        {...select}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
  error?: string;
}

export function Checkbox({ label, error, ...input }: CheckboxProps) {
  return (
    <div className="field">
      <label className="checkbox">
        <input type="checkbox" aria-invalid={error ? true : undefined} {...input} />
        <span>{label}</span>
      </label>
      {error && (
        <span className="field__error" role="alert">
          <LuCircleAlert aria-hidden="true" /> {error}
        </span>
      )}
    </div>
  );
}

export function FormAlert({ kind = 'error', children }: { kind?: 'error' | 'info' | 'success' | 'warning'; children: ReactNode }) {
  return (
    <div className={`form-alert${kind !== 'error' ? ` form-alert--${kind}` : ''}`} role={kind === 'error' ? 'alert' : 'status'}>
      <LuCircleAlert aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

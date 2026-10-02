import { useState, type KeyboardEvent } from 'react';
import { LuX } from 'react-icons/lu';

interface TagInputProps {
  id?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  max?: number;
  maxLength?: number;
  placeholder?: string;
  suggestions?: string[];
}

export function TagInput({ id, value, onChange, max = 30, maxLength = 40, placeholder, suggestions = [] }: TagInputProps) {
  const [draft, setDraft] = useState('');

  const add = (raw: string) => {
    const tag = raw.replace(/;/g, '').trim().slice(0, maxLength);
    if (!tag || value.length >= max) return;
    if (value.some((t) => t.toLowerCase() === tag.toLowerCase())) return;
    onChange([...value, tag]);
    setDraft('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(draft);
    } else if (e.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  const available = suggestions.filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase())).slice(0, 8);

  return (
    <div className="stack stack--sm">
      <div className="tag-input" onClick={(e) => (e.currentTarget.querySelector('input') as HTMLInputElement | null)?.focus()}>
        {value.map((tag) => (
          <span key={tag} className="chip chip--brand">
            {tag}
            <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))} aria-label={`Remover ${tag}`}>
              <LuX />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          maxLength={maxLength}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => draft && add(draft)}
          placeholder={value.length >= max ? `Limite de ${max} habilidades` : placeholder}
          disabled={value.length >= max}
        />
      </div>
      {available.length > 0 && (
        <div className="chip-list" aria-label="Sugestões">
          {available.map((s) => (
            <button key={s} type="button" className="toggle-chip" style={{ height: 28, fontSize: 12 }} onClick={() => add(s)}>
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

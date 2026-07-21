import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { inputClass } from './TextInput';

export type SelectOption = { value: string; label: string };

export type SelectInputProps = {
  id: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  describedBy?: string;
  placeholder: string;
  options: readonly SelectOption[];
};

/**
 * Custom select — the native <select> popup is OS-rendered and can't be
 * styled to match the form. ARIA 1.2 select-only combobox pattern: the
 * trigger button keeps focus, options are highlighted via
 * aria-activedescendant (never focused), so blur/focus handling stays simple
 * and focusFirstError's aria-invalid scan still lands on the button.
 */
export function SelectInput({
  id,
  value,
  onChange,
  onBlur,
  error,
  describedBy,
  placeholder,
  options,
}: SelectInputProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typeahead = useRef({ buffer: '', at: 0 });

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selectedLabel = selectedIndex >= 0 ? options[selectedIndex].label : '';
  const listboxId = `${id}-listbox`;

  useEffect(() => {
    if (!open || activeIndex < 0) return;
    listRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex]);

  const openList = () => {
    setOpen(true);
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
  };

  const commit = (index: number) => {
    onChange(options[index].value);
    setOpen(false);
  };

  const moveActive = (next: number) => {
    setActiveIndex(Math.max(0, Math.min(options.length - 1, next)));
  };

  const handleTypeahead = (key: string) => {
    if (!/^[a-z0-9 ]$/i.test(key)) return false;
    const now = Date.now();
    const t = typeahead.current;
    t.buffer = now - t.at > 500 ? key : t.buffer + key;
    t.at = now;
    const query = t.buffer.toLowerCase();
    const start = activeIndex >= 0 ? activeIndex : 0;
    // With a repeated single char, cycle to the next match; with a longer
    // buffer, stay on the current option while it still matches.
    const from = query.length > 1 ? 0 : 1;
    for (let step = from; step <= options.length; step++) {
      const i = (start + step) % options.length;
      if (options[i].label.toLowerCase().startsWith(query)) {
        if (!open) openList();
        moveActive(i);
        return true;
      }
    }
    return true;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (open) moveActive(activeIndex + 1);
        else openList();
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (open) moveActive(activeIndex - 1);
        else openList();
        break;
      case 'Home':
        if (open) {
          e.preventDefault();
          moveActive(0);
        }
        break;
      case 'End':
        if (open) {
          e.preventDefault();
          moveActive(options.length - 1);
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (open && activeIndex >= 0) commit(activeIndex);
        else openList();
        break;
      case 'Escape':
        if (open) {
          e.preventDefault();
          setOpen(false);
        }
        break;
      case 'Tab':
        setOpen(false);
        break;
      default:
        if (handleTypeahead(e.key)) e.preventDefault();
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        id={id}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={open && activeIndex >= 0 ? `${id}-opt-${activeIndex}` : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={handleKeyDown}
        onBlur={(e) => {
          if (wrapperRef.current?.contains(e.relatedTarget as Node | null)) return;
          setOpen(false);
          onBlur?.();
        }}
        className={inputClass(!!error, 'flex items-center justify-between gap-2 text-left')}
      >
        <span className={`truncate ${selectedLabel ? '' : 'text-[#9CA3AF]'}`}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[#6B7280] transition-transform duration-[130ms] ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open ? (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label={placeholder}
          className="absolute z-20 mt-1 max-h-[264px] w-full overflow-y-auto rounded-[var(--brand-radius)] border-[1.5px] border-[#E5E7EB] bg-white py-1 shadow-[0_4px_24px_rgba(0,0,0,0.08)]"
        >
          {options.map((opt, i) => {
            const selected = i === selectedIndex;
            const active = i === activeIndex;
            return (
              <li
                key={opt.value}
                id={`${id}-opt-${i}`}
                role="option"
                aria-selected={selected}
                data-index={i}
                // preventDefault keeps focus on the trigger so blur logic stays simple
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => commit(i)}
                onMouseMove={() => { if (!active) setActiveIndex(i); }}
                className={[
                  'flex min-h-[44px] cursor-pointer items-center justify-between gap-2 px-3 text-[15px]',
                  active ? 'bg-[var(--brand-light)]' : '',
                  selected ? 'font-medium text-[var(--brand-color)]' : 'text-[#111827]',
                ].join(' ')}
              >
                <span className="truncate">{opt.label}</span>
                {selected ? (
                  <Check className="h-4 w-4 shrink-0 text-[var(--brand-color)]" aria-hidden />
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

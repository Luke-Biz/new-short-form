import { useEffect, useRef, useState } from 'react';
import { Search, Loader } from 'lucide-react';
import { inputClass } from './TextInput';
import { searchAbr, type AbrResult } from '../../lib/abrLookup';

export type BusinessNameAutocompleteProps = {
  id: string;
  value: string;
  /** Updates businessName. */
  onChange: (v: string) => void;
  /** ABN of the picked match; '' when the user edits the name by hand. */
  onAbnChange: (abn: string) => void;
  onBlur?: () => void;
  error?: string;
  describedBy?: string;
  placeholder?: string;
  autoFocus?: boolean;
};

type Status = 'idle' | 'loading' | 'error';

const DEBOUNCE_MS = 400;

/**
 * Business name field with ABR autocomplete. An editable combobox (ARIA 1.2
 * autocomplete-list pattern): the input keeps focus, results are highlighted
 * via aria-activedescendant. The lookup is a progressive enhancement — the
 * field works as plain text if the API is slow, errors, or finds nothing, and
 * never blocks submission.
 */
export function BusinessNameAutocomplete({
  id,
  value,
  onChange,
  onAbnChange,
  onBlur,
  error,
  describedBy,
  placeholder,
  autoFocus,
}: BusinessNameAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<AbrResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [status, setStatus] = useState<Status>('idle');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listboxId = `${id}-listbox`;

  // The value we just committed from a pick — suppresses a re-search for it.
  const justSelected = useRef<string | null>(null);
  const debounceTimer = useRef<number | undefined>(undefined);
  const abortRef = useRef<AbortController | null>(null);

  // Debounced ABR search whenever the typed value changes.
  useEffect(() => {
    const q = value.trim();
    if (justSelected.current === value || q.length < 2) {
      setResults([]);
      setStatus('idle');
      setOpen(false);
      return;
    }

    setStatus('loading');
    setOpen(true);
    window.clearTimeout(debounceTimer.current);
    debounceTimer.current = window.setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      searchAbr(q, controller.signal)
        .then((items) => {
          if (controller.signal.aborted) return;
          setResults(items);
          setActiveIndex(items.length ? 0 : -1);
          setStatus('idle');
        })
        .catch((err) => {
          if (controller.signal.aborted || (err as Error).name === 'AbortError') return;
          setResults([]);
          setStatus('error');
        });
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(debounceTimer.current);
  }, [value]);

  useEffect(() => {
    if (!open || activeIndex < 0) return;
    listRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex]);

  const commit = (index: number) => {
    const picked = results[index];
    if (!picked) return;
    justSelected.current = picked.name;
    onChange(picked.name);
    onAbnChange(picked.abn);
    setOpen(false);
    setResults([]);
  };

  const handleInput = (v: string) => {
    justSelected.current = null;
    onAbnChange(''); // typing invalidates any previously captured ABN
    onChange(v);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (open && results.length) setActiveIndex((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (open && results.length) setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      if (open && activeIndex >= 0 && results.length) {
        e.preventDefault();
        commit(activeIndex);
      }
    } else if (e.key === 'Escape') {
      if (open) {
        e.preventDefault();
        setOpen(false);
      }
    }
  };

  const showPanel = open && (status !== 'idle' || results.length > 0);

  return (
    <div ref={wrapperRef} className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-9 items-center justify-center text-[#9CA3AF]">
        {status === 'loading' ? <Loader className="h-4 w-4 animate-spin" aria-hidden /> : <Search className="h-4 w-4" aria-hidden />}
      </div>
      <input
        id={id}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showPanel}
        aria-controls={listboxId}
        aria-activedescendant={showPanel && activeIndex >= 0 ? `${id}-opt-${activeIndex}` : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        autoComplete="off"
        placeholder={placeholder}
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => handleInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => { if (results.length) setOpen(true); }}
        onBlur={(e) => {
          if (wrapperRef.current?.contains(e.relatedTarget as Node | null)) return;
          setOpen(false);
          onBlur?.();
        }}
        className={inputClass(!!error, 'pl-9')}
      />

      {showPanel ? (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label="Matching businesses"
          className="absolute z-20 mt-1 max-h-[264px] w-full overflow-y-auto rounded-[var(--brand-radius)] border-[1.5px] border-[#E5E7EB] bg-white py-1 shadow-[0_4px_24px_rgba(0,0,0,0.08)]"
        >
          {status === 'error' ? (
            <li className="px-3 py-2 text-[13px] text-[#6B7280]">
              Lookup unavailable — just type your business name.
            </li>
          ) : status === 'loading' && !results.length ? (
            <li className="px-3 py-2 text-[13px] text-[#6B7280]">Searching…</li>
          ) : results.length === 0 ? (
            <li className="px-3 py-2 text-[13px] text-[#6B7280]">
              No matches — type your business name to continue.
            </li>
          ) : (
            results.map((r, i) => {
              const active = i === activeIndex;
              return (
                <li
                  key={`${r.abn}-${i}`}
                  id={`${id}-opt-${i}`}
                  role="option"
                  aria-selected={active}
                  data-index={i}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => commit(i)}
                  onMouseMove={() => { if (!active) setActiveIndex(i); }}
                  className={[
                    'flex cursor-pointer flex-col gap-0.5 px-3 py-2 text-[15px]',
                    active ? 'bg-[var(--brand-light)]' : '',
                  ].join(' ')}
                >
                  <span className="truncate text-[#111827]">{r.name}</span>
                  <span className="text-[12px] text-[#6B7280]">ABN {r.abn}</span>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}

import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { inputBaseClass, labelFloatClass } from './FloatingInput';

export type FloatingSelectProps = {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  describedBy?: string;
  children: ReactNode;
  alwaysFloatLabel?: boolean;
};

export function FloatingSelect({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  describedBy,
  children,
  alwaysFloatLabel,
}: FloatingSelectProps) {
  const [focused, setFocused] = useState(false);
  const [autofillHint, setAutofillHint] = useState(false);
  const floated = Boolean(alwaysFloatLabel) || focused || value.length > 0 || autofillHint;

  return (
    <div className="bizcap-field">
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); onBlur?.(); }}
          onAnimationStart={(e) => {
            if (e.animationName === 'bizcap-autofill-detect') setAutofillHint(true);
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${inputBaseClass(!!error)} appearance-none pr-10`}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute bottom-0 right-[14px] top-0 flex items-center text-[#6B7280]">
          <ChevronDown className="h-4 w-4" aria-hidden />
        </div>
        <label htmlFor={id} className={labelFloatClass(floated)}>
          {label}
        </label>
      </div>
      {error ? (
        <p id={describedBy} className="mt-1 text-[12px] text-[#DC2626]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

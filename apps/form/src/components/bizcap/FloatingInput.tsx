import {
  useState,
  type AnimationEvent,
  type ComponentProps,
  type ReactNode,
} from 'react';

export function inputBaseClass(error: boolean): string {
  return [
    'bizcap-input w-full rounded-[10px] border-[1.5px] bg-white text-[16px] leading-normal text-[#111827]',
    'min-h-[56px] pt-8 pb-2 px-[14px]',
    'focus-visible:outline-none',
    error
      ? 'border-[#DC2626] focus-visible:border-[#DC2626] focus-visible:shadow-[0_0_0_3px_rgba(220,38,38,0.12)]'
      : 'border-[#D1D5DB] focus-visible:border-[var(--brand-color)] focus-visible:shadow-[0_0_0_3px_rgba(0,0,0,0.12)]',
  ].join(' ');
}

export function labelFloatClass(
  floated: boolean,
  labelInset?: { left: string },
): string {
  const left = labelInset?.left ?? 'left-[14px]';
  return [
    `bizcap-float-label pointer-events-none absolute ${left} right-[14px] z-[1] origin-left`,
    floated
      ? 'top-2 text-[11px] font-medium text-[var(--brand-color)]'
      : 'top-1/2 -translate-y-1/2 text-[16px] font-normal text-[#9CA3AF]',
  ].join(' ');
}

export type FloatingInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  describedBy?: string;
  type?: string;
  autoComplete?: string;
  inputMode?: ComponentProps<'input'>['inputMode'];
  className?: string;
  onAnimationStart?: (e: AnimationEvent<HTMLInputElement>) => void;
  prefix?: ReactNode;
  prefixWidthClass?: string;
  iconLeft?: ReactNode;
  inputPaddingLeft?: string;
  labelInsetLeftClass?: string;
  autoFocus?: boolean;
};

export function FloatingInput({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  describedBy,
  type = 'text',
  autoComplete,
  inputMode,
  className = '',
  onAnimationStart,
  prefix,
  prefixWidthClass,
  iconLeft,
  inputPaddingLeft = 'pl-10',
  labelInsetLeftClass,
  autoFocus,
}: FloatingInputProps) {
  const [focused, setFocused] = useState(false);
  const [autofillHint, setAutofillHint] = useState(false);
  const floated = focused || value.length > 0 || autofillHint;

  return (
    <div className={`bizcap-field ${className}`}>
      <div className="relative">
        {prefix ? (
          <div
            className={`pointer-events-none absolute bottom-0 left-0 top-0 z-10 flex items-center border-r border-[#D1D5DB] pl-[14px] pr-2 text-[16px] text-[#374151] ${prefixWidthClass ?? ''}`}
          >
            {prefix}
          </div>
        ) : null}
        {iconLeft ? (
          <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 flex w-10 items-center justify-center text-[#9CA3AF]">
            {iconLeft}
          </div>
        ) : null}
        <input
          id={id}
          type={type}
          autoComplete={autoComplete}
          inputMode={inputMode}
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); onBlur?.(); }}
          onAnimationStart={(e) => {
            if (e.animationName === 'bizcap-autofill-detect') setAutofillHint(true);
            onAnimationStart?.(e);
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${inputBaseClass(!!error)} ${prefix ? 'pl-[88px]' : ''} ${iconLeft ? inputPaddingLeft : ''}`}
        />
        <label
          htmlFor={id}
          className={labelFloatClass(
            floated,
            labelInsetLeftClass ? { left: labelInsetLeftClass } : undefined,
          )}
        >
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

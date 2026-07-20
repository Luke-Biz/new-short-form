import type { ComponentProps, ReactNode } from 'react';

/**
 * Canonical input frame: 44px tall, 1.5px border, 8px radius, 16px text.
 * The error border must survive focus — the whole class set branches on error.
 */
export function inputClass(error: boolean, extra = ''): string {
  return [
    'h-[44px] w-full rounded-[8px] border-[1.5px] bg-white px-3 text-[16px] text-[#111827]',
    'outline-none transition-[border-color] duration-[130ms] placeholder:text-[#9CA3AF]',
    error
      ? 'border-[#991B1B] focus:border-[#991B1B] focus:shadow-[0_0_0_3px_rgba(153,27,27,0.12)]'
      : 'border-[#E5E7EB] focus:border-[var(--brand-color)] focus:shadow-[0_0_0_3px_var(--brand-shadow)]',
    extra,
  ].join(' ');
}

export type TextInputProps = {
  id: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  describedBy?: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: ComponentProps<'input'>['inputMode'];
  autoFocus?: boolean;
  iconLeft?: ReactNode;
};

export function TextInput({
  id,
  value,
  onChange,
  onBlur,
  error,
  describedBy,
  type = 'text',
  placeholder,
  autoComplete,
  inputMode,
  autoFocus,
  iconLeft,
}: TextInputProps) {
  return (
    <div className="relative">
      {iconLeft ? (
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-9 items-center justify-center text-[#9CA3AF]">
          {iconLeft}
        </div>
      ) : null}
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={inputClass(!!error, iconLeft ? 'pl-9' : '')}
      />
    </div>
  );
}

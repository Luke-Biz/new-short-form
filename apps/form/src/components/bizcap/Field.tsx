import type { ReactNode } from 'react';

type FieldProps = {
  id: string;
  label: ReactNode;
  error?: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
  className?: string;
};

/**
 * Label / hint / error wrapper — every field shares this anatomy.
 * Error id is `${id}-err`, hint id is `${id}-hint`; inputs must point
 * aria-describedby at them (see fieldDescribedBy).
 */
export function Field({ id, label, error, hint, optional, children, className = '' }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-[7px] block text-[13px] font-medium text-[#111827]">
        {label}
        {optional ? <span className="ml-1 font-normal text-[#9CA3AF]">(optional)</span> : null}
      </label>
      {hint ? (
        <span id={`${id}-hint`} className="-mt-[3px] mb-[9px] block text-[12px] text-[#9CA3AF]">
          {hint}
        </span>
      ) : null}
      {children}
      {error ? (
        <p id={`${id}-err`} role="alert" className="mt-1.5 text-[12px] text-[#991B1B]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function fieldDescribedBy(
  id: string,
  opts: { hint?: boolean; error?: boolean },
): string | undefined {
  const ids = [opts.hint ? `${id}-hint` : null, opts.error ? `${id}-err` : null].filter(Boolean);
  return ids.length ? ids.join(' ') : undefined;
}

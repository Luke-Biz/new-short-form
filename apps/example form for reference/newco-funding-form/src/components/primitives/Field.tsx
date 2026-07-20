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

export function Field({ id, label, error, hint, optional, children, className }: FieldProps) {
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="block text-[13px] font-medium text-text-primary mb-[0.45rem]"
      >
        {label}
        {optional && (
          <span className="font-normal text-text-tertiary ml-1">(optional)</span>
        )}
      </label>
      {hint && (
        <span
          id={hintId}
          className="block text-[12px] text-text-tertiary mb-[0.6rem] -mt-[0.2rem]"
        >
          {hint}
        </span>
      )}
      {/* Children should spread aria-describedby={[hintId, errorId].filter(Boolean).join(' ')} */}
      <div
        data-error-id={errorId}
        data-hint-id={hintId}
      >
        {children}
      </div>
      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-1.5 text-[12px] text-error-text"
        >
          {error}
        </p>
      )}
    </div>
  );
}

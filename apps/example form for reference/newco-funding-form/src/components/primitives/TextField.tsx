import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> & {
  id: string;
  error?: string;
  describedBy?: string;
};

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField({ id, error, describedBy, ...rest }, ref) {
    const ariaDescribedBy = [describedBy, error ? `${id}-error` : undefined]
      .filter(Boolean)
      .join(' ') || undefined;

    return (
      <input
        ref={ref}
        id={id}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={ariaDescribedBy}
        className={[
          'w-full h-[40px] border-[1.5px] rounded-form-sm px-3 text-[16px] font-sans',
          'text-text-primary bg-surface outline-none appearance-none',
          'transition-[border-color] duration-[130ms] placeholder:text-text-tertiary',
          error
            ? 'border-error-text focus:border-error-text focus-ring-error'
            : 'border-form-border focus:border-brand focus-ring',
        ].join(' ')}
        {...rest}
      />
    );
  },
);

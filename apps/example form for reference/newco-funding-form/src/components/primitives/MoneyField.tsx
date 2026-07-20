import { forwardRef, useCallback, useEffect, useState } from 'react';

type MoneyFieldProps = {
  id: string;
  value: number;
  placeholder?: string;
  error?: string;
  describedBy?: string;
  onValueChange: (raw: number) => void;
  onBlur?: () => void;
};

function formatCurrency(value: string): string {
  const digits = value.replace(/[^0-9]/g, '');
  return digits ? parseInt(digits, 10).toLocaleString('en-US') : '';
}

export function parseCurrency(formatted: string): number {
  const digits = formatted.replace(/[^0-9]/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

export const MoneyField = forwardRef<HTMLInputElement, MoneyFieldProps>(
  function MoneyField({ id, value, placeholder, error, describedBy, onValueChange, onBlur }, ref) {
    const [displayValue, setDisplayValue] = useState(
      value > 0 ? value.toLocaleString('en-US') : '',
    );

    // Sync display when form state changes externally (e.g. form.reset())
    useEffect(() => {
      setDisplayValue(value > 0 ? value.toLocaleString('en-US') : '');
    }, [value]);

    const ariaDescribedBy =
      [describedBy, error ? `${id}-error` : undefined].filter(Boolean).join(' ') || undefined;

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatCurrency(e.target.value);
        setDisplayValue(formatted);
        onValueChange(parseCurrency(formatted));
      },
      [onValueChange],
    );

    return (
      <div className="relative flex items-center">
        <span
          className="absolute left-3 text-[16px] font-medium text-text-muted pointer-events-none"
          aria-hidden="true"
        >
          $
        </span>
        <input
          ref={ref}
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder={placeholder}
          value={displayValue}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={ariaDescribedBy}
          onChange={handleChange}
          onBlur={onBlur}
          className={[
            'w-full h-[40px] border-[1.5px] rounded-form-sm pl-[26px] pr-3 text-[16px] font-sans',
            'text-text-primary bg-surface outline-none appearance-none',
            'transition-[border-color] duration-[130ms] placeholder:text-text-tertiary',
            error
              ? 'border-error-text focus:border-error-text focus-ring-error'
              : 'border-form-border focus:border-brand focus-ring',
          ].join(' ')}
        />
      </div>
    );
  },
);

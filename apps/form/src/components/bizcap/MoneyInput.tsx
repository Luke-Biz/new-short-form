import { formatMoneyWithCommas, stripMoneyToNumberString } from '../../lib/formUtils';
import { inputClass } from './TextInput';

export type MoneyInputProps = {
  id: string;
  /** Raw value without commas (digits + optional decimal point). */
  value: string;
  onChange: (raw: string) => void;
  onBlur?: () => void;
  error?: string;
  describedBy?: string;
  placeholder?: string;
  autoFocus?: boolean;
};

export function MoneyInput({
  id,
  value,
  onChange,
  onBlur,
  error,
  describedBy,
  placeholder,
  autoFocus,
}: MoneyInputProps) {
  return (
    <div className="relative">
      <span
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[16px] font-medium text-[#6B7280]"
        aria-hidden="true"
      >
        $
      </span>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        placeholder={placeholder}
        autoFocus={autoFocus}
        value={formatMoneyWithCommas(value)}
        onChange={(e) => onChange(stripMoneyToNumberString(e.target.value))}
        onBlur={onBlur}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={inputClass(!!error, 'pl-[26px]')}
      />
    </div>
  );
}

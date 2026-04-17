import { useState, type ClipboardEvent, type KeyboardEvent } from 'react';
import { Controller, type Control, type UseFormTrigger } from 'react-hook-form';
import {
  Banknote,
  CircleDollarSign,
  Ellipsis,
  Hammer,
  Package,
  TrendingUp,
  User,
  Wrench,
} from 'lucide-react';
import {
  formatMoneyWithCommas,
  moneyPasteSanitize,
  stripMoneyToNumberString,
} from '../../lib/formUtils';
import { type Step3Data } from '../../lib/schemas';
import { inputBaseClass, labelFloatClass } from './FloatingInput';

const PURPOSES = [
  { id: 'equipment', label: 'Equipment', Icon: Wrench },
  { id: 'inventory', label: 'Inventory', Icon: Package },
  { id: 'growth', label: 'Growth', Icon: TrendingUp },
  { id: 'cashflow', label: 'Cashflow', Icon: Banknote },
  { id: 'debt', label: 'Pay off debt', Icon: CircleDollarSign },
  { id: 'renovation', label: 'Renovation', Icon: Hammer },
  { id: 'personal', label: 'Personal', Icon: User },
  { id: 'other', label: 'Other', Icon: Ellipsis },
] as const;

type Step3LoanDetailsProps = {
  control: Control<Step3Data>;
  formId: string;
  trigger: UseFormTrigger<Step3Data>;
};

export function Step3LoanDetails({ control, formId, trigger }: Step3LoanDetailsProps) {
  const [revenueFocused, setRevenueFocused] = useState(false);
  const [loanFocused, setLoanFocused] = useState(false);
  const [revenueAutofillHint, setRevenueAutofillHint] = useState(false);
  const [loanAutofillHint, setLoanAutofillHint] = useState(false);

  const onMoneyKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const nav = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'Home', 'End',
    ];
    if (nav.includes(e.key)) return;
    const v = e.currentTarget.value;
    if (e.key === '.' && !v.replace(/,/g, '').includes('.')) return;
    if (/\d/.test(e.key)) return;
    e.preventDefault();
  };

  const applyMoneyPaste = (
    e: ClipboardEvent<HTMLInputElement>,
    current: string,
    setter: (s: string) => void,
  ) => {
    e.preventDefault();
    const paste = moneyPasteSanitize(e.clipboardData.getData('text'));
    const selStart = e.currentTarget.selectionStart ?? current.length;
    const selEnd = e.currentTarget.selectionEnd ?? current.length;
    const next = current.slice(0, selStart) + paste + current.slice(selEnd);
    setter(stripMoneyToNumberString(next));
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[26px] font-bold leading-tight text-[#111827]">Your loan</h1>
        <p className="mt-1 text-[15px] font-normal text-[#6B7280]">
          Almost done — tell us what you need.
        </p>
      </div>

      <Controller
        name="monthlyRevenue"
        control={control}
        render={({ field, fieldState }) => {
          const display = revenueFocused ? field.value : formatMoneyWithCommas(field.value);
          return (
            <div className="bizcap-field">
              <div className="relative">
                <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 flex items-center border-r border-[#D1D5DB] pl-[14px] pr-2 text-[16px] text-[#374151]">
                  $
                </div>
                <input
                  id={`${formId}-monthlyRevenue`}
                  type="text"
                  inputMode="decimal"
                  autoFocus
                  value={display}
                  onChange={(e) => { field.onChange(stripMoneyToNumberString(e.target.value)); if (fieldState.invalid) trigger('monthlyRevenue'); }}
                  onKeyDown={onMoneyKeyDown}
                  onPaste={(e) => applyMoneyPaste(e, field.value, field.onChange)}
                  onFocus={() => setRevenueFocused(true)}
                  onBlur={() => { setRevenueFocused(false); field.onBlur(); }}
                  onAnimationStart={(e) => {
                    if (e.animationName === 'bizcap-autofill-detect') setRevenueAutofillHint(true);
                  }}
                  aria-invalid={fieldState.error ? true : undefined}
                  aria-describedby={fieldState.error ? `${formId}-monthlyRevenue-err` : undefined}
                  className={`${inputBaseClass(!!fieldState.error)} pl-10`}
                />
                <label
                  htmlFor={`${formId}-monthlyRevenue`}
                  className={labelFloatClass(
                    revenueFocused || field.value.length > 0 || revenueAutofillHint,
                    { left: 'left-10' },
                  )}
                >
                  Monthly revenue
                </label>
              </div>
              {fieldState.error ? (
                <p
                  id={`${formId}-monthlyRevenue-err`}
                  className="mt-1 text-[12px] text-[#DC2626]"
                  role="alert"
                >
                  {fieldState.error.message}
                </p>
              ) : null}
            </div>
          );
        }}
      />

      <Controller
        name="loanAmount"
        control={control}
        render={({ field, fieldState }) => {
          const display = loanFocused ? field.value : formatMoneyWithCommas(field.value);
          return (
            <div className="bizcap-field">
              <div className="relative">
                <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 flex items-center border-r border-[#D1D5DB] pl-[14px] pr-2 text-[16px] text-[#374151]">
                  $
                </div>
                <input
                  id={`${formId}-loanAmount`}
                  type="text"
                  inputMode="decimal"
                  value={display}
                  onChange={(e) => { field.onChange(stripMoneyToNumberString(e.target.value)); if (fieldState.invalid) trigger('loanAmount'); }}
                  onKeyDown={onMoneyKeyDown}
                  onPaste={(e) => applyMoneyPaste(e, field.value, field.onChange)}
                  onFocus={() => setLoanFocused(true)}
                  onBlur={() => { setLoanFocused(false); field.onBlur(); }}
                  onAnimationStart={(e) => {
                    if (e.animationName === 'bizcap-autofill-detect') setLoanAutofillHint(true);
                  }}
                  aria-invalid={fieldState.error ? true : undefined}
                  aria-describedby={
                    fieldState.error
                      ? `${formId}-loanAmount-hint ${formId}-loanAmount-err`
                      : `${formId}-loanAmount-hint`
                  }
                  className={`${inputBaseClass(!!fieldState.error)} pl-10`}
                />
                <label
                  htmlFor={`${formId}-loanAmount`}
                  className={labelFloatClass(
                    loanFocused || field.value.length > 0 || loanAutofillHint,
                    { left: 'left-10' },
                  )}
                >
                  Desired loan amount
                </label>
              </div>
              <p id={`${formId}-loanAmount-hint`} className="mt-1 text-[12px] text-[#6B7280]">
                Up to $4,000,000
              </p>
              {fieldState.error ? (
                <p id={`${formId}-loanAmount-err`} className="mt-1 text-[12px] text-[#DC2626]" role="alert">
                  {fieldState.error.message}
                </p>
              ) : null}
            </div>
          );
        }}
      />

      <Controller
        name="purpose"
        control={control}
        render={({ field, fieldState }) => (
          <div>
            <p id={`${formId}-purpose-label`} className="mb-2 text-[13px] font-medium text-[#374151]">
              Purpose of funds
            </p>
            <div
              id={`${formId}-purpose-group`}
              role="radiogroup"
              aria-labelledby={`${formId}-purpose-label`}
              aria-label="Purpose of funds"
              aria-invalid={fieldState.error ? true : undefined}
              aria-describedby={fieldState.error ? `${formId}-purpose-err` : undefined}
              className="grid auto-rows-fr max-[359px]:grid-cols-2 min-[360px]:grid-cols-4 gap-2"
              tabIndex={-1}
            >
              {PURPOSES.map(({ id, label, Icon }) => {
                const selected = field.value === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    tabIndex={0}
                    onClick={() => { field.onChange(id); if (fieldState.invalid) trigger('purpose'); }}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        field.onChange(id);
                      }
                    }}
                    className={[
                      'flex h-full min-h-[64px] flex-col items-center justify-center gap-1 rounded-[10px] border-[1.5px] px-1.5 py-2.5 text-center text-[13px] transition-colors',
                      'focus-visible:outline-none focus-visible:border-[var(--brand-color)] focus-visible:shadow-[0_0_0_3px_rgba(12,121,193,0.12)]',
                      selected
                        ? 'border-[var(--brand-color)] bg-[#E8F4FD] text-[var(--brand-color)]'
                        : 'border-[#D1D5DB] bg-white text-[#111827] hover:border-[#93C5FD]',
                    ].join(' ')}
                  >
                    <Icon className="h-5 w-5 shrink-0" aria-hidden />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
            {fieldState.error ? (
              <p id={`${formId}-purpose-err`} className="mt-1 text-[12px] text-[#DC2626]" role="alert">
                {fieldState.error.message}
              </p>
            ) : null}
          </div>
        )}
      />
    </div>
  );
}

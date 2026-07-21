import { Controller, type Control, type UseFormTrigger } from 'react-hook-form';
import {
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  Ellipsis,
  Hammer,
  Package,
  TrendingUp,
  User,
  Wrench,
} from 'lucide-react';
import { type Step3Data } from '../../lib/schemas';
import { Field, fieldDescribedBy } from './Field';
import { MoneyInput } from './MoneyInput';

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
  return (
    <div className="flex flex-col gap-[18px]">
      <div>
        <div className="mb-[10px] inline-flex items-center gap-[5px] rounded-full bg-[var(--brand-light)] px-[10px] py-1 text-[11px] font-medium text-[var(--brand-color)]">
          <CheckCircle2 className="h-[13px] w-[13px]" aria-hidden />
          One last step
        </div>
        <h1 className="text-[18px] font-medium tracking-[-0.2px] text-[#111827]">Your loan</h1>
        <p className="mt-[5px] text-[13px] leading-[1.55] text-[#6B7280]">
          Almost done — tell us what you need.
        </p>
      </div>

      <Controller
        name="monthlyRevenue"
        control={control}
        render={({ field, fieldState }) => (
          <Field
            id={`${formId}-monthlyRevenue`}
            label="Monthly revenue"
            error={fieldState.error?.message}
          >
            <MoneyInput
              id={`${formId}-monthlyRevenue`}
              placeholder="e.g. 50,000"
              autoFocus
              value={field.value}
              onChange={(v) => { field.onChange(v); if (fieldState.invalid) trigger('monthlyRevenue'); }}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              describedBy={fieldDescribedBy(`${formId}-monthlyRevenue`, { error: !!fieldState.error })}
            />
          </Field>
        )}
      />

      <Controller
        name="loanAmount"
        control={control}
        render={({ field, fieldState }) => (
          <Field
            id={`${formId}-loanAmount`}
            label="Desired loan amount"
            hint="Up to $4,000,000"
            error={fieldState.error?.message}
          >
            <MoneyInput
              id={`${formId}-loanAmount`}
              placeholder="e.g. 250,000"
              value={field.value}
              onChange={(v) => { field.onChange(v); if (fieldState.invalid) trigger('loanAmount'); }}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              describedBy={fieldDescribedBy(`${formId}-loanAmount`, { hint: true, error: !!fieldState.error })}
            />
          </Field>
        )}
      />

      <Controller
        name="purpose"
        control={control}
        render={({ field, fieldState }) => (
          <div>
            <p id={`${formId}-purpose-label`} className="mb-[7px] text-[13px] font-medium text-[#111827]">
              Purpose of funds
            </p>
            <div
              id={`${formId}-purpose-group`}
              role="radiogroup"
              aria-labelledby={`${formId}-purpose-label`}
              aria-label="Purpose of funds"
              aria-invalid={fieldState.error ? true : undefined}
              aria-describedby={fieldState.error ? `${formId}-purpose-err` : undefined}
              className="grid auto-rows-fr gap-[7px] max-[359px]:grid-cols-2 min-[360px]:grid-cols-4"
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
                      'flex h-full min-h-[64px] flex-col items-center justify-center gap-1 rounded-[var(--brand-radius)] border-[1.5px] px-1.5 py-2.5 text-center text-[13px]',
                      'transition-[border-color,background-color,color] duration-[130ms]',
                      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-color)]',
                      selected
                        ? 'border-[var(--brand-color)] bg-[var(--brand-light)] font-medium text-[var(--brand-color)]'
                        : 'border-[#E5E7EB] bg-white text-[#111827] hover:border-[var(--brand-color)] hover:bg-[var(--brand-light)]',
                    ].join(' ')}
                  >
                    <Icon
                      className={`h-5 w-5 shrink-0 ${selected ? 'text-[var(--brand-color)]' : 'text-[#9CA3AF]'}`}
                      aria-hidden
                    />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
            {fieldState.error ? (
              <p id={`${formId}-purpose-err`} className="mt-1.5 text-[12px] text-[#991B1B]" role="alert">
                {fieldState.error.message}
              </p>
            ) : null}
          </div>
        )}
      />
    </div>
  );
}

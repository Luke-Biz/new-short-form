import { Controller, type Control, type UseFormTrigger, type UseFormSetValue } from 'react-hook-form';
import { type Step2Data } from '../../lib/schemas';
import { Field, fieldDescribedBy } from './Field';
import { SelectInput } from './SelectInput';
import { BusinessNameAutocomplete } from './BusinessNameAutocomplete';
import { AddressAutocomplete } from './AddressAutocomplete';

const INDUSTRIES = [
  { value: 'retail', label: 'Retail' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'construction', label: 'Construction' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'transport', label: 'Transport & Logistics' },
  { value: 'professional', label: 'Professional Services' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'education', label: 'Education' },
  { value: 'real-estate', label: 'Real Estate' },
  { value: 'technology', label: 'Technology' },
  { value: 'other', label: 'Other' },
] as const;

type Step2BusinessDetailsProps = {
  control: Control<Step2Data>;
  formId: string;
  trigger: UseFormTrigger<Step2Data>;
  setValue: UseFormSetValue<Step2Data>;
};

export function Step2BusinessDetails({ control, formId, trigger, setValue }: Step2BusinessDetailsProps) {
  return (
    <div className="flex flex-col gap-[18px]">
      <div>
        <div className="mb-[5px] text-[11px] font-medium uppercase tracking-[0.07em] text-[var(--brand-color)]">
          Business details
        </div>
        <h1 className="text-[18px] font-medium tracking-[-0.2px] text-[#111827]">
          About your business
        </h1>
        <p className="mt-[5px] text-[13px] leading-[1.55] text-[#6B7280]">
          Tell us a bit about your business.
        </p>
      </div>

      <Controller
        name="businessName"
        control={control}
        render={({ field, fieldState }) => (
          <Field id={`${formId}-businessName`} label="Business name" error={fieldState.error?.message}>
            <BusinessNameAutocomplete
              id={`${formId}-businessName`}
              placeholder="Start typing your business name"
              autoFocus
              value={field.value}
              onChange={(v) => { field.onChange(v); if (fieldState.invalid) trigger('businessName'); }}
              onAbnChange={(abn) => setValue('abn', abn)}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              describedBy={fieldDescribedBy(`${formId}-businessName`, { error: !!fieldState.error })}
            />
          </Field>
        )}
      />

      <Controller
        name="businessAddress"
        control={control}
        render={({ field, fieldState }) => (
          <Field id={`${formId}-businessAddress`} label="Business address" error={fieldState.error?.message}>
            <AddressAutocomplete
              id={`${formId}-businessAddress`}
              placeholder="Start typing your address"
              value={field.value}
              onChange={(v) => { field.onChange(v); if (fieldState.invalid) trigger('businessAddress'); }}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              describedBy={fieldDescribedBy(`${formId}-businessAddress`, { error: !!fieldState.error })}
            />
          </Field>
        )}
      />

      <Controller
        name="industry"
        control={control}
        render={({ field, fieldState }) => (
          <Field id={`${formId}-industry`} label="Industry" error={fieldState.error?.message}>
            <SelectInput
              id={`${formId}-industry`}
              value={field.value}
              onChange={(v) => { field.onChange(v); if (fieldState.invalid) trigger('industry'); }}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              describedBy={fieldDescribedBy(`${formId}-industry`, { error: !!fieldState.error })}
              placeholder="Select your industry"
              options={INDUSTRIES}
            />
          </Field>
        )}
      />
    </div>
  );
}

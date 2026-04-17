import { Controller, type Control, type UseFormTrigger } from 'react-hook-form';
import { Search } from 'lucide-react';
import { type Step2Data } from '../../lib/schemas';
import { FloatingInput } from './FloatingInput';
import { FloatingSelect } from './FloatingSelect';

const INDUSTRIES = [
  { value: '', label: 'Select your industry', disabled: true },
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
};

export function Step2BusinessDetails({ control, formId, trigger }: Step2BusinessDetailsProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[26px] font-bold leading-tight text-[#111827]">
          About your business
        </h1>
        <p className="mt-1 text-[15px] font-normal text-[#6B7280]">
          Tell us a bit about your business.
        </p>
      </div>

      <Controller
        name="businessName"
        control={control}
        render={({ field, fieldState }) => (
          <FloatingInput
            id={`${formId}-businessName`}
            label="Business name"
            autoFocus
            value={field.value}
            onChange={(v) => { field.onChange(v); if (fieldState.invalid) trigger('businessName'); }}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            describedBy={`${formId}-businessName-err`}
            autoComplete="organization"
            iconLeft={<Search className="h-4 w-4" aria-hidden />}
            inputPaddingLeft="pl-10"
            labelInsetLeftClass="left-10"
          />
        )}
      />

      <Controller
        name="businessAddress"
        control={control}
        render={({ field, fieldState }) => (
          <FloatingInput
            id={`${formId}-businessAddress`}
            label="Business address"
            value={field.value}
            onChange={(v) => { field.onChange(v); if (fieldState.invalid) trigger('businessAddress'); }}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            describedBy={`${formId}-businessAddress-err`}
            autoComplete="street-address"
            iconLeft={<Search className="h-4 w-4" aria-hidden />}
            inputPaddingLeft="pl-10"
            labelInsetLeftClass="left-10"
          />
        )}
      />

      <Controller
        name="industry"
        control={control}
        render={({ field, fieldState }) => (
          <FloatingSelect
            id={`${formId}-industry`}
            label="Industry"
            value={field.value}
            onChange={(v) => { field.onChange(v); if (fieldState.invalid) trigger('industry'); }}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            describedBy={`${formId}-industry-err`}
            alwaysFloatLabel
          >
            {INDUSTRIES.map((opt) => (
              <option
                key={opt.value || 'placeholder'}
                value={opt.value}
                disabled={'disabled' in opt ? opt.disabled : false}
              >
                {opt.label}
              </option>
            ))}
          </FloatingSelect>
        )}
      />
    </div>
  );
}

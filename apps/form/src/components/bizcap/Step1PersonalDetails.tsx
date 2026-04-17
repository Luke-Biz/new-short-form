import { Controller, type Control, type UseFormTrigger } from 'react-hook-form';
import { Check } from 'lucide-react';
import { type Step1Data } from '../../lib/schemas';
import { FloatingInput } from './FloatingInput';
import { FloatingLabelPhoneInput } from './FloatingLabelPhoneInput';

type Step1PersonalDetailsProps = {
  control: Control<Step1Data>;
  formId: string;
  trigger: UseFormTrigger<Step1Data>;
};

export function Step1PersonalDetails({ control, formId, trigger }: Step1PersonalDetailsProps) {
  const consentId = `${formId}-consent`;
  const consentErrId = `${formId}-consent-err`;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[26px] font-bold leading-tight text-[#111827]">
          Let&apos;s get started
        </h1>
        <p className="mt-1 text-[15px] font-normal text-[#6B7280]">
          We&apos;ll use these details to get in touch about your application.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Controller
          name="firstName"
          control={control}
          render={({ field, fieldState }) => (
            <FloatingInput
              id={`${formId}-firstName`}
              label="First name"
              autoFocus
              value={field.value}
              onChange={(v) => { field.onChange(v); if (fieldState.invalid) trigger('firstName'); }}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              describedBy={`${formId}-firstName-err`}
              autoComplete="given-name"
            />
          )}
        />
        <Controller
          name="lastName"
          control={control}
          render={({ field, fieldState }) => (
            <FloatingInput
              id={`${formId}-lastName`}
              label="Last name"
              value={field.value}
              onChange={(v) => { field.onChange(v); if (fieldState.invalid) trigger('lastName'); }}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              describedBy={`${formId}-lastName-err`}
              autoComplete="family-name"
            />
          )}
        />
      </div>

      <Controller
        name="email"
        control={control}
        render={({ field, fieldState }) => (
          <FloatingInput
            id={`${formId}-email`}
            label="Email address"
            type="email"
            value={field.value}
            onChange={(v) => { field.onChange(v); if (fieldState.invalid) trigger('email'); }}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            describedBy={`${formId}-email-err`}
            autoComplete="email"
            inputMode="email"
          />
        )}
      />

      <Controller
        name="phone"
        control={control}
        render={({ field, fieldState }) => (
          <FloatingLabelPhoneInput
            id={`${formId}-phone`}
            label="Mobile number"
            value={field.value}
            onChange={(v) => { field.onChange(v); if (fieldState.invalid) trigger('phone'); }}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            describedBy={`${formId}-phone-err`}
            defaultCountry="au"
            autoComplete="tel"
          />
        )}
      />

      <Controller
        name="consent"
        control={control}
        render={({ field, fieldState }) => (
          <div>
            <label
              htmlFor={consentId}
              className="flex cursor-pointer items-start gap-3 text-[15px] leading-snug text-[#374151]"
            >
              <span className="relative mt-0.5 inline-flex h-[18px] w-[18px] shrink-0">
                <input
                  id={consentId}
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => { field.onChange(e.target.checked); if (fieldState.invalid) trigger('consent'); }}
                  onBlur={field.onBlur}
                  className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                  aria-invalid={fieldState.error ? true : undefined}
                  aria-describedby={fieldState.error ? consentErrId : undefined}
                />
                <span
                  className="pointer-events-none flex h-[18px] w-[18px] items-center justify-center rounded border-[1.5px] border-[#D1D5DB] bg-white peer-focus-visible:border-[var(--brand-color)] peer-focus-visible:shadow-[0_0_0_3px_rgba(12,121,193,0.12)] peer-checked:border-[var(--brand-color)] peer-checked:bg-[var(--brand-color)] [&_svg]:opacity-0 peer-checked:[&_svg]:opacity-100"
                  aria-hidden
                >
                  <Check className="h-3 w-3 text-white" strokeWidth={3} />
                </span>
              </span>
              <span>
                I agree to Bizcap&apos;s{' '}
                <a
                  href="https://www.bizcap.com.au/terms-and-conditions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[var(--brand-color)] underline underline-offset-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  consent
                </a>{' '}
                and{' '}
                <a
                  href="https://www.bizcap.com.au/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[var(--brand-color)] underline underline-offset-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  privacy policy
                </a>
              </span>
            </label>
            {fieldState.error ? (
              <p id={consentErrId} className="mt-1 text-[12px] text-[#DC2626]" role="alert">
                {fieldState.error.message}
              </p>
            ) : null}
          </div>
        )}
      />
    </div>
  );
}

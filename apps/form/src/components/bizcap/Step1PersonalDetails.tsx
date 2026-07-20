import { Controller, type Control, type UseFormTrigger } from 'react-hook-form';
import { Check } from 'lucide-react';
import { type Step1Data } from '../../lib/schemas';
import { Field, fieldDescribedBy } from './Field';
import { TextInput } from './TextInput';
import { PhoneField } from './PhoneField';

type Step1PersonalDetailsProps = {
  control: Control<Step1Data>;
  formId: string;
  trigger: UseFormTrigger<Step1Data>;
};

export function Step1PersonalDetails({ control, formId, trigger }: Step1PersonalDetailsProps) {
  const consentId = `${formId}-consent`;
  const consentErrId = `${formId}-consent-err`;

  return (
    <div className="flex flex-col gap-[18px]">
      <div>
        <div className="mb-[5px] text-[11px] font-medium uppercase tracking-[0.07em] text-[var(--brand-color)]">
          Get started
        </div>
        <h1 className="text-[18px] font-medium tracking-[-0.2px] text-[#111827]">
          Let&apos;s get started
        </h1>
        <p className="mt-[5px] text-[13px] leading-[1.55] text-[#6B7280]">
          We&apos;ll use these details to get in touch about your application.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-[10px] min-[480px]:grid-cols-2">
        <Controller
          name="firstName"
          control={control}
          render={({ field, fieldState }) => (
            <Field id={`${formId}-firstName`} label="First name" error={fieldState.error?.message}>
              <TextInput
                id={`${formId}-firstName`}
                placeholder="Sarah"
                autoFocus
                value={field.value}
                onChange={(v) => { field.onChange(v); if (fieldState.invalid) trigger('firstName'); }}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                describedBy={fieldDescribedBy(`${formId}-firstName`, { error: !!fieldState.error })}
                autoComplete="given-name"
              />
            </Field>
          )}
        />
        <Controller
          name="lastName"
          control={control}
          render={({ field, fieldState }) => (
            <Field id={`${formId}-lastName`} label="Last name" error={fieldState.error?.message}>
              <TextInput
                id={`${formId}-lastName`}
                placeholder="Johnson"
                value={field.value}
                onChange={(v) => { field.onChange(v); if (fieldState.invalid) trigger('lastName'); }}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                describedBy={fieldDescribedBy(`${formId}-lastName`, { error: !!fieldState.error })}
                autoComplete="family-name"
              />
            </Field>
          )}
        />
      </div>

      <Controller
        name="email"
        control={control}
        render={({ field, fieldState }) => (
          <Field id={`${formId}-email`} label="Email address" error={fieldState.error?.message}>
            <TextInput
              id={`${formId}-email`}
              type="email"
              placeholder="sarah@example.com"
              value={field.value}
              onChange={(v) => { field.onChange(v); if (fieldState.invalid) trigger('email'); }}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              describedBy={fieldDescribedBy(`${formId}-email`, { error: !!fieldState.error })}
              autoComplete="email"
              inputMode="email"
            />
          </Field>
        )}
      />

      <Controller
        name="phone"
        control={control}
        render={({ field, fieldState }) => (
          <Field id={`${formId}-phone`} label="Mobile number" error={fieldState.error?.message}>
            <PhoneField
              id={`${formId}-phone`}
              value={field.value}
              onChange={(v) => { field.onChange(v); if (fieldState.invalid) trigger('phone'); }}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              describedBy={fieldDescribedBy(`${formId}-phone`, { error: !!fieldState.error })}
              defaultCountry="au"
              autoComplete="tel"
            />
          </Field>
        )}
      />

      <Controller
        name="consent"
        control={control}
        render={({ field, fieldState }) => (
          <div>
            <label
              htmlFor={consentId}
              className="flex cursor-pointer items-start gap-3 text-[13px] leading-[1.55] text-[#6B7280]"
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
                  className="pointer-events-none flex h-[18px] w-[18px] items-center justify-center rounded border-[1.5px] border-[#D1D5DB] bg-white peer-focus-visible:border-[var(--brand-color)] peer-focus-visible:shadow-[0_0_0_3px_var(--brand-shadow)] peer-checked:border-[var(--brand-color)] peer-checked:bg-[var(--brand-color)] [&_svg]:opacity-0 peer-checked:[&_svg]:opacity-100"
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
                  className="font-medium text-[var(--brand-color)] underline underline-offset-2 hover:text-[var(--brand-hover)]"
                  onClick={(e) => e.stopPropagation()}
                >
                  consent
                </a>{' '}
                and{' '}
                <a
                  href="https://www.bizcap.com.au/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[var(--brand-color)] underline underline-offset-2 hover:text-[var(--brand-hover)]"
                  onClick={(e) => e.stopPropagation()}
                >
                  privacy policy
                </a>
              </span>
            </label>
            {fieldState.error ? (
              <p id={consentErrId} className="mt-1.5 text-[12px] text-[#991B1B]" role="alert">
                {fieldState.error.message}
              </p>
            ) : null}
          </div>
        )}
      />
    </div>
  );
}

import { useRef } from 'react';
import { Controller } from 'react-hook-form';
import type { UseFormReturn } from 'react-hook-form';
import { IMaskInput } from 'react-imask';
import { IconCircleCheck, IconSend } from '@tabler/icons-react';
import type { FullFormData } from '../../schema/form';
import type { FormErrorState } from '../../types';
import { Field } from '../primitives/Field';
import { TextField } from '../primitives/TextField';
import { SubmitButton } from '../primitives/SubmitButton';
import { ErrorBanner } from '../primitives/ErrorBanner';
import { ConsentDisclosure } from '../primitives/ConsentDisclosure';


type Step3Props = {
  form: UseFormReturn<FullFormData>;
  isSubmitting: boolean;
  formError: FormErrorState | null;
  submitCta: string;
  onSubmit: () => void;
  onBack: () => void;
  onRetry?: () => void;
};

export function Step3Contact({
  form,
  isSubmitting,
  formError,
  submitCta,
  onSubmit,
  onBack,
  onRetry,
}: Step3Props) {
  const firstName = form.watch('firstName');
  const lastName = form.watch('lastName');
  const phone = form.watch('phone');
  const email = form.watch('email');

  const step3Valid = firstName?.trim() && lastName?.trim() && phone?.trim() && email?.trim() && email.includes('@');

  const { errors } = form.formState;

  const nameRowRef = useRef<HTMLDivElement>(null);
  const firstNameInputRef = useRef<HTMLInputElement | null>(null);
  const lastNameInputRef = useRef<HTMLInputElement | null>(null);
  const phoneFieldRef = useRef<HTMLDivElement>(null);
  const phoneInputRef = useRef<HTMLInputElement | null>(null);
  const emailFieldRef = useRef<HTMLDivElement>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);

  const { ref: lastNameRhfRef, ...lastNameReg } = form.register('lastName', {
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.value.trim()) form.clearErrors('lastName');
    },
  });
  const { ref: firstNameRhfRef, ...firstNameReg } = form.register('firstName', {
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.value.trim()) form.clearErrors('firstName');
    },
  });
  const { ref: emailRhfRef, ...emailReg } = form.register('email', {
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.value.trim()) form.clearErrors('email');
    },
  });

  async function handleContinue() {
    const valid = await form.trigger(['firstName', 'lastName', 'phone', 'email']);
    if (!valid) {
      const errs = form.formState.errors;
      if (errs.firstName || errs.lastName) {
        nameRowRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        (errs.firstName ? firstNameInputRef : lastNameInputRef).current?.focus({ preventScroll: true });
      } else if (errs.phone) {
        phoneFieldRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        phoneInputRef.current?.focus({ preventScroll: true });
      } else if (errs.email) {
        emailFieldRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        emailInputRef.current?.focus({ preventScroll: true });
      }
      return;
    }
    onSubmit();
  }

  return (
    <div>
      <div className="px-6 pt-6 pb-0">
        <div className="inline-flex items-center gap-[5px] text-[11px] font-medium px-[10px] py-1 rounded-full bg-brand-light text-brand mb-[0.875rem]">
          <IconCircleCheck size={13} aria-hidden="true" />
          One last step
        </div>
        <h2 className="text-[18px] font-medium text-text-primary tracking-[-0.2px] mb-[0.3rem]">
          Where should we send your offer?
        </h2>
        <p className="text-[13px] text-text-muted leading-[1.55] mb-5">
          A funding specialist will reach out within 24 hours with your personalized offer.
        </p>
      </div>

      <div className="px-6 pb-6">
        {/* Name row */}
        <div ref={nameRowRef} className="grid grid-cols-1 sm:grid-cols-2 gap-[10px] mb-[1.125rem]">
          <Field id="fname" label="First name" error={errors.firstName?.message}>
            <TextField
              id="fname"
              placeholder="Sarah"
              autoComplete="given-name"
              error={errors.firstName?.message}
              ref={(el) => { firstNameInputRef.current = el; firstNameRhfRef(el); }}
              {...firstNameReg}
            />
          </Field>
          <Field id="lname" label="Last name" error={errors.lastName?.message}>
            <TextField
              id="lname"
              placeholder="Johnson"
              autoComplete="family-name"
              error={errors.lastName?.message}
              ref={(el) => { lastNameInputRef.current = el; lastNameRhfRef(el); }}
              {...lastNameReg}
            />
          </Field>
        </div>

        <div ref={phoneFieldRef}>
        <Field
          id="phone"
          label="Phone number"
          error={errors.phone?.message}
          className="mb-[1.125rem]"
        >
          <Controller
            control={form.control}
            name="phone"
            render={({ field }) => (
              <IMaskInput
                mask="+1 (000) 000-0000"
                inputRef={(el: HTMLInputElement) => { phoneInputRef.current = el; field.ref(el); }}
                id="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+1 (555) 000-0000"
                value={field.value}
                onAccept={(value: string) => {
                  field.onChange(value);
                  if (value.replace(/\D/g, '').length === 11) form.clearErrors('phone');
                }}
                onBlur={() => {
                  field.onBlur();
                  void form.trigger('phone');
                }}
                aria-invalid={errors.phone ? 'true' : undefined}
                aria-describedby={errors.phone ? 'phone-error' : undefined}
                className={[
                  'w-full h-[40px] border-[1.5px] rounded-form-sm px-3 text-[16px] font-sans',
                  'text-text-primary bg-surface outline-none appearance-none',
                  'transition-[border-color] duration-[130ms] placeholder:text-text-tertiary',
                  errors.phone
                    ? 'border-error-text focus:border-error-text focus-ring-error'
                    : 'border-form-border focus:border-brand focus-ring',
                ].join(' ')}
              />
            )}
          />
        </Field>
        </div>

        <div ref={emailFieldRef}>
        <Field
          id="email"
          label="Email address"
          error={errors.email?.message}
          className="mb-0"
        >
          <TextField
            id="email"
            type="email"
            placeholder="sarah.johnson@example.com"
            autoComplete="email"
            error={errors.email?.message}
            ref={(el) => { emailInputRef.current = el; emailRhfRef(el); }}
            {...emailReg}
          />
        </Field>
        </div>

        {/* SMS consent checkbox — above submit for TCPA compliance */}
        <label className="flex items-start gap-3 cursor-pointer group mt-[1.125rem] mb-[0.875rem]">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-form-border text-brand focus-ring accent-brand cursor-pointer"
            {...form.register('smsConsent')}
          />
          <span className="text-[11px] text-text-tertiary leading-[1.6] group-hover:text-text-muted transition-colors">
            By checking this box, I provide my electronic signature agreeing to receive customer
            support, informational, promotional text messages, including automated text messages
            from Bizcap. I understand that my consent is not required to purchase
            goods or services. I can opt-out at any time by replying STOP to a text. Text HELP
            to get assistance. Standard message and data rates may apply. I agree to the{' '}
            <a
              href="https://www.bizcapfunding.com/sms-terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand underline hover:text-brand-hover focus-ring rounded"
            >
              SMS Terms
            </a>
            .
          </span>
        </label>

        {formError && <ErrorBanner error={formError} onRetry={onRetry} />}

        <SubmitButton
          inactive={!step3Valid}
          loading={isSubmitting}
          onClick={() => void handleContinue()}
        >
          {submitCta} <IconSend size={15} aria-hidden="true" />
        </SubmitButton>

        {/* Disclosure text */}
        <ConsentDisclosure ctaLabel="Submit" className="mt-[0.875rem] space-y-3" />

        <button
          type="button"
          onClick={onBack}
          className="block w-full text-center mt-3 text-[13px] text-text-tertiary hover:text-text-muted focus-ring rounded"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}

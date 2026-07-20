import { useRef } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { FullFormData } from '../../schema/form';
import { Field } from '../primitives/Field';
import { TextField } from '../primitives/TextField';
import { SubmitButton } from '../primitives/SubmitButton';
import { ConsentDisclosure } from '../primitives/ConsentDisclosure';
import { pushDataLayer } from '../../lib/dataLayer';

type Step1ContactV2Props = {
  form: UseFormReturn<FullFormData>;
  cta: string;
  // True while the container is creating the lead in BizMate.
  loading: boolean;
  onNext: () => void;
};

export function Step1ContactV2({ form, cta, loading, onNext }: Step1ContactV2Props) {
  const firstName = form.watch('firstName');
  const lastName = form.watch('lastName');
  const email = form.watch('email');
  const businessName = form.watch('businessName');

  const stepValid =
    firstName?.trim() && lastName?.trim() && email?.trim() && email.includes('@') && businessName?.trim();

  const { errors } = form.formState;

  const nameRowRef = useRef<HTMLDivElement>(null);
  const firstNameInputRef = useRef<HTMLInputElement | null>(null);
  const lastNameInputRef = useRef<HTMLInputElement | null>(null);
  const emailFieldRef = useRef<HTMLDivElement>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const businessNameFieldRef = useRef<HTMLDivElement>(null);
  const businessNameInputRef = useRef<HTMLInputElement | null>(null);

  const { ref: firstNameRhfRef, ...firstNameReg } = form.register('firstName', {
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.value.trim()) form.clearErrors('firstName');
    },
  });
  const { ref: lastNameRhfRef, ...lastNameReg } = form.register('lastName', {
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.value.trim()) form.clearErrors('lastName');
    },
  });
  const { ref: emailRhfRef, ...emailReg } = form.register('email', {
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.value.trim()) form.clearErrors('email');
    },
  });
  const { ref: businessNameRhfRef, ...businessNameReg } = form.register('businessName', {
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.value.trim()) form.clearErrors('businessName');
    },
  });

  async function handleContinue() {
    if (loading) return;
    const valid = await form.trigger(['firstName', 'lastName', 'email', 'businessName']);
    if (!valid) {
      const errs = form.formState.errors;
      if (errs.firstName || errs.lastName) {
        nameRowRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        (errs.firstName ? firstNameInputRef : lastNameInputRef).current?.focus({ preventScroll: true });
      } else if (errs.email) {
        emailFieldRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        emailInputRef.current?.focus({ preventScroll: true });
      } else if (errs.businessName) {
        businessNameFieldRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        businessNameInputRef.current?.focus({ preventScroll: true });
      }
      return;
    }
    pushDataLayer({
      event: 'contact_details_button',
      funnelStep: 'Step 1',
    });
    onNext();
  }

  return (
    <div>
      <div className="px-6 pt-6 pb-0">
        <div className="text-[11px] font-medium uppercase tracking-[0.07em] text-brand mb-[0.3rem]">
          Get started
        </div>
        <h1 className="text-[18px] font-medium text-text-primary tracking-[-0.2px] mb-[0.3rem]">
          Let&rsquo;s get your business funded
        </h1>
        <p className="text-[13px] text-text-muted leading-[1.55] mb-5">
          Takes about 60 seconds, no credit check, no commitment.
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

        <div ref={emailFieldRef}>
        <Field
          id="email"
          label="Email address"
          error={errors.email?.message}
          className="mb-[1.125rem]"
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

        <div ref={businessNameFieldRef}>
        <Field
          id="biz-name"
          label="Business name"
          error={errors.businessName?.message}
          className="mb-0"
        >
          <TextField
            id="biz-name"
            placeholder="Acme Inc."
            autoComplete="organization"
            error={errors.businessName?.message}
            ref={(el) => { businessNameInputRef.current = el; businessNameRhfRef(el); }}
            {...businessNameReg}
          />
        </Field>
        </div>

        <SubmitButton
          inactive={!stepValid}
          loading={loading}
          onClick={() => void handleContinue()}
        >
          {cta}
        </SubmitButton>

        {/* Disclosure text */}
        <ConsentDisclosure
          ctaLabel={cta.replace(/\s*→\s*$/, '')}
          className="mt-[0.875rem] space-y-3"
        />
      </div>
    </div>
  );
}

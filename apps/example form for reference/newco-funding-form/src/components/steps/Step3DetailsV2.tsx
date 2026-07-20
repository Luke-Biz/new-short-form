import { useRef, useState } from 'react';
import { Controller } from 'react-hook-form';
import type { UseFormReturn } from 'react-hook-form';
import { IMaskInput } from 'react-imask';
import {
  IconShoppingCart,
  IconToolsKitchen2,
  IconHeartRateMonitor,
  IconCrane,
  IconBriefcase,
  IconDots,
  IconCircleCheck,
  IconSend,
} from '@tabler/icons-react';
import type { FullFormData } from '../../schema/form';
import type { FormErrorState } from '../../types';
import { Field } from '../primitives/Field';
import { TextField } from '../primitives/TextField';
import { SelectButton } from '../primitives/SelectButton';
import { SubmitButton } from '../primitives/SubmitButton';
import { ErrorBanner } from '../primitives/ErrorBanner';
import { pushDataLayer } from '../../lib/dataLayer';

const INDUSTRY_OPTIONS = [
  { value: 'Retail/eCommerce', label: 'Retail / eCommerce', icon: <IconShoppingCart size={15} aria-hidden="true" /> },
  { value: 'Food & Beverage', label: 'Food & beverage', icon: <IconToolsKitchen2 size={15} aria-hidden="true" /> },
  { value: 'Healthcare', label: 'Healthcare', icon: <IconHeartRateMonitor size={15} aria-hidden="true" /> },
  { value: 'Construction', label: 'Construction', icon: <IconCrane size={15} aria-hidden="true" /> },
  { value: 'Professional Services', label: 'Professional services', icon: <IconBriefcase size={15} aria-hidden="true" /> },
  { value: 'Other', label: 'Other', icon: <IconDots size={15} aria-hidden="true" /> },
] as const;

function formatEIN(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, '');
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}-${digits.slice(2, 9)}`;
}

type Step3DetailsV2Props = {
  form: UseFormReturn<FullFormData>;
  isSubmitting: boolean;
  formError: FormErrorState | null;
  submitCta: string;
  onSubmit: () => void;
  onBack: () => void;
  onRetry?: () => void;
};

export function Step3DetailsV2({
  form,
  isSubmitting,
  formError,
  submitCta,
  onSubmit,
  onBack,
  onRetry,
}: Step3DetailsV2Props) {
  const industry = form.watch('industry');
  const phone = form.watch('phone');

  const stepValid = industry && phone?.trim();

  const [attemptedIndustry, setAttemptedIndustry] = useState(false);

  const industryRef = useRef<HTMLDivElement>(null);
  const einRef = useRef<HTMLDivElement>(null);
  const phoneFieldRef = useRef<HTMLDivElement>(null);
  const phoneInputRef = useRef<HTMLInputElement | null>(null);

  const { errors } = form.formState;

  async function handleContinue() {
    setAttemptedIndustry(true);
    const textValid = await form.trigger(['ein', 'phone']);
    if (!textValid || !industry) {
      if (!industry) {
        industryRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      } else if (form.formState.errors.ein) {
        einRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      } else if (form.formState.errors.phone) {
        phoneFieldRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        phoneInputRef.current?.focus({ preventScroll: true });
      }
      return;
    }
    pushDataLayer({
      event: 'business_details_button',
      industry: INDUSTRY_OPTIONS.find((o) => o.value === industry)?.label ?? '',
      funnelStep: 'Step 3',
    });
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
          A few final details
        </h2>
        <p className="text-[13px] text-text-muted leading-[1.55] mb-5">
          A funding specialist will reach out within 24 hours with your personalized offer.
        </p>
      </div>

      <div className="px-6 pb-6">
        <div ref={industryRef} className="mb-[1.125rem]">
          <span className="block text-[13px] font-medium text-text-primary mb-[0.45rem]">
            Industry
          </span>
          <div
            role="radiogroup"
            aria-label="Industry"
            className="grid grid-cols-1 sm:grid-cols-2 gap-[7px]"
          >
            {INDUSTRY_OPTIONS.map((opt) => (
              <SelectButton
                key={opt.value}
                label={opt.label}
                icon={opt.icon}
                selected={industry === opt.value}
                onClick={() => {
                  setAttemptedIndustry(false);
                  form.setValue('industry', opt.value as FullFormData['industry'], {
                    shouldValidate: true,
                  });
                }}
              />
            ))}
          </div>
          {attemptedIndustry && !industry && (
            <p className="mt-[6px] text-[12px] text-error-text">Please select your industry.</p>
          )}
        </div>

        <div ref={einRef}>
        <Field
          id="ein-input"
          label={<>EIN <span className="font-normal text-text-tertiary">(optional — speeds up review)</span></>}
          error={errors.ein?.message}
          className="mb-[1.125rem]"
        >
          <TextField
            id="ein-input"
            placeholder="12-3456789"
            maxLength={10}
            error={errors.ein?.message}
            {...form.register('ein', {
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                e.target.value = formatEIN(e.target.value);
              },
            })}
          />
        </Field>
        </div>

        <div ref={phoneFieldRef}>
        <Field
          id="phone"
          label="Phone number"
          error={errors.phone?.message}
          className="mb-0"
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
          inactive={!stepValid}
          loading={isSubmitting}
          onClick={() => void handleContinue()}
        >
          {submitCta} <IconSend size={15} aria-hidden="true" />
        </SubmitButton>

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

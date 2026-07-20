import { useRef, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import {
  IconShoppingCart,
  IconToolsKitchen2,
  IconHeartRateMonitor,
  IconCrane,
  IconBriefcase,
  IconDots,
  IconCircleCheck,
} from '@tabler/icons-react';
import type { FullFormData } from '../../schema/form';
import { Field } from '../primitives/Field';
import { TextField } from '../primitives/TextField';
import { SelectButton } from '../primitives/SelectButton';
import { SubmitButton } from '../primitives/SubmitButton';
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

type Step2Props = {
  form: UseFormReturn<FullFormData>;
  headline: string;
  subheadline: string;
  onNext: () => void;
  onBack: () => void;
};

export function Step2Business({ form, headline, subheadline, onNext, onBack }: Step2Props) {
  const industry = form.watch('industry');
  const businessName = form.watch('businessName');

  const step2Valid = businessName?.trim() && industry;

  const [attemptedIndustry, setAttemptedIndustry] = useState(false);

  const businessNameRef = useRef<HTMLDivElement>(null);
  const industryRef = useRef<HTMLDivElement>(null);
  const einRef = useRef<HTMLDivElement>(null);

  const { errors } = form.formState;

  async function handleContinue() {
    setAttemptedIndustry(true);
    const textValid = await form.trigger(['businessName', 'ein']);
    if (!textValid || !industry) {
      if (form.formState.errors.businessName) {
        businessNameRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        setTimeout(() => form.setFocus('businessName'), 50);
      } else if (!industry) {
        industryRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      } else if (form.formState.errors.ein) {
        einRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
      return;
    }
    pushDataLayer({
      event: 'continue_about_button',
      industry: INDUSTRY_OPTIONS.find((o) => o.value === industry)?.label ?? '',
      funnelStep: 'Step 2',
    });
    onNext();
  }

  return (
    <div>
      <div className="px-6 pt-6 pb-0">
        <div className="inline-flex items-center gap-[5px] text-[11px] font-medium px-[10px] py-1 rounded-full bg-brand-light text-brand mb-[0.875rem]">
          <IconCircleCheck size={13} aria-hidden="true" />
          Looking good, you appear eligible
        </div>
        <h2 className="text-[18px] font-medium text-text-primary tracking-[-0.2px] mb-[0.3rem]">
          {headline}
        </h2>
        <p className="text-[13px] text-text-muted leading-[1.55] mb-5">{subheadline}</p>
      </div>

      <div className="px-6 pb-6">
        <div ref={businessNameRef}>
        <Field
          id="biz-name"
          label="Business name"
          error={errors.businessName?.message}
          className="mb-[1.125rem]"
        >
          <TextField
            id="biz-name"
            placeholder="Acme Inc."
            error={errors.businessName?.message}
            {...form.register('businessName', {
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                if (e.target.value.trim()) form.clearErrors('businessName');
              },
            })}
          />
        </Field>
        </div>

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
          className="mb-0"
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

        <SubmitButton inactive={!step2Valid} onClick={() => void handleContinue()}>
          Continue
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

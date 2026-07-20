import React, { useEffect, useId, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BizcapLogo } from './BizcapLogo';
import { TrustStrip } from './TrustStrip';
import { parseMoneyNumber } from '../../lib/formUtils';
import {
  Step1Schema, type Step1Data,
  Step2Schema, type Step2Data,
  Step3Schema, type Step3Data,
} from '../../lib/schemas';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { Step1PersonalDetails } from './Step1PersonalDetails';
import { Step2BusinessDetails } from './Step2BusinessDetails';
import { Step3LoanDetails } from './Step3LoanDetails';

type FieldKey =
  | 'firstName' | 'lastName' | 'email' | 'phone' | 'consent'
  | 'businessName' | 'businessAddress' | 'industry'
  | 'monthlyRevenue' | 'loanAmount' | 'purpose';

const STEP_LABELS = ['Your details', 'Business details', 'Loan details'] as const;

export function BizcapLoanForm() {
  const reducedMotion = usePrefersReducedMotion();
  const formId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  const [brandColor] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('color') ?? '#0C79C1';
  });

  const [logoUrl] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('logo') ?? null;
  });

  // Configurator preview: free step navigation, submission disabled.
  // Only the configurator's iframe carries this param — never generated links.
  const [previewMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('preview') === '1';
  });

  // Partner preference from the configurator: who Bizcap calls about the application.
  const [contactPreference] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('contact') === 'broker' ? 'Call Broker' : 'Call Client';
  });

  const [step, setStep] = useState(1);
  const [announcement, setAnnouncement] = useState('');

  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(Step1Schema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { firstName: '', lastName: '', email: '', phone: '', consent: false },
  });

  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(Step2Schema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { businessName: '', businessAddress: '', industry: '' },
  });

  const step3Form = useForm<Step3Data>({
    resolver: zodResolver(Step3Schema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { monthlyRevenue: '', loanAmount: '' },
  });

  // Rough completeness mirror of each step's schema. Drives the CTA's
  // "inactive" look only — the button stays clickable so a click still runs
  // full validation and focuses the first error.
  const s1 = step1Form.watch();
  const s2 = step2Form.watch();
  const s3 = step3Form.watch();
  const stepComplete =
    previewMode ||
    (step === 1
      ? !!(s1.firstName.trim() && s1.lastName.trim() && s1.email.includes('@') && s1.phone.trim() && s1.consent)
      : step === 2
        ? !!(s2.businessName.trim() && s2.businessAddress.trim() && s2.industry)
        : !!(s3.monthlyRevenue.trim() && s3.loanAmount.trim() && s3.purpose));

  const focusFirstError = () => {
    const root = containerRef.current;
    if (!root) return;
    const order: FieldKey[] = [
      'firstName', 'lastName', 'email', 'phone', 'consent',
      'businessName', 'businessAddress', 'industry',
      'monthlyRevenue', 'loanAmount', 'purpose',
    ];
    for (const k of order) {
      const id =
        k === 'consent'
          ? `${formId}-consent`
          : k === 'purpose'
            ? `${formId}-purpose-group`
            : `${formId}-${k}`;
      const el = root.querySelector<HTMLElement>(`[id="${id}"]`);
      if (el?.getAttribute('aria-invalid') === 'true') {
        el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
        // preventScroll so the browser's instant focus-scroll doesn't fight
        // the smooth scrollIntoView above.
        el.focus({ preventScroll: true });
        break;
      }
    }
  };

  // Scroll back to the top of the form after committing a new step.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const behavior = reducedMotion ? ('auto' as const) : ('smooth' as const);
    containerRef.current?.scrollIntoView({ block: 'start', behavior });
    window.scrollTo({ top: 0, behavior });
    setAnnouncement(`Now on step ${step} of 3: ${STEP_LABELS[step - 1]}`);
  }, [step, reducedMotion]);

  const handleNext = async () => {
    if (step === 1) {
      if (!previewMode) {
        const valid = await step1Form.trigger();
        if (!valid) {
          requestAnimationFrame(focusFirstError);
          return;
        }
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!previewMode) {
        const valid = await step2Form.trigger();
        if (!valid) {
          requestAnimationFrame(focusFirstError);
          return;
        }
      }
      setStep(3);
      return;
    }
    if (previewMode) return;
    const valid = await step3Form.trigger();
    if (!valid) {
      requestAnimationFrame(focusFirstError);
      return;
    }
    const { monthlyRevenue: revRaw, loanAmount: loanRaw, purpose } = step3Form.getValues();
    // eslint-disable-next-line no-console
    console.log('Submit', {
      ...step1Form.getValues(),
      ...step2Form.getValues(),
      monthlyRevenue: parseMoneyNumber(revRaw),
      loanAmount: parseMoneyNumber(loanRaw),
      purpose,
      contactPreference,
    });
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const percent = step === 1 ? 33 : step === 2 ? 66 : 100;
  const ctaDisabled = previewMode && step === 3;

  return (
    <div
      ref={containerRef}
      style={{
        '--brand-color': brandColor,
        '--brand-shadow': 'color-mix(in srgb, var(--brand-color) 12%, transparent)',
        '--brand-hover': 'color-mix(in srgb, var(--brand-color) 85%, black)',
        '--brand-light': 'color-mix(in srgb, var(--brand-color) 8%, white)',
      } as React.CSSProperties}
      className="min-h-full bg-[#F9FAFB] px-4 pb-16 pt-10"
    >
      <div className="mx-auto w-full max-w-[600px]">
        {logoUrl
          ? <img src={logoUrl} alt="Logo" className="mx-auto mb-7 block max-h-12 w-auto max-w-[200px] object-contain" />
          : <BizcapLogo className="mx-auto mb-7 block h-8 w-auto" />
        }

        <TrustStrip />

        <div className="mb-6">
          <div className="mb-[7px] flex items-center justify-between">
            <span className="text-[12px] font-medium text-[#6B7280]">
              <span className="min-[480px]:hidden">{step} / 3</span>
              <span className="hidden min-[480px]:inline">
                Step {step} of 3 — {STEP_LABELS[step - 1]}
              </span>
            </span>
            <span className="text-[12px] text-[#9CA3AF]" aria-hidden="true">
              {percent}%
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={3}
            aria-valuenow={step}
            aria-label={`Step ${step} of 3 — ${STEP_LABELS[step - 1]}`}
            className="relative h-[3px] rounded-[2px] bg-[#E5E7EB]"
          >
            <div
              aria-hidden="true"
              className="absolute inset-y-0 left-0 rounded-[2px] bg-[var(--brand-color)] transition-[width] duration-[400ms] ease-in-out motion-reduce:transition-none"
              style={{ width: `${percent}%` }}
            />
          </div>
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {announcement}
          </div>
        </div>

        <div className="overflow-hidden rounded-[14px] border border-[#E5E7EB] bg-white">
          <form
            className="px-6 py-6"
            aria-label="Business loan application"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              handleNext();
            }}
          >
            {step === 1 ? <Step1PersonalDetails control={step1Form.control} formId={formId} trigger={step1Form.trigger} /> : null}
            {step === 2 ? <Step2BusinessDetails control={step2Form.control} formId={formId} trigger={step2Form.trigger} /> : null}
            {step === 3 ? <Step3LoanDetails control={step3Form.control} formId={formId} trigger={step3Form.trigger} /> : null}

            <button
              type="submit"
              disabled={ctaDisabled}
              className={[
                'mt-5 flex w-full items-center justify-center gap-2 rounded-[10px] px-4 py-3 text-[15px] font-medium',
                'transition-[background-color,transform,opacity] duration-150 active:scale-[0.99]',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-color)]',
                ctaDisabled
                  ? 'cursor-not-allowed bg-[#D1D5DB] text-[#9CA3AF]'
                  : stepComplete
                    ? 'bg-[var(--brand-color)] text-white hover:bg-[var(--brand-hover)]'
                    : 'bg-[var(--brand-color)] text-white opacity-60 hover:opacity-75',
              ].join(' ')}
            >
              {step === 3
                ? previewMode ? 'Preview mode — submissions disabled' : 'Submit application'
                : 'Next'}
            </button>

            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="mx-auto mt-3 block min-h-[44px] w-full rounded-md text-center text-[13px] text-[#9CA3AF] transition-colors hover:text-[#6B7280] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-color)]"
              >
                ← Back
              </button>
            ) : null}
          </form>
        </div>
      </div>
    </div>
  );
}

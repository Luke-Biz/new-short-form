import React, { useCallback, useId, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Clock, Shield } from 'lucide-react';
import { BizcapLogo } from './BizcapLogo';
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

  const [step, setStep] = useState(1);
  const [headerStep, setHeaderStep] = useState(1);
  const [phase, setPhase] = useState<'idle' | 'leave' | 'enter'>('idle');

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
        el.focus();
        break;
      }
    }
  };

  const goToStep = useCallback(
    (next: number, direction: 'forward' | 'back') => {
      const run = () => {
        setStep(next);
        if (direction === 'back') setHeaderStep(next);
      };
      if (reducedMotion) {
        setStep(next);
        setHeaderStep(next);
        return;
      }
      setPhase('leave');
      window.setTimeout(() => {
        run();
        setPhase('enter');
        window.setTimeout(() => setPhase('idle'), 300);
      }, 150);
    },
    [reducedMotion],
  );

  const handleNext = async () => {
    if (step === 1) {
      const valid = await step1Form.trigger();
      if (!valid) {
        requestAnimationFrame(focusFirstError);
        return;
      }
      setHeaderStep(2);
      goToStep(2, 'forward');
      return;
    }
    if (step === 2) {
      const valid = await step2Form.trigger();
      if (!valid) {
        requestAnimationFrame(focusFirstError);
        return;
      }
      setHeaderStep(3);
      goToStep(3, 'forward');
      return;
    }
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
    });
  };

  const handleBack = () => {
    if (step > 1) goToStep(step - 1, 'back');
  };

  const progress = headerStep === 1 ? 33 : headerStep === 2 ? 66 : 100;

  const stepPanelClass =
    phase === 'leave'
      ? 'bizcap-step-panel--leave'
      : phase === 'enter'
        ? 'bizcap-step-panel--enter'
        : '';

  return (
    <div ref={containerRef} style={{ '--brand-color': brandColor } as React.CSSProperties} className="flex min-h-dvh min-h-[100svh] flex-col bg-white min-[480px]:items-center min-[480px]:justify-center min-[480px]:px-4 min-[480px]:py-8 min-[1024px]:min-h-screen min-[1024px]:bg-[#F9FAFB]">
      {logoUrl
        ? <img src={logoUrl} alt="Logo" className="mx-auto mt-6 mb-5 block max-h-12 max-w-[200px] w-auto object-contain shrink-0" />
        : <BizcapLogo className="mx-auto mt-6 mb-5 block h-8 w-auto shrink-0" />
      }
      <div
        className={[
          'bizcap-card flex w-full max-w-[480px] min-[1024px]:max-w-[560px] min-[1280px]:max-w-[640px] flex-col overflow-hidden bg-white shadow-[0_4px_24px_rgba(0,0,0,0.08)]',
          'max-h-dvh min-h-0 flex-1 min-[480px]:mx-auto min-[480px]:flex-none min-[480px]:max-h-none min-[480px]:rounded-2xl min-[480px]:shadow-[0_4px_24px_rgba(0,0,0,0.08)]',
          'max-[479px]:max-w-none max-[479px]:rounded-none',
        ].join(' ')}
      >
        <form
          className="flex min-h-0 flex-1 flex-col"
          aria-label="Business loan application"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            handleNext();
          }}
        >
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div
              className={[
                'min-h-0 flex-1 overflow-y-auto',
                'max-[479px]:px-5 max-[479px]:pb-4 max-[479px]:pt-6',
                'min-[480px]:px-8 min-[480px]:pb-4 min-[480px]:pt-8',
              ].join(' ')}
            >
              <div className="mb-5">
                <div className="mb-2 text-right text-[12px] text-[#6B7280]">
                  Step {headerStep} of 3
                </div>
                <div
                  className="h-[4px] w-full overflow-hidden rounded-[99px] bg-[#E5E7EB]"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress}
                  aria-label={`Application progress, step ${headerStep} of 3`}
                >
                  <div
                    className="bizcap-progress-fill h-full rounded-[99px] bg-[var(--brand-color)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-[99px] bg-[#F3F4F6] px-3 py-1.5 text-[12px] text-[#374151]">
                    <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    Takes ~3 minutes
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-[99px] bg-[#F3F4F6] px-3 py-1.5 text-[12px] text-[#374151]">
                    <Shield className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    No credit check required yet
                  </span>
                </div>
              </div>

              <div key={step} className={stepPanelClass}>
                {step === 1 ? <Step1PersonalDetails control={step1Form.control} formId={formId} trigger={step1Form.trigger} /> : null}
                {step === 2 ? <Step2BusinessDetails control={step2Form.control} formId={formId} trigger={step2Form.trigger} /> : null}
                {step === 3 ? <Step3LoanDetails control={step3Form.control} formId={formId} trigger={step3Form.trigger} /> : null}
              </div>
            </div>

            <div
              className={[
                'shrink-0 border-t border-[#F3F4F6] bg-white',
                'max-[479px]:px-5 max-[479px]:pb-[max(1.25rem,env(safe-area-inset-bottom))] max-[479px]:pt-4',
                'min-[480px]:px-8 min-[480px]:pb-6 min-[480px]:pt-4',
              ].join(' ')}
            >
              <button
                type="submit"
                className="flex h-[52px] w-full min-h-[52px] items-center justify-center rounded-[10px] bg-[var(--brand-color)] text-[16px] font-semibold text-white transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-color)] focus-visible:ring-offset-2"
              >
                {step === 3 ? 'Submit application' : 'Next'}
              </button>
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="mx-auto mt-3 block min-h-[44px] w-full py-2 text-center text-[14px] font-medium text-[var(--brand-color)] focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-color)] focus-visible:ring-offset-2"
                >
                  Back
                </button>
              ) : null}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
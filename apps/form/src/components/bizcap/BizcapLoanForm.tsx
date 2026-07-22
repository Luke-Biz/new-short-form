import React, { useEffect, useId, useRef, useState } from 'react';
import { Loader, CheckCircle2, ExternalLink } from 'lucide-react';
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
import { submitApplication } from '../../lib/submitApplication';
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
  const contentRef = useRef<HTMLDivElement>(null);

  const [brandColor] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('color') ?? '#0C79C1';
  });

  const [logoUrl] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('logo') ?? null;
  });

  // Configurator preview: free step navigation, submission disabled.
  // Only the configurator's iframe carries this param - never generated links.
  const [previewMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('preview') === '1';
  });

  // Partner preference from the configurator: who Bizcap calls about the application.
  const [contactPreference] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('contact') === 'broker' ? 'Call Broker' : 'Call Client';
  });

  // Corner radius for controls (px). Default 8 preserves the canonical look;
  // clamped 0–24 so partners can't break the layout. Button/card derive from it.
  const [brandRadius] = useState(() => {
    const raw = new URLSearchParams(window.location.search).get('radius');
    if (raw == null) return 8;
    const n = parseInt(raw, 10);
    return Number.isNaN(n) ? 8 : Math.max(0, Math.min(24, n));
  });

  // "Powered by Bizcap" attribution shows by default; partners opt out via poweredby=0.
  const [showPoweredBy] = useState(() => {
    return new URLSearchParams(window.location.search).get('poweredby') !== '0';
  });

  // Partner attribution from the CRM-supplied URL; forwarded to the submission
  // Lambda, which maps them to brokerId / brokerRepId.
  const [partnerParams] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    return {
      partnerid: p.get('partnerid') ?? undefined,
      partnercontactid: p.get('partnercontactid') ?? undefined,
    };
  });

  const [step, setStep] = useState(1);
  const [announcement, setAnnouncement] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [bankStatementsUrl, setBankStatementsUrl] = useState('');

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
    defaultValues: { businessName: '', abn: '', businessAddress: '', industry: '' },
  });

  const step3Form = useForm<Step3Data>({
    resolver: zodResolver(Step3Schema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { monthlyRevenue: '', loanAmount: '' },
  });

  // Rough completeness mirror of each step's schema. Drives the CTA's
  // "inactive" look only - the button stays clickable so a click still runs
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

  // When embedded in an iframe, report our content height to the parent so the
  // embed snippet can auto-size the iframe (no internal scrollbars or empty gap).
  useEffect(() => {
    if (window.parent === window) return; // not embedded
    const content = contentRef.current;
    const root = containerRef.current;
    if (!content || !root) return;

    let frame = 0;
    const post = () => {
      const cs = getComputedStyle(root);
      const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      const height = Math.ceil(content.getBoundingClientRect().height + padY);
      window.parent.postMessage({ type: 'bizcap-form-resize', height }, '*');
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(post);
    };

    schedule();
    const ro = new ResizeObserver(schedule);
    ro.observe(content);
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener('resize', schedule);
    };
  }, []);

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
    if (previewMode || submitting) return;
    const valid = await step3Form.trigger();
    if (!valid) {
      requestAnimationFrame(focusFirstError);
      return;
    }
    const { monthlyRevenue: revRaw, loanAmount: loanRaw, purpose } = step3Form.getValues();

    setSubmitError(false);
    setSubmitting(true);
    const result = await submitApplication({
      ...step1Form.getValues(),
      ...step2Form.getValues(),
      monthlyRevenue: parseMoneyNumber(revRaw),
      loanAmount: parseMoneyNumber(loanRaw),
      purpose,
      contactPreference,
      ...partnerParams,
    });

    setSubmitting(false);
    if (result.isSuccess) {
      // Show an in-form thank-you screen. The bank-statements link isn't
      // iframeable, so it's offered as a "new tab" button rather than a redirect.
      setBankStatementsUrl(result.redirectUrl ?? '');
      setSubmitted(true);
      setAnnouncement('Your application has been submitted.');
      return;
    }
    setSubmitError(true);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const percent = step === 1 ? 33 : step === 2 ? 66 : 100;
  const ctaDisabled = (previewMode && step === 3) || submitting;

  return (
    <div
      ref={containerRef}
      style={{
        '--brand-color': brandColor,
        '--brand-shadow': 'color-mix(in srgb, var(--brand-color) 12%, transparent)',
        '--brand-hover': 'color-mix(in srgb, var(--brand-color) 85%, black)',
        '--brand-light': 'color-mix(in srgb, var(--brand-color) 8%, white)',
        '--brand-radius': `${brandRadius}px`,
      } as React.CSSProperties}
      className="min-h-full bg-[#F9FAFB] px-4 pb-16 pt-10"
    >
      <div ref={contentRef} className="mx-auto w-full max-w-[600px]">
        {logoUrl === 'none'
          ? null
          : logoUrl
            ? <img src={logoUrl} alt="Logo" className="mx-auto mb-7 block max-h-12 w-auto max-w-[200px] object-contain" />
            : <BizcapLogo className="mx-auto mb-7 block h-8 w-auto" />
        }

        {submitted ? (
          <div
            role="status"
            className="rounded-[calc(var(--brand-radius)_+_6px)] border border-[#E5E7EB] bg-white px-6 py-10 text-center"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-light)]">
              <CheckCircle2 className="h-8 w-8 text-[var(--brand-color)]" aria-hidden />
            </div>
            <h1 className="text-[20px] font-semibold text-[#111827]">
              Thank you for your submission
            </h1>
            <p className="mx-auto mt-2 max-w-[420px] text-[14px] leading-[1.55] text-[#6B7280]">
              We&apos;ve received your application and our team will be in touch shortly.
            </p>
            {bankStatementsUrl ? (
              <>
                <p className="mx-auto mt-4 max-w-[420px] text-[14px] leading-[1.55] text-[#6B7280]">
                  To speed things up, securely provide your bank statements now.
                </p>
                <a
                  href={bankStatementsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-[calc(var(--brand-radius)_+_2px)] bg-[var(--brand-color)] px-4 py-3 text-[15px] font-medium text-white transition-colors hover:bg-[var(--brand-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-color)]"
                >
                  Continue to bank statements
                  <ExternalLink className="h-4 w-4" aria-hidden />
                </a>
                <p className="mt-2 text-[12px] text-[#9CA3AF]">
                  Opens in a new tab and takes you to bizcap.com.au
                </p>
              </>
            ) : null}
          </div>
        ) : (
        <>
        <TrustStrip />

        <div className="mb-6">
          <div className="mb-[7px] flex items-center justify-between">
            <span className="text-[12px] font-medium text-[#6B7280]">
              <span className="min-[480px]:hidden">{step} / 3</span>
              <span className="hidden min-[480px]:inline">
                Step {step} of 3 - {STEP_LABELS[step - 1]}
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
            aria-label={`Step ${step} of 3 - ${STEP_LABELS[step - 1]}`}
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

        {/* No overflow-hidden here - the industry dropdown panel must be able
            to extend past the card edge */}
        <div className="rounded-[calc(var(--brand-radius)_+_6px)] border border-[#E5E7EB] bg-white">
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
            {step === 2 ? <Step2BusinessDetails control={step2Form.control} formId={formId} trigger={step2Form.trigger} setValue={step2Form.setValue} /> : null}
            {step === 3 ? <Step3LoanDetails control={step3Form.control} formId={formId} trigger={step3Form.trigger} /> : null}

            {step === 3 && submitError ? (
              <p className="mt-4 text-[13px] text-[#991B1B]" role="alert">
                Something went wrong submitting your application. Please check your connection and try again.
              </p>
            ) : null}

            <button
              type="submit"
              disabled={ctaDisabled}
              aria-busy={submitting}
              className={[
                'mt-5 flex w-full items-center justify-center gap-2 rounded-[calc(var(--brand-radius)_+_2px)] px-4 py-3 text-[15px] font-medium',
                'transition-[background-color,transform,opacity] duration-150 active:scale-[0.99]',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-color)]',
                submitting
                  ? 'cursor-wait bg-[var(--brand-color)] text-white opacity-80'
                  : ctaDisabled
                    ? 'cursor-not-allowed bg-[#D1D5DB] text-[#9CA3AF]'
                    : stepComplete
                      ? 'bg-[var(--brand-color)] text-white hover:bg-[var(--brand-hover)]'
                      : 'bg-[var(--brand-color)] text-white opacity-60 hover:opacity-75',
              ].join(' ')}
            >
              {submitting ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" aria-hidden />
                  Submitting…
                </>
              ) : step === 3 ? (
                previewMode ? 'Preview mode - submissions disabled' : 'Submit application'
              ) : (
                'Next'
              )}
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
        </>
        )}

        {showPoweredBy ? (
          <p className="mt-5 text-center text-[12px] text-[#9CA3AF]">
            Powered by{' '}
            <a
              href="https://www.bizcap.com.au"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#6B7280] underline underline-offset-2 hover:text-[#111827]"
            >
              Bizcap
            </a>
          </p>
        ) : null}
      </div>
    </div>
  );
}

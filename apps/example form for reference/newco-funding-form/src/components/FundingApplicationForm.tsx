import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { CSSProperties } from 'react';

import { fullFormSchema } from '../schema/form';
import type { FullFormData } from '../schema/form';
import type { DisqReason, FormErrorState, FormStep, FormVariant, StepNumber, StepState } from '../types';
import { FORM_NAME, MIN_SUBMIT_DELAY_MS, REVENUE_THRESHOLD, STEP_INFO, STEP_INFO_V2, V2_BROKER_ID } from '../constants';
import { track } from '../lib/analytics';
import { useFeatureFlag } from '../lib/featureFlags';
import { captureUtm, capturePartnerParams, captureAffiliateParams } from '../lib/utm';
import type { UtmParams, PartnerParams, AffiliateParams } from '../lib/utm';
import * as Sentry from '@sentry/react';
import { submitLead, patchLead, isPatchConfigured, extractLeadId, extractRedirectUrl } from '../lib/api';
import { buildPayload, buildInitialPayload } from '../lib/payload';
import { pushDataLayer, setDataLayerVariant } from '../lib/dataLayer';
import { reportSubmitError } from '../lib/errorReporting';

import { TrustStrip } from './TrustStrip';
import { StepProgress } from './StepProgress';
import { DisqualifiedScreen } from './DisqualifiedScreen';
import { SuccessScreen } from './SuccessScreen';
import { Step1Eligibility } from './steps/Step1Eligibility';
import { Step2Business } from './steps/Step2Business';
import { Step3Contact } from './steps/Step3Contact';
import { Step1ContactV2 } from './steps/Step1ContactV2';
import { Step3DetailsV2 } from './steps/Step3DetailsV2';

export type FundingApplicationFormProps = {
  headlineOverride?: string;
  subheadlineOverride?: string;
  submitCtaOverride?: string;
  eligibilityCtaOverride?: string;
  revenueThresholdOverride?: number;
  brandColorOverride?: string;
  showBrandTitle?: boolean;
  // Webflow Variant prop value, e.g. "Variant 1" / "Variant 2".
  formVariant?: string;
};

const CSS_VARS: CSSProperties = {
  '--brand': '#0C79C1',
  '--brand-hover': '#0A639E',
  '--brand-light': '#E8F3FB',
  '--bg': '#f9fafb',
  '--surface': '#ffffff',
  '--text-primary': '#111827',
  '--text-muted': '#6b7280',
  '--text-tertiary': '#6b7280',
  '--border': '#e5e7eb',
  '--error-bg': '#fef2f2',
  '--error-text': '#991b1b',
  '--success-bg': '#f0fdf4',
  '--success-text': '#166534',
  '--success-border': '#bbf7d0',
  '--warning-bg': '#fffbeb',
  '--warning-text': '#92400e',
  '--warning-border': '#fde68a',
  '--radius-sm': '8px',
  '--radius-md': '10px',
  '--radius-lg': '14px',
};

const ERROR_MESSAGES: Record<NonNullable<FormErrorState>['category'], string> = {
  validation: 'Please check your information and try again.',
  rate_limit: 'Too many submissions — please try again in a moment.',
  server: 'Something went wrong on our end. Please try again.',
  network: 'Connection failed. Please check your internet and try again.',
};

const RETRYABLE = new Set<FormErrorState['category']>(['server', 'network']);

export function FundingApplicationForm({
  headlineOverride,
  subheadlineOverride,
  submitCtaOverride,
  eligibilityCtaOverride,
  revenueThresholdOverride = REVENUE_THRESHOLD,
  brandColorOverride,
  showBrandTitle = true,
  formVariant,
}: FundingApplicationFormProps) {
  const variant: FormVariant = formVariant?.includes('2') ? 'v2' : 'v1';
  const stepInfo = variant === 'v2' ? STEP_INFO_V2 : STEP_INFO;

  // Feature flags
  const showTrustStrip = useFeatureFlag('show_trust_strip', true);
  const progressiveReveal = useFeatureFlag('progressive_reveal_step_1', true);

  // Form
  const form = useForm<FullFormData>({
    resolver: zodResolver(fullFormSchema),
    defaultValues: {
      revenue: undefined,
      businessStructure: undefined,
      bank: undefined,
      amount: 0,
      businessName: '',
      industry: undefined,
      timeInBusiness: undefined,
      ein: '',
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      smsConsent: false,
    },
    mode: 'onBlur',
  });

  // Step state machine
  const [stepState, setStepState] = useState<StepState>({
    current: 1,
    highest: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingLead, setIsCreatingLead] = useState(false);
  const [formError, setFormError] = useState<FormErrorState | null>(null);
  const [announcement, setAnnouncement] = useState('');

  // Refs
  const mountedAtRef = useRef(Date.now());
  const abortRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const honeypotRef = useRef('');
  const utmRef = useRef<UtmParams>(captureUtm());
  const partnerRef = useRef<PartnerParams>(capturePartnerParams());
  const affiliateRef = useRef<AffiliateParams>(captureAffiliateParams());

  // v2 leads go to their own broker; an explicit ?partnerid= referral still
  // wins. v1 sends no brokerId at all — the Lambda's default applies.
  const partnerParams = useCallback(
    (): PartnerParams =>
      variant === 'v2' && !partnerRef.current.brokerId
        ? { ...partnerRef.current, brokerId: V2_BROKER_ID }
        : partnerRef.current,
    [variant],
  );
  // v2: lead created after step 1; final submission PATCHes it.
  const leadIdRef = useRef<string | null>(null);
  const applicationLinkRef = useRef<string | null>(null);
  const botRef = useRef(false);

  useEffect(() => {
    setDataLayerVariant(variant);
    track('form_view', { form_name: FORM_NAME, form_variant: variant });
    return () => {
      abortRef.current?.abort();
    };
  }, [variant]);

  const isFirstRender = useRef(true);

  const navigate = useCallback(
    (to: FormStep, fromStep?: StepNumber) => {
      setStepState((prev) => ({
        ...prev,
        current: to,
        highest:
          typeof to === 'number'
            ? (Math.max(prev.highest, to) as StepNumber)
            : prev.highest,
      }));
      setFormError(null);

      if (typeof to === 'number') {
        setAnnouncement(`Now on Step ${to} of 3: ${stepInfo[to - 1].label}`);
      } else if (to === 'success') {
        setAnnouncement('Application submitted successfully.');
      } else if (to === 'disqualified') {
        setAnnouncement('You do not currently meet the eligibility criteria.');
      }

      if (typeof to === 'number' && typeof fromStep === 'number') {
        track('step_back', { form_name: FORM_NAME, form_variant: variant, from_step: fromStep, to_step: to });
      }
    },
    [stepInfo, variant],
  );

  const disqualify = useCallback(
    (reason: DisqReason) => {
      track('qualification_failed', { form_name: FORM_NAME, form_variant: variant, reason });
      setStepState((prev) => ({ ...prev, current: 'disqualified', disqReason: reason }));
      setAnnouncement('You do not currently meet the eligibility criteria.');
    },
    [variant],
  );

  const handleStep1Next = useCallback(() => {
    track('step_advance', { form_name: FORM_NAME, form_variant: variant, step: 1, step_name: 'eligibility' });
    navigate(2);
  }, [navigate, variant]);

  const handleStep2Next = useCallback(() => {
    track('step_advance', { form_name: FORM_NAME, form_variant: variant, step: 2, step_name: 'business_details' });
    navigate(3);
  }, [navigate, variant]);

  // v2 step 1 → create the lead in BizMate, then advance. Advances even when
  // the create fails — the final submission falls back to a full POST, so the
  // lead is never lost to a transient error here.
  const handleV2Step1Next = useCallback(async () => {
    track('step_advance', { form_name: FORM_NAME, form_variant: variant, step: 1, step_name: 'contact_details' });

    if (honeypotRef.current) {
      botRef.current = true;
      navigate(2);
      return;
    }
    // Filled too fast (bot indicator) — skip the early create; the final
    // submission's own checks decide whether anything is ever sent.
    if (Date.now() - mountedAtRef.current < MIN_SUBMIT_DELAY_MS) {
      navigate(2);
      return;
    }

    if (!leadIdRef.current) {
      setIsCreatingLead(true);
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      const payload = buildInitialPayload(form.getValues(), utmRef.current, partnerParams(), affiliateRef.current);
      const result = await submitLead(payload, abortRef.current.signal);
      setIsCreatingLead(false);

      if (result.ok) {
        leadIdRef.current = extractLeadId(result.responseData);
        applicationLinkRef.current = extractRedirectUrl(result.responseData);
      } else {
        reportSubmitError(`lead_create_${result.error.type}`, payload, window.location.href);
      }
    }
    navigate(2);
  }, [form, navigate, variant, partnerParams]);

  const handleV2Step2Next = useCallback(() => {
    track('step_advance', { form_name: FORM_NAME, form_variant: variant, step: 2, step_name: 'funding_details' });
    navigate(3);
  }, [navigate, variant]);

  const handleSubmit = useCallback(async () => {
    // Honeypot check (botRef: honeypot tripped earlier, before the v2 lead create)
    if (honeypotRef.current || botRef.current) {
      setStepState((prev) => ({ ...prev, current: 'success' }));
      return;
    }

    // Timing check — silent success if submitted too fast (bot indicator)
    if (Date.now() - mountedAtRef.current < MIN_SUBMIT_DELAY_MS) {
      setStepState((prev) => ({ ...prev, current: 'success' }));
      return;
    }

    const data = form.getValues();
    const valid = await form.trigger(['firstName', 'phone', 'email']);
    if (!valid) return;

    Sentry.setUser({
      email: data.email,
      username: `${data.firstName} ${data.lastName}`.trim(),
      phone: data.phone,
    });

    setIsSubmitting(true);
    setFormError(null);
    track('submit_attempt', { form_name: FORM_NAME, form_variant: variant });

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const payload = buildPayload(data, utmRef.current, partnerParams(), affiliateRef.current);
    // v2 with a created lead updates it; anything else (v1, failed create,
    // PATCH endpoint not configured yet) creates via full POST.
    const leadId = leadIdRef.current;
    const result = variant === 'v2' && leadId && isPatchConfigured()
      ? await patchLead(leadId, payload, abortRef.current.signal)
      : await submitLead(payload, abortRef.current.signal);

    setIsSubmitting(false);

    if (result.ok) {
      track('submit_success', { form_name: FORM_NAME, form_variant: variant, amount_requested: data.amount });
      pushDataLayer({ event: 'custom.successful.application' });
      const redirectUrl = extractRedirectUrl(result.responseData) ?? applicationLinkRef.current;
      if (redirectUrl) {
        window.location.assign(redirectUrl);
      } else {
        navigate('success');
      }
    } else {
      if (result.error.type === 'validation' && result.error.fields) {
        Object.entries(result.error.fields).forEach(([field, message]) => {
          form.setError(field as keyof FullFormData, { message });
        });
      }
      track('submit_error', { form_name: FORM_NAME, form_variant: variant, error_category: result.error.type });
      reportSubmitError(result.error.type, payload as Record<string, unknown>, window.location.href);
      setFormError({
        category: result.error.type,
        message: ERROR_MESSAGES[result.error.type],
        retryable: RETRYABLE.has(result.error.type),
      });
    }
  }, [form, navigate, variant, partnerParams]);

  const handleRestart = useCallback(() => {
    track('restart_from_disqualified', { form_name: FORM_NAME, form_variant: variant });
    pushDataLayer({ event: 'start_over_button' });
    form.reset();
    honeypotRef.current = '';
    setFormError(null);
    setStepState({ current: 1, highest: 1 });
    setAnnouncement(`Form restarted. Now on Step 1: ${stepInfo[0].label}.`);
  }, [form, stepInfo, variant]);

  const { current, highest, disqReason } = stepState;

  // Fires after React commits the new step — scroll happens on the updated DOM,
  // not the outgoing step's content. isFirstRender skips the initial mount.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    containerRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [current]);

  const rootStyle: CSSProperties = {
    ...CSS_VARS,
    ...(brandColorOverride ? { '--brand': brandColorOverride } : {}),
  };

  return (
    <div
      ref={containerRef}
      style={rootStyle}
      className="font-sans bg-form-bg text-text-primary min-h-screen px-4 py-10 pb-16 animate-fade-in"
    >
      <div className="max-w-[600px] mx-auto">
        {/* Brand */}
        {showBrandTitle && (
          <div className="flex items-center justify-center mb-[1.75rem]">
            <div className="text-[17px] font-medium text-text-primary tracking-[-0.3px]">
              Bizcap
            </div>
          </div>
        )}

        {/* Trust strip */}
        {showTrustStrip && <TrustStrip />}

        {/* Progress bar (hidden on terminal screens that have their own state indicators) */}
        <StepProgress
          currentStep={current}
          highestStep={highest}
          announcement={announcement}
          steps={stepInfo}
        />

        {/* Honeypot — off-screen, aria-hidden, never validated by RHF */}
        <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}>
          <label htmlFor="website_url">Website</label>
          <input
            id="website_url"
            name="website_url"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            onChange={(e) => { honeypotRef.current = e.target.value; }}
          />
        </div>

        {/* Card */}
        <div className="bg-surface border border-form-border rounded-form-lg overflow-hidden">
          {current === 1 && (variant === 'v2' ? (
            <Step1ContactV2
              form={form}
              cta="Continue →"
              loading={isCreatingLead}
              onNext={() => void handleV2Step1Next()}
            />
          ) : (
            <Step1Eligibility
              form={form}
              progressiveReveal={progressiveReveal}
              eligibilityCta={eligibilityCtaOverride || 'Check my eligibility →'}
              revenueThreshold={revenueThresholdOverride}
              onDisqualify={disqualify}
              onNext={handleStep1Next}
            />
          ))}

          {current === 2 && (variant === 'v2' ? (
            <Step1Eligibility
              form={form}
              progressiveReveal={progressiveReveal}
              eligibilityCta={eligibilityCtaOverride || 'Continue →'}
              revenueThreshold={revenueThresholdOverride}
              onDisqualify={disqualify}
              onNext={handleV2Step2Next}
              gated={false}
              kicker="Funding details"
              headline="What are you looking for?"
              subheadline="Tell us about your revenue and funding needs."
              dataLayerEvent="funding_details_button"
              funnelStep="Step 2"
              onBack={() => navigate(1, 2)}
            />
          ) : (
            <Step2Business
              form={form}
              headline={headlineOverride || 'Tell us about your business'}
              subheadline={subheadlineOverride || 'A few details about your company.'}
              onNext={handleStep2Next}
              onBack={() => navigate(1, 2)}
            />
          ))}

          {current === 3 && (variant === 'v2' ? (
            <Step3DetailsV2
              form={form}
              isSubmitting={isSubmitting}
              formError={formError}
              submitCta={submitCtaOverride || 'Submit my application'}
              onSubmit={handleSubmit}
              onBack={() => navigate(2, 3)}
              onRetry={handleSubmit}
            />
          ) : (
            <Step3Contact
              form={form}
              isSubmitting={isSubmitting}
              formError={formError}
              submitCta={submitCtaOverride || 'Submit my application'}
              onSubmit={handleSubmit}
              onBack={() => navigate(2, 3)}
              onRetry={handleSubmit}
            />
          ))}

          {current === 'disqualified' && disqReason && (
            <DisqualifiedScreen reason={disqReason} onRestart={handleRestart} />
          )}

          {current === 'success' && <SuccessScreen />}
        </div>
      </div>
    </div>
  );
}

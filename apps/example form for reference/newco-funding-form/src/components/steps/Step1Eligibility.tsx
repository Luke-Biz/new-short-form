import { useRef, useEffect, useState } from 'react';
import { Controller } from 'react-hook-form';
import type { UseFormReturn } from 'react-hook-form';
import {
  IconBuilding,
  IconBuildingCommunity,
  IconUser,
  IconUsersGroup,
  IconBuildingBank,
  IconDeviceMobile,
  IconInfoCircle,
  IconCalendar,
  IconCalendarStats,
} from '@tabler/icons-react';
import type { FullFormData } from '../../schema/form';
import type { DisqReason } from '../../types';
import { REVENUE_BANDS } from '../../constants';
import { RevenueGateButton } from '../primitives/RevenueGateButton';
import { SelectButton } from '../primitives/SelectButton';
import { Field } from '../primitives/Field';
import { MoneyField } from '../primitives/MoneyField';
import { SubmitButton } from '../primitives/SubmitButton';
import { pushDataLayer } from '../../lib/dataLayer';

const STRUCTURE_OPTIONS = [
  { value: 'llc', label: 'LLC', icon: <IconBuilding size={15} aria-hidden="true" />, disq: false },
  { value: 'corporation', label: 'Corporation (C or S)', icon: <IconBuildingCommunity size={15} aria-hidden="true" />, disq: false },
  { value: 'sole_proprietor', label: 'Sole proprietor', icon: <IconUser size={15} aria-hidden="true" />, disq: false },
  { value: 'partnership', label: 'Partnership / LLP', icon: <IconUsersGroup size={15} aria-hidden="true" />, disq: false },
] as const;

const TIME_OPTIONS = [
  { value: '<1yr', label: 'Under 1 yr', icon: <IconCalendar size={15} aria-hidden="true" />, disq: true },
  { value: '1-2yr', label: '1 – 2 yrs', icon: <IconCalendar size={15} aria-hidden="true" />, disq: false },
  { value: '2-5yr', label: '2 – 5 yrs', icon: <IconCalendar size={15} aria-hidden="true" />, disq: false },
  { value: '5yr+', label: '5+ years', icon: <IconCalendarStats size={15} aria-hidden="true" />, disq: false },
] as const;

const BANK_OPTIONS = [
  { value: 'chase_bofa_wells', label: 'Chase / Bank of America / Wells Fargo', icon: <IconBuildingBank size={15} aria-hidden="true" />, neo: false },
  { value: 'usbank_pnc_truist', label: 'US Bank / PNC / Truist', icon: <IconBuildingBank size={15} aria-hidden="true" />, neo: false },
  { value: 'community', label: 'Community / regional bank', icon: <IconBuildingBank size={15} aria-hidden="true" />, neo: false },
  { value: 'neo_relay_mercury', label: 'Relay / Mercury / Bluevine', icon: <IconDeviceMobile size={15} aria-hidden="true" />, neo: true },
  { value: 'neo_other', label: 'Other neo-bank', icon: <IconDeviceMobile size={15} aria-hidden="true" />, neo: true },
] as const;

type Step1Props = {
  form: UseFormReturn<FullFormData>;
  progressiveReveal: boolean;
  eligibilityCta: string;
  revenueThreshold: number;
  onDisqualify: (reason: DisqReason) => void;
  onNext: () => void;
  // When false (contact-first variant), no selection disqualifies — the lead
  // already exists in BizMate, so qualification is handled downstream.
  gated?: boolean;
  kicker?: string;
  headline?: string;
  subheadline?: string;
  dataLayerEvent?: string;
  funnelStep?: string;
  onBack?: () => void;
};

export function Step1Eligibility({
  form,
  progressiveReveal,
  eligibilityCta,
  onDisqualify,
  onNext,
  gated = true,
  kicker = 'Quick eligibility check',
  headline = 'Let’s see if you qualify',
  subheadline = 'Takes about 60 seconds, no credit check, no commitment.',
  dataLayerEvent = 'check_my_eligibility_button',
  funnelStep = 'Step 1',
  onBack,
}: Step1Props) {
  const revenue = form.watch('revenue');
  const businessStructure = form.watch('businessStructure');
  const timeInBusiness = form.watch('timeInBusiness');
  const bank = form.watch('bank');
  const amount = form.watch('amount');

  const showTime = !progressiveReveal || revenue === '20k_100k' || revenue === '100k_500k' || revenue === '500k_plus';
  const showStructure = !progressiveReveal || (showTime && !!timeInBusiness);
  const showBank = !progressiveReveal || (showStructure && !!businessStructure);
  const showAmount = !progressiveReveal || (showBank && !!bank);

  const isNeoBank = bank === 'neo_relay_mercury' || bank === 'neo_other';

  const step1Valid =
    revenue && (!gated || revenue !== 'below_20k') &&
    businessStructure &&
    timeInBusiness && (!gated || timeInBusiness !== '<1yr') &&
    bank &&
    amount > 0;

  const [attempted, setAttempted] = useState(false);

  // Refs for scroll-into-view on progressive reveal and validate-on-click
  const revenueRef = useRef<HTMLDivElement>(null);
  const structureRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLDivElement>(null);
  const bankRef = useRef<HTMLDivElement>(null);
  const amountRef = useRef<HTMLDivElement>(null);
  const amountInputRef = useRef<HTMLInputElement | null>(null);

  const prevShowStructure = useRef(showStructure);
  const prevShowTime = useRef(showTime);
  const prevShowBank = useRef(showBank);
  const prevShowAmount = useRef(showAmount);

  useEffect(() => {
    if (!prevShowTime.current && showTime && timeRef.current) {
      timeRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    prevShowTime.current = showTime;
  }, [showTime]);

  useEffect(() => {
    if (!prevShowStructure.current && showStructure && structureRef.current) {
      structureRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    prevShowStructure.current = showStructure;
  }, [showStructure]);

  useEffect(() => {
    if (!prevShowBank.current && showBank && bankRef.current) {
      bankRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    prevShowBank.current = showBank;
  }, [showBank]);

  useEffect(() => {
    if (!prevShowAmount.current && showAmount && amountRef.current) {
      amountRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    prevShowAmount.current = showAmount;
  }, [showAmount]);

  async function handleContinue() {
    setAttempted(true);
    if (!revenue || (gated && revenue === 'below_20k')) {
      revenueRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    if (!timeInBusiness) {
      timeRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    if (!businessStructure) {
      structureRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    if (!bank) {
      bankRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    if (amount <= 0) {
      await form.trigger('amount');
      amountRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      amountInputRef.current?.focus({ preventScroll: true });
      return;
    }
    pushDataLayer({
      event: dataLayerEvent,
      revenueAmount: REVENUE_BANDS.find((b) => b.value === revenue)?.label ?? '',
      timeInBusiness: TIME_OPTIONS.find((o) => o.value === timeInBusiness)?.label ?? '',
      businessStructure: STRUCTURE_OPTIONS.find((o) => o.value === businessStructure)?.label ?? '',
      primaryBank: BANK_OPTIONS.find((o) => o.value === bank)?.label ?? '',
      desiredFundingAmount: `$${amount.toLocaleString('en-US')}`,
      funnelStep,
    });
    onNext();
  }

  function handleRevenueSelect(value: string) {
    setAttempted(false);
    if (gated && value === 'below_20k') {
      onDisqualify('revenue_below_threshold');
      return;
    }
    form.setValue('revenue', value as FullFormData['revenue'], { shouldValidate: false });
  }

  function handleTimeSelect(value: string, isDisq: boolean) {
    setAttempted(false);
    if (gated && isDisq) {
      onDisqualify('time_under_1yr');
      return;
    }
    form.setValue('timeInBusiness', value as FullFormData['timeInBusiness'], { shouldValidate: false });
  }

  function handleStructureSelect(value: string, isDisq: boolean) {
    setAttempted(false);
    if (gated && isDisq) {
      onDisqualify('sole_proprietor');
      return;
    }
    form.setValue('businessStructure', value as FullFormData['businessStructure'], { shouldValidate: false });
  }

  function handleBankSelect(value: string) {
    setAttempted(false);
    form.setValue('bank', value as FullFormData['bank'], { shouldValidate: false });
  }

  return (
    <div>
      <div className="px-6 pt-6 pb-0">
        <div className="text-[11px] font-medium uppercase tracking-[0.07em] text-brand mb-[0.3rem]">
          {kicker}
        </div>
        <h1 className="text-[18px] font-medium text-text-primary tracking-[-0.2px] mb-[0.3rem]">
          {headline}
        </h1>
        <p className="text-[13px] text-text-muted leading-[1.55] mb-5">
          {subheadline}
        </p>
      </div>

      <div className="px-6 pb-6">
        {/* Revenue — 2×2 grid */}
        <div ref={revenueRef} className="mb-[1.125rem]">
          <span className="block text-[13px] font-medium text-text-primary mb-[0.45rem]">
            What is your average monthly revenue?
          </span>
          <div
            role="radiogroup"
            aria-label="Average monthly revenue"
            className="grid grid-cols-2 gap-[10px]"
          >
            {REVENUE_BANDS.map((band) => (
              <RevenueGateButton
                key={band.value}
                option={band}
                selected={revenue === band.value}
                onClick={() => handleRevenueSelect(band.value)}
              />
            ))}
          </div>
          {attempted && !revenue && (
            <p className="mt-[6px] text-[12px] text-error-text">Please select your monthly revenue.</p>
          )}
        </div>

        {/* Time in business — progressive reveal */}
        {showTime && (
          <div
            ref={timeRef}
            className={progressiveReveal ? 'animate-slide-down motion-reduce:animate-none' : ''}
          >
            <div className="h-px bg-form-border mb-[1.125rem]" aria-hidden="true" />
            <div className="mb-[1.125rem]">
              <span className="block text-[13px] font-medium text-text-primary mb-[0.45rem]">
                Time in business
              </span>
              <div
                role="radiogroup"
                aria-label="Time in business"
                className="grid grid-cols-2 md:grid-cols-4 gap-[7px]"
              >
                {TIME_OPTIONS.map((opt) => (
                  <SelectButton
                    key={opt.value}
                    label={opt.label}
                    icon={opt.icon}
                    selected={timeInBusiness === opt.value}
                    onClick={() => handleTimeSelect(opt.value, opt.disq)}
                  />
                ))}
              </div>
              {attempted && !timeInBusiness && (
                <p className="mt-[6px] text-[12px] text-error-text">Please select your time in business.</p>
              )}
            </div>
          </div>
        )}

        {/* Business structure — progressive reveal */}
        {showStructure && (
          <div
            ref={structureRef}
            className={progressiveReveal ? 'animate-slide-down motion-reduce:animate-none' : ''}
          >
            <div className="h-px bg-form-border mb-[1.125rem]" aria-hidden="true" />
            <div className="mb-[1.125rem]">
              <span className="block text-[13px] font-medium text-text-primary mb-[0.45rem]">
                Business structure
              </span>
              <div
                role="radiogroup"
                aria-label="Business structure"
                className="grid grid-cols-1 sm:grid-cols-2 gap-[7px]"
              >
                {STRUCTURE_OPTIONS.map((opt) => (
                  <SelectButton
                    key={opt.value}
                    label={opt.label}
                    icon={opt.icon}
                    selected={businessStructure === opt.value}
                    onClick={() => handleStructureSelect(opt.value, opt.disq)}
                  />
                ))}
              </div>
              {attempted && !businessStructure && (
                <p className="mt-[6px] text-[12px] text-error-text">Please select your business structure.</p>
              )}
            </div>
          </div>
        )}

        {/* Bank — progressive reveal */}
        {showBank && (
          <div
            ref={bankRef}
            className={progressiveReveal ? 'animate-slide-down motion-reduce:animate-none' : ''}
          >
            <div className="h-px bg-form-border mb-[1.125rem]" aria-hidden="true" />
            <div className="mb-[1.125rem]">
              <span className="block text-[13px] font-medium text-text-primary mb-[0.45rem]">
                Primary business bank
              </span>
              <div
                role="radiogroup"
                aria-label="Primary business bank"
                className="grid grid-cols-1 gap-[7px]"
              >
                {BANK_OPTIONS.map((opt) => (
                  <SelectButton
                    key={opt.value}
                    label={opt.label}
                    icon={opt.icon}
                    selected={bank === opt.value}
                    onClick={() => handleBankSelect(opt.value)}
                  />
                ))}
              </div>
              {attempted && !bank && (
                <p className="mt-[6px] text-[12px] text-error-text">Please select your primary business bank.</p>
              )}

              {/* Neo-bank amber warning */}
              {isNeoBank && (
                <div
                  role="status"
                  className={[
                    'flex items-start gap-[6px] mt-[6px] px-[10px] py-2 rounded-form-sm',
                    'bg-warning-bg border border-warning-border text-[12px] text-warning-text leading-[1.5]',
                    'animate-slide-down motion-reduce:animate-none',
                  ].join(' ')}
                >
                  <IconInfoCircle size={14} className="flex-shrink-0 mt-0.5 text-[#d97706]" aria-hidden="true" />
                  <span>
                    Neo-bank accounts can sometimes complicate our review. You may still qualify,
                    our team will assess your file. Opening a secondary traditional bank account
                    can also strengthen your application.
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Funding amount — progressive reveal */}
        {showAmount && (
          <div
            ref={amountRef}
            className={progressiveReveal ? 'animate-slide-down motion-reduce:animate-none' : ''}
          >
            <div className="h-px bg-form-border mb-[1.125rem]" aria-hidden="true" />
            <Field
              id="amount-input"
              label="Desired funding amount"
              hint="Enter the approximate amount you're looking to access"
              error={form.formState.errors.amount?.message}
              className="mb-0"
            >
              <Controller
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <MoneyField
                    ref={(el) => { amountInputRef.current = el; field.ref(el); }}
                    id="amount-input"
                    placeholder="e.g. 250,000"
                    value={field.value}
                    error={form.formState.errors.amount?.message}
                    onValueChange={(raw) => {
                      field.onChange(raw);
                      if (raw > 0) form.clearErrors('amount');
                    }}
                    onBlur={() => {
                      field.onBlur();
                      if (attempted) void form.trigger('amount');
                    }}
                  />
                )}
              />
            </Field>
          </div>
        )}

        <SubmitButton inactive={!step1Valid} onClick={() => void handleContinue()}>
          {eligibilityCta}
        </SubmitButton>

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="block w-full text-center mt-3 text-[13px] text-text-tertiary hover:text-text-muted focus-ring rounded"
          >
            ← Back
          </button>
        )}
      </div>
    </div>
  );
}

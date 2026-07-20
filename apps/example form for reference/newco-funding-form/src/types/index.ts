declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

// Extend React.CSSProperties to accept CSS custom properties
declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
}

// v1 = eligibility-first (original). v2 = contact-first: lead is created in
// BizMate after step 1, then updated (PATCH) at final submission.
export type FormVariant = 'v1' | 'v2';

export type DisqReason = 'revenue_below_threshold' | 'sole_proprietor' | 'time_under_1yr';

export type StepNumber = 1 | 2 | 3;
export type TerminalState = 'disqualified' | 'success';
export type FormStep = StepNumber | TerminalState;

export type StepState = {
  current: FormStep;
  highest: StepNumber;
  disqReason?: DisqReason;
};

export type FormErrorState = {
  category: 'validation' | 'rate_limit' | 'server' | 'network';
  message: string;
  retryable: boolean;
};

export type DisqConfig = {
  title: string;
  message: string;
  alt: string;
};

export type RevenueBandValue = 'below_20k' | '20k_100k' | '100k_500k' | '500k_plus';

export type RevenueBandOption = {
  value: RevenueBandValue;
  label: string;
  sublabel: string;
  qualifier: boolean;
  apiValue: number;
};

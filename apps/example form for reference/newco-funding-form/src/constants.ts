import type { DisqConfig, DisqReason, RevenueBandOption } from './types';

export const FORM_NAME = 'newco_funding_application_v2' as const;

export const REVENUE_THRESHOLD = 20_000;
export const MIN_SUBMIT_DELAY_MS = 3_000;
export const API_TIMEOUT_MS = 10_000;
export const API_MAX_RETRIES = 2;
export const API_URL = 'https://u0p8nbqy76.execute-api.ap-southeast-2.amazonaws.com/default/BizmateUSShortFormPOSTLeadV2';

// Lead-update endpoint for the contact-first variant: the final submission is
// sent here as PATCH with `{ id, ...fields }`. Same Lambda as API_URL — it
// routes on HTTP method. If ever emptied, variant 2 falls back to a full POST
// at submission (risking duplicate/dedup-swallowed leads).
export const API_PATCH_URL = API_URL;

// Contact-first variant sends this brokerId explicitly. Variant 1 sends none,
// so the Lambda's own default broker applies there — do not add one for v1.
// An explicit ?partnerid= URL param still wins over this on v2 pages.
export const V2_BROKER_ID = '889a8b31-921b-4da3-87f8-86b3a45c177c';

export const REVENUE_BANDS: RevenueBandOption[] = [
  {
    value: 'below_20k',
    label: 'Below $20k',
    sublabel: 'per month',
    qualifier: false,
    apiValue: 0,
  },
  {
    value: '20k_100k',
    label: '$20k – $100k',
    sublabel: 'per month',
    qualifier: true,
    apiValue: 20_000,
  },
  {
    value: '100k_500k',
    label: '$100k – $500k',
    sublabel: 'per month',
    qualifier: true,
    apiValue: 100_000,
  },
  {
    value: '500k_plus',
    label: '$500k+',
    sublabel: 'per month',
    qualifier: true,
    apiValue: 500_000,
  },
];

export const DISQ_CONFIGS: Record<DisqReason, DisqConfig> = {
  revenue_below_threshold: {
    title: 'Below our minimum threshold',
    message: 'Bizcap funds businesses generating $20,000 or more per month.',
    alt: 'Come back as your revenue grows, we\'d love to work with you.',
  },
  sole_proprietor: {
    title: 'Not eligible as a sole proprietor',
    message: 'Bizcap works with LLCs, corporations, and partnerships.',
    alt: 'We recommend speaking with a business advisor about converting your structure before applying.',
  },
  time_under_1yr: {
    title: 'Not enough operating history',
    message: 'Bizcap funds businesses that have been operating for at least 1 year.',
    alt: 'Come back once you\'ve passed your first year, we\'d love to work with you.',
  },
};

export const STEP_INFO = [
  { n: 1 as const, label: 'Eligibility check', shortLabel: '1 / 3' },
  { n: 2 as const, label: 'Business details', shortLabel: '2 / 3' },
  { n: 3 as const, label: 'Contact details', shortLabel: '3 / 3' },
];

export const STEP_INFO_V2 = [
  { n: 1 as const, label: 'Contact details', shortLabel: '1 / 3' },
  { n: 2 as const, label: 'Funding details', shortLabel: '2 / 3' },
  { n: 3 as const, label: 'Business details', shortLabel: '3 / 3' },
];

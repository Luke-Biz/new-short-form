/**
 * Webflow Code Component wrapper.
 *
 * Rules:
 * - Must be a DEFAULT export (Webflow CLI requirement).
 * - Imports compiled.css (pre-compiled Tailwind) — never the Tailwind source.
 * - No document.querySelector / document.getElementById — Shadow DOM boundary.
 *
 * Run `npm run webflow:share` to publish to the Webflow Code Component Library.
 * First run opens a browser auth flow and writes a token to .env (gitignored).
 */
import * as Sentry from '@sentry/react';
import { props } from '@webflow/data-types';
import { declareComponent } from '@webflow/react';
import '../compiled.css';
import { FundingApplicationForm } from './FundingApplicationForm';
Sentry.init({
  dsn: 'https://338694829a64e7632e586ba8dbea9a48@o4511465617489920.ingest.us.sentry.io/4511465630400512',
  sendDefaultPii: true,
});

export default declareComponent(FundingApplicationForm, {
  name: 'Funding Application Form',
  description: 'Multi-step funding eligibility and application form for Bizcap.',
  props: {
    formVariant: props.Variant({
      name: 'Form Variant',
      options: ['Variant 1 (eligibility first)', 'Variant 2 (contact first)'],
      defaultValue: 'Variant 1 (eligibility first)',
    }),
    headlineOverride: props.Text({ name: 'Step 2 Headline Override' }),
    subheadlineOverride: props.Text({ name: 'Step 2 Subheadline Override' }),
    submitCtaOverride: props.Text({ name: 'Submit CTA Override' }),
    eligibilityCtaOverride: props.Text({ name: 'Eligibility CTA Override' }),
    revenueThresholdOverride: props.Number({ name: 'Revenue Threshold ($)', defaultValue: 20000 }),
    brandColorOverride: props.Text({ name: 'Brand Color (hex or rgb)' }),
    showBrandTitle: props.Boolean({ name: 'Show Title', defaultValue: true }),
  },
});

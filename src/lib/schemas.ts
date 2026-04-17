import { z } from 'zod';
import { isValidEmail, isValidIntlPhoneInputValue, parseMoneyNumber } from './formUtils';

// ─── Purpose IDs ──────────────────────────────────────────────────────────────
// Exported so BizcapLoanForm can import from here instead of defining its own.

export const VALID_PURPOSE_IDS = [
  'equipment',
  'inventory',
  'growth',
  'cashflow',
  'debt',
  'renovation',
  'personal',
  'other',
] as const;

export type PurposeId = (typeof VALID_PURPOSE_IDS)[number];

// ─── Step 1: Personal details ─────────────────────────────────────────────────

export const Step1Schema = z.object({
  firstName: z.string().min(1, 'Enter your first name.'),
  lastName: z.string().min(1, 'Enter your last name.'),
  email: z.string().superRefine((val, ctx) => {
    if (!val.trim()) {
      ctx.addIssue({ code: 'custom', message: 'Enter your email address.' });
      return;
    }
    if (!isValidEmail(val)) {
      ctx.addIssue({ code: 'custom', message: 'Enter a valid email address.' });
    }
  }),
  phone: z.string().superRefine((val, ctx) => {
    const digits = val.replace(/\D/g, '');
    if (!digits) {
      ctx.addIssue({ code: 'custom', message: 'Enter your mobile number.' });
      return;
    }
    if (!isValidIntlPhoneInputValue(val)) {
      ctx.addIssue({ code: 'custom', message: 'Enter a valid mobile number.' });
    }
  }),
  consent: z.boolean().refine((val) => val === true, 'You must agree to continue.'),
});

// ─── Step 2: Business details ─────────────────────────────────────────────────

export const Step2Schema = z.object({
  businessName: z.string().min(1, 'Enter your business name.'),
  businessAddress: z.string().min(1, 'Enter your business address.'),
  industry: z.string().min(1, 'Select your industry.'),
});

// ─── Step 3: Loan details ─────────────────────────────────────────────────────

export const Step3Schema = z.object({
  monthlyRevenue: z.string().superRefine((val, ctx) => {
    const n = parseMoneyNumber(val);
    if (!val.trim() || Number.isNaN(n)) {
      ctx.addIssue({ code: 'custom', message: 'Enter your monthly revenue.' });
      return;
    }
    if (n < 12000) {
      ctx.addIssue({ code: 'custom', message: 'Minimum monthly revenue is $12,000' });
    }
  }),
  loanAmount: z.string().superRefine((val, ctx) => {
    const n = parseMoneyNumber(val);
    if (!val.trim() || Number.isNaN(n) || n <= 0) {
      ctx.addIssue({ code: 'custom', message: 'Enter a valid loan amount.' });
    }
  }),
  purpose: z.enum(VALID_PURPOSE_IDS, { error: 'Select a purpose for your loan.' }),
});

// ─── Inferred types ───────────────────────────────────────────────────────────

export type Step1Data = z.infer<typeof Step1Schema>;
export type Step2Data = z.infer<typeof Step2Schema>;
export type Step3Data = z.infer<typeof Step3Schema>;
export type FullFormData = Step1Data & Step2Data & Step3Data;

import { z } from 'zod';

export const RevenueBandSchema = z.enum([
  'below_20k',
  '20k_100k',
  '100k_500k',
  '500k_plus',
]);
export type RevenueBand = z.infer<typeof RevenueBandSchema>;

export const BusinessStructureSchema = z.enum(['llc', 'corporation', 'sole_proprietor', 'partnership']);
export type BusinessStructure = z.infer<typeof BusinessStructureSchema>;

export const BankOptionSchema = z.enum([
  'chase_bofa_wells',
  'usbank_pnc_truist',
  'community',
  'neo_relay_mercury',
  'neo_other',
]);
export type BankOption = z.infer<typeof BankOptionSchema>;

export const IndustrySchema = z.enum([
  'Retail/eCommerce',
  'Food & Beverage',
  'Healthcare',
  'Construction',
  'Professional Services',
  'Other',
]);
export type Industry = z.infer<typeof IndustrySchema>;

export const TimeInBusinessSchema = z.enum(['<1yr', '1-2yr', '2-5yr', '5yr+']);
export type TimeInBusiness = z.infer<typeof TimeInBusinessSchema>;

export const step1Schema = z.object({
  revenue: RevenueBandSchema,
  businessStructure: BusinessStructureSchema,
  timeInBusiness: TimeInBusinessSchema,
  bank: BankOptionSchema,
  amount: z.number({ invalid_type_error: 'Please enter a funding amount' }).positive('Please enter a funding amount greater than 0'),
});
export type Step1Data = z.infer<typeof step1Schema>;

export const step2Schema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  industry: IndustrySchema,
  ein: z
    .string()
    .refine(
      (val) => val === '' || /^\d{2}-\d{7}$/.test(val),
      { message: 'EIN must be in format XX-XXXXXXX' },
    )
    .optional(),
});
export type Step2Data = z.infer<typeof step2Schema>;

export const step3Schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string()
    .min(1, 'Phone number is required')
    .refine(
      (val) => {
        const digits = val.replace(/\D/g, '');
        return digits.length === 11 && digits[0] === '1';
      },
      'Please enter a valid US phone number',
    ),
  email: z.string().email('Please enter a valid email address'),
  smsConsent: z.boolean(),
});
export type Step3Data = z.infer<typeof step3Schema>;

export const fullFormSchema = step1Schema.merge(step2Schema).merge(step3Schema);
export type FullFormData = z.infer<typeof fullFormSchema>;

export const STEP_1_FIELDS: (keyof Step1Data)[] = ['revenue', 'businessStructure', 'timeInBusiness', 'bank', 'amount'];
export const STEP_2_FIELDS: (keyof Step2Data)[] = ['businessName', 'industry'];
export const STEP_3_FIELDS: (keyof Step3Data)[] = ['firstName', 'lastName', 'phone', 'email'];

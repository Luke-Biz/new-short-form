import { describe, it, expect } from 'vitest';
import { step1Schema, step2Schema, step3Schema, fullFormSchema } from '../schema/form';

const validStep1 = {
  revenue: '20k_100k' as const,
  businessStructure: 'llc' as const,
  timeInBusiness: '2-5yr' as const,
  bank: 'chase_bofa_wells' as const,
  amount: 250_000,
};

const validStep2 = {
  businessName: 'Acme Inc.',
  industry: 'Retail/eCommerce' as const,
  ein: '',
};

const validStep3 = {
  firstName: 'Sarah',
  lastName: 'Johnson',
  phone: '+1 (555) 000-0000',
  email: 'sarah.johnson@example.com',
  smsConsent: false,
};

describe('step1Schema', () => {
  it('accepts all valid revenue bands', () => {
    for (const rev of ['below_20k', '20k_100k', '100k_500k', '500k_plus'] as const) {
      expect(step1Schema.safeParse({ ...validStep1, revenue: rev }).success).toBe(true);
    }
  });

  it('rejects zero amount', () => {
    const r = step1Schema.safeParse({ ...validStep1, amount: 0 });
    expect(r.success).toBe(false);
  });

  it('rejects negative amount', () => {
    const r = step1Schema.safeParse({ ...validStep1, amount: -1 });
    expect(r.success).toBe(false);
  });

  it('rejects missing bank', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { bank: _bank, ...rest } = validStep1;
    const r = step1Schema.safeParse(rest);
    expect(r.success).toBe(false);
  });
});

describe('step2Schema', () => {
  it('accepts valid step 2 data', () => {
    expect(step2Schema.safeParse(validStep2).success).toBe(true);
  });

  it('rejects empty business name', () => {
    const r = step2Schema.safeParse({ ...validStep2, businessName: '' });
    expect(r.success).toBe(false);
  });

  it('accepts blank EIN (optional)', () => {
    expect(step2Schema.safeParse({ ...validStep2, ein: '' }).success).toBe(true);
  });

  it('accepts well-formed EIN', () => {
    expect(step2Schema.safeParse({ ...validStep2, ein: '12-3456789' }).success).toBe(true);
  });

  it('rejects malformed EIN', () => {
    const r = step2Schema.safeParse({ ...validStep2, ein: '123456789' });
    expect(r.success).toBe(false);
  });
});

describe('step3Schema', () => {
  it('accepts valid step 3 data', () => {
    expect(step3Schema.safeParse(validStep3).success).toBe(true);
  });

  it('rejects invalid email', () => {
    const r = step3Schema.safeParse({ ...validStep3, email: 'not-an-email' });
    expect(r.success).toBe(false);
  });

  it('rejects empty phone', () => {
    const r = step3Schema.safeParse({ ...validStep3, phone: '' });
    expect(r.success).toBe(false);
  });

  it('rejects incomplete phone (10 digits with +1 prefix)', () => {
    const r = step3Schema.safeParse({ ...validStep3, phone: '+1 (555) 000-000' });
    expect(r.success).toBe(false);
  });

  it('accepts smsConsent true or false', () => {
    expect(step3Schema.safeParse({ ...validStep3, smsConsent: true }).success).toBe(true);
    expect(step3Schema.safeParse({ ...validStep3, smsConsent: false }).success).toBe(true);
  });
});

describe('fullFormSchema', () => {
  it('accepts a complete valid form submission', () => {
    const r = fullFormSchema.safeParse({ ...validStep1, ...validStep2, ...validStep3 });
    expect(r.success).toBe(true);
  });
});

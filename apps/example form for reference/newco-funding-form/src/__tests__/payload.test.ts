import { describe, it, expect } from 'vitest';
import { buildPayload, buildInitialPayload, extractPublisherId } from '../lib/payload';
import type { FullFormData } from '../schema/form';

const baseData: FullFormData = {
  revenue: '20k_100k',
  businessStructure: 'llc',
  bank: 'chase_bofa_wells',
  amount: 250_000,
  businessName: 'Acme Inc.',
  industry: 'Retail/eCommerce',
  timeInBusiness: '2-5yr',
  ein: '',
  firstName: 'Sarah',
  lastName: 'Johnson',
  phone: '+1 (555) 000-0000',
  email: 'sarah.johnson@example.com',
  smsConsent: false,
};

describe('buildPayload', () => {
  it('maps LLC structure to "Limited Liability Company"', () => {
    const p = buildPayload({ ...baseData, businessStructure: 'llc' }, {});
    expect(p.businessType).toBe('Limited Liability Company');
  });

  it('maps corporation to "Corporation"', () => {
    const p = buildPayload({ ...baseData, businessStructure: 'corporation' }, {});
    expect(p.businessType).toBe('Corporation');
  });

  it('maps partnership to "Partnership"', () => {
    const p = buildPayload({ ...baseData, businessStructure: 'partnership' }, {});
    expect(p.businessType).toBe('Partnership');
  });

  it('sends correct averageMonthlyTurnover for 20k-100k band', () => {
    const p = buildPayload({ ...baseData, revenue: '20k_100k' }, {});
    expect(p.averageMonthlyTurnover).toBe(20_000);
  });

  it('sends correct averageMonthlyTurnover for 100k-500k band', () => {
    const p = buildPayload({ ...baseData, revenue: '100k_500k' }, {});
    expect(p.averageMonthlyTurnover).toBe(100_000);
  });

  it('sends correct averageMonthlyTurnover for 500k+ band', () => {
    const p = buildPayload({ ...baseData, revenue: '500k_plus' }, {});
    expect(p.averageMonthlyTurnover).toBe(500_000);
  });

  it('sets applicationCompleted to "Yes"', () => {
    const p = buildPayload(baseData, {});
    expect(p.applicationCompleted).toBe('Yes');
  });

  it('sets sourceChannel to "Web - Apply"', () => {
    const p = buildPayload(baseData, {});
    expect(p.sourceChannel).toBe('Web - Apply');
  });

  it('sets brazeUserProfile.marketingSms to Subscribed when smsConsent is true', () => {
    const p = buildPayload({ ...baseData, smsConsent: true }, {});
    expect((p.brazeUserProfile as Record<string, unknown>).marketingSms).toBe('Subscribed');
  });

  it('sets brazeUserProfile.marketingSms to Unsubscribed when smsConsent is false', () => {
    const p = buildPayload({ ...baseData, smsConsent: false }, {});
    expect((p.brazeUserProfile as Record<string, unknown>).marketingSms).toBe('Unsubscribed');
  });

  it('omits empty lastName', () => {
    const p = buildPayload({ ...baseData, lastName: '' }, {});
    expect(p.lastName).toBeUndefined();
  });

  it('includes lastName when provided', () => {
    const p = buildPayload({ ...baseData, lastName: 'Smith' }, {});
    expect(p.lastName).toBe('Smith');
  });

  it('omits empty EIN', () => {
    const p = buildPayload({ ...baseData, ein: '' }, {});
    expect(p.companyNumber).toBeUndefined();
  });

  it('includes EIN when provided', () => {
    const p = buildPayload({ ...baseData, ein: '12-3456789' }, {});
    expect(p.companyNumber).toBe('12-3456789');
  });

  it('includes UTM params', () => {
    const p = buildPayload(baseData, { utmSource: 'google', utmMedium: 'cpc' });
    expect(p.utmSource).toBe('google');
    expect(p.utmMedium).toBe('cpc');
  });

  it('includes extended UTM and click-id params', () => {
    const p = buildPayload(baseData, {
      utmDevice: 'mobile',
      utmMatchType: 'e',
      utmContent: 'ad-variant-a',
      gbraid: 'gb-123',
      msclkid: 'ms-456',
      productType: 'mca',
    });
    expect(p.utmDevice).toBe('mobile');
    expect(p.utmMatchType).toBe('e');
    expect(p.utmContent).toBe('ad-variant-a');
    expect(p.gbraid).toBe('gb-123');
    expect(p.msclkid).toBe('ms-456');
    expect(p.productType).toBe('mca');
  });

  it('omits undefined UTM params', () => {
    const p = buildPayload(baseData, {});
    expect(p.utmSource).toBeUndefined();
    expect(p.utmDevice).toBeUndefined();
    expect(p.gbraid).toBeUndefined();
    expect(p.msclkid).toBeUndefined();
    expect(p.productType).toBeUndefined();
  });

  it('appends neo-bank flag to notes', () => {
    const p = buildPayload({ ...baseData, bank: 'neo_relay_mercury' }, {});
    expect(typeof p.notes).toBe('string');
    expect(p.notes as string).toContain('(neo-bank)');
  });

  it('does not append neo-bank flag for traditional banks', () => {
    const p = buildPayload({ ...baseData, bank: 'chase_bofa_wells' }, {});
    expect(p.notes as string).not.toContain('(neo-bank)');
  });
});

describe('buildPayload — businessStartDate', () => {
  const DAY_MS = 24 * 60 * 60 * 1000;

  it('is a valid ISO string', () => {
    const p = buildPayload(baseData, {});
    const date = new Date(p.businessStartDate as string);
    expect(date.toISOString()).toBe(p.businessStartDate);
  });

  it('is approximately 6 months ago for <1yr', () => {
    const p = buildPayload({ ...baseData, timeInBusiness: '<1yr' }, {});
    const actual = new Date(p.businessStartDate as string);
    const expected = new Date();
    expected.setMonth(expected.getMonth() - 6);
    expect(Math.abs(actual.getTime() - expected.getTime())).toBeLessThan(DAY_MS);
  });

  it('is approximately 18 months ago for 1-2yr', () => {
    const p = buildPayload({ ...baseData, timeInBusiness: '1-2yr' }, {});
    const actual = new Date(p.businessStartDate as string);
    const expected = new Date();
    expected.setMonth(expected.getMonth() - 18);
    expect(Math.abs(actual.getTime() - expected.getTime())).toBeLessThan(DAY_MS);
  });

  it('is approximately 42 months ago for 2-5yr', () => {
    const p = buildPayload({ ...baseData, timeInBusiness: '2-5yr' }, {});
    const actual = new Date(p.businessStartDate as string);
    const expected = new Date();
    expected.setMonth(expected.getMonth() - 42);
    expect(Math.abs(actual.getTime() - expected.getTime())).toBeLessThan(DAY_MS);
  });

  it('is approximately 6 years ago for 5yr+', () => {
    const p = buildPayload({ ...baseData, timeInBusiness: '5yr+' }, {});
    const actual = new Date(p.businessStartDate as string);
    const expected = new Date();
    expected.setFullYear(expected.getFullYear() - 6);
    expect(Math.abs(actual.getTime() - expected.getTime())).toBeLessThan(DAY_MS);
  });
});

describe('buildInitialPayload (contact-first variant, step-1 lead create)', () => {
  const initialData = {
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@example.com',
    businessName: 'Acme Inc.',
  };

  it('maps contact fields and business name', () => {
    const p = buildInitialPayload(initialData, {});
    expect(p.firstName).toBe('Sarah');
    expect(p.lastName).toBe('Johnson');
    expect(p.email).toBe('sarah.johnson@example.com');
    expect(p.companyName).toBe('Acme Inc.');
  });

  it('sets applicationCompleted to "No"', () => {
    const p = buildInitialPayload(initialData, {});
    expect(p.applicationCompleted).toBe('No');
  });

  it('includes the fixed lead-source fields', () => {
    const p = buildInitialPayload(initialData, {});
    expect(p.country).toBe('US');
    expect(p.leadSource).toBe('Advertisement');
    expect(p.sourceChannel).toBe('Web - Apply');
    expect(p.agreeToBizcapConsentPrivacy).toBe('Yes');
    expect(p.thirdPartyMarketingConsent).toBe('No');
  });

  it('omits fields not yet collected at step 1', () => {
    const p = buildInitialPayload(initialData, {});
    expect(p.phone).toBeUndefined();
    expect(p.amountRequested).toBeUndefined();
    expect(p.averageMonthlyTurnover).toBeUndefined();
    expect(p.businessType).toBeUndefined();
    expect(p.industry).toBeUndefined();
    expect(p.businessStartDate).toBeUndefined();
    expect(p.notes).toBeUndefined();
    expect(p.brazeUserProfile).toBeUndefined();
  });

  it('omits empty lastName', () => {
    const p = buildInitialPayload({ ...initialData, lastName: '' }, {});
    expect(p.lastName).toBeUndefined();
  });

  it('includes UTM and partner params', () => {
    const p = buildInitialPayload(initialData, { utmSource: 'google', gclid: 'g-1' }, { brokerId: 'broker-123' });
    expect(p.utmSource).toBe('google');
    expect(p.gclid).toBe('g-1');
    expect(p.brokerId).toBe('broker-123');
  });
});

describe('affiliate attribution (FlexOffers refid)', () => {
  const REFID = '24.250080.6673593FOF13404491126783016';

  it('extractPublisherId pulls the second foid segment', () => {
    expect(extractPublisherId(REFID)).toBe('250080');
  });

  it('extractPublisherId handles a refid without a click id suffix', () => {
    expect(extractPublisherId('24.250080.6673593')).toBe('250080');
  });

  it('extractPublisherId returns undefined for malformed values', () => {
    expect(extractPublisherId(undefined)).toBeUndefined();
    expect(extractPublisherId('')).toBeUndefined();
    expect(extractPublisherId('garbage-no-dots')).toBeUndefined();
    expect(extractPublisherId('FOF123')).toBeUndefined();
  });

  it('buildPayload maps refid to uen and publisher id to sfid', () => {
    const p = buildPayload(baseData, {}, {}, { refId: REFID });
    expect(p.uen).toBe(REFID);
    expect(p.sfid).toBe('250080');
  });

  it('buildInitialPayload maps refid to uen and publisher id to sfid', () => {
    const p = buildInitialPayload(
      { firstName: 'Sarah', lastName: 'Johnson', email: 'sarah@example.com', businessName: 'Acme Inc.' },
      {},
      {},
      { refId: REFID },
    );
    expect(p.uen).toBe(REFID);
    expect(p.sfid).toBe('250080');
  });

  it('omits uen and sfid when no refid was captured', () => {
    const p = buildPayload(baseData, {});
    expect(p.uen).toBeUndefined();
    expect(p.sfid).toBeUndefined();
  });

  it('sends uen without sfid when the publisher segment is missing', () => {
    const p = buildPayload(baseData, {}, {}, { refId: 'oddformat' });
    expect(p.uen).toBe('oddformat');
    expect(p.sfid).toBeUndefined();
  });
});

describe('buildPayload — partner params', () => {
  it('includes brokerId when provided', () => {
    const p = buildPayload(baseData, {}, { brokerId: 'broker-123' });
    expect(p.brokerId).toBe('broker-123');
  });

  it('includes brokerRepId when provided', () => {
    const p = buildPayload(baseData, {}, { brokerRepId: 'rep-456' });
    expect(p.brokerRepId).toBe('rep-456');
  });

  it('includes both when both provided', () => {
    const p = buildPayload(baseData, {}, { brokerId: 'broker-123', brokerRepId: 'rep-456' });
    expect(p.brokerId).toBe('broker-123');
    expect(p.brokerRepId).toBe('rep-456');
  });

  it('omits both when partner params are empty', () => {
    const p = buildPayload(baseData, {}, {});
    expect(p.brokerId).toBeUndefined();
    expect(p.brokerRepId).toBeUndefined();
  });

  it('omits both when partner params are not provided', () => {
    const p = buildPayload(baseData, {});
    expect(p.brokerId).toBeUndefined();
    expect(p.brokerRepId).toBeUndefined();
  });
});

import type { FullFormData } from '../schema/form';
import type { UtmParams, PartnerParams, AffiliateParams } from './utm';
import { REVENUE_BANDS } from '../constants';

const STRUCTURE_MAP: Record<FullFormData['businessStructure'], string> = {
  llc: 'Limited Liability Company',
  corporation: 'Corporation',
  sole_proprietor: 'Sole Proprietor',
  partnership: 'Partnership',
};

const BANK_LABELS: Record<FullFormData['bank'], string> = {
  chase_bofa_wells: 'Chase / Bank of America / Wells Fargo',
  usbank_pnc_truist: 'US Bank / PNC / Truist',
  community: 'Community / regional bank',
  neo_relay_mercury: 'Relay / Mercury / Bluevine',
  neo_other: 'Other neo-bank',
};

const NEO_BANKS = new Set<FullFormData['bank']>(['neo_relay_mercury', 'neo_other']);

const TIME_LABEL: Record<FullFormData['timeInBusiness'], string> = {
  '<1yr': 'Under 1 year',
  '1-2yr': '1–2 years',
  '2-5yr': '2–5 years',
  '5yr+': '5+ years',
};

function calculateBusinessStartDate(time: FullFormData['timeInBusiness']): string {
  const d = new Date();
  switch (time) {
    case '<1yr':
      d.setMonth(d.getMonth() - 6);
      break;
    case '1-2yr':
      d.setMonth(d.getMonth() - 18);
      break;
    case '2-5yr':
      d.setMonth(d.getMonth() - 42);
      break;
    case '5yr+':
      d.setFullYear(d.getFullYear() - 6);
      break;
  }
  return d.toISOString();
}

function stripEmpty(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== null && v !== undefined && v !== ''),
  );
}

// FlexOffers refid = "<program>.<publisher>.<link>FOF<clickId>", e.g.
// "24.250080.6673593FOF13404491126783016" → publisher "250080".
export function extractPublisherId(refId: string | undefined): string | undefined {
  if (!refId) return undefined;
  const foid = refId.split('FOF')[0];
  const segments = foid.split('.');
  return segments.length >= 2 && segments[1] ? segments[1] : undefined;
}

// Affiliate attribution: full refid → uen, publisher id → sfid (agreed field
// repurposing — BizMate has no dedicated affiliate fields).
function affiliateFields(affiliate: AffiliateParams): Record<string, unknown> {
  return {
    uen: affiliate.refId,
    sfid: extractPublisherId(affiliate.refId),
  };
}

export type InitialLeadData = Pick<FullFormData, 'firstName' | 'lastName' | 'email' | 'businessName'>;

// Contact-first variant: minimal lead created after step 1. Everything else
// arrives via PATCH (or fallback POST) at final submission.
export function buildInitialPayload(data: InitialLeadData, utm: UtmParams, partner: PartnerParams = {}, affiliate: AffiliateParams = {}): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    ...affiliateFields(affiliate),
    firstName: data.firstName,
    lastName: data.lastName?.trim() || undefined,
    email: data.email,
    companyName: data.businessName,
    applicationCompleted: 'No',
    country: 'US',
    leadSource: 'Advertisement',
    sourceChannel: 'Web - Apply',
    agreeToBizcapConsentPrivacy: 'Yes',
    thirdPartyMarketingConsent: 'No',
    // UTM params
    utmSource: utm.utmSource,
    utmMedium: utm.utmMedium,
    utmCampaign: utm.utmCampaign,
    utmTerm: utm.utmTerm,
    utmDevice: utm.utmDevice,
    utmMatchType: utm.utmMatchType,
    utmContent: utm.utmContent,
    gclid: utm.gclid,
    fbclid: utm.fbclid,
    gbraid: utm.gbraid,
    msclkid: utm.msclkid,
    productType: utm.productType,
    // Partner params
    brokerId: partner.brokerId,
    brokerRepId: partner.brokerRepId,
  };

  return stripEmpty(payload);
}

export function buildPayload(data: FullFormData, utm: UtmParams, partner: PartnerParams = {}, affiliate: AffiliateParams = {}): Record<string, unknown> {
  const revenueBand = REVENUE_BANDS.find((b) => b.value === data.revenue);
  const bankLabel = BANK_LABELS[data.bank];
  const isNeoBank = NEO_BANKS.has(data.bank);

  const notes = [
    `Revenue: ${revenueBand?.label ?? data.revenue}/mo`,
    `Primary bank: ${bankLabel}${isNeoBank ? ' (neo-bank)' : ''}`,
    `Time in business: ${TIME_LABEL[data.timeInBusiness]}`,
  ].join('\n');

  const payload: Record<string, unknown> = {
    firstName: data.firstName,
    lastName: data.lastName?.trim() || undefined,
    phone: data.phone,
    email: data.email,
    companyName: data.businessName,
    companyNumber: data.ein?.trim() || undefined,
    businessType: STRUCTURE_MAP[data.businessStructure],
    amountRequested: data.amount,
    averageMonthlyTurnover: revenueBand?.apiValue ?? 20_000,
    industry: data.industry,
    businessStartDate: calculateBusinessStartDate(data.timeInBusiness),
    applicationCompleted: 'Yes',
    notes,
    country: 'US',
    leadSource: 'Advertisement',
    sourceChannel: 'Web - Apply',
    agreeToBizcapConsentPrivacy: 'Yes',
    thirdPartyMarketingConsent: 'No',
    brazeUserProfile: {
      marketingSms: data.smsConsent ? 'Subscribed' : 'Unsubscribed',
    },
    // Affiliate attribution
    ...affiliateFields(affiliate),
    // UTM params
    utmSource: utm.utmSource,
    utmMedium: utm.utmMedium,
    utmCampaign: utm.utmCampaign,
    utmTerm: utm.utmTerm,
    utmDevice: utm.utmDevice,
    utmMatchType: utm.utmMatchType,
    utmContent: utm.utmContent,
    gclid: utm.gclid,
    fbclid: utm.fbclid,
    gbraid: utm.gbraid,
    msclkid: utm.msclkid,
    productType: utm.productType,
    // Partner params
    brokerId: partner.brokerId,
    brokerRepId: partner.brokerRepId,
  };

  return stripEmpty(payload);
}

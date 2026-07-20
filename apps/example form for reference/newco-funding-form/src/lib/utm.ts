const SESSION_KEY = 'newco_utm_v1';
const PARTNER_SESSION_KEY = 'newco_partner_v1';
const AFFILIATE_SESSION_KEY = 'newco_refid_v1';

export type UtmParams = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmDevice?: string;
  utmMatchType?: string;
  utmContent?: string;
  gclid?: string;
  fbclid?: string;
  gbraid?: string;
  msclkid?: string;
  productType?: string;
};

export type PartnerParams = {
  brokerId?: string;
  brokerRepId?: string;
};

// FlexOffers affiliate attribution token, e.g.
// ?refid=24.250080.6673593FOF13404491126783016
// (foid triplet + "FOF" separator + unique click id)
export type AffiliateParams = {
  refId?: string;
};

function fromSearchParams(): UtmParams {
  const p = new URLSearchParams(window.location.search);
  const captured: UtmParams = {};
  const utmSource = p.get('utm_source');
  const utmMedium = p.get('utm_medium');
  const utmCampaign = p.get('utm_campaign');
  const utmTerm = p.get('utm_term');
  const utmDevice = p.get('utm_device');
  const utmMatchType = p.get('utm_matchtype');
  const utmContent = p.get('utm_content');
  const gclid = p.get('gclid');
  const fbclid = p.get('fbclid');
  const gbraid = p.get('gbraid');
  const msclkid = p.get('msclkid');
  const productType = p.get('product_type');
  if (utmSource) captured.utmSource = utmSource;
  if (utmMedium) captured.utmMedium = utmMedium;
  if (utmCampaign) captured.utmCampaign = utmCampaign;
  if (utmTerm) captured.utmTerm = utmTerm;
  if (utmDevice) captured.utmDevice = utmDevice;
  if (utmMatchType) captured.utmMatchType = utmMatchType;
  if (utmContent) captured.utmContent = utmContent;
  if (gclid) captured.gclid = gclid;
  if (fbclid) captured.fbclid = fbclid;
  if (gbraid) captured.gbraid = gbraid;
  if (msclkid) captured.msclkid = msclkid;
  if (productType) captured.productType = productType;
  return captured;
}

function partnerFromSearchParams(): PartnerParams {
  const p = new URLSearchParams(window.location.search);
  const captured: PartnerParams = {};
  const brokerId = p.get('partnerid');
  const brokerRepId = p.get('partnercontactid');
  if (brokerId) captured.brokerId = brokerId;
  if (brokerRepId) captured.brokerRepId = brokerRepId;
  return captured;
}

function loadStored<T>(key: string): T {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : ({} as T);
  } catch {
    return {} as T;
  }
}

function persist(key: string, params: object): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(params));
  } catch {
    // sessionStorage unavailable (e.g. private mode with storage blocked) — ignore
  }
}

// Called once on form mount. Fresh URL params take precedence over stored ones.
export function captureUtm(): UtmParams {
  const fresh = fromSearchParams();
  const stored = loadStored<UtmParams>(SESSION_KEY);
  const merged = { ...stored, ...fresh };
  if (Object.keys(merged).length > 0) persist(SESSION_KEY, merged);
  return merged;
}

export function capturePartnerParams(): PartnerParams {
  const fresh = partnerFromSearchParams();
  const stored = loadStored<PartnerParams>(PARTNER_SESSION_KEY);
  const merged = { ...stored, ...fresh };
  if (Object.keys(merged).length > 0) persist(PARTNER_SESSION_KEY, merged);
  return merged;
}

export function captureAffiliateParams(): AffiliateParams {
  const fresh: AffiliateParams = {};
  const refId = new URLSearchParams(window.location.search).get('refid');
  if (refId) fresh.refId = refId;
  const stored = loadStored<AffiliateParams>(AFFILIATE_SESSION_KEY);
  const merged = { ...stored, ...fresh };
  if (Object.keys(merged).length > 0) persist(AFFILIATE_SESSION_KEY, merged);
  return merged;
}

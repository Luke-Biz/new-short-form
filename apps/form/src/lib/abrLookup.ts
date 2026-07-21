/**
 * Australian Business Register (ABR) company lookup.
 *
 * Hits a Bizcap-hosted Lambda that proxies the ABR XML search API (CORS open,
 * so it works from Vercel, the Webflow component, and inside the CRM iframe).
 * Numeric queries search by ABN; everything else by name.
 */

const ENDPOINT =
  'https://pc9knsi0ci.execute-api.ap-southeast-2.amazonaws.com/default/fetchCompany';

const MAX_RESULTS = 10;

export type AbrResult = { name: string; abn: string };

function parseAbrRecords(xml: string): AbrResult[] {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) return [];

  const records = Array.from(doc.getElementsByTagNameNS('*', 'searchResultsRecord'));
  const results: AbrResult[] = [];
  for (const rec of records) {
    const abn = rec.getElementsByTagNameNS('*', 'identifierValue')[0]?.textContent?.trim() ?? '';
    const name = rec.getElementsByTagNameNS('*', 'organisationName')[0]?.textContent?.trim() ?? '';
    if (abn && name) results.push({ name, abn });
    if (results.length >= MAX_RESULTS) break;
  }
  return results;
}

/**
 * Search the ABR. Returns [] for short queries. Throws on network/HTTP failure
 * so callers can show a "lookup unavailable" state and fall back to free text.
 */
export async function searchAbr(query: string, signal?: AbortSignal): Promise<AbrResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const searchType = /^\d[\d\s]*$/.test(q) ? 'byId' : 'byName';
  const url = `${ENDPOINT}?query=${encodeURIComponent(q)}&searchType=${searchType}`;

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`ABR lookup failed: ${res.status}`);
  return parseAbrRecords(await res.text());
}

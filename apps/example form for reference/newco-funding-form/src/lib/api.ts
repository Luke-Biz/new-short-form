import { API_MAX_RETRIES, API_PATCH_URL, API_TIMEOUT_MS, API_URL } from '../constants';

export type ApiError =
  | { type: 'validation'; fields?: Record<string, string> }
  | { type: 'rate_limit' }
  | { type: 'server' }
  | { type: 'network' };

export type ApiResult =
  | { ok: true; responseData: unknown }
  | { ok: false; error: ApiError };

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Combines a per-request timeout with an optional caller-provided abort signal.
function makeSignal(timeoutMs: number, callerSignal?: AbortSignal): [AbortSignal, () => void] {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  callerSignal?.addEventListener('abort', () => controller.abort());

  return [controller.signal, () => clearTimeout(timer)];
}

async function requestLead(
  url: string,
  method: 'POST' | 'PATCH',
  payload: Record<string, unknown>,
  callerSignal?: AbortSignal,
): Promise<ApiResult> {
  let attempt = 0;
  let lastError: ApiError = { type: 'network' };

  while (attempt <= API_MAX_RETRIES) {
    const [signal, clearTimer] = makeSignal(API_TIMEOUT_MS, callerSignal);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal,
      });

      clearTimer();

      if (response.ok) {
        const responseData: unknown = await response.json();
        return { ok: true, responseData };
      }

      if (response.status === 429) {
        return { ok: false, error: { type: 'rate_limit' } };
      }

      if (response.status >= 400 && response.status < 500) {
        let fields: Record<string, string> | undefined;
        try {
          const body = (await response.json()) as Record<string, unknown>;
          const raw = body.errors ?? body.fields;
          if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
            fields = Object.fromEntries(
              Object.entries(raw).map(([k, v]) => [k, String(v)]),
            );
          }
        } catch {
          // ignore parse failure — fall through to generic validation error
        }
        console.error('[api] 4xx response', response.status);
        return { ok: false, error: { type: 'validation', fields } };
      }

      // 5xx — eligible for retry
      console.error('[api] 5xx response', response.status);
      lastError = { type: 'server' };
    } catch (err) {
      clearTimer();
      if (callerSignal?.aborted) {
        // Component unmounted — stop silently
        return { ok: false, error: { type: 'network' } };
      }
      console.error('[api] fetch error', err);
      lastError = { type: 'network' };
    }

    attempt++;
    if (attempt <= API_MAX_RETRIES) {
      await delay(Math.pow(2, attempt - 1) * 1000); // 1 s, 2 s
    }
  }

  return { ok: false, error: lastError };
}

export function submitLead(
  payload: Record<string, unknown>,
  callerSignal?: AbortSignal,
): Promise<ApiResult> {
  return requestLead(API_URL, 'POST', payload, callerSignal);
}

export function isPatchConfigured(): boolean {
  return API_PATCH_URL.length > 0;
}

// Updates an existing lead. Contract with the Lambda: PATCH with the lead id
// in the body alongside the changed fields.
export function patchLead(
  leadId: string,
  payload: Record<string, unknown>,
  callerSignal?: AbortSignal,
): Promise<ApiResult> {
  return requestLead(API_PATCH_URL, 'PATCH', { id: leadId, ...payload }, callerSignal);
}

export function extractLeadId(responseData: unknown): string | null {
  if (!responseData || typeof responseData !== 'object') return null;
  const root = responseData as Record<string, unknown>;
  const candidates = [root, typeof root.data === 'object' && root.data !== null ? (root.data as Record<string, unknown>) : {}];
  for (const obj of candidates) {
    const val = obj.id ?? obj.leadId;
    if (typeof val === 'string' && val.length > 0) return val;
  }
  return null;
}

export function extractRedirectUrl(responseData: unknown): string | null {
  if (!responseData || typeof responseData !== 'object') return null;
  const root = responseData as Record<string, unknown>;
  // Try both the top-level and the nested `data` envelope
  const candidates = [root, typeof root.data === 'object' && root.data !== null ? (root.data as Record<string, unknown>) : {}];
  const keys = ['applicationLink', 'redirectUrl', 'redirect_url', 'applicationUrl'];

  for (const obj of candidates) {
    for (const key of keys) {
      const val = (obj as Record<string, unknown>)[key];
      if (typeof val === 'string' && (val.startsWith('https://') || val.startsWith('http://'))) {
        return val;
      }
    }
  }
  return null;
}

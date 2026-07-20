import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extractRedirectUrl, submitLead } from '../lib/api';

function mockResponse(status: number, body: unknown = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  };
}

describe('submitLead', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.clearAllTimers();
  });

  it('returns ok:true with responseData on 200', async () => {
    const responseData = { data: { applicationLink: 'https://example.com/apply/123' } };
    vi.mocked(fetch).mockResolvedValue(mockResponse(200, responseData) as unknown as Response);

    const result = await submitLead({ name: 'test' });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.responseData).toEqual(responseData);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('returns rate_limit on 429 without retrying', async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(429) as unknown as Response);

    const result = await submitLead({});

    expect(result).toEqual({ ok: false, error: { type: 'rate_limit' } });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('returns validation on 400 without retrying', async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse(400) as unknown as Response);

    const result = await submitLead({});

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.type).toBe('validation');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('extracts field errors from 400 response with errors key', async () => {
    const body = { errors: { email: 'Invalid email', phone: 'Required' } };
    vi.mocked(fetch).mockResolvedValue(mockResponse(400, body) as unknown as Response);

    const result = await submitLead({});

    expect(result.ok).toBe(false);
    if (!result.ok && result.error.type === 'validation') {
      expect(result.error.fields).toEqual({ email: 'Invalid email', phone: 'Required' });
    }
  });

  it('extracts field errors from 400 response with fields key', async () => {
    const body = { fields: { firstName: 'Required' } };
    vi.mocked(fetch).mockResolvedValue(mockResponse(400, body) as unknown as Response);

    const result = await submitLead({});

    expect(result.ok).toBe(false);
    if (!result.ok && result.error.type === 'validation') {
      expect(result.error.fields).toEqual({ firstName: 'Required' });
    }
  });

  it('retries on 5xx and returns server error after all attempts exhausted', async () => {
    vi.useFakeTimers();
    vi.mocked(fetch).mockResolvedValue(mockResponse(500) as unknown as Response);

    const resultPromise = submitLead({});
    await vi.advanceTimersByTimeAsync(4000); // covers 1s + 2s retry delays
    const result = await resultPromise;

    expect(result).toEqual({ ok: false, error: { type: 'server' } });
    expect(fetch).toHaveBeenCalledTimes(3); // initial + 2 retries (API_MAX_RETRIES = 2)
  });

  it('retries on network failure and returns network error after all attempts exhausted', async () => {
    vi.useFakeTimers();
    vi.mocked(fetch).mockRejectedValue(new Error('Failed to fetch'));

    const resultPromise = submitLead({});
    await vi.advanceTimersByTimeAsync(4000);
    const result = await resultPromise;

    expect(result).toEqual({ ok: false, error: { type: 'network' } });
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('stops immediately on first attempt when caller signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    vi.mocked(fetch).mockRejectedValue(new Error('aborted'));

    const result = await submitLead({}, controller.signal);

    expect(result).toEqual({ ok: false, error: { type: 'network' } });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

describe('extractRedirectUrl', () => {
  it('returns null for null input', () => {
    expect(extractRedirectUrl(null)).toBeNull();
  });

  it('returns null for non-object input', () => {
    expect(extractRedirectUrl('string')).toBeNull();
    expect(extractRedirectUrl(42)).toBeNull();
  });

  it('finds applicationLink at top level', () => {
    const result = extractRedirectUrl({ applicationLink: 'https://example.com/apply/123' });
    expect(result).toBe('https://example.com/apply/123');
  });

  it('finds applicationLink inside data envelope', () => {
    const result = extractRedirectUrl({ data: { applicationLink: 'https://example.com/apply/123' } });
    expect(result).toBe('https://example.com/apply/123');
  });

  it('prefers applicationLink over redirectUrl', () => {
    const result = extractRedirectUrl({
      applicationLink: 'https://primary.com',
      redirectUrl: 'https://secondary.com',
    });
    expect(result).toBe('https://primary.com');
  });

  it('falls back to redirectUrl when applicationLink is absent', () => {
    const result = extractRedirectUrl({ redirectUrl: 'https://fallback.com' });
    expect(result).toBe('https://fallback.com');
  });

  it('accepts http:// URLs', () => {
    const result = extractRedirectUrl({ applicationLink: 'http://example.com' });
    expect(result).toBe('http://example.com');
  });

  it('rejects plain string values that are not URLs', () => {
    const result = extractRedirectUrl({ applicationLink: 'Some Text' });
    expect(result).toBeNull();
  });

  it('returns null when no matching keys', () => {
    const result = extractRedirectUrl({ id: '123', status: 'active' });
    expect(result).toBeNull();
  });

  it('handles the sample API response shape', () => {
    const sampleResponse = {
      data: {
        id: 'some-id',
        applicationLink: 'https://app.example.com/apply/abc123',
        status: 'New',
      },
    };
    expect(extractRedirectUrl(sampleResponse)).toBe('https://app.example.com/apply/abc123');
  });
});

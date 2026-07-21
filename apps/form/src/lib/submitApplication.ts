/**
 * Posts the completed application to the AU submission Lambda (submitCustomApplyFormAU),
 * which creates the lead in Bizmate and returns where to send the applicant next.
 *
 * VITE_SUBMIT_URL overrides for the Vite/Vercel build; the literal fallback is
 * what the Webflow bundle uses (it doesn't read Vite env vars).
 */
const SUBMIT_URL =
  (import.meta.env?.VITE_SUBMIT_URL as string | undefined) ??
  'https://4rfg41s5l5.execute-api.ap-southeast-2.amazonaws.com/default/submitCustomApplyFormAU';

export type SubmitResult = {
  isSuccess: boolean;
  redirectUrl?: string;
  error?: string;
};

export async function submitApplication(
  payload: Record<string, unknown>,
): Promise<SubmitResult> {
  try {
    const res = await fetch(SUBMIT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => null)) as SubmitResult | null;
    if (!res.ok || !data?.isSuccess) {
      return { isSuccess: false, error: data?.error };
    }
    return { isSuccess: true, redirectUrl: data.redirectUrl };
  } catch {
    return { isSuccess: false, error: 'network' };
  }
}

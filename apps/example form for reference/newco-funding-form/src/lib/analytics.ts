import { getPosthog } from './posthog-instance';
import { FORM_NAME } from '../constants';

const isDev = import.meta.env.DEV;

export function track(event: string, payload?: Record<string, unknown>): void {
  if (isDev) {
    console.debug('[analytics]', event, { form_name: FORM_NAME, ...payload });
  }
  getPosthog()?.capture(event, { form_name: FORM_NAME, ...payload });
}

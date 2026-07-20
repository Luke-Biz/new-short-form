import { useEffect, useRef } from 'react';
import { getPosthog } from './posthog-instance';
import { track } from './analytics';
import { FORM_NAME } from '../constants';

export type FeatureFlagKey =
  | 'show_trust_strip'
  | 'progressive_reveal_step_1'
  | 'consent_explicit_checkbox'
  | 'industry_options_order'
  | 'step_2_3_swapped'; // reserved — type exists, not wired in component yet

// Module-level set so exposure fires at most once per session per flag regardless
// of how many components call useFeatureFlag with the same key.
const exposureFired = new Set<string>();

export function useFeatureFlag<T>(key: FeatureFlagKey, defaultValue: T): T {
  const value = (getPosthog()?.getFeatureFlag(key) ?? defaultValue) as T;

  const firedRef = useRef(false);
  useEffect(() => {
    if (!firedRef.current && value !== defaultValue && !exposureFired.has(key)) {
      firedRef.current = true;
      exposureFired.add(key);
      track('experiment_exposed', { form_name: FORM_NAME, flag: key, variant: String(value) });
    }
  }, [key, value, defaultValue]);

  return value;
}

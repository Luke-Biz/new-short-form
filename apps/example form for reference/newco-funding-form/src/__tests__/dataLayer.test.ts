import { describe, it, expect, beforeEach } from 'vitest';
import { pushDataLayer } from '../lib/dataLayer';

describe('pushDataLayer', () => {
  beforeEach(() => {
    delete window.dataLayer;
  });

  it('initializes window.dataLayer when absent and pushes the payload', () => {
    pushDataLayer({ event: 'check_my_eligibility_button', funnelStep: 'Step 1' });
    expect(window.dataLayer).toEqual([
      { event: 'check_my_eligibility_button', funnelStep: 'Step 1' },
    ]);
  });

  it('appends to an existing dataLayer without clobbering earlier entries', () => {
    window.dataLayer = [{ event: 'pre_existing' }];
    pushDataLayer({ event: 'continue_about_button', funnelStep: 'Step 2' });
    expect(window.dataLayer).toHaveLength(2);
    expect(window.dataLayer[1]).toEqual({ event: 'continue_about_button', funnelStep: 'Step 2' });
  });
});

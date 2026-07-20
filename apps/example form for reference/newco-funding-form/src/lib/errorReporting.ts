import * as Sentry from '@sentry/react';

export function reportSubmitError(
  errorCategory: string,
  payload: Record<string, unknown>,
  pageUrl: string,
): void {
  Sentry.withScope((scope) => {
    scope.setTag('error_category', errorCategory);
    scope.setContext('submission', {
      error_category: errorCategory,
      page_url: pageUrl,
      payload,
    });
    Sentry.captureMessage(`Lead not sent — ${errorCategory} error on submission`, 'error');
  });
}

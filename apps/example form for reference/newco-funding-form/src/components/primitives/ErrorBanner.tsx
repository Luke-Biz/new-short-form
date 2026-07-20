import { IconAlertCircle, IconRefresh } from '@tabler/icons-react';
import type { FormErrorState } from '../../types';

type ErrorBannerProps = {
  error: FormErrorState;
  onRetry?: () => void;
};

export function ErrorBanner({ error, onRetry }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 mt-4 p-3 rounded-form-sm bg-error-bg border border-[#fca5a5] animate-fade-in motion-reduce:animate-none"
    >
      <IconAlertCircle
        size={16}
        className="text-error-text flex-shrink-0 mt-0.5"
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-error-text leading-snug">{error.message}</p>
        {error.retryable && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 flex items-center gap-1 text-[12px] font-medium text-error-text underline underline-offset-2 focus-ring rounded"
          >
            <IconRefresh size={12} aria-hidden="true" />
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

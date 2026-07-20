import { IconAlertCircle, IconRefresh } from '@tabler/icons-react';
import type { DisqReason } from '../types';
import { DISQ_CONFIGS } from '../constants';

type DisqualifiedScreenProps = {
  reason: DisqReason;
  onRestart: () => void;
};

export function DisqualifiedScreen({ reason, onRestart }: DisqualifiedScreenProps) {
  const config = DISQ_CONFIGS[reason];

  return (
    <div className="text-center px-6 py-9 animate-fade-in motion-reduce:animate-none" role="status" aria-live="assertive">
      <div className="w-[52px] h-[52px] rounded-full bg-error-bg flex items-center justify-center mx-auto mb-4">
        <IconAlertCircle size={22} className="text-error-text" aria-hidden="true" />
      </div>
      <h2 className="text-[17px] font-medium text-text-primary mb-[0.45rem]">
        {config.title}
      </h2>
      <p className="text-[13px] text-text-muted leading-relaxed max-w-[340px] mx-auto mb-3">
        {config.message}
      </p>
      <p className="text-[12px] text-text-tertiary leading-relaxed max-w-[340px] mx-auto mb-6">
        {config.alt}
      </p>
      <button
        type="button"
        onClick={onRestart}
        className={[
          'inline-flex items-center gap-[6px] px-5 py-[10px]',
          'bg-surface border-[1.5px] border-form-border rounded-form-md',
          'text-[13px] font-medium font-sans text-text-primary',
          'transition-[border-color,color] duration-[130ms]',
          'hover:border-brand hover:text-brand focus-ring',
        ].join(' ')}
      >
        <IconRefresh size={14} aria-hidden="true" />
        Start over
      </button>
    </div>
  );
}

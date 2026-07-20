import type { RevenueBandOption } from '../../types';
import { IconTrendingDown, IconTrendingUp, IconChartBar } from '@tabler/icons-react';

type RevenueGateButtonProps = {
  option: RevenueBandOption;
  selected?: boolean;
  onClick: () => void;
};

export function RevenueGateButton({ option, selected, onClick }: RevenueGateButtonProps) {
  const isDisq = !option.qualifier;

  const containerClass = [
    'flex flex-col items-center gap-[6px] w-full min-h-[80px] px-4 pt-4 pb-[0.875rem]',
    'border-[1.5px] rounded-form-md cursor-pointer text-center',
    'transition-[border-color,background] duration-[130ms] focus-ring font-sans',
    selected && isDisq
      ? 'border-form-border bg-error-bg'
      : selected && !isDisq
        ? 'border-brand bg-brand-light'
        : isDisq
          ? 'border-form-border bg-surface hover:border-form-border hover:bg-error-bg'
          : 'border-form-border bg-surface hover:border-brand hover:bg-brand-light',
  ].join(' ');

  const iconWrapClass = [
    'w-9 h-9 rounded-full flex items-center justify-center mb-0.5',
    isDisq ? 'bg-error-bg text-error-text' : 'bg-brand-light text-brand',
  ].join(' ');

  const labelClass = [
    'text-[15px] font-medium leading-tight',
    selected && isDisq
      ? 'text-error-text'
      : selected && !isDisq
        ? 'text-brand'
        : 'text-text-primary',
  ].join(' ');

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={containerClass}
    >
      <div className={iconWrapClass}>
        {isDisq ? (
          <IconTrendingDown size={18} aria-hidden="true" />
        ) : option.value === '500k_plus' ? (
          <IconChartBar size={18} aria-hidden="true" />
        ) : (
          <IconTrendingUp size={18} aria-hidden="true" />
        )}
      </div>
      <div className={labelClass}>{option.label}</div>
      <div className="text-[11px] text-text-tertiary leading-tight">{option.sublabel}</div>
    </button>
  );
}

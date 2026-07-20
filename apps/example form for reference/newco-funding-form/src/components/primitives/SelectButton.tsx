import type { ReactNode } from 'react';

type SelectButtonProps = {
  label: string;
  icon?: ReactNode;
  selected?: boolean;
  onClick: () => void;
  className?: string;
};

export function SelectButton({ label, icon, selected, onClick, className = '' }: SelectButtonProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={[
        'flex items-center gap-[7px] w-full min-h-[44px] px-[0.85rem] py-[0.65rem]',
        'border-[1.5px] rounded-form-sm text-[13px] font-sans text-left',
        'transition-[border-color,background,color] duration-[130ms]',
        'focus-ring',
        selected
          ? 'border-brand bg-brand-light text-brand font-medium'
          : 'border-form-border bg-surface text-text-primary hover:border-brand hover:bg-brand-light',
        className,
      ].join(' ')}
    >
      {icon && (
        <span className={`flex-shrink-0 text-[15px] ${selected ? 'text-brand' : 'text-text-tertiary'}`}>
          {icon}
        </span>
      )}
      {label}
    </button>
  );
}

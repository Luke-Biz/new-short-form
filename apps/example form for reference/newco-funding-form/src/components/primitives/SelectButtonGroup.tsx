import type { ReactNode } from 'react';
import { SelectButton } from './SelectButton';

type Option = {
  value: string;
  label: string;
  icon?: ReactNode;
};

type SelectButtonGroupProps = {
  groupLabel: string;
  options: Option[];
  value?: string;
  onChange: (value: string) => void;
  cols?: 1 | 2 | 3;
};

const COLS_CLASS: Record<1 | 2 | 3, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-2 md:grid-cols-3',
};

export function SelectButtonGroup({
  groupLabel,
  options,
  value,
  onChange,
  cols = 2,
}: SelectButtonGroupProps) {
  return (
    <div role="radiogroup" aria-label={groupLabel}>
      <div className={`grid ${COLS_CLASS[cols]} gap-[7px]`}>
        {options.map((opt) => (
          <SelectButton
            key={opt.value}
            label={opt.label}
            icon={opt.icon}
            selected={value === opt.value}
            onClick={() => onChange(opt.value)}
          />
        ))}
      </div>
    </div>
  );
}

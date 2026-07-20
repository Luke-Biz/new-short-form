import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { inputClass } from './TextInput';

export type SelectInputProps = {
  id: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  describedBy?: string;
  children: ReactNode;
  autoFocus?: boolean;
};

export function SelectInput({
  id,
  value,
  onChange,
  onBlur,
  error,
  describedBy,
  children,
  autoFocus,
}: SelectInputProps) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        autoFocus={autoFocus}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={inputClass(!!error, 'appearance-none pr-10')}
        // Placeholder option shows in hint grey until a real value is chosen
        style={value ? undefined : { color: '#9CA3AF' }}
      >
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#6B7280]">
        <ChevronDown className="h-4 w-4" aria-hidden />
      </div>
    </div>
  );
}

import { Clock, Lock, ShieldCheck } from 'lucide-react';

const ITEMS = [
  { Icon: Lock, label: 'Secure & confidential' },
  { Icon: Clock, label: 'Takes ~3 minutes' },
  { Icon: ShieldCheck, label: 'No credit check required yet' },
] as const;

export function TrustStrip() {
  return (
    <div
      className="mb-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
      aria-label="Trust indicators"
    >
      {ITEMS.map(({ Icon, label }) => (
        <span key={label} className="flex items-center gap-[5px] text-[12px] text-[#6B7280]">
          <Icon className="h-[13px] w-[13px] shrink-0 text-[var(--brand-color)]" aria-hidden />
          {label}
        </span>
      ))}
    </div>
  );
}

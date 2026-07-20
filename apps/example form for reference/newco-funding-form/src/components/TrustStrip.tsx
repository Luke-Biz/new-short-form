import { IconLock, IconClock, IconShieldCheck } from '@tabler/icons-react';

const ITEMS = [
  { icon: <IconLock size={13} aria-hidden="true" />, label: 'Secure & confidential' },
  { icon: <IconClock size={13} aria-hidden="true" />, label: '2 min to complete' },
  { icon: <IconShieldCheck size={13} aria-hidden="true" />, label: 'No credit impact' },
] as const;

export function TrustStrip() {
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mb-[1.75rem]"
      aria-label="Trust indicators"
    >
      {ITEMS.map(({ icon, label }) => (
        <span key={label} className="flex items-center gap-[5px] text-[12px] text-text-muted">
          <span className="text-brand">{icon}</span>
          {label}
        </span>
      ))}
    </div>
  );
}

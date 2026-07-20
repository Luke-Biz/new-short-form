import { useRef, useEffect } from 'react';

type SubmitButtonProps = {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  inactive?: boolean;
  onClick?: () => void;
  type?: 'submit' | 'button';
};

export function SubmitButton({
  children,
  loading = false,
  disabled = false,
  inactive = false,
  onClick,
  type = 'button',
}: SubmitButtonProps) {
  const isDisabled = disabled || loading;
  const btnRef = useRef<HTMLButtonElement>(null);

  // Force color via JS so it wins over any Webflow !important stylesheet rule.
  // Stylesheet !important < inline-style !important (set via setProperty).
  useEffect(() => {
    const el = btnRef.current;
    if (!el) return;
    el.style.setProperty('color', isDisabled ? '#9ca3af' : 'white', 'important');
  }, [isDisabled]);

  return (
    <button
      ref={btnRef}
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      aria-busy={loading}
      className={[
        'w-full flex items-center justify-center gap-[7px]',
        'px-4 py-3 mt-5 rounded-form-md border-none',
        'text-[15px] font-medium font-sans [color:white]',
        'transition-[background,transform,opacity] duration-[150ms]',
        'active:scale-[0.99] focus-ring',
        isDisabled
          ? 'bg-[#d1d5db] [color:#9ca3af] cursor-not-allowed'
          : inactive
          ? 'bg-brand opacity-60 cursor-pointer hover:opacity-75'
          : 'bg-brand hover:bg-brand-hover cursor-pointer',
      ].join(' ')}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span>Submitting…</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

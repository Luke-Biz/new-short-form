type ConsentDisclosureProps = {
  // The button label the second paragraph refers to, e.g. "Submit" or "Continue".
  ctaLabel: string;
  className?: string;
};

const LINK_CLASS = 'text-brand underline hover:text-brand-hover focus-ring rounded';

export function ConsentDisclosure({ ctaLabel, className }: ConsentDisclosureProps) {
  return (
    <div className={className ?? 'space-y-3'}>
      <p className="text-[11px] text-text-tertiary leading-[1.6]">
        By providing your personal information to Bizcap, you are hereby agreeing
        to the Bizcap{' '}
        <a
          href="https://www.bizcapfunding.com/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
          className={LINK_CLASS}
        >
          Privacy Policy
        </a>{' '}
        and{' '}
        <a
          href="https://www.bizcapfunding.com/terms-of-use"
          target="_blank"
          rel="noopener noreferrer"
          className={LINK_CLASS}
        >
          Terms of Use
        </a>
        .
      </p>

      <p className="text-[11px] text-text-tertiary leading-[1.6]">
        By clicking &ldquo;{ctaLabel}&rdquo;, I agree and consent to Bizcap{' '}
        <a
          href="https://www.bizcapfunding.com/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
          className={LINK_CLASS}
        >
          Privacy Policy
        </a>
        .
      </p>
    </div>
  );
}

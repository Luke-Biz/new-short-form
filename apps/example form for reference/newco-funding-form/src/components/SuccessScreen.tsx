import { IconCircleCheck, IconMail, IconPhoneCall, IconFileDollar } from '@tabler/icons-react';

export function SuccessScreen() {
  return (
    <div
      className="text-center px-6 py-9 animate-fade-in motion-reduce:animate-none"
      role="status"
      aria-live="polite"
    >
      <div className="w-[52px] h-[52px] rounded-full bg-success-bg flex items-center justify-center mx-auto mb-4">
        <IconCircleCheck size={22} className="text-success-text" aria-hidden="true" />
      </div>
      <h2 className="text-[17px] font-medium text-text-primary mb-[0.45rem]">
        Application received!
      </h2>
      <p className="text-[13px] text-text-muted leading-relaxed mb-5 max-w-[340px] mx-auto">
        A Bizcap funding specialist will review your profile and reach out within{' '}
        <strong>24 business hours</strong> with a personalized offer tailored to your needs.
      </p>

      <div className="bg-success-bg border border-success-border rounded-form-md px-[1.125rem] py-4 text-left max-w-[340px] mx-auto">
        <p className="text-[12px] font-medium text-success-text mb-2">What happens next</p>
        <div className="flex items-center gap-[7px] text-[13px] text-success-text mb-[5px]">
          <IconMail size={14} aria-hidden="true" />
          Confirmation email on its way
        </div>
        <div className="flex items-center gap-[7px] text-[13px] text-success-text mb-[5px]">
          <IconPhoneCall size={14} aria-hidden="true" />
          Specialist call within 24 hours
        </div>
        <div className="flex items-center gap-[7px] text-[13px] text-success-text">
          <IconFileDollar size={14} aria-hidden="true" />
          Personalized offer prepared for you
        </div>
      </div>
    </div>
  );
}

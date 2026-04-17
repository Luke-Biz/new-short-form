import {
  forwardRef,
  useCallback,
  type AnimationEvent,
  type MutableRefObject,
} from 'react';
import PhoneInput from 'react-phone-input-2';

/** AU mobiles: 4XX XXX XXX — replaces library default `(..) .... ....` → `(47) 8895 900`. */
const PHONE_MASKS_AU = { au: '... ... ...' } as const;

/** Country dial + flag column is always visible, so the label stays in the “floated” slot. */
const phoneLabelFloatClass =
  'bizcap-float-label bizcap-phone-field__label pointer-events-none absolute right-[14px] z-[2] origin-left top-2 text-[11px] font-medium text-[var(--brand-color)]';

export type FloatingLabelPhoneInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  describedBy?: string;
  autoComplete?: string;
  /** Default ISO2 country code */
  defaultCountry?: string;
  onAnimationStart?: (e: AnimationEvent<HTMLInputElement>) => void;
};

export const FloatingLabelPhoneInput = forwardRef<
  HTMLInputElement,
  FloatingLabelPhoneInputProps
>(function FloatingLabelPhoneInput(
  {
    id,
    label,
    value,
    onChange,
    onBlur,
    error,
    describedBy,
    autoComplete = 'tel',
    defaultCountry = 'au',
    onAnimationStart,
  },
  ref,
) {
  const assignRef = useCallback(
    (node: HTMLInputElement | null) => {
      if (typeof ref === 'function') ref(node);
      else if (ref)
        (ref as MutableRefObject<HTMLInputElement | null>).current = node;
    },
    [ref],
  );

  return (
    <div
      className={`bizcap-field bizcap-phone-field${error ? ' bizcap-phone-field--error' : ''}`}
    >
      <div className="relative">
        <PhoneInput
          country={defaultCountry}
          value={value ?? ''}
          onChange={onChange}
          masks={PHONE_MASKS_AU}
          enableSearch
          disableDropdown={false}
          countryCodeEditable={false}
          preferredCountries={['au', 'nz', 'gb', 'us', 'sg', 'ca', 'in', 'hk', 'jp']}
          containerClass="bizcap-react-tel w-full"
          inputClass="bizcap-phone-input-control"
          buttonClass="bizcap-phone-flag-button"
          dropdownClass="bizcap-phone-country-dropdown"
          specialLabel=""
          inputProps={{
            id,
            ref: assignRef,
            name: 'phone',
            autoComplete,
            'aria-invalid': error ? true : undefined,
            'aria-describedby': describedBy,
            onAnimationStart,
            onBlur,
          }}
        />
        <label htmlFor={id} className={phoneLabelFloatClass}>
          {label}
        </label>
      </div>
      {error ? (
        <p
          id={describedBy}
          className="mt-1 text-[12px] text-[#DC2626]"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
});

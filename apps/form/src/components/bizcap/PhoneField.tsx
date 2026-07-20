import PhoneInput from 'react-phone-input-2';

/** AU mobiles: 4XX XXX XXX — replaces library default `(..) .... ....`. */
const PHONE_MASKS_AU = { au: '... ... ...' } as const;

export type PhoneFieldProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  describedBy?: string;
  autoComplete?: string;
  /** Default ISO2 country code */
  defaultCountry?: string;
};

export function PhoneField({
  id,
  value,
  onChange,
  onBlur,
  error,
  describedBy,
  autoComplete = 'tel',
  defaultCountry = 'au',
}: PhoneFieldProps) {
  return (
    <div className={`bizcap-phone-field${error ? ' bizcap-phone-field--error' : ''}`}>
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
          name: 'phone',
          autoComplete,
          'aria-invalid': error ? true : undefined,
          'aria-describedby': describedBy,
          onBlur,
        }}
      />
    </div>
  );
}

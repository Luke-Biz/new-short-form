import { useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { inputClass } from './TextInput';
import { loadGooglePlaces } from '../../lib/googleMaps';

export type AddressAutocompleteProps = {
  id: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  describedBy?: string;
  placeholder?: string;
};

/**
 * Business address field with Google Places autocomplete (AU-only).
 *
 * Google renders its own suggestions dropdown (.pac-container) in the light
 * DOM, so it works even inside the Webflow shadow component. A progressive
 * enhancement — if the Maps script fails to load, the field stays a plain text
 * input and never blocks submission.
 */
export function AddressAutocomplete({
  id,
  value,
  onChange,
  onBlur,
  error,
  describedBy,
  placeholder,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  // Keep the latest onChange without re-running the bind effect each render.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    let autocomplete: google.maps.places.Autocomplete | null = null;
    let cancelled = false;

    loadGooglePlaces()
      .then(() => {
        if (cancelled || !inputRef.current || !window.google?.maps?.places) return;
        autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: ['au'] },
          fields: ['formatted_address'],
          types: ['address'],
        });
        autocomplete.addListener('place_changed', () => {
          const addr = autocomplete?.getPlace().formatted_address;
          if (addr) onChangeRef.current(addr);
        });
      })
      .catch(() => {
        // Maps unavailable — the plain input below still works as free text.
      });

    return () => {
      cancelled = true;
      if (autocomplete && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocomplete);
      }
    };
  }, []);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-9 items-center justify-center text-[#9CA3AF]">
        <Search className="h-4 w-4" aria-hidden />
      </div>
      <input
        ref={inputRef}
        id={id}
        type="text"
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={inputClass(!!error, 'pl-9')}
      />
    </div>
  );
}

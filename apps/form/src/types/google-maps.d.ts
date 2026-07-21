// Minimal Google Maps JS Places typings - only the surface we use, to avoid a
// full @types/google.maps dependency.
declare namespace google.maps {
  interface MapsEventListener {
    remove(): void;
  }
  namespace event {
    function clearInstanceListeners(instance: object): void;
  }
  namespace places {
    interface AutocompleteOptions {
      componentRestrictions?: { country: string | string[] };
      fields?: string[];
      types?: string[];
    }
    interface PlaceResult {
      formatted_address?: string;
    }
    class Autocomplete {
      constructor(inputField: HTMLInputElement, opts?: AutocompleteOptions);
      addListener(eventName: string, handler: () => void): MapsEventListener;
      getPlace(): PlaceResult;
    }
  }
}

interface Window {
  google?: typeof google;
}

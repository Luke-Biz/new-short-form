/**
 * Loads the Google Maps JS API (Places library) once, on demand.
 *
 * The key is a public, HTTP-referrer-restricted client key — safe to ship in
 * client bundles (that is the intended design for Maps JS keys). Keep it
 * referrer- and API-restricted in the Google Cloud Console. Vite/Vercel can
 * override it via VITE_GOOGLE_MAPS_API_KEY; the literal fallback is what the
 * Webflow bundle uses, since the Webflow bundler doesn't read Vite env vars.
 */
const GOOGLE_MAPS_API_KEY =
  (import.meta.env?.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ??
  'AIzaSyA0MN5ZH-6Gu-Yt3iPcpHsVUUdH8FDPxrY';

let loadPromise: Promise<void> | null = null;

export function loadGooglePlaces(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'));
  if (window.google?.maps?.places) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null; // allow a later retry
      reject(new Error('Failed to load Google Maps'));
    };
    document.head.appendChild(script);
  });
  return loadPromise;
}

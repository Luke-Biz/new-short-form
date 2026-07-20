import type { PostHog } from 'posthog-js';

// posthog-js is loaded via a <script> snippet in the page head (index.html for dev,
// Webflow site head for production). Accessing it via window avoids bundling the
// module, which crashes the Webflow CLI metadata step in Node.js.
declare global {
  interface Window {
    posthog?: PostHog;
  }
}

export function getPosthog(): PostHog | undefined {
  return typeof window !== 'undefined' ? window.posthog : undefined;
}

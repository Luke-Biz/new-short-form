// GTM dataLayer push. The form renders in Webflow's Shadow DOM, which GTM's
// DOM-based triggers cannot see into — so funnel events are pushed explicitly
// from here to the (shared) window.dataLayer.

// Set once on form mount so every push carries the variant without threading
// it through each call site. One form instance per page, so module state is safe.
let formVariant: string | undefined;

export function setDataLayerVariant(variant: string): void {
  formVariant = variant;
}

export function pushDataLayer(payload: Record<string, unknown>): void {
  // GTM overrides dataLayer.push to evaluate tags synchronously; a broken
  // tag could throw. Analytics must never break the form flow.
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(formVariant ? { formVariant, ...payload } : payload);
  } catch {
    // swallow — a tracking failure must not block navigation or submission
  }
}

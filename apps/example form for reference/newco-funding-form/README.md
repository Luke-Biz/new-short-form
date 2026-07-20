# Bizcap — Funding Application Form

Multi-step funding eligibility and application form, published as a native Webflow Code Component.

**Stack:** React 18 · TypeScript strict · Tailwind CSS (pre-compiled) · react-hook-form · Zod · Webflow CLI

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env and set VITE_LEADS_API_TOKEN

# 3. Start dev server (Tailwind watch + Vite in parallel)
npm run dev
```

Open http://localhost:5173

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_LEADS_API_TOKEN` | Yes | Bearer token for the BizMate leads API |

Never commit `.env` — it is gitignored. The file is Vite-prefixed (`VITE_`) so it's bundled client-side; treat it as a public token scoped to lead creation only.

---

## Available Commands

```bash
npm run dev           # Tailwind watch + Vite dev server (parallel)
npm run build         # Typecheck + Tailwind compile + Vite production build
npm run lint          # ESLint
npm run typecheck     # tsc --noEmit (strict)
npm run test          # Vitest unit tests
npm run webflow:share # Compile Tailwind + publish to Webflow Code Component Library
```

---

## Publishing to Webflow

### First time

```bash
npm run webflow:share
```

This will:
1. Compile `src/index.css` → `src/compiled.css` (minified)
2. Open a browser to authenticate with your Webflow account
3. Write the auth token to `.env` (gitignored)
4. Upload the component library to Webflow

### Subsequent publishes

```bash
npm run webflow:share
```

Auth token is already stored — no browser prompt.

### After publishing — steps in the Webflow UI

1. Open your Webflow project → **Apps & Integrations → Code Component Libraries**
2. Find **Bizcap Form Library** and click **Add to project**
3. In the Designer, open the **Components** panel and search for **Funding Application Form**
4. Drag it onto any page
5. To set prop overrides, select the component and edit values in the right panel

### Important: `src/compiled.css` is gitignored

`compiled.css` is not committed. On a fresh clone:
- `npm run dev` generates it automatically (Tailwind watch)
- `npm run build` generates it automatically (prebuild step)
- `npm run webflow:share` generates it automatically

Do not manually create or edit `compiled.css`.

---

## Project Structure

```
src/
├── constants.ts                         # Form name, thresholds, static data
├── types/index.ts                       # Shared TypeScript types
├── schema/form.ts                       # Zod schemas (source of truth for types)
├── lib/
│   ├── analytics.ts                     # track() — PostHog-ready no-op
│   ├── featureFlags.ts                  # useFeatureFlag<T> hook
│   ├── api.ts                           # submitLead() with retry + typed errors
│   ├── payload.ts                       # buildPayload() — pure, tested
│   └── utm.ts                           # UTM capture + sessionStorage
└── components/
    ├── primitives/                      # Reusable low-level components
    ├── steps/                           # Step1, Step2, Step3
    ├── FundingApplicationForm.tsx       # Named export — main form
    └── FundingApplicationForm.webflow.tsx  # Default export — Webflow entry
```

---

## Qualification Logic

All gates live on Step 1 (order: revenue → time in business → structure → bank → amount).

| Signal | Qualifies | Immediately disqualifies |
|---|---|---|
| Monthly revenue | $20k–$100k, $100k–$500k, $500k+ | Below $20k |
| Time in business | 1–2 yrs, 2–5 yrs, 5+ yrs | Under 1 year |
| Business structure | LLC, Corporation, Sole proprietor, Partnership | None — all qualify |
| Bank | Any selection | None (neo-banks warn, still qualify) |
| Funding amount | > $0 | 0 or empty (blocks step advance) |

---

## Analytics Events

The `track()` function in `src/lib/analytics.ts` is a PostHog-ready no-op. Wire PostHog by following the instructions below — no changes to callers are needed.

| Event | When |
|---|---|
| `form_view` | On mount |
| `step_advance` | CTA advances to next step |
| `step_back` | Back navigation (link or progress bar) |
| `qualification_failed` | Disq screen shown |
| `submit_attempt` | Submit button clicked |
| `submit_success` | API 200 OK |
| `submit_error` | API error of any kind |
| `restart_from_disqualified` | Restart button clicked |
| `experiment_exposed` | Feature flag returns non-default value |

---

## Feature Flags

Flags are defined in `src/lib/featureFlags.ts`. Today all return their defaults (no flag service connected).

| Flag | Default | Controls |
|---|---|---|
| `show_trust_strip` | `true` | Trust indicator row |
| `progressive_reveal_step_1` | `true` | Sequential vs all-visible Step 1 |
| `consent_explicit_checkbox` | `true` | SMS checkbox (always on per legal requirement) |
| `industry_options_order` | `'default'` | Order of industry options |
| `step_2_3_swapped` | `false` | Reserved (not wired) |

### Adding a new flag

```ts
// 1. Add to FeatureFlagKey in src/lib/featureFlags.ts
export type FeatureFlagKey =
  | 'show_trust_strip'
  | 'your_new_flag';   // ← add here

// 2. Use in your component
const value = useFeatureFlag('your_new_flag', 'default_value');
```

`experiment_exposed` fires automatically when PostHog returns a non-default value.

### Connecting PostHog

```bash
npm install posthog-js
```

**1. Initialise** (Webflow embed or custom code block on every page):
```js
import posthog from 'posthog-js';
posthog.init('phc_YOUR_KEY', { api_host: 'https://app.posthog.com' });
```

**2. Wire feature flags** — edit `src/lib/featureFlags.ts`:
```ts
// Replace:
const value = defaultValue;
// With:
const value = (posthog.getFeatureFlag(key) ?? defaultValue) as T;
```

**3. Wire analytics** — edit `src/lib/analytics.ts`:
```ts
export function track(event: string, payload?: Record<string, unknown>): void {
  if (isDev) console.debug('[analytics]', event, payload);
  posthog.capture(event, payload);  // ← add this line
}
```

No other changes needed anywhere.

---

## Webflow Prop Overrides

These props are exposed in the Webflow Designer's right panel when the component is selected.

| Prop | Type | Default | Use case |
|---|---|---|---|
| `headlineOverride` | string | "Tell us about your business" | A/B test copy |
| `subheadlineOverride` | string | "A few details about your company." | A/B test copy |
| `submitCtaOverride` | string | "Submit my application" | A/B test CTA |
| `eligibilityCtaOverride` | string | "Check my eligibility →" | A/B test CTA |
| `revenueThresholdOverride` | number | 20000 | Change disq copy threshold |
| `brandColorOverride` | string | `#0C79C1` | Match client brand colour |

> **Note:** Changing revenue band boundaries, field order, or consent copy requires a code change and re-publish via `npm run webflow:share`.

---

## Anti-spam

- **Honeypot field** — hidden off-screen input. If filled (bots do this), submit silently succeeds without POSTing.
- **Timing gate** — submits within 3 seconds of mount silently succeed without POSTing.
- **Cloudflare Turnstile** can be added later via a Webflow embed if spam volume warrants it.

---

## Accessibility Notes

Improvements over the prototype, with rationale:

| Change | Why |
|---|---|
| `focus-visible` rings on all interactive elements | WCAG 2.4.7 Focus Visible (AA) |
| Input font size ≥ 16px | iOS Safari auto-zooms inputs below 16px |
| Tap targets ≥ 44px tall | WCAG 2.5.5, Apple HIG |
| Progress bar fully keyboard navigable | Spec requirement; WCAG 2.1.1 |
| `aria-live="polite"` for step transitions | WCAG 4.1.3 Status Messages |
| `prefers-reduced-motion` guard on animations | WCAG 2.3.3 (AAA), general best practice |
| Muted text minimum `#6b7280` (4.63:1 on white) | WCAG 1.4.3 Contrast (AA) |
| `aria-invalid` + `aria-describedby` on fields | WCAG 3.3.1 Error Identification |

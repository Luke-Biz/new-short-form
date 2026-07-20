# Bizcap Loan Form Monorepo

## Project Overview
npm-workspaces monorepo with two Vite + React + TypeScript + Tailwind apps:

- **`apps/form`** — 3-step business loan application wizard. Deployed two ways:
  1. **Webflow code component** — published via `npm run webflow:share` (the primary distribution)
  2. **Vercel** — https://new-short-form-test.vercel.app (used as iframe target for previews)
- **`apps/configurator`** — partner-facing white-label tool. Partners pick a brand colour and logo, preview the form live (iframe of the Vercel deployment), and generate a shareable URL + embed code. Deployed on Vercel at https://new-short-form-configurator.vercel.app, iframed inside a custom CRM. Logo uploads go to Cloudinary (unsigned preset, config in `apps/configurator/.env`).

No backend — both apps are frontend-only. The form submits to an external API directly.

## Commands (run from repo root)
- `npm run dev` — both apps (form :5173, configurator :5174)
- `npm run dev:form` / `npm run dev:configurator` — individually
- `npm run build:form` / `npm run build:configurator` — `tsc && vite build`
- `npm run webflow:share` — pre-compiles Tailwind CSS then publishes the form to Webflow

## Webflow Code Component Pipeline (apps/form)
The form runs **natively inside Webflow** (not iframed) via `@webflow/react`.

- `BizcapLoanForm.webflow.tsx` wraps the component with `declareComponent()` — must be a **default export**
- `apps/form/webflow.json` tells the CLI which `*.webflow.tsx` files to publish
- **CSS must be pre-compiled**: the Webflow CLI's bundler does not run Tailwind/PostCSS. `webflow:share` first runs the `tailwindcss` CLI to produce `src/bizcap.compiled.css` (gitignored), which the `.webflow.tsx` imports. Never import `src/index.css` from a `.webflow.tsx` file.
- PostCSS config lives in `vite.config.ts` (NOT a `postcss.config.js` — the Webflow CLI would pick that up and fail)

### Shadow DOM constraints (critical)
Webflow components render in a Shadow DOM:
- `document.getElementById` / `document.querySelector` return null — always use a `ref` on the root element and `containerRef.current.querySelector(...)`
- Autofocus: use the React `autoFocus` prop, never `useEffect` + DOM lookup

## White-Label Theming (apps/form)
The form reads URL params on mount (`useState` lazy initializer + `URLSearchParams`):
- `?color=%23FF6B00` — sets `--brand-color` (default `#0C79C1`) plus derived vars as inline CSS variables on the root div: `--brand-shadow` (12% transparent tint, focus rings), `--brand-hover` (85% mix toward black, button hover), `--brand-light` (8% mix toward white, selected-tile/badge background)
- `?logo=<url>` — renders an `<img>` above the card instead of the inline `BizcapLogo` SVG

Rules:
- All brand-blue styling must use the `--brand-*` vars — never hardcode `#0C79C1` in components (the only exceptions: the default fallback value and the `BizcapLogo` SVG fill, which stays Bizcap blue)
- Tints/derived colours use `color-mix(in srgb, var(--brand-color) N%, ...)`
- These stay a fixed colour on purpose: error red `#991B1B` (text + errored input borders), greys (`#E5E7EB` field/card borders, `#9CA3AF` placeholders/hints/tertiary text, `#6B7280` muted text, `#111827` headings/labels/input text)
- Labels stay dark on error — the red border + inline error message carry the error state, never the label colour

## Code Style
- TypeScript everywhere — no `.js` for components/logic, no `any`
- `.tsx` for React components, `.ts` for utilities/types
- Named exports (the one exception: `*.webflow.tsx` files require default exports)
- ES module imports only
- Destructure props explicitly with TypeScript types
- Keep components small and single-responsibility
- Tailwind classes for styling; inline `style` only for runtime-computed values (CSS variables, `color-mix` with state-dependent logic)

## Form Architecture (apps/form)
- One `react-hook-form` instance per step (`useForm` + Zod schemas from `src/lib/schemas.ts`), all owned by `BizcapLoanForm.tsx`
- Each step is its own component receiving `control`, `formId`, and `trigger` props
- Validation mode: `onBlur`, re-validate `onChange`; step components call `trigger(field)` in `onChange` when the field is already invalid so errors clear as the user types
- Step data accumulates; submitted only on the final step
- Never reset earlier step data when navigating back
- On failed validation, focus the first invalid field via `aria-invalid` scan inside `containerRef`

## UI/UX Rules — Multi-Step Forms

### Progress & Navigation
- Progress header above the card: "Step X of 3 — {label}" left, percent right, 3px brand-colour track; sr-only `aria-live` region announces step changes
- Trust strip (lock/clock/shield icons in brand colour) above the progress bar, visible on every step
- "Back" is a subtle text link (13px, tertiary grey) on steps 2+, never on Step 1
- "Next" / "Submit" is a full-width primary button at the bottom; **inactive vs disabled**: while the step is incomplete the button shows `opacity-60` but stays clickable (a click runs validation and focuses the first error) — true `disabled` (grey) is reserved for in-flight submits/preview mode
- Each step opens with an eyebrow kicker (11px uppercase brand colour) or badge, an 18px medium heading, and a 13px muted subline

### Validation
- Validate on blur, not on every keystroke; clear errors on change once a field is invalid
- Inline error messages directly below the relevant field — red, small, specific
- Block progression while the current step has errors; re-validate all fields on "Next"
- IMPORTANT: Never validate on mount or show errors before a field has been touched

### Input Fields
- Static top-label anatomy (established — see `Field.tsx`): 13px medium label above the input, optional 12px hint between label and input, 12px inline error below (`role="alert"`); placeholders are example values, never labels
- Canonical input (`inputClass` in `TextInput.tsx`): 44px tall, 1.5px `#E5E7EB` border, 8px radius, 16px text (never smaller — iOS zoom); error border `#991B1B` must survive focus (branch the whole class set on `error`)
- Phone: country code selector, Australian default (+61 🇦🇺)
- Currency fields show a `$` prefix inside the input; value is always comma-formatted as the user types
- Search-style fields (Business name/address) show a left search icon
- Checkboxes must have a clickable label, not just the box

### Selection Cards (Step 3 — Purpose of funds)
- Icon + label tiles, 4-column grid (2-column under 360px)
- Selected: brand-colour border + `--brand-light` background + brand-colour text/icon, medium weight
- Hover (unselected): brand-colour border + `--brand-light` background
- Single select, keyboard-navigable, visible focus states; icons are `#9CA3AF` when unselected

### Accessibility
- All inputs have associated `<label>` elements
- `aria-describedby` links error messages to inputs; `aria-invalid` on errored fields
- Colour alone must never be the only error indicator — always include text
- Touch targets ≥ 44px; logical tab order

### Mobile / Breakpoints
Single 600px max-width container, top-aligned on a `#F9FAFB` page background at every width (no vertical centering — card height changes between steps must not make it jump). Card is a `1px #E5E7EB` border + 14px radius; buttons sit in the natural document flow (no pinned footer / inner scroll region). Custom breakpoints via arbitrary values: 360px (purpose grid 2→4 columns), 480px (name row stacks below, side-by-side above; progress label collapses to "N / 3" below). No horizontal scroll from 320px up.

## Submission
- Loading state + disabled Submit button while the API call is in flight
- Success: confirmation state, not an alert; Error: friendly message above the button
- Never expose raw API errors to the user

## What NOT to Do
- Do not use `any` in TypeScript
- Do not hardcode `#0C79C1` in form components — use `var(--brand-color)`
- Do not add new dependencies without asking first
- Do not use `document.getElementById` in the form — Shadow DOM breaks it
- Do not create a `postcss.config.js` — it breaks the Webflow CLI
- Do not import non-compiled CSS in `*.webflow.tsx` files
- Do not show validation errors before a field has been touched
- Do not reset form state when navigating between steps
- Do not use `alert()` for errors or success messages
- Do not commit `.env` files (a Webflow CLI token was leaked once already — revoked)

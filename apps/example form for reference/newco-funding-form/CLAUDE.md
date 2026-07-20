# Bizcap Funding Form — CLAUDE.md

## Project Overview

A production-grade, multi-step funding application form built with React 18 + TypeScript strict + Tailwind CSS, delivered as a native Webflow Code Component via the Webflow Code Component Library CLI. The form collects eligibility signals (revenue band, time in business, business structure, bank, funding amount), business details, and contact information, then POSTs to the BizMate leads API. Qualification gates immediately disqualify ineligible leads. The component renders in Webflow's Shadow DOM and uses pre-compiled Tailwind CSS.

The component ships **two variants**, selected per-instance via the Webflow "Form Variant" dropdown (see Form Variants section below). Variant 1 is the original eligibility-first flow described above. Variant 2 is contact-first: the lead is created in BizMate right after step 1, and the final submission updates that lead.

---

## Form Variants

`formVariant` prop (Webflow dropdown; any value containing "2" → v2, everything else → v1). Dev preview: `npm run dev` then `?variant=2`.

| | Variant 1 (eligibility first) | Variant 2 (contact first) |
|---|---|---|
| Step 1 | Revenue / time / structure / bank / amount, disq gates | First name, last name, email, business name + both consent paragraphs |
| Step 2 | Business name, industry, EIN | Revenue / time / structure / bank / amount — **no disq gates** (all options qualify) |
| Step 3 | Name, phone, email, SMS consent → submit | Industry, EIN, phone, SMS consent → submit |
| Lead create | Single POST at final submission | POST after step 1 (`applicationCompleted: 'No'`, contact fields + UTM/partner only) |
| Final submission | POST (full payload) | PATCH of the step-1 lead (full payload, `applicationCompleted: 'Yes'`) — see below |
| Disqualification | Below $20k / under 1 yr → disq screen | Never — lead already exists; qualification handled downstream |
| Redirect | `applicationLink` from POST response | `applicationLink` from PATCH response, falling back to the one captured at lead creation |
| Broker | None sent — Lambda default applies | `V2_BROKER_ID` (`889a8b31-…`) sent explicitly; an explicit `?partnerid=` still wins |

### v2 PATCH contract & fallback
- `API_PATCH_URL` in `src/constants.ts` is the lead-update Lambda endpoint. Client sends `PATCH` with body `{ id: <leadId>, ...fullPayload }` (`patchLead()` in `src/lib/api.ts`). The lead id is read from the step-1 POST response.
- `lambda/index.js` is the reference copy of the Lambda handler (deployed manually to AWS, not part of the app bundle; excluded from ESLint). It routes POST → create / PATCH → update, returns `{ applicationLink, id }`, honors `applicationCompleted` from the body, and whitelists writable CRM fields. The BizMate token is redacted in the repo copy and the CRM update route needs confirming before deploy — see the header comment.
- **Do not enable variant 2 in production before the updated Lambda is deployed**: the old Lambda returns no lead id (PATCH impossible) and its 60-second per-email dedup lock would swallow the final fallback POST of anyone completing the form within a minute of step 1.
- **While `API_PATCH_URL` is empty** (backend route not built yet), v2 falls back to a full POST at final submission — the form works, but a completed application may appear in BizMate as a second lead alongside the partial step-1 lead. Set the constant as soon as the PATCH Lambda exists. CORS on the Lambda must allow the `PATCH` method for the page's exact origin.
- If the step-1 create fails (after retries), the user still advances; final submission falls back to a full POST so the lead is never lost. The failure is reported to Sentry as `lead_create_<category>`.
- v2 bot handling: honeypot filled at step 1 → no API calls ever, silent success at the end. Filled faster than 3 s → step-1 create skipped; final submission applies the standard checks.

---

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Tailwind CSS watch + Vite dev server (parallel) |
| `npm run build` | Typecheck → compile Tailwind → Vite production build |
| `npm run prebuild` | Compile Tailwind only (runs automatically before `build`) |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript strict check (no emit) |
| `npm run test` | Vitest unit tests |
| `npm run webflow:share` | Compile Tailwind + publish to Webflow Code Component Library |

### First-time setup
1. `npm install`
2. Copy `.env.example` → `.env`, fill in `VITE_LEADS_API_TOKEN`
3. `npm run dev` — Tailwind compiles on first watch tick; Vite dev server starts

---

## File Structure Conventions

```
src/
├── constants.ts              # FORM_NAME, thresholds, static data arrays, disq copy
├── types/index.ts            # Shared TS types (StepState, DisqReason, etc.)
│                             #   Also: module augmentation for CSS custom properties
├── schema/form.ts            # Zod schemas — single source of truth for field types
├── lib/
│   ├── analytics.ts          # track() — no-op today, PostHog-ready
│   ├── featureFlags.ts       # useFeatureFlag<T> hook + FeatureFlagKey union
│   ├── api.ts                # submitLead() + extractRedirectUrl() — fetch + retry
│   ├── payload.ts            # buildPayload() — pure function, fully unit-tested
│   └── utm.ts                # UTM capture + sessionStorage persistence
└── components/
    ├── primitives/           # Reusable low-level components
    │   ├── ConsentDisclosure.tsx  # Privacy Policy / Terms paragraphs (ctaLabel prop)
    │   ├── Field.tsx         # label + slot + error message
    │   ├── SelectButton.tsx  # Single tile radio button
    │   ├── SelectButtonGroup.tsx
    │   ├── RevenueGateButton.tsx  # Large revenue band tile
    │   ├── TextField.tsx
    │   ├── MoneyField.tsx    # Dollar-prefix + comma formatting
    │   ├── SubmitButton.tsx  # CTA with loading spinner
    │   └── ErrorBanner.tsx   # Form-level error banner
    ├── TrustStrip.tsx
    ├── StepProgress.tsx      # Interactive progress bar with full ARIA
    ├── DisqualifiedScreen.tsx
    ├── SuccessScreen.tsx
    ├── steps/
    │   ├── Step1Eligibility.tsx  # v1 step 1; reused (gated=false) as v2 step 2
    │   ├── Step2Business.tsx     # v1 step 2
    │   ├── Step3Contact.tsx      # v1 step 3
    │   ├── Step1ContactV2.tsx    # v2 step 1 — contact + business name + consent
    │   └── Step3DetailsV2.tsx    # v2 step 3 — industry, EIN, phone, SMS consent
    ├── FundingApplicationForm.tsx      # Named export — main composition
    └── FundingApplicationForm.webflow.tsx  # Default export — Webflow entry
```

---

## Code Style

- **Named exports everywhere** — default exports reserved for `.webflow.tsx` wrappers (Webflow CLI requirement)
- **No `any`** — use `unknown` and narrow. `@typescript-eslint/no-explicit-any` is an error.
- **Zod schemas are the source of truth** — infer TypeScript types with `z.infer<>`, never handwrite them
- **No `dangerouslySetInnerHTML`** ever
- **No `document.*` selectors** — use refs or React state (Shadow DOM constraint)
- **`autoFocus` prop works in Shadow DOM**; `useEffect(() => ref.current?.focus())` does not
- **Comments only for non-obvious WHY** — no JSDoc blocks, no narrating what code does
- **Consistent type imports** — `import type { Foo }` for type-only imports (enforced by ESLint)

---

## Webflow Gotchas (Shadow DOM)

1. **`document.getElementById` / `document.querySelector` return `null`** — use React refs exclusively
2. **CSS must be pre-compiled** — `FundingApplicationForm.webflow.tsx` imports `../compiled.css` (the output of `tailwindcss -i src/index.css -o src/compiled.css --minify`). Never import `src/index.css` from the Webflow wrapper.
3. **`src/compiled.css` is gitignored** — must be generated before `npm run webflow:share`. `npm run build` and `npm run dev` both generate it automatically. Document this in README onboarding.
4. **`.env` must be gitignored before first commit** — `VITE_LEADS_API_TOKEN` must never appear in git history or the client bundle.
5. **`window.scrollTo`** — works fine from inside Shadow DOM (same `window` object). Step-change scroll uses both `containerRef.current?.scrollIntoView()` + `window.scrollTo({ top: 0 })` via a `useEffect` on `current` (fires after React commits new step DOM).
6. **Scroll conventions** — progressive reveal uses `block: 'center'` (intentional — guides user's attention to new section). Validation error scroll also uses `block: 'center'`. Invalid field focus uses `element.focus({ preventScroll: true })` paired with smooth `scrollIntoView` to avoid the browser's instant focus-scroll fighting our animation.
7. **Fonts** — Montserrat is loaded via `@font-face` rules in `src/index.css` (compiled into `compiled.css`), pointing at `.woff2` files hosted on the Webflow site's assets CDN (`cdn.prod.website-files.com/<siteId>/...`). Host-page font settings do not cross the Shadow DOM boundary — the `@font-face` must live in the component's own CSS. If the form moves to a different Webflow site, re-upload the font files there and update the URLs in `src/index.css`.

---

## Qualification Rules

Step 1 reveal/gate order: revenue → time in business → business structure → bank → funding amount.

| Signal | Qualifies | Disqualifies immediately |
|---|---|---|
| Monthly revenue | $20k–$100k, $100k–$500k, or $500k+ | Below $20k → disq screen, red progress bar |
| Time in business | 1–2 years, 2–5 years, or 5+ years | Under 1 year → disq screen |
| Business structure | LLC, Corporation (C or S), Sole proprietor, Partnership/LLP | None — all structures qualify |
| Bank | Any selection | None (neo-banks show amber warning; still qualify) |
| Funding amount | Any value > 0 | 0 or empty prevents step 1 CTA |

All disqualification gates live on Step 1. Steps 2 and 3 have no disqualification logic — they only validate required fields. Disqualifying selections (Below $20k, Under 1 year) call `onDisqualify` before writing to form state, so a disqualifying value never reaches the payload.

---

## Confirmed API Field Mapping

| Form field | API field | Value |
|---|---|---|
| Revenue band | `averageMonthlyTurnover` | Lower bound: 20k→20000, 100k→100000, 500k+→500000 |
| Business structure | `businessType` | LLC→"Limited Liability Company", Corporation→"Corporation", Sole proprietor→"Sole Proprietor", Partnership→"Partnership" |
| Bank | `notes` (appended) | "Primary bank: [label]" + "(neo-bank)" for neo selections |
| Funding amount | `amountRequested` | Parsed integer from comma-formatted input |
| Industry | `industry` | Human-readable label as-is |
| Time in business | `businessStartDate` | Collected on Step 1. ISO: 1-2yr→-18mo, 2-5yr→-42mo, 5yr+→-72mo (Under 1 year disqualifies, never sent) |
| Business name | `companyName` | |
| EIN (optional) | `companyNumber` | Omitted if empty |
| First name | `firstName` | |
| Last name (optional) | `lastName` | Omitted if empty |
| Phone | `phone` | Sent as typed |
| Email | `email` | |
| SMS consent checkbox | `brazeUserProfile.marketingSms` | "Subscribed" if checked, "Unsubscribed" if not |
| — | `country` | Fixed: `"US"` |
| — | `leadSource` | Fixed: `"Advertisement"` |
| — | `sourceChannel` | Fixed: `"Web - Apply"` |
| — | `applicationCompleted` | Fixed: `"Yes"` |
| — | `agreeToBizcapConsentPrivacy` | Fixed: `"Yes"` |
| — | `thirdPartyMarketingConsent` | Fixed: `"No"` |
| URL query string (UTM) | `utmSource`, `utmMedium`, `utmCampaign`, `utmTerm`, `utmDevice`, `utmMatchType`, `utmContent`, `gclid`, `fbclid`, `gbraid`, `msclkid`, `productType` | Captured on mount, persisted in sessionStorage. Params: `utm_source`/`utm_medium`/`utm_campaign`/`utm_term`/`utm_device`/`utm_matchtype`/`utm_content`/`gclid`/`fbclid`/`gbraid`/`msclkid`/`product_type` |
| URL query string (partner) | `brokerId`, `brokerRepId` | From `partnerid`/`partnercontactid`. Captured on mount, persisted in sessionStorage |
| URL query string (affiliate) | `uen`, `sfid` | From `refid` (FlexOffers, both variants). Full refid (`<program>.<publisher>.<link>FOF<clickId>`) → `uen`; publisher segment (2nd dot-part) → `sfid`. Captured on mount, persisted in sessionStorage. Repurposed BizMate fields — deliberate |

Notes field (newline-separated):
```
Revenue: [band label]/mo
Primary bank: [bank label][ (neo-bank)]
Time in business: [human label]
```

---

## Analytics Event Reference

| Event | When fired | Key payload fields |
|---|---|---|
| `form_view` | On mount | `form_name` |
| `step_advance` | CTA advances forward | `form_name, step, step_name` |
| `step_back` | Back link or progress-bar click | `form_name, from_step, to_step` |
| `qualification_failed` | Disq screen shown | `form_name, reason` |
| `submit_attempt` | Submit button clicked | `form_name` |
| `submit_success` | API 200 OK | `form_name, amount_requested` |
| `submit_error` | API error | `form_name, error_category` |
| `restart_from_disqualified` | Restart button clicked | `form_name` |
| `experiment_exposed` | Feature flag returns non-default | `form_name, flag, variant` |

`form_name` constant: `"newco_funding_application_v2"` (in `src/constants.ts`). All `track()` events also carry `form_variant: 'v1' | 'v2'`.

### GTM dataLayer pushes (separate from PostHog `track()`)

The form renders in Shadow DOM, which GTM's DOM-based triggers cannot read into — so funnel events are pushed explicitly via `pushDataLayer()` (`src/lib/dataLayer.ts`) to the shared `window.dataLayer`. These are independent of the PostHog `track()` events above.

Every push is auto-tagged with `formVariant: 'v1' | 'v2'` (set once on mount via `setDataLayerVariant()`).

| Event | Variant | When fired | Payload (values are display labels) |
|---|---|---|---|
| `check_my_eligibility_button` | v1 | Step 1 CTA, on successful advance | `revenueAmount, timeInBusiness, businessStructure, primaryBank, desiredFundingAmount, funnelStep: 'Step 1'` |
| `continue_about_button` | v1 | Step 2 CTA, on successful advance | `industry, funnelStep: 'Step 2'` |
| `contact_details_button` | v2 | Step 1 CTA, on successful advance | `funnelStep: 'Step 1'` |
| `funding_details_button` | v2 | Step 2 CTA, on successful advance | same fields as `check_my_eligibility_button`, `funnelStep: 'Step 2'` |
| `business_details_button` | v2 | Step 3 CTA, before submit | `industry, funnelStep: 'Step 3'` |
| `start_over_button` | both | "Start over" on disqualified screen | `event` only |
| `custom.successful.application` | both | Successful submission (pre-existing) | `event` only |

Notes: `timeInBusiness` is on the Step 1 push (it's collected on Step 1, not Step 2). `desiredFundingAmount` is the formatted display string (e.g. `"$250,000"`). Pushes fire only when the step actually advances (validation passed), not on every raw click.

---

## Feature Flag Reference

| Key | Default | Controls |
|---|---|---|
| `show_trust_strip` | `true` | Toggle the trust row |
| `progressive_reveal_step_1` | `true` | Progressive vs all-fields-visible Step 1 |
| `consent_explicit_checkbox` | `true` | SMS checkbox (always shown; required by consent copy) |
| `industry_options_order` | `'default'` | `'usage_sorted'` re-orders industry options (future) |
| `step_2_3_swapped` | `false` | Reserved — type exists, not wired |

### Adding a new flag
1. Add key to `FeatureFlagKey` union in `src/lib/featureFlags.ts`
2. Call `useFeatureFlag('new_key', defaultValue)` in the relevant component
3. When PostHog is initialised, `experiment_exposed` fires automatically on non-default values — no caller changes needed

### Enabling PostHog
1. `npm install posthog-js`
2. In app entry or Webflow embed: `posthog.init('YOUR_KEY', { api_host: 'https://app.posthog.com' })`
3. In `src/lib/featureFlags.ts`: replace `const value = defaultValue` with `const value = (posthog.getFeatureFlag(key) ?? defaultValue) as T`
4. In `src/lib/analytics.ts`: add `posthog.capture(event, payload)` in `track()`

---

## Webflow Prop Override Reference

| Prop | Type | Default | Safe for A/B |
|---|---|---|---|
| `formVariant` | dropdown | "Variant 1 (eligibility first)" | Yes — selects the whole flow (see Form Variants) |
| `headlineOverride` | `string` | "Tell us about your business" | Yes |
| `subheadlineOverride` | `string` | "A few details about your company." | Yes |
| `submitCtaOverride` | `string` | "Submit my application" | Yes |
| `eligibilityCtaOverride` | `string` | "Check my eligibility →" | Yes |
| `revenueThresholdOverride` | `number` | `20000` | Yes — updates disq copy only (band labels hardcoded) |
| `brandColorOverride` | `string` | `"#0C79C1"` | Yes — single hex/rgb value |
| `showBrandTitle` | `boolean` | `true` | Yes — Webflow prop "Show Title"; toggles the "Bizcap" brand title (shown above the trust strip on all steps) |

> Changing band boundaries, field order, or consent copy requires a code change and re-publish.

---

## Responsive Breakpoint Matrix

| Breakpoint | Width | Changes |
|---|---|---|
| Base | 0–639px | Single column, stacked name inputs, `"1/3"` progress label |
| `sm` | 640px+ | 2-col button grids, side-by-side name row |
| `md` | 768px+ | 4-col time-in-business grid |
| `lg` | 1024px+ | 500px max-width centred, generous padding |
| 1280px+ | — | No change |

---

## Definition of Done

- [ ] `npm run typecheck` — zero errors
- [ ] `npm run lint` — zero warnings or errors
- [ ] `npm run build` — clean build output
- [ ] `npm run test` — all tests pass
- [ ] Tailwind compile step of `npm run webflow:share` succeeds
- [ ] Manual check at: 320px, 375px, 414px, 640px, 768px, 1024px, 1440px
- [ ] Portrait + landscape on mobile — no horizontal scroll
- [ ] Progressive reveal on small screen — new fields scroll into view without pushing CTA off-screen
- [ ] Progress-bar steps navigable by click and by keyboard (Tab + Enter/Space)
- [ ] Form scales correctly under 200% browser zoom
- [ ] Qualification paths: below-$20k revenue disq, under-1-year disq, sole-proprietor passes, neo-bank warning, full happy path
- [ ] Submit: loading state, redirect on `applicationLink`, success screen fallback, all API error types, retry button
- [ ] Honeypot filled → silent success (no POST)
- [ ] Submit within 3 s of mount → silent success (no POST)
- [ ] All interactive elements have visible focus-visible rings
- [ ] Consent links open in new tab, SMS checkbox maps correctly to `brazeUserProfile.marketingSms`

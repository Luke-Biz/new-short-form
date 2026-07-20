# Multi-Step Form Styleguide

A portable design + implementation standard extracted from the Bizcap funding form. Hand this to any project (React + Tailwind assumed, but the tokens and rules are framework-agnostic) to produce forms with the same look, feel, and accessibility quality.

The philosophy: **calm, high-contrast, generous touch targets, inline validation, no surprises.** Every interactive element has a visible focus state. Nothing relies on colour alone. Motion is subtle and always respects `prefers-reduced-motion`.

---

## 1. Design Tokens

Define these once as CSS custom properties on the form root. Everything else references them — never hardcode hex values in components.

```css
:root {
  /* Brand */
  --brand:          #0C79C1;  /* primary actions, selected states, links, focus rings */
  --brand-hover:    #0A639E;  /* hover on brand surfaces */
  --brand-light:    #E8F3FB;  /* selected tile background, badge background */

  /* Surfaces */
  --bg:             #f9fafb;  /* page background */
  --surface:        #ffffff;  /* card / input background */
  --border:         #e5e7eb;  /* default field + card borders */

  /* Text */
  --text-primary:   #111827;  /* headings, input text, primary labels */
  --text-muted:     #6b7280;  /* body copy, secondary text */
  --text-tertiary:  #9ca3af;  /* hints, placeholders, legal text, disabled (see note) */

  /* Feedback — error */
  --error-bg:       #fef2f2;
  --error-text:     #991b1b;
  --error-border:   #fca5a5;

  /* Feedback — success */
  --success-bg:     #f0fdf4;
  --success-text:   #166534;
  --success-border: #bbf7d0;

  /* Feedback — warning */
  --warning-bg:     #fffbeb;
  --warning-text:   #92400e;
  --warning-border: #fde68a;
  --warning-icon:   #d97706;

  /* Disabled */
  --disabled-bg:    #d1d5db;
  --disabled-text:  #9ca3af;

  /* Radii */
  --radius-sm:      8px;   /* inputs, select tiles */
  --radius-md:      10px;  /* primary button */
  --radius-lg:      14px;  /* card container */
}
```

> **Improvement applied vs. the original:** In the source project `--text-muted` and `--text-tertiary` were both `#6b7280`, which flattened the hierarchy, and several values (`#fca5a5`, `#d1d5db`, `#9ca3af`, `#d97706`) were hardcoded one-offs. This guide promotes `--text-tertiary` to a genuinely lighter `#9ca3af` and tokenises the one-offs (`--error-border`, `--warning-icon`, `--disabled-bg/text`). Adopt these for cleaner hierarchy.

### Theming / white-label
Because every colour is a CSS var, a whole new brand is a single override: set `--brand`, `--brand-hover`, `--brand-light` on the root. This is also the hook for dark mode — re-declare the tokens under a `[data-theme="dark"]` selector.

---

## 2. Typography

**Family:** `Montserrat, sans-serif` (loaded via `@font-face`, not a page `<link>` — see §11 if rendering inside Shadow DOM). One family throughout. Only two weights: **400 (normal)** and **500 (medium)**. No bold.

**Type scale** — name these so usage is consistent. All sizes in `px` (do not use `rem` for type here; fixed px avoids host-page font-size interference):

| Token | Size | Weight | Usage |
|---|---|---|---|
| `text-eyebrow` | 11px | 500 | Uppercase section eyebrow (`tracking-[0.07em]`), badges, legal/disclosure copy |
| `text-meta` | 12px | 400 | Field hints, inline error messages, retry link |
| `text-body` | 13px | 400/500 | Body paragraphs, field labels (500), select-tile labels, banner text |
| `text-cta` | 15px | 500 | Primary submit button |
| `text-input` | **16px** | 400 | **All text inputs — never smaller** (prevents iOS Safari zoom-on-focus) |
| `text-title-sm` | 17px | 500 | Brand wordmark, success heading |
| `text-title` | 18px | 500 | Step headings (`tracking-[-0.2px]`) |

**Rules**
- **Inputs are always 16px.** This is the single most important type rule — anything smaller triggers a zoom on iOS and feels broken on mobile.
- Headings use slight negative tracking (`-0.2px` to `-0.3px`); the uppercase eyebrow uses positive tracking (`0.07em`).
- Line height: `1.55` for paragraphs, `1.6` for dense legal text, `snug`/`1.5` for compact UI text.
- Body copy max width ~`340–360px` (measure) for readability.

---

## 3. Spacing

Use a 4px-based scale. The source used arbitrary rem values; normalise to these:

| Purpose | Value |
|---|---|
| Label → input | 7px (`0.45rem`) |
| Between fields / sections | 18px (`1.125rem`) |
| Tile grid gaps | 7px (tight grids) / 10px (revenue gate) |
| Card padding | 24px (`px-6`, `pt-6`, `pb-6`) |
| Button padding | 16px x / 12px y (`px-4 py-3`) |
| Submit top margin | 20px (`mt-5`) |
| Page padding | 16px sides, 40px top, 64px bottom |

---

## 4. Layout

- **Container:** `max-width: 600px`, centred (`margin-inline: auto`).
- **Card:** `background: var(--surface)`, `1px solid var(--border)`, `border-radius: var(--radius-lg)`, `overflow: hidden`.
- **Page:** `background: var(--bg)`, `min-height: 100vh`.
- **Responsive grids:**
  - Base: single column.
  - `sm` (640px+): 2-column tile grids; name fields side by side.
  - `md` (768px+): 4-column for short option sets (e.g. time-in-business).
- No horizontal scroll at any width from 320px up. Test at 320 / 375 / 414 / 640 / 768 / 1024 / 1440.

---

## 5. Form Fields (text inputs)

The canonical input:

```
height: 40px
border: 1.5px solid var(--border)
border-radius: var(--radius-sm)   /* 8px */
padding-inline: 12px
font-size: 16px
background: var(--surface)
color: var(--text-primary)
outline: none
transition: border-color 130ms
placeholder: var(--text-tertiary)
```

**States (conditional classes, not overrides):**

| State | Border | Focus |
|---|---|---|
| Default | `var(--border)` | `border → var(--brand)` + focus ring |
| Error | `var(--error-text)` | `border stays error` + **error** focus ring |

> **Critical pattern:** the error border must survive focus. Don't let a generic `focus:border-brand` override the red. Branch the whole class set on `error`:
> ```
> error
>   ? 'border-error-text focus:border-error-text focus-ring-error'
>   : 'border-form-border focus:border-brand focus-ring'
> ```

**Always wire ARIA:**
- `aria-invalid={error ? 'true' : undefined}`
- `aria-describedby` pointing at the error id (`{id}-error`) and/or hint id (`{id}-hint`).

**Money / masked inputs:** prefix symbol absolutely positioned, `pointer-events: none`, `aria-hidden`; pad the input left to clear it. Format on change, store the raw number in state.

---

## 6. Field Anatomy (label / hint / error wrapper)

Every field is wrapped in a consistent structure:

```
<label>  13px medium, var(--text-primary), margin-bottom 7px
         optional marker: " (optional)" normal weight, var(--text-tertiary)
<hint>   12px var(--text-tertiary), below label (id = {id}-hint)
<input>  (spreads aria-describedby = hint id + error id)
<error>  12px var(--error-text), role="alert", margin-top 6px (id = {id}-error)
```

Errors render **inline beneath the field**, never as toasts. They carry `role="alert"` so screen readers announce them.

---

## 7. Select Tiles (single-choice / radio groups)

Used for revenue band, structure, industry, bank, etc. — large tappable cards instead of native radios/selects.

```
min-height: 44px            /* touch target floor — never go smaller */
border: 1.5px solid …
border-radius: var(--radius-sm)
font-size: 13px
padding: 0.65rem 0.85rem
transition: border-color, background, color 130ms
```

| State | Style |
|---|---|
| Unselected | `border var(--border)`, `bg surface`, `text-primary`; **hover** → `border-brand`, `bg-brand-light` |
| Selected | `border-brand`, `bg-brand-light`, `text-brand`, weight 500 |

**Accessibility:**
- Container: `role="radiogroup"` + `aria-label`.
- Each tile: `<button role="radio" aria-checked={selected}>`.
- Leading icon is `aria-hidden`; it shifts to `var(--brand)` when selected, `var(--text-tertiary)` otherwise.

---

## 8. Buttons

### Primary / submit
```
width: 100%; display: flex; justify-content: center; gap: 7px
padding: 12px 16px; border-radius: var(--radius-md); border: none
font-size: 15px; font-weight: 500; color: white
transition: background, transform, opacity 150ms
active: scale(0.99)
```

| State | Style |
|---|---|
| Enabled | `bg var(--brand)`, hover `bg var(--brand-hover)` |
| Inactive (form incomplete) | `bg var(--brand)` at `opacity 0.6`, still clickable (so clicking runs validation + scrolls to the first error) |
| Disabled (submitting) | `bg var(--disabled-bg)`, `color var(--disabled-text)`, `cursor not-allowed`, `aria-busy` |
| Loading | spinner (SVG, `animate-spin`) + "Submitting…" label |

> **"Inactive" vs "disabled" is a deliberate UX choice.** A truly disabled button gives the user no feedback about *why* they can't proceed. The inactive state stays clickable so the click can trigger validation and scroll/focus the offending field. Reserve true `disabled` for the in-flight submit.

### Secondary / back
Text-only, centred, `13px`, `var(--text-tertiary)` → hover `var(--text-muted)`. Always present a focus ring.

### Links (inline, in legal/body copy)
`color: var(--brand)`, **keep the underline**, hover → `var(--brand-hover)`. Underline is mandatory: colour alone fails WCAG 1.4.1 for colour-blind users. External links: `target="_blank"` + `rel="noopener noreferrer"`.

---

## 9. Feedback Components

**Inline error banner (form-level):** `role="alert"`, error-bg, `1px solid var(--error-border)`, alert icon (`aria-hidden`), 13px message, optional underlined "Try again" retry action for retryable errors only. Fades in (`motion-reduce` aware).

**Warning (non-blocking):** amber tokens, info icon in `var(--warning-icon)`, `role="status"`. Used to caution without stopping the user (e.g. "this may complicate review, but you still qualify").

**Success screen:** `role="status" aria-live="polite"`, check icon in a success-bg circle, heading, short paragraph, and a bulleted "what happens next" panel in success tokens.

---

## 10. Focus, Motion & Accessibility (non-negotiable)

**Focus rings** — every interactive element. Use `:focus-visible` (not `:focus`, so mouse clicks don't show rings):
```css
.focus-ring        { outline: 2px solid var(--brand);      outline-offset: 2px; }
.focus-ring-error  { outline: 2px solid var(--error-text); outline-offset: 2px; }
```

**Touch targets:** ≥ 44px on any tappable control.

**Motion:** two subtle animations only — `slide-down` (0.22s ease, opacity + 6px translate, for progressively revealed sections) and `fade-in` (0.2s). **Every** animated element also carries `motion-reduce:animate-none`. Transitions: 130ms for borders, 150ms for button states.

**ARIA roles in play:**
- `role="radiogroup"` + `role="radio"`/`aria-checked` — tile groups.
- `role="alert"` — field + form errors.
- `role="status"` / `aria-live="polite"` — success, warnings, step-change announcements.
- `role="progressbar"` with `aria-valuenow/min/max` — step indicator (informational, not interactive).
- `aria-invalid`, `aria-describedby` — every input ↔ its error/hint.
- `aria-hidden` — all decorative icons.
- `aria-busy` — submit button while loading.
- `sr-only` utility — visually hidden but announced text (live regions).

**Other:**
- Works at 200% browser zoom with no clipping.
- Colour is never the sole signal (icons + text + border accompany every state).
- A live region announces step changes ("Now on Step 2 of 3: …").

---

## 11. Validation UX

- **Validate on blur** (`mode: 'onBlur'` in React Hook Form), not on every keystroke — less nagging.
- **Clear the error as soon as the input becomes valid** (`onChange` → `clearErrors`).
- **On a failed "Continue":** scroll the first invalid field into view (`block: 'center'`, smooth) and focus it with `focus({ preventScroll: true })` so the browser's instant focus-scroll doesn't fight the smooth scroll.
- Errors are inline and specific ("Please enter a valid US phone number"), never generic.
- Schema is the single source of truth (Zod or equivalent); infer types from it rather than hand-writing them.

---

## 12. Multi-Step Patterns

- **Progressive reveal:** within a step, reveal the next question only after the prior one is answered; scroll the new section to centre. Guides attention and shortens the perceived form.
- **Progress indicator:** informational `role="progressbar"`; show "Step N of M". (If you make steps clickable, they must be keyboard-operable; the safer default is non-interactive.)
- **Disqualification gates:** when a choice makes the user ineligible, route immediately to a dedicated, kind "not eligible" screen with a reason and a constructive next step — don't let them complete a form that will be rejected.
- **Bot protection:** off-screen `aria-hidden` honeypot field + a minimum time-to-submit threshold. Both yield a silent success (no backend call) so bots get no signal.
- **Step-change scroll:** after committing the new step, scroll container into view + `window.scrollTo({ top: 0 })`.

---

## 13. Platform note — Shadow DOM / embedded components

If the form renders inside Shadow DOM (e.g. a Webflow Code Component or any web-component host):
- **Fonts must be in the component's own compiled CSS** via `@font-face` — host-page `<link>`/`* { font-family }` rules do not cross the shadow boundary.
- **No `document.getElementById` / `querySelector`** for internal elements — use framework refs.
- **Forcing colours that beat host `!important`:** set the style via JS `el.style.setProperty('color', …, 'important')` (inline `!important` beats stylesheet `!important`).
- `window.scrollTo` and `dataLayer.push` still work (same `window`).

---

## 14. Quick-start checklist for a new form

- [ ] Drop in the token block (§1) on the form root.
- [ ] Load Montserrat (or chosen family) at weights 400/500.
- [ ] Inputs: 40px tall, 1.5px border, 8px radius, **16px** text, error-survives-focus state.
- [ ] Select tiles: ≥44px, `radiogroup`/`radio`, selected = brand-light.
- [ ] Submit button: inactive (opacity) vs disabled (grey + aria-busy) + loading spinner.
- [ ] `:focus-visible` ring on **everything** (brand; error variant on invalid fields).
- [ ] Inline `role="alert"` errors with `aria-describedby` wiring.
- [ ] `motion-reduce:animate-none` on every animation.
- [ ] Validate on blur, clear on valid, scroll+focus first error on submit.
- [ ] Links: brand colour **and** underline.
- [ ] No horizontal scroll 320→1440; usable at 200% zoom.
- [ ] Inputs never below 16px (iOS zoom).
```

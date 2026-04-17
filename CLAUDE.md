# Bizcap Multi-Step Loan Application Form

## Project Overview
A 3-step loan application wizard built with React + TypeScript + Vite + Tailwind CSS.
Submits to an external API directly from the frontend (no backend/API routes).

## Tech Stack
- React + TypeScript (`.tsx` components, `.ts` utilities)
- Vite (not Next.js — no file-based routing or API routes)
- Tailwind CSS for all styling
- External API submission from the frontend

## Code Style
- Always use TypeScript — no plain `.js` files for components or logic
- Use `.tsx` for all React components, `.ts` for utilities and types
- Use named exports for components, not default exports
- Use ES module imports (`import { x } from 'y'`), not CommonJS
- Destructure props explicitly with TypeScript interfaces
- Keep components small and single-responsibility

## Form Architecture
- All multi-step state lives in a single parent component (or context)
- Each step is its own component receiving props — no step manages global state itself
- Step data is accumulated and only submitted on the final step
- Never reset earlier step data when navigating back
- Validate each step before allowing progression to the next

## UI/UX Rules — Multi-Step Forms

### Progress & Navigation
- Always show a progress bar and "Step X of Y" label
- Trust badges (e.g. "Takes ~3 minutes", "No credit check required yet") must appear on every step
- "Back" link (not a button) on steps 2+ — styled as a text link, not a filled button
- "Next" / "Submit" is always a full-width primary button at the bottom
- Never use a "Back" button on Step 1 — there's nowhere to go

### Validation
- Validate on blur (when a field loses focus), not on every keystroke
- Show inline error messages directly below the relevant field
- Error text should be red, small, and specific (e.g. "Please enter a valid email address")
- Block progression to the next step if the current step has errors
- Re-validate all fields on "Next" click before proceeding
- IMPORTANT: Never validate on mount or show errors before the user has touched a field

### Input Fields
- Placeholder text should be the field label (e.g. "First name") — no floating labels unless already established
- Phone fields must include country code selector (Australian default: +61 🇦🇺)
- Currency fields ($) must show dollar sign prefix inside the input
- Search-style fields (Business name, Business address) show a search icon on the left
- Dropdowns (e.g. Industry) use a floating label pattern that moves up on selection
- Checkboxes (e.g. consent) must have a clearly clickable label, not just the box

### Selection Cards (Step 3 — Purpose of funds)
- Icon + label tile layout in a 4-column grid
- Selected state: blue border + light blue background fill
- Hover state: subtle border highlight
- Only one selection allowed at a time (single select)
- Cards must be keyboard-navigable and have focus states

### Accessibility
- All inputs must have associated `<label>` elements (even if visually hidden)
- Use `aria-describedby` to link error messages to their inputs
- Buttons must have descriptive text (not just "Next")
- Maintain logical tab order through the form
- Color alone must never be the only indicator of an error — always include text

### Mobile
- Form card should be full-width on mobile with reduced padding
- Input fields full-width on all screen sizes
- First name / Last name stack vertically on mobile (side-by-side on desktop)
- Touch targets minimum 44px height
- Progress bar and trust badges remain visible on mobile

## Submission
- Show a loading state on the Submit button when the API call is in flight
- Disable the Submit button while loading to prevent double submission
- On success: show a confirmation state (not just an alert)
- On error: show a user-friendly error message above the Submit button
- Never expose raw API errors to the user

## What NOT to Do
- Do not use `any` type in TypeScript
- Do not use inline styles — use Tailwind classes only
- Do not add new dependencies without asking first
- Do not show validation errors before a field has been touched
- Do not reset form state when the user navigates between steps
- Do not use `alert()` for errors or success messages
- Do not submit the form on Enter key press without explicit validation

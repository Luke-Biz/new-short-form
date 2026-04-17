---
name: uiux-forms
description: UI/UX best practices for multi-step forms and financial applications
---

# Multi-Step Form UI/UX Best Practices

## Trust & Anxiety Reduction
- Show time estimate and low-commitment signals on every step ("Takes ~3 minutes", "No credit check required yet")
- Never ask for sensitive information earlier than necessary
- Explain WHY you need sensitive fields (e.g. "We use this to contact you about your application")
- Progress bar must always be visible — users abandon forms when they don't know how long it takes

## Cognitive Load
- Maximum 4-5 fields per step — if a step feels long, split it
- Group related fields together logically
- Lead with the easiest fields first to build momentum
- Use plain language in labels — avoid jargon in a financial context

## Validation & Errors
- Validate on blur, never on keystroke
- Error messages are specific and actionable ("Enter a valid Australian mobile number" not "Invalid input")
- Never show errors before the user has interacted with a field
- On Next/Submit click, scroll to and focus the first error field automatically
- Inline errors appear directly below the field, never in a toast or modal

## Input Design
- Every input has a visible label — placeholders alone are not labels
- Use input masks for phone numbers and currency
- Currency inputs show $ prefix, never suffix
- Dropdowns are a last resort — prefer radio cards or segmented controls for <6 options
- Autofocus the first field of each step on mount

## Selection Cards (e.g. Purpose of funds)
- Always single-select unless explicitly multi-select
- Selected state must be obvious — border + background change, not just a checkmark
- Keyboard navigable with visible focus ring
- Icon + label, never icon alone

## Buttons & CTAs
- Primary CTA is always full-width on the bottom of the form
- Back navigation is a text link, never a secondary button
- Loading state on submit — spinner inside the button, button disabled
- Never two primary buttons on the same step

## Mobile
- Stack side-by-side fields vertically on mobile
- Minimum 44px tap target height for all interactive elements
- Input font size minimum 16px to prevent iOS zoom on focus
- Test on 375px width (iPhone SE) as minimum viewport

## Accessibility
- All inputs have a programmatic label (htmlFor + id, or aria-label)
- Error messages linked with aria-describedby
- Form is fully keyboard navigable in logical tab order
- Never rely on color alone to indicate state
- Focus is moved to the first field of each new step automatically

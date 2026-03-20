# Prezzy Design Notes

Warm sand palette, editorial look. No hard borders, separation comes from surface tones and spacing.

## Colors & Surfaces

Base palette:

| Token | Hex |
| --- | --- |
| surface | #faf9f8 |
| surface-container-low | #f3f4f3 |
| surface-container-lowest | #ffffff |
| on-surface | #2f3333 |
| primary | #4e6073 |
| primary-dim | #425467 |
| on-primary | #f4f8ff |
| secondary-container | #ebe1d7 |
| tertiary-container | #faf3e5 |
| outline-variant | #aeb3b2 |
| error-container | #fe8b70 |

Rules:

- Sections are separated by background shifts (`surface-container-low` on `surface`) or by spacing, not by 1px borders.
- Never place two surfaces with the same token next to each other; step up or down one level.
- Cards: `surface-container-lowest` on a darker surface, radius `xl` (0.75rem), no border.
- Floating elements (navbars, popovers): surface at ~70-80% opacity + `backdrop-blur: 20px`.
- Primary CTAs: 135° gradient from primary to primary-dim.
- Shadows only where layering isn't enough: `0 12px 40px rgba(47,51,51,0.06)` (tinted with on-surface, not black).
- If a border is unavoidable (inputs, a11y): `outline-variant` at 20% opacity. Inputs use a bottom-only border that switches to 1px primary on focus.

## Typography

Manrope for display/headlines, Inter for body/labels.

| Token | Font | Size | Notes |
| --- | --- | --- | --- |
| display-lg | Manrope | 3.5rem | bold, -0.02em tracking |
| headline-md | Manrope | 1.75rem | medium, slide titles |
| body-lg | Inter | 1rem | regular |
| label-md | Inter | 0.75rem | uppercase, +0.05em tracking |

## Misc

- Text is never pure black, use on-surface.
- Hover: raise the surface level or scale 1.02, don't darken the fill.
- Inactive states use `surface-dim`.
- Alerts use error-container instead of saturated red.
- When in doubt, add more whitespace.

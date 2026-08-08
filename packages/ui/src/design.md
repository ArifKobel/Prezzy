# Prezzy Design Notes

Warm sand palette with a deep green accent. Separation comes from surface tones and spacing, not from hard borders.

All values live in `src/styles/globals.css` as CSS custom properties. Change them there, never in components.

## Colors

| Token | Light | Dark |
| --- | --- | --- |
| surface | #f6f2ea | #191512 |
| surface-container-low | #efe9dd | #1e1a15 |
| surface-container | #e9e1d3 | #26211b |
| surface-container-lowest (cards) | #fffdf9 | #221d18 |
| on-surface (text) | #231f1c | #f2ece3 |
| muted-foreground | #5b534b | #b0a698 |
| primary | #22574a | #6fae9b |
| primary-dim (gradient end) | #1a4438 | #588f7f |
| secondary-container | #e4d9c6 | #322b22 |
| tertiary-container | #f7efdd | #3a3225 |
| outline-variant | #a89d8c | — |
| destructive | #a8412a | #e0714f |

Rules:

- Sections are separated by background shifts or spacing, not by 1px borders. Borders are for inputs and other cases where an edge is functionally needed; they use `outline-variant` at 26%.
- Never place two surfaces with the same token next to each other, step up or down one level.
- Cards sit on `surface-container-lowest` over a darker surface, radius `xl`, no border.
- Floating elements use a surface at 70-80% opacity with `backdrop-blur: 20px`.
- Primary actions use a 135° gradient from `primary` to `primary-dim`.
- Shadows come from `--shadow-card` and `--shadow-pop`, tinted with the text color rather than black. Do not write new inline `rgba()` shadows.

## Radii

`--radius` is 0.75rem. The scale derives from it: sm 8px, md 10px, lg 12px, xl 16px, 2xl 20px. Stay on the scale.

## Typography

Manrope for display and headlines, Inter for body and labels.

| Token | Font | Size | Notes |
| --- | --- | --- | --- |
| display-lg | Manrope | 3.5rem | bold, -0.02em tracking |
| headline-md | Manrope | 1.75rem | medium, slide titles |
| body-lg | Inter | 1rem | regular |
| label-md | Inter | 0.8125rem | normal case |

Small labels are set in normal case at 13px. Uppercase micro-labels below 12px are hard to read and are not used for anything a person needs to act on.

## Misc

- Text is never pure black, use `on-surface`.
- Hover raises the surface level or scales by 1.02, it does not darken the fill.
- Inactive states use `surface-dim`.
- Alerts use `destructive` rather than a saturated red.

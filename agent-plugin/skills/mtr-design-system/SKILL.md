---
name: mtr-design-system
description: MTR / MTROBOTIX design system — exact colour, type, spacing, radius, shadow and motion tokens, component styles, logo usage, and the slide and Word layouts. Use with mtr-brand-rules when building or reviewing any MTR page, deck, document, image or UI.
---

# MTR design system

Warm white, navy ink, one red accent, condensed headings, generous but never empty space, motion felt more than seen.

Read `mtr-brand-rules` first (names, copy, facts, logo rules). This skill gives the exact values and layouts. Source of truth: `MTRobotix/MTR-Site` → `src/styles/tokens.css` and `.claude/skills/mtrobotix-web/SKILL.md`. If they disagree with this file, the website wins; tell Tom this file is out of date.

## Files in this skill

| File | Use |
|---|---|
| `tokens.css` | Copy of the website tokens (CSS custom properties + `@font-face`). Web and HTML outputs import these names. |
| `tokens.json` | Same tokens as data, with a usage note on every token. |
| `components.css` | Button, text link, kicker, badge, frame, tick list, facts table and product card classes, built only from tokens. |

Logos: `logos/` in this kit (rules: `reference/logo-kit.md`). Fonts: `fonts/*.woff2` for the web (Barlow 400/500, Barlow Condensed 600, Vietnamese subsets); for Office, install `fonts/office/*.ttf` (Barlow Regular, Barlow Medium, Barlow Condensed SemiBold). Slide and Word templates: `templates/mtr-slide-template.pptx`, `mtr-document-template.docx`.

Live, browsable version (private to Tom): https://claude.ai/artifact/JNCzgDD6LnipGXvpXegPur

## Colour

Light theme only, flat. Colour carries meaning, never decoration. In code use the variable, never the hex.

| Token | Hex | Use |
|---|---|---|
| `--color-bg` | `#faf9f6` | Page and slide ground (warm white) |
| `--color-bg-soft` | `#f2f1ec` | Alternate web sections, image backdrops, table label cells |
| `--color-surface` | `#ffffff` | Cards, frames, panels |
| `--color-text` | `#17181a` | Body text, headings (16.9:1) |
| `--color-text-muted` | `#5b5d63` | Leads, labels, kickers (6.3:1) |
| `--color-text-faint` | `#8b8d92` | Captions only (3.2:1: large or non-essential text) |
| `--color-line` / `--color-line-strong` | `#e6e4dc` / `#c9c5ba` | Hairlines, borders |
| `--color-hover` | `rgba(23,24,26,.05)` | Hover wash |
| `--color-ink` | `#1d2d3d` | Brand navy: primary buttons, logo dots, ROBOTIX, table header rows |
| `--color-on-ink` | `#ffffff` | Text on navy |
| `--color-brand-red` | `#e5463d` | Only the MT, the logo's largest dots, defects in inspection visuals |
| `#ff6259` | — | Logo red on navy only |
| `--color-accent` | `#2f5d8a` | The one accent: links, stat values, ticks, focus ring, document placeholders |
| `--color-accent-soft` | `rgba(47,93,138,.08)` | "Details coming soon" badge |
| `--color-pass` / `--color-fail` | `#2f7d52` / brand red | Inspection visuals only |
| `--color-wip` / `--color-wip-soft` | `#8a5a12` / `rgba(138,90,18,.1)` | "Work in progress" badge only |

## Type

- Headings **Barlow Condensed 600** (`--font-heading`), body **Barlow 400/500** (`--font-body`). Fallback Arial. Never serif, script or display faces. Vietnamese uses the same fonts.
- Office files: the Windows font names are `Barlow Condensed SemiBold`, `Barlow`, `Barlow Medium`. They must be installed on the PC that edits the file; customers get PDF.

| Style | Size (web max) | Line height | Weight | Notes |
|---|---|---|---|---|
| h1 | 4.4rem, `clamp(2.5rem, 4vw + 1rem, 4.4rem)` | 1.05 | 600 | one per page, −0.02em |
| h2 | 2.75rem | 1.05 | 600 | −0.01em |
| h3 | 1.55rem | 1.05 | 600 | cards |
| stat | 3rem | 1.05 | 600 | `--color-accent`, sourced numbers only |
| lead | 1.3rem | 1.5 | 400 | muted |
| body | 1.0625rem | 1.6 | 400 | max 62ch |
| small | 0.9rem | 1.5 | 500 | buttons, nav |
| kicker | 0.78rem | 1.4 | 500 | uppercase, 0.14em tracking, 1–3 words |
| caption | 0.78rem | 1.4 | 400 | faint |

Sentence case, `text-wrap: balance` on headings. The wordmark is always the logo file, never typed.

## Spacing, radius, shadow, motion

- Spacing `--space-1`…`--space-9`: 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4.5, 7 rem. Inside components 2–4; between blocks 5–6; between columns 7; section padding 8 (7 mobile).
- Layout: `--shell` 74rem, `--measure` 62ch, `--hit` 2.75rem, gutter `clamp(1rem, 4vw, 3rem)`. Breakpoints 900px and 720px only.
- Radius: `--radius-sm` 0.5rem, `--radius-md` 0.875rem (inside cards), `--radius-lg` 1.25rem (cards, frames), `--radius-pill` 999px (controls, badges).
- Shadows only for hover and floating: `--shadow-sm` `0 1px 2px rgba(30,32,36,.08)`, `--shadow-md` `0 12px 32px rgba(30,32,36,.08)`.
- Motion: opacity and translate ≤ 12px only, `--ease` `cubic-bezier(0.22,0.8,0.32,1)`, `--dur-fast` 150ms, `--dur` 260ms, `--dur-slow` 520ms, `--stagger` 80ms. `prefers-reduced-motion` turns it off.

## Components (`components.css`)

| Class | Rule |
|---|---|
| `.btn` / `.btn-primary` | Pill, min height `--hit`. Primary navy, one per view; secondary hairline. Verb-first labels. |
| `.text-link` | Accent, weight 500, trailing Lucide arrow (stroke 1.5). |
| `.kicker` | Uppercase label above a title. |
| `.badge` / `.badge-soon` | Status only: Work in progress (robot arm, always) / Details coming soon. |
| `.frame` | White, hairline, `--radius-lg`, around every product image; images 4:3. |
| `.ticks` | 3–4 short benefit lines with accent dots. |
| `.facts` | Label/value spec rows; unknown → leave out or TBD. |
| `.card` | Product card: 4:3 image, title, approved one-liner, Learn more; hover lifts 2px. |

Icons: Lucide, stroke 1.5, 16–22px. No emoji.

## Slides (Halftone)

Template: `templates/mtr-slide-template.pptx` (16:9). Every slide on `--color-bg` with the colour logo.

- The logo's dot grid is the one motif: large field from the top-right on the title slide, bottom-right on the closing slide, medium field bottom-right on section slides beside a big navy numeral ("01"), small field top-right on content slides. Dots navy, only the largest few red.
- Layouts: Title, Section, Content, Title only, Closing. One left-aligned title (30 pt content, 40 pt title/closing, room for two lines) and one message per slide; kicker 10 pt above it; body 14–16 pt; logo mark bottom-left; slide number bottom-right (none on section slides).
- Product images in a white hairline frame, 4:3. Stats in accent. No text, numbers or images on the large dots.

## Word documents

Template: `templates/mtr-document-template.docx`, same layout as the 19 templates in `reference/document-set.md`.

- A4, 2 cm margins, Arial (so files match on client PCs). Body 9.5 pt; title 28 pt bold navy; subtitle 12 pt muted; numbered section headings ("1. Summary") 16 pt bold navy over a `#c9c5ba` hairline.
- Header: `logo-lockup.png` left, "Document type · CODE-YYYY-NNN" right, navy rule under. Footer: "MTROBOTIX · mtrobotix@gmail.com · Ho Chi Minh City · Toronto" and "Page X of Y".
- Info grid: label cells bold on `#f2f1ec`; line-item tables: navy header row, white bold text; borders `#c9c5ba`.
- Placeholders `[in brackets]` in `#2f5d8a`; replace, then set to black. Dates DD/MM/YYYY. Send PDF.

## Layout QA (must pass before delivering)

1. Size every text box for the fallback font too: titles have room for two lines; nothing sits directly under a one-line title.
2. Nothing on the halftone dots or in the logo clear space. Gaps 0.3" or 0.5", margins ≥ 0.5", body ≥ 14 pt on slides.
3. Render every slide/page with Barlow, then again with Arial in its place, and look at each image: no overlap, overflow, cut-off text or split numbers ("100" / "ms").
4. Fix in the generator and re-render until clean.

# MTR design system

Warm white, navy ink, one red accent, condensed headings, generous but never empty space, motion felt more than seen.

This system covers everything made for MTR (MetriQ, SensQ): web pages, documents, slides, emails, outreach images and social posts. Values come from the website (`MTRobotix/MTR-Site` → `src/styles/tokens.css` and the `mtrobotix-web` skill), which is the source of truth. Logo files come from the SOP logo kit (`MTRobotix/MTR-SOP` → `content/business/logo-kit.md`).

## Principles

- **Minimal.** Every element earns its place. If removing it loses nothing, remove it.
- **Straightforward.** One message per section or slide, one primary action per view.
- **Attractive through restraint.** Type, spacing, real product imagery and small precise motion. No gradients, glass, glows, blueprint frames, `+` marks, stock art, clip-art or emoji.

## Names

| Use | Never |
|---|---|
| **MTR** (short) or **MTROBOTIX** (in full) | MTRobotics, MT Robotics, MTRobotix, Mtrobotix |
| **MetriQ** | MTR-Q, BoltEye, Metriq, METRIQ |
| **SensQ** | Sensq, SENSQ, Sens-Q |
| the robot arm, always "in development" / "Work in progress" | any product name |

First mention in a document, email or page: MTROBOTIX; after that MTR. Legal documents use MTROBOTIX in full. Company email: `mtrobotix@gmail.com`.

## Logo

The halftone mark (concept 41): a navy dot grid with the largest dots in red, plus the wordmark **MT** (`color-brand-red`) **ROBOTIX** (`color-ink`). Always use a file from the Logos group. Never redraw, trace, regenerate, recolour or type the wordmark out as a substitute.

| Task | File |
|---|---|
| Website, slides, documents (default) | `logo-lockup.svg` / `logo-lockup.png` |
| Word / Google Docs header | `logo-lockup.png` |
| White ground for forms | `logo-lockup-white-bg.png` |
| Email signature (440×108, shown at 220 px) | `logo-email-signature.png` |
| Dark background (navy slide, video end card) | `logo-lockup-dark-bg.png` |
| Print, stamp, engraving, one colour | `logo-mono-black.svg` |
| Square space, sticker, machine label, watermark | `logo-mark.svg` / `logo-mark.png` |
| White square for uploads | `logo-mark-white-bg.png` |
| App icon, favicon (7×7 dots) | `logo-app-icon.png` / `logo-app-icon-navy.png` |
| Profile photo (1080²) | `logo-social-avatar.png` |
| LinkedIn banner (1584×396) | `logo-linkedin-banner.png` |

- Clear space on every side ≥ the height of the "M" in the wordmark.
- Minimum size: lockup `logo-min-width` (120 px on screen, 30 mm in print); mark alone `mark-min-width` (24 px).
- Never stretch, rotate, add shadows, outlines or effects; never change which dots are red or move the wordmark.
- Never put the colour logo on a busy photo: use the dark-background version on a solid `color-ink` band.

## Colour

Light theme only, flat. Colour carries meaning, never decoration.

- Ground is `color-bg`; alternate sections use `color-bg-soft` (the only coloured section background). Cards and frames are `color-surface` with a `color-line` hairline.
- Text is `color-text`; leads and labels `color-text-muted`; captions `color-text-faint` (3.2:1, large or non-essential text only).
- `color-ink` (navy) is the brand colour: primary buttons, logo dots, dark slides. Text on it is `color-on-ink`.
- `color-brand-red` is reserved for the "MT", the logo's largest dots and defects in inspection visuals. Never for headings, body text, buttons or decoration.
- `color-accent` is the one accent: links, stat values, list ticks, focus ring. Do not add other hues.
- `color-pass` / `color-fail` appear only in inspection visuals; `color-wip` only in the Work in progress badge.
- Text contrast ≥ 4.5:1. In code use the token variables (`var(--color-ink)`), never a hard-coded hex.

## Type

- Headings: **Barlow Condensed 600** (`font-heading`). Body: **Barlow 400/500** (`font-body`). Both ship Vietnamese subsets (`fonts/*-vietnamese.woff2`, loaded on the website with `unicode-range`); use them for VI text too.
- No Barlow available (Word on a client PC, Google Slides without the font)? Fall back to Arial. Never a serif, script or display font.
- Scale: `h1`, `h2`, `h3`, `tagline`, `stat`, `lead`, `body`, `small`, `kicker`, `caption`. No other sizes. Web sizes are fluid `clamp()` values; the table shows the maximum.
- One title per page or slide, sentence case, `text-wrap: balance`. Body lines ≤ `measure` (62ch).
- Small uppercase `kicker` labels (1–3 words) are the only all-caps text besides the wordmark and the name MTROBOTIX.

## Layout and spacing

- Content sits in a `shell` (74rem) with a fluid side gutter (`clamp(1rem, 4vw, 3rem)`).
- Spacing only from `space-1` … `space-9`. Inside a component `space-2`–`space-4`; between blocks `space-5`–`space-6`; between columns `space-7`; section padding `space-8` (`space-7` on mobile). No spacer elements, no padding added "to breathe".
- Sections alternate `color-bg` / `color-bg-soft`, divided by a hairline, never boxed in borders.
- Radius: `radius-pill` for controls, `radius-lg` for cards and frames, `radius-md` inside them. Shadows (`shadow-sm`, `shadow-md`) only for hover and floating elements.
- Web breakpoints: 900px (two columns collapse) and 720px only. No sideways scroll at 320px.
- Icons: Lucide, stroke 1.5, 16–22 px. No emoji.

## Motion

Only opacity and translate (≤ 12px), one curve (`ease`). `dur-fast` for hover, `dur` for UI state, `dur-slow` for entrances; staggered lists step by `stagger`. No scale pops, bounce, spin, parallax, blur or colour flashes. Product animations loop calmly and pause off screen. `prefers-reduced-motion` turns everything off.

## Imagery

- Real product photos, renders and real MetriQ output only. No stock photos, illustrations of people or decorative backgrounds.
- Renders: studio light on a `color-bg-soft` backdrop, product centred, three-quarter view. Images sit in a Frame, 4:3. Web: WebP ≤ 250 KB.
- Every image gets real alt text (EN and VI on the website).
- The MetriQ dashboard screenshot shows sample numbers. Never quote them as results. No customer name, site or photo without written permission.

## Voice and copy

- Say it once, plainly, in the fewest words that are still clear. Lead with the benefit or the action. Engineer-led voice: "we build", or founder voice "I build".
- Banned: simply, just, easily, seamless, cutting-edge, state-of-the-art, innovative, solutions (as filler), leverage, robust, world-class, revolutionary, in order to, we are proud to, please note.
- Buttons: verb first, sentence case ("See MetriQ", "Contact us").
- Customer-facing copy exists in English and Vietnamese; change both together. Vietnamese emails are signed Huỳnh Lê Minh Thông; English as Tom.

Approved one-liners:

| Product | Status | One-liner |
|---|---|---|
| MetriQ | Live | Automated inspection system for live production lines. |
| SensQ | Live | Compact AMR platform for warehouse and SME automation. |
| Robot arm | Work in progress | 6-DOF robotic arm, in development for pick-and-place. |

Approved numbers (only these): MetriQ detects surface defects down to ≤ 2 mm with end-to-end latency under 100 ms. SensQ uses Nav2 + SLAM Toolbox for mapping and localization and docks to its charging station with AprilTags. Unknown → leave it out or write `[TBD]`.

## Documents and slides

### Word documents (synced with the MetriQ document set)

The 19 business templates (`MTR-MetriQ-Document-Set-Editable`: index, sales playbook, requirements form, site visit, proposal, quotation, T&C, NDA, order confirmation, BOM, PO, change order, minutes, FAT/SAT, acceptance, handover, payment request, warranty, service report) and the general `MTR-document-template.docx` share one layout:

- A4, 2 cm margins. **Arial** throughout, so files look the same on client PCs (the approved Barlow fallback). Body 9.5 pt, title 28 pt bold `color-ink`, subtitle 12 pt `color-text-muted`, section headings numbered ("1. Summary") 16 pt bold `color-ink` over a `color-line-strong` hairline.
- Header: `logo-lockup.png` left (≥ 120 px), "Document type · CODE-YYYY-NNN" right in 7.5 pt muted, a `color-ink` rule below.
- Info grid under the title: label cells bold on `color-bg-soft`, values plain, `color-line-strong` hairlines.
- Line-item tables: header row `color-ink` fill with white bold text.
- Placeholders in `color-accent` blue, `[in brackets]`; replace, then set to black.
- Footer: "MTROBOTIX · mtrobotix@gmail.com · Ho Chi Minh City · Toronto" left, "Page X of Y" right, over a hairline.
- Numbering `CODE-YYYY-NNN` (P- proposal, Q- quotation…); dates DD/MM/YYYY. Send PDF. A signed document is never edited: issue a new revision.

Where the current document set differs from this system (fix when each template is next revised): the footer says "MTRobotix" (use MTROBOTIX); placeholders use `#2f6fb0` (use `color-accent` `#2f5d8a`); label cells use `#f2f4f6` and borders `#cbd2d9` (use `color-bg-soft` and `color-line-strong`); section headings carry a red rule (red is reserved for the logo and defects: use the hairline).

### Slides

`MTR-slide-template.pptx`, Halftone direction: the logo's dot grid is the deck's one motif. Every slide sits on the web ground, `color-bg` (`#faf9f6`), with the colour logo. A large dot field fades from the top-right corner of the title slide (bottom-right on the closing slide), a medium field sits bottom-right on section slides beside a big `color-ink` numeral ("01"), and a small field marks the top-right of content slides. Dots are `color-ink` with only the largest few `color-brand-red`, as in the mark. Never put text or images over the large dots. Barlow Condensed SemiBold titles and Barlow body (install both from Google Fonts). One left-aligned title and one message per slide, kicker above the title, logo mark bottom-left, slide number bottom-right. Product images in a white hairline frame, 4:3. Stats in `color-accent`, sourced numbers only.

### Layout QA (slides and documents)

- Text boxes are sized for the worst case: titles have room for two lines, and nothing sits directly under a one-line title. Every box must still fit if Barlow is missing and Office falls back to a wider font (Arial).
- Slide numbers, text and images never sit on the halftone dots or in the logo's clear space; section slides carry no slide number for that reason.
- Gaps 0.3" or 0.5", margins at least 0.5". No text below 14 pt body / 10 pt captions.
- Before sending, render every slide or page with Barlow and again with Arial in its place, and check for overlap, overflow, cut-off text and broken numbers ("100" / "ms").
- Install Barlow and Barlow Condensed (Google Fonts) on any PC that edits the deck; send customers a PDF.

## Components

Button, TextLink, Kicker, Badge, Frame, Ticks, Facts and ProductCard mirror the website's classes in `components/bundle.css` (`.btn`, `.text-link`, `.kicker`, `.badge`, `.frame`, `.ticks`, `.facts`, product cards). The website itself is Astro with no UI framework; the React wrappers here are for prototypes and previews.

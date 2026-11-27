---
name: "mtr-brand-rules"
description: "Brand, logo, design and copy rules for anything made for MTR / MTROBOTIX (MetriQ, SensQ): docs, slides, emails, designs, web pages, social posts. Read before making or reviewing any MTR output."
---

# MTR brand rules

Binding for every agent making anything for MTR: documents, slides, emails, outreach images, designs, web pages, social posts. If a request breaks a rule, say so and offer the in-rules option. Never make a one-off exception silently.

## 0. Source of truth

**The website rules are the source of truth for design and copy:** `github.com/MTRobotix/MTR-Site` → `.claude/skills/mtrobotix-web/SKILL.md` and `src/styles/tokens.css`. Where any other file (including the SOP's `brand-and-copy.md`) disagrees, the website wins.

The SOP repo `github.com/MTRobotix/MTR-SOP` is the source for files and facts:

| Topic | File in MTR-SOP |
|---|---|
| Logo files and logo rules | `content/business/logo-kit.md`, files in `content/business/attachments/logo-*` |
| Product one-liners and approved numbers | `content/marketing/product-messaging.md` |
| Outreach images | `content/business/outreach-images.md` |
| Business templates (quote, proposal, NDA, FAT/SAT…) | `reference/document-set.md` |
| Slide and Word brand templates | `templates/` |
| Design system (tokens, components, slides/doc layout) | `skills/mtr-design-system/SKILL.md` |
| Social post checklist | `content/marketing/social-posts.md` |
| SOP doc format and editing | `.claude/skills/mtr-sop-content/SKILL.md` |

Clone with `git clone --depth 1 https://github.com/MTRobotix/MTR-Site` (or `MTR-SOP`). Read the live file when the task depends on it. If this skill and the website disagree, follow the website and tell Tom this skill is out of date.

## 1. Names

| Use | Never |
|---|---|
| **MTR** (short) or **MTROBOTIX** (in full) | MTRobotics, MT Robotics, MTRobotix, Mtrobotix |
| MetriQ | MTR-Q, BoltEye, Metriq, METRIQ |
| SensQ | Sensq, SENSQ, Sens-Q |
| the robot arm (always "in development" / "work in progress") | any product name — it has none |

- First mention in a document, email or page: **MTROBOTIX**. After that, **MTR** is fine.
- Legal documents (NDA, quotation, terms, contracts): MTROBOTIX in full.
- The wordmark itself is always the logo file (**MT** red + **ROBOTIX** navy) — never typed out as a substitute for the logo.
- Company email: `mtrobotix@gmail.com`.

## 2. Logo

The logo is the **halftone mark** (concept 41, chosen Oct 2026): a dot grid in navy with the largest dots in red, plus the wordmark **MT** (red) **ROBOTIX** (navy).

Always use the files from the SOP logo kit. Never redraw, trace, regenerate or approximate the logo.

| Task | File (`logos/` in this kit; same files in `MTR-SOP/content/business/attachments/`) |
|---|---|
| Website, slides, documents (default) | `logo-lockup.svg`, or `logo-lockup.png` |
| Word / Google Docs header | `logo-lockup.png` |
| Email signature (440×108, shown at 220 px) | `logo-email-signature.png` |
| Dark background (navy slide, video end card) | `logo-lockup-dark-bg.png` |
| Print, stamp, engraving, one colour | `logo-mono-black.svg` |
| Square space, sticker, machine label, watermark | `logo-mark.svg` / `logo-mark.png` |
| White square for forms and uploads | `logo-mark-white-bg.png` |
| App icon, favicon (simpler 7×7 dots) | `logo-app-icon.png` (white) / `logo-app-icon-navy.png` |
| LinkedIn, Facebook, Zalo profile photo (1080²) | `logo-social-avatar.png` |
| LinkedIn page banner (1584×396) | `logo-linkedin-banner.png` |

SVG when the tool accepts it; PNG everywhere else.

Rules:
- Clear space on every side ≥ the height of the "M" in the wordmark.
- Minimum size: lockup 120 px wide on screen / 30 mm in print; mark alone 24 px.
- Never stretch, rotate, recolour (except the one-colour file), add shadows, outlines or effects.
- Never change which dots are red, or move the wordmark relative to the mark.
- Never put the colour logo on a busy photo — use the navy version on a solid band.
- Wordmark type: Barlow Medium 500, letter-spacing 0.28em. Never re-letter it.

## 3. Colour (website tokens)

| Token | Hex | Use |
|---|---|---|
| `--color-bg` | `#faf9f6` | Page ground (warm white) |
| `--color-bg-soft` | `#f2f1ec` | Alternate sections, image backdrops |
| `--color-surface` | `#ffffff` | Cards, frames, panels |
| `--color-text` | `#17181a` | Body text, headings |
| `--color-text-muted` | `#5b5d63` | Leads, labels, secondary text |
| `--color-text-faint` | `#8b8d92` | Captions, step numbers |
| `--color-line` / `--color-line-strong` | `#e6e4dc` / `#c9c5ba` | Hairlines, borders |
| `--color-ink` | `#1d2d3d` | Brand navy: primary buttons, "ROBOTIX", logo dots, dark backgrounds |
| `--color-brand-red` | `#e5463d` | Only the "MT", the logo's largest dots, and defect red in inspection visuals |
| `--color-accent` | `#2f5d8a` | The one accent: links, stat values, list ticks, focus ring |
| `--color-pass` | `#2f7d52` | "Good part" in inspection visuals only |
| `--color-wip` | `#8a5a12` | "Work in progress" badge only |

Rules:
- Light theme. Flat — no glass, no blur, no gradients, no glows, no extra hues.
- Colour carries meaning, never decoration. No coloured section backgrounds beyond `--color-bg-soft`.
- Text contrast ≥ 4.5:1.
- In code, use the token variables — never hard-code a value a token carries.
- (Only when editing the MTR Home app code inside MTR-SOP, that repo's own `tokens.css` applies mechanically. Everything else follows the table above.)

## 4. Type

- Headings: **Barlow Condensed 600**. Body: **Barlow 400/500**. Both have Vietnamese subsets — use them for VI text too. Self-host on the web; no font CDNs.
- If Barlow is unavailable (e.g. Word on a client PC), fall back to Arial / system sans. Never a serif, script or display font.
- One title per page/slide. Sentence-case headings, `text-wrap: balance` on the web.
- Small uppercase labels (kickers, 1–3 words) are the only all-caps text besides the wordmark and the name MTROBOTIX.
- Body line length ≤ 62ch.

## 5. Look and layout

Warm white, navy ink, one red accent, condensed headings, generous but never empty space, motion felt more than seen.

- **Minimal:** every element earns its place. If removing it loses nothing, remove it.
- **Straightforward:** one message per section/slide, one primary action per view.
- **Attractive through restraint:** type, spacing, real product imagery, small precise motion. No decoration, blueprint frames, `+` marks, stock art, clip-art or emoji.
- Pill buttons (primary = navy fill, one per view; secondary = hairline outline). Cards and image frames: white, hairline border, large radius. Shadows only for hover and floating elements.
- Sections alternate warm white / soft, divided by a hairline, never boxed in borders.
- No empty spacer elements or padding added "to breathe". Web breakpoints 900px and 720px only; no sideways scroll at 320px.
- Icons: Lucide, stroke 1.5, 16–22 px.

## 6. Motion (web, video)

- Only opacity and translate (≤ 12px). No scale pops, bounce, spin, parallax, blur or colour flashes.
- Durations: 150ms hover, 260ms UI state, 520ms entrances. Nothing longer except product animations.
- Product animations loop calmly, explain one idea each, pause off screen.
- `prefers-reduced-motion` turns all of it off.

## 7. Imagery

- Real product photos, renders and real MetriQ output only. No stock photos, no illustrations of people, no decorative backgrounds.
- Renders: studio light on a warm-white backdrop matching `#f2f1ec`, product centred, three-quarter view.
- Product images sit in a white frame with a hairline border; 4:3 for cards and heroes. Web: WebP, ≤ 250 KB where possible.
- Every image gets real alt text (EN and VI on the website).
- Outreach images: use the files in `outreach-images.md` — side-by-side raw vs AI for a first message, close-up for Zalo/WhatsApp, full frame for slides.
- **The MetriQ dashboard screenshot shows sample numbers (8,034 products, 97.8% in spec, sizes). Never quote them as results.**
- No customer name, site or photo without the customer's written permission.

## 8. Voice and copy

- Say it once, plainly, in the fewest words that are still clear. Lead with the benefit or the action.
- Engineer-led voice: "we build" or founder voice "I build".
- Banned filler: simply, just, easily, seamless, cutting-edge, state-of-the-art, innovative, solutions (as filler), leverage, robust, world-class, revolutionary, in order to, we are proud to, please note.
- Buttons and CTAs: verb first, sentence case ("See MetriQ", "Contact us").
- Customer-facing copy exists in **English and Vietnamese**; change both together. On the website, copy lives in `src/data/content.ts` / `src/data/i18n.ts`, never hard-coded in a component.
- Vietnamese emails are signed Huỳnh Lê Minh Thông; English as Tom.

Approved one-liners:

| Product | Status | One-liner |
|---|---|---|
| MetriQ | Live | Automated inspection system for live production lines. |
| SensQ | Live | Compact AMR platform for warehouse and SME automation. |
| Robot arm | Work in progress | 6-DOF robotic arm, in development for pick-and-place. |

## 9. Facts and numbers

- Numbers are exact and sourced. The website's facts come from the sources named at the top of `MTR-Site/src/data/content.ts`; the SOP's approved list is `product-messaging.md`. Use only numbers found there — currently:
  - MetriQ: surface defects down to ≤ 2 mm; end-to-end latency under 100 ms
  - SensQ: Nav2 + SLAM Toolbox mapping and localization; AprilTag docking to its charging station
- Never invent headcount, offices, customers, partners, awards, revenue, prices, margins, dates or specs.
- Unknown → leave it out, or write a visible placeholder (`[TBD]`, or `> [!TODO]` in SOP docs) and tell Tom.
- The robot arm is always shown with the "Work in progress" badge / wording.
- No pricing page, demo-request form or Docs page on the website.

## 10. Business documents

- Start from the 19 templates in `reference/document-set.md` (EN + VI). Don't build a new quote, proposal, NDA or FAT/SAT record from scratch.
- Numbering: `CODE-YYYY-NNN` (e.g. `Q-2026-004`); all documents of a project carry its proposal number; file name `NN-CODE-YYYY-NNN-customer.pdf`. A signed document is never edited — issue a new revision.
- Replace every blue `[placeholder]`, then set it to black. Send PDF.
- Apply the name rule (§1) and colours/type (§3–4) to documents too.
- Never put filled or signed customer documents in the SOP repo.

## 11. Where the work happens

- Website (`MTR-Site`): follow its `mtrobotix-web` skill exactly. No Tailwind, CSS-in-JS, UI kits or animation libraries.
- SOP content (`MTR-SOP`): follow `mtr-sop-content`; changes go via PR; run `npm run content:format` and `npm run content:check`.
- Outreach email: from `mtrobotix@gmail.com`; verify every recipient address on its source page right before sending; never guess a name, gender or whether an address is personal — ask Tom.

## 12. Layout QA: no overlap, no overflow

Binding for every slide, document, image and page. A file with overlapping or cut-off text is not finished.

- **Size boxes for the worst case, not the preview.** Every text box must hold its text in the fallback font too (Arial is wider than condensed faces: allow ~25% more width, or one extra line). Titles get room for two lines; anything below a title is placed under the two-line height, never directly under one line.
- **No fixed-height box that text can outgrow.** In PowerPoint, title/body placeholders are tall enough for their longest expected text; never rely on autofit to shrink text below the floors (title 28 pt, body 14 pt, captions 10 pt).
- **Fonts must exist where the file opens.** Use a font installed on the target PC or a system font (Arial). If a brand font is used in Office files, say so and tell Tom it must be installed (or the deck exported to PDF).
- **Keep clear of motifs and furniture.** Text, slide numbers and images never sit on the halftone dots, the logo clear space or each other. Footer items (logo mark, page number) have their own fixed zone.
- **Spacing from the scale only.** Gaps between blocks are 0.3" or 0.5" on slides (`--space-5`/`--space-6` on the web); margins ≥ 0.5". No uneven gaps, no elements closer than 0.3".
- **Verify before delivering, every time:**
  1. Render every page/slide to images at ≥ 100 dpi and look at each one.
  2. Render again with the brand fonts replaced by Arial (or uninstalled) and look again — this is where overlap usually appears.
  3. Check: text overflowing or cut off, lines through words, titles wrapping into the next element, words or numbers broken across lines ("100" / "ms"), page numbers on decoration, uneven gaps, margins < 0.5".
  4. Fix in the generator, re-render the changed pages, repeat until clean. Only then send.

## Review checklist

Name is MTR or MTROBOTIX (never MTRobotics) · MetriQ / SensQ spelled right · logo from the kit, untouched, clear space, min size · website tokens: navy ink, red only for MT/dots/defects, one accent `#2f5d8a`, flat, no gradients or glass · Barlow / Barlow Condensed · minimal, one primary action, no extra spacing · motion = opacity + small translate, reduced motion honoured · real imagery in a frame, no sample numbers quoted as results · no filler words · every number sourced · EN + VI where customer-facing · robot arm marked work in progress · rendered and checked with brand fonts AND Arial fallback: no overlap, overflow or cut-off text.
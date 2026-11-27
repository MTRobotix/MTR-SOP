---
name: mtrobotix-web
description: Design rules for the MTRobotix website (MTR-Site) — theme colours, type, minimalist style, layout and spacing, motion, imagery and copy. Read before adding or changing any page, component, style, animation, image or text on the site, and follow it for every change.
---

# MTRobotix website — design rules

Binding for everyone who changes this site: people, agents, scripts. If a request conflicts with a
rule, say so and offer the in-system option. Extend the system by adding a rule here, never by a
one-off exception in a component.

**The look in one line:** warm white, navy ink, one red accent, condensed headings, generous but
never empty space, motion that is felt more than seen.

## 1. Principles

1. **Minimal.** Every element earns its place. If removing it loses nothing, remove it.
2. **Straightforward.** One message per section, one primary action per view.
3. **Attractive through restraint.** Quality comes from type, spacing, real product imagery and
   small precise motion — not from decoration, gradients, glows or effects.
4. **Fast.** Static pages, self-hosted fonts, one small site script (`src/scripts/site.ts`) plus
   the product animations and the home hero field, each its own small module. No UI frameworks,
   no animation libraries, no web-font CDNs.
   The only third-party-style script is Vercel Web Analytics (`/_vercel/insights/script.js`,
   same origin, cookieless, production only, in `Base.astro`). `?analytics=off` on any page stops
   counting that browser (our own visits); `?analytics=on` undoes it. No other trackers.

## 2. Theme colours

Defined only in `src/styles/tokens.css`. Never hard-code a hex, rgba, font, spacing or duration
that a token carries. New token → add it there with a one-line comment saying why.

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#faf9f6` | Page ground (warm white) |
| `--color-bg-soft` | `#f2f1ec` | Alternate sections (`.section-soft`), media backdrops |
| `--color-surface` | `#ffffff` | Cards, frames, panels |
| `--color-text` | `#17181a` | Body text, headings |
| `--color-text-muted` | `#5b5d63` | Leads, labels, secondary text |
| `--color-text-faint` | `#8b8d92` | Captions, step numbers |
| `--color-line` / `--color-line-strong` | `#e6e4dc` / `#c9c5ba` | Hairlines, borders |
| `--color-ink` | `#1d2d3d` | Brand navy: primary buttons, wordmark "ROBOTIX", logo dots, active underline |
| `--color-brand-red` | `#e5463d` | Only the "MT" of the wordmark, the logo's largest dots, and defect red in diagrams |
| `--color-accent` | `#2f5d8a` | Links, stat values, list ticks, focus ring |
| `--color-pass` | `#2f7d52` | "Good part" in inspection diagrams only |
| `--color-wip` | `#8a5a12` | "Work in progress" badge only |

- Light theme only (`color-scheme: light`).
- Colour carries meaning, never decoration. No gradients on UI, no coloured section backgrounds
  beyond `--color-bg-soft`.
- Text contrast ≥ 4.5:1 against its background.

## 3. Type

- Headings: **Barlow Condensed 600** (`--font-heading`). Body: **Barlow 400/500** (`--font-body`).
  Self-hosted in `public/fonts/`, Vietnamese subsets included.
- Scale: `--text-xs … --text-h1`, `--text-lead`, `--text-stat`. No other sizes.
- One `<h1>` per page. Headings in sentence case, `text-wrap: balance`.
- Body text max width `--measure` (62ch).
- Small uppercase labels (`.kicker`) are the only all-caps text, besides the wordmark.
- Wordmark: `MT` red + `ROBOTIX` navy, letter-spaced 0.28em (`Wordmark.astro`). In the header it
  folds to the mark + `MTR` once the page scrolls. Never restyle, recolour or re-letter it.
- Logo: the halftone mark (concept 41). Source of truth is the SOP logo kit
  (`MTR-SOP/content/business/logo-kit.md`). Header: coarse 7×7 mark (`Mark.astro`), only in the
  scrolled header. Footer: the primary lockup `public/logo-lockup.svg`, copied from the kit, at
  least 120px wide. Favicons and `public/logo.png`: the white app icon (`public/favicon.svg`, PNGs
  rendered from it). Never redraw, recolour or rearrange it; update from the kit.

## 4. Layout and spacing

- Content sits in `.shell` (max `--shell` 74rem, side gutter `--space-page-gutter`).
- Spacing only from `--space-1 … --space-9`. Pick the smallest step that separates the things:
  - inside a component: `--space-2` to `--space-4`
  - between blocks in a section: `--space-5` to `--space-6`
  - between columns: `--space-7`
  - section padding: `.section` (`--space-8`, `--space-7` on mobile). Never stack extra margins on
    top of it.
- No unnecessary spacing: no empty spacer elements, no `<br>` for layout, no padding added to
  "make it breathe" when the section already has rhythm. Use `gap` on flex/grid, not margins on
  children.
- Two columns (`.two-col`, hero grids) collapse to one at **900px**. Other breakpoint: **720px**.
  Nothing else.
- No horizontal scroll at 320px.
- Sections alternate `bg` / `bg-soft` and are divided by a hairline; never boxed in borders.

## 5. Components (reuse, do not reinvent)

| Component | Rule |
|---|---|
| Button | Pill (`.btn`). Primary = navy fill (`.btn-primary`), one per view. Secondary = hairline outline. Min height `--hit`. |
| Text link | `.text-link`, accent colour, arrow icon after. |
| Frame | `.frame`: white surface, hairline, `--radius-lg`, around every product image or diagram. |
| Card | Product cards (`ProductCards.astro`): image 4:3 on top, title, one line, "Learn more". Hover: lift 2px + shadow. |
| Kicker | `.kicker` above a section title. Short, 1–3 words. |
| Ticks | `.ticks` for benefit lists: 3–4 items, each one short line. |
| Badge | `.badge` / `.badge-soon` for status only ("Work in progress", "Details coming soon"). |
| Facts | `.facts` label/value rows for specs. Unknown value → leave it out or "TBD", never a guess. |
| Back to top | `BackToTop.astro`: round white button bottom-right after the first screen, ring shows scroll progress. |
| Icons | `@lucide/astro`, `stroke-width={1.5}`, 16–22px. No emoji. |

Radius: pills for controls, `--radius-lg` for cards/frames/panels, `--radius-md` inside them.
Shadows only for hover and floating elements (`--shadow-sm`, `--shadow-md`).

## 6. Motion — simple, short, purposeful

- Only **opacity** and **translate** (≤ 12px). No scale pops, bounce, spin, parallax, blur or
  colour flashes.
- One curve: `--ease`. Durations: `--dur-fast` 150ms (hover), `--dur` 260ms (UI state),
  `--dur-slow` 520ms (entrances, reveals). Nothing longer, except product animations.
- Patterns in use — use these, do not add new kinds:
  - **Page entrance:** hero copy and image rise in once, in reading order (`rise` keyframes).
    The home hero copy instead wipes in left to right (clip + ≤ 12px slide, `hero-wipe` in
    `Home.astro`), still once per load.
  - **Home hero field:** `src/scripts/hero-pool.ts` (from the Portfolio site). Hidden dots the
    cursor pushes aside, lit in `--color-accent`, crosshair cursor, normal cursor over controls.
    Home hero only, desktop only (wider than 900px, mouse); stops when at rest; off under reduced
    motion.
  - **Reveal on scroll:** `data-reveal`; list items set `--d` (0, 1, 2…) to stagger by `--stagger`.
  - **Page switch:** cross-document view transition, short cross-fade; the header stays put.
  - **Header:** border appears after scrolling; wordmark folds to the mark + `MTR` and back.
  - **Hover:** colour/border change, cards lift 2px.
- Product animations (MetriQ line, AMR) loop calmly, explain one idea each, pause when off screen,
  and show a still frame under reduced motion.
- `prefers-reduced-motion: reduce` turns all of it off. Every new motion must respect it.

## 7. Imagery

- Real product photos and renders only, in a `.frame`. No stock photos, no illustrations of
  people, no decorative backgrounds.
- Renders: studio light on a warm-white backdrop that matches `--color-bg-soft`, product centred,
  three-quarter view. Keep the script that made a render in `scripts/renders/` (never in `public/`).
- Card and product-hero images are 4:3. Export WebP, ≤ 250 KB where possible, with `width` and
  `height` set. Hero image `fetchpriority="high"`, everything else `loading="lazy"`.
- Every image has real alt text in both languages.

## 8. Copy — no filler

- Say it once, plainly, in the fewest words that are still clear. Lead with the benefit or the
  action.
- No buffer words: "simply", "just", "easily", "seamless", "cutting-edge", "state-of-the-art",
  "innovative", "solutions" (as filler), "leverage", "robust", "world-class", "in order to",
  "we are proud to".
- Numbers are exact and sourced: `<1mm`, `0 downtime`, `0.4s per part`. Never invent a number,
  customer, price or claim. Facts come from the sources named at the top of `src/data/content.ts`;
  unknown → leave it out.
- Every string exists in **English and Vietnamese**, in `src/data/content.ts` or `src/data/i18n.ts`.
  Never hard-code copy in a component.
- Buttons: verb first ("See MetriQ", "Contact us"). Sentence case.

## 9. Accessibility (must pass)

- Visible focus ring (`--color-accent`, 2px). Hit targets ≥ `--hit` (44px).
- Landmarks: `<header>`, `<nav>`, `<main>`, `<footer>`. Icon-only buttons have `aria-label`.
- Canvas/SVG animations: `role="img"` with an `aria-label` describing what they show.

## Review checklist

Tokens only · one primary button · Barlow / Barlow Condensed only · no extra spacing, gaps from the
scale · 900/720 breakpoints only · 320px no sideways scroll · motion = opacity + small translate,
reduced motion honoured · real imagery in a frame, 4:3, WebP · copy has no filler, EN + VI, every
fact sourced.

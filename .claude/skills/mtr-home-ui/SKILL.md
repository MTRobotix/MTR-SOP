---
name: mtr-home-ui
description: UI, UX, layout, theme, motion and copy rules for the MTR Home app (MTR-HOME) — SOP, Hours and Projects. Read before writing or reviewing any page, component, style or UI copy in MTR-HOME, and follow it for every change.
---

# MTR Home — UI/UX rules

Binding for every agent and contributor working in `MTR-HOME/`. If a request conflicts with a rule,
say so and propose the in-system alternative. Extend by adding a rule here, never by making a
one-off exception in a component.

Theme source: the Portfolio site (`/home/tom/Portfolio/src/index.css`) — ivory paper, grey glass,
navy dark mode. The token file is `MTR-HOME/src/styles/tokens.css`. That file is the only place
values are defined.

## 1. Purpose drives every decision

MTR Home is a tool, not a showcase. A person arrives with a job and must finish it in the fewest
steps. Three areas: SOP (`/sop`, docs at `/d/…`), Hours (`/hours`), Projects (`/projects`).

- Every screen answers one question:
  - Home `/`: "where do I go, and what is mine?" — one card per area, then "Your open tasks".
  - SOP: "where is it?" (SOP page, department) or "how do I do it?" (doc).
  - Hours: "what did I work on this week?" Team hours (admin): "who worked on what, when?"
  - Projects: "what is running, who works on it, what is next?"
- Maximum two clicks from the SOP page to any section: department card → featured link, or
  search → result. The header search reaches any section from every page.
- No hero images, no marketing blocks, no decorative illustrations, no carousels.

## 2. Tokens are the only source of values

- Use `var(--color-*)`, `var(--space-*)`, `var(--radius-*)`, `var(--shadow-*)`, `var(--glass-*)`,
  `var(--font-*)`, `var(--ease)`, `var(--dur-*)` from `src/styles/tokens.css`.
- Never hard-code a hex, rgba, font stack, px spacing or duration that a token carries.
- New token: add it to both the light and dark blocks, with a one-line comment saying why.

## 3. Look

- Ground: `--color-bg` (ivory). Text: `--color-text`. One accent (`--color-accent`) for links,
  focus rings, active tab, AI bubble border, the normal budget meter and the Active status tag.
- Status colours, and only for state: `--color-warning` (hour budget ≥ 90% used) and
  `--color-danger` (overdue, over budget, invalid input). Always with a Lucide icon and a word
  ("Overdue", "Over by 12 h"), never colour alone: the two look alike to colour-blind readers.
  Nothing else is coloured.
- Glass only on floating surfaces: header island (`.glass`) and AI answer bubble (`.glass-panel`,
  more opaque for text contrast). Content cards are solid `--color-surface`.
- Never glass over dense text or code (e.g. the editor toolbar, the search suggestion list): the
  content shows through and hurts legibility. Use a solid surface there.
- Corners: pills (`--radius-pill`) for buttons, inputs, search bar, tags, nav. Cards and panels
  `--radius-lg`. Code blocks `--radius-md`. No square corners on interactive elements.
- Borders are hairline `1px solid var(--color-line)`. Shadows only on floating surfaces.
- Dark mode: `:root[data-theme="dark"]` navy palette. Every component must be checked in both.

## 4. Typography

- System font stack via `--font-body`; monospace via `--font-mono`. No web-font downloads.
- Scale: `--text-xs … --text-2xl`. One `<h1>` per page (the doc title). Doc bodies start at `##`.
- Body text max width 70ch (`--measure`). Code blocks may be wider and scroll horizontally.
- Headings sentence case. No ALL CAPS except the brand wordmark and small labels.

## 5. Layout

- `.shell` container (`--shell` max width), `--space-page-gutter` side padding, `gap` for spacing.
- Breakpoints: 900px (grids collapse to one column), 720px (mobile header). Nothing else.
- No horizontal page scroll at 320px width.
- Doc page: left = content, right = sticky "On this page" list of `##` headings (hidden < 900px).

## 6. Components

| Component | Rule |
|---|---|
| Button | Pill. Primary = accent fill, one per view. Secondary = hairline outline. Icon-only buttons need `aria-label`. |
| Search bar | Pill, full width of shell (max 44rem), Lucide `Search` icon left. |
| Header search | Search icon button in the header on every page; `/` and Ctrl/Cmd+K open it (not while typing in a field). On home it focuses the page search bar; elsewhere it opens a native `<dialog>` with the same search bar over a `--color-scrim` backdrop. Esc: first closes suggestions, then the dialog. |
| Suggestion popup | Solid surface, `--radius-lg`, opens under the search bar while typing, max 6 rows, arrow keys + Enter navigate, Esc closes. |
| AI answer bubble | Rounded (`--radius-xl`) `.glass-panel` card with accent hairline border, label "AI answer", streamed text, numbered citations linking to sections, footer "Generated from the SOP. Check the linked section before acting." Never styled as authoritative content. |
| Department card | Solid surface, title, one-line summary, up to 5 featured section links (jump straight to the section), "All sections →" link. |
| Editor toolbar | Solid surface pill, sticky under the header. Icon buttons with `aria-label`. |
| Tag | Small pill, `--color-bg-soft` fill, muted text. |
| TODO marker | `> [!TODO]` renders as a dashed-border callout — shows unwritten content honestly. |
| Area card (home) | Solid surface, Lucide icon + area name, one-line purpose, the one number that matters (hours this week, ongoing projects), one link or button. The home view's one primary button is "Log hours". |
| Stat tile | Solid surface, label in muted text, value `--text-xl` semibold. A row holds up to 4; 2 per row below 900px. No sparkline unless there is a trend to show. |
| Budget meter | Track `--color-accent-soft`, fill `--color-accent`; warn/danger fills sit on their own `*-soft` track. Text under it always shows "37 of 120 h" plus the state word. `role="meter"` with `aria-valuetext`. No budget → hours only, no bar. |
| Status tag | The Tag pill with the status word. Only Active uses the accent tint. |
| Filter pills | Links, one per filter, with a faint count; the current one has `aria-current="page"`. |
| Timesheet grid | Days are columns, projects are rows; project column sticky on the left; the grid scrolls sideways inside its card, never the page. Cells are pill inputs that accept `1.5`, `1,5` and `1:30`. Today's column on `--color-bg-soft`. Invalid cells and days over 24 h are marked and block Save. Unsaved changes warn before leaving. |
| Task board | Four columns on `--color-bg-soft` (To do, In progress, Review, Done), one column below 900px. Cards are solid surface: title link, assignee, due date, and a status select for whoever may move it. No drag and drop: the select is keyboard- and touch-friendly. |
| Numbers in tables | Right-aligned, `tabular-nums` (`.num`). |
| Icons | `lucide-react`, `strokeWidth={1.5}`, 16–20px. No emoji. |

## 7. Motion

- One curve: `--ease` = `cubic-bezier(.22,.8,.32,1)`. Durations `--dur-fast` (120ms), `--dur` (200ms).
- Only opacity and small translateY (≤ 6px). No bounce, scale pops, spinners longer than needed.
- `@media (prefers-reduced-motion: reduce)` disables all transitions and animations.

## 8. Accessibility (must pass)

- Visible focus ring: `outline: 2px solid var(--color-accent); outline-offset: 2px`.
- Contrast ≥ 4.5:1 for text in both themes, including text on glass.
- Semantic landmarks: `<header>`, `<nav>`, `<main>`, `<footer>`. Forms have `<label>`s.
- Popup: `role="listbox"`, options `role="option"`, `aria-activedescendant` on the input.
- Streaming AI text container: `aria-live="polite"`.
- Hit targets ≥ 40px tall.

## 9. UI copy (applies to labels, buttons, messages, empty states)

Plain, short, exact. The reader may be new, non-native, or in a hurry.

- Imperative verbs on actions: "Save", "Open", "Approve", "Sign in". Not "Click here to…".
- No filler: remove "simply", "just", "easily", "please note", "in order to", "basically".
- Errors say what happened and what to do: "Wrong email or password." / "Someone changed this
  section. Reload to see their version."
- Empty states say what is missing and the next action: "No sections yet. Create one."
- Numbers and units always explicit: "115200 baud", "/dev/ttyACM0", "~1–2 min".
- Never invent facts about MTR, its people, customers, prices or products (see
  `/home/tom/MTR/AGENTS.md`). Unknown → a TODO marker, not a guess.

## 10. Stack limits

- Next.js App Router + TypeScript + plain CSS files (global tokens + per-component CSS modules).
- Forbidden: Tailwind, CSS-in-JS, UI kits (MUI, Chakra, shadcn, Bootstrap), animation libraries.
- Allowed exceptions (editor only): Tiptap, CodeMirror 6, markdownlint. Record any new exception
  here with its reason before adding it.
- Allowed exceptions (server-side attachment previews, `src/lib/content/embeds.ts`): mammoth
  (Word → HTML), read-excel-file (Excel → rows), rehype-parse (re-sanitize the Word HTML). No
  client JavaScript; previews render as plain HTML styled by `.prose .embed*` tokens.

## Review checklist

Tokens only · light + dark checked · glass only on floating surfaces · pill controls · one accent ·
status colour only with icon + word · Lucide 1.5 · one `<h1>` · focus ring visible · reduced motion
honoured · copy has no filler · no invented facts · 320px no sideways scroll · content edits follow
`mtr-sop-content`.

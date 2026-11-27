# MTR agent kit

Everything an AI agent needs to make on-brand work for MTR / MTROBOTIX (MetriQ, SensQ): slides, documents, web pages, images, emails and social posts.

## Agents: read in this order

1. `skills/mtr-brand-rules/SKILL.md`: names, logo, colour, type, layout, motion, imagery, copy, approved facts, business documents, layout QA. Binding.
2. `skills/mtr-design-system/SKILL.md`: exact tokens, components, slide (Halftone) and Word layouts, layout QA.
3. For web or HTML work also load `skills/mtr-design-system/tokens.css` and `components.css`. Never hard-code a value a token carries.
4. Use the files below; never redraw a logo or invent a number.
5. Before delivering anything, run the layout QA in both skills: render every page or slide with Barlow and again with Arial in its place, and fix any overlap, overflow or cut-off text.

## What is in the kit

| Folder | Contents |
|---|---|
| `skills/` | The two skills (`SKILL.md` each) plus `tokens.css`, `tokens.json`, `components.css`. |
| `templates/` | `mtr-slide-template.pptx` (Halftone, 16:9) and `mtr-document-template.docx` (A4, matches the business document set), each with a PDF preview. Start every deck and general document from these. |
| `logos/` | All 13 logo files from the logo kit (lockup, mark, dark background, one colour, app icon, email signature, social). Which file when: `reference/logo-kit.md`. |
| `fonts/` | Barlow 400/500 and Barlow Condensed 600 web fonts (`.woff2`, Latin + Vietnamese). `fonts/office/` has the desktop files Word and PowerPoint need (Barlow Regular, Barlow Medium, Barlow Condensed SemiBold, `.ttf`); install them on every PC that edits MTR files. Licence: `fonts/OFL.txt`. |
| `reference/` | `design-system-brand-book.md` (the full design system), `website-design-rules.md` (MTR-Site rules, the source of truth), `logo-kit.md`, `product-messaging.md` (approved one-liners and numbers), `document-set.md` (the 19 business templates), `install-skills.md`. |

## Install as a plugin

In Claude Code: `/plugin marketplace add MTRobotix/MTR-SOP`, then `/plugin install mtr-brand@mtr-sop`. Full steps: `reference/install-skills.md`.

## Source of truth

Design: `MTRobotix/MTR-Site` → `src/styles/tokens.css` and `.claude/skills/mtrobotix-web/SKILL.md`. Files and facts: `MTRobotix/MTR-SOP`. If this kit disagrees with them, they win; update the kit.

Live design system (private to Tom): https://claude.ai/artifact/JNCzgDD6LnipGXvpXegPur

Kit version 1.0.1 · 2026-11-27 (desktop fonts and plugin manifest added)

---
title: Work on the MTR website
summary: Run, check and build the Astro site; where copy, tokens and rules live.
tags: [website, astro]
owner: Thong Huynh
featured: true
order: 40
updated: 2026-09-27
---

## Goal

Change the public MTR website (`~/MTR/site`) without breaking its design rules.

## Read first

1. `~/MTR/AGENTS.md` — binding rules: white/glass identity, tokens only, no frameworks, routes, copy rules.
2. `~/MTR/site/src/styles/tokens.css` — every colour, font, space, radius and shadow.

> [!WARNING]
> `~/MTR/.agents/skills/mtrobotics-web/SKILL.md` and `~/MTR/design_handoff_mtrobotics_site/` describe the retired blueprint design. Do not build from them. `AGENTS.md` wins.

## Run

```bash
cd ~/MTR/site
npm install
npm run dev
```

Node.js 22.12 or newer (`package.json` `engines`).

## Check and build

```bash
npm run astro -- check
npm run build
```

Expected: no errors; output in `dist/`. Deploys to Vercel as a static site (`output: 'static'`).

## Where things live

| Change                                  | File                                        |
| --------------------------------------- | ------------------------------------------- |
| Home, about, contact copy (EN + VI)     | `src/data/site.ts`                          |
| Product pages (MTR-Q, SensQ, robot arm) | `src/data/products.ts`                      |
| Nav labels (EN + VI)                    | `src/data/i18n.ts`                          |
| Page routes                             | `src/pages/*.astro`, `src/pages/vi/*.astro` |
| Mobile nav, scroll reveal, header glass | `src/scripts/site.ts`                       |
| Colours, spacing, fonts                 | `src/styles/tokens.css`                     |

## Rules that fail review

- Hard-coded hex, font stack or px value that a token carries.
- Tailwind, CSS-in-JS, UI kits, animation libraries.
- Robot arm shown without the "Demo · Work in progress" badge.
- Invented stats, clients, team members or offices.
- A pricing page, demo-request form or Docs page.

> [!NOTE]
> `~/MTR/site/README.md` still describes a Resend demo-request form. `AGENTS.md` (2026-09-15) says there is no form and no backend. Follow `AGENTS.md`.

Source: `~/MTR/AGENTS.md`, `~/MTR/site/package.json`, `~/MTR/site/astro.config.mjs`, `~/MTR/site/README.md`

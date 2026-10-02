# MTR Home — agent rules

MTR Home is the staff app: SOP, hours tracking and project management, behind one login.

Before changing anything here, read both skills and follow them:

- `.claude/skills/mtr-home-ui/SKILL.md` — UI, UX, theme, motion, copy, for every area.
- `.claude/skills/mtr-sop-content/SKILL.md` — SOP source of truth, file format, editing rules.

(`/home/tom/MTR/.agents/skills/` links here, so agents working anywhere in `~/MTR` find them.)

Hard rules:

- `content/**/*.md` on `main` is the only source of truth for the SOP. The database holds users, projects, tasks and hours — never SOP content.
- Schema lives in `src/lib/db.ts` and runs on every cold start, so every statement must be idempotent (`IF NOT EXISTS`). Never drop or rename a column there; add new ones.
- Run `npm run content:format` and `npm run content:check` after any content change.
- `npm run check` must pass before commit.
- Never invent facts about MTR, its people, customers, prices or products. Unknown → `> [!TODO]`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

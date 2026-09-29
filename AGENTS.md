# MTR SOP — agent rules

Before changing anything here, read both skills and follow them:

- `.claude/skills/mtr-sop-ui/SKILL.md` — UI, UX, theme, motion, copy.
- `.claude/skills/mtr-sop-content/SKILL.md` — source of truth, file format, editing rules.

(`/home/tom/MTR/.agents/skills/` links here, so agents working anywhere in `~/MTR` find them.)

Hard rules:

- `content/**/*.md` on `main` is the only source of truth. The database holds users only.
- Run `npm run content:format` and `npm run content:check` after any content change.
- `npm run check` must pass before commit.
- Never invent facts about MTR, its people, customers, prices or products. Unknown → `> [!TODO]`.

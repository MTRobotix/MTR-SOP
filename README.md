# MTR SOP

Internal standard operating procedures for MTR. Login required. Search with an AI answer, one card per department, in-app editing with review.

## How it works

| Part | Where |
| - | - |
| Content (source of truth) | `content/<dept>/<slug>.md` on `main` |
| Users and roles | Postgres (Neon) in production, PGlite in `.data/` locally |
| Saves | Admin → commit to `main`. Editor → pull request, approved in `/admin/reviews` |
| AI answer | Claude Haiku 4.5 over the top search hits (`src/lib/ai/`) |
| Rules | `.claude/skills/mtr-sop-content`, `.claude/skills/mtr-sop-ui` |

## Run locally

```bash
npm install
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='min4' npm run db:setup
npm run dev
```

Open `http://localhost:3000` and sign in. Locally, admin saves write `content/` directly and editor saves go to `.drafts/`. Commit content changes with git.

Stop `npm run dev` before `npm run db:setup`: PGlite allows one process at a time.

Optional: `ANTHROPIC_API_KEY=...` in `.env.local` turns on the AI answer. Without it the bubble is hidden.

## Commands

| Command | Does |
| - | - |
| `npm run content:format` | Rewrite all content into canonical Markdown |
| `npm run content:check` | Validate frontmatter, lint, allowed HTML, links, format |
| `npm run check` | content:check + typecheck + lint (CI runs this) |
| `npm run db:setup` | Create tables and the first admin |

## Deploy (Vercel)

1. Push this repo to a private GitHub repo.
2. Create a Neon Postgres database; copy the pooled connection string.
3. Create a fine-grained GitHub token for this repo only: Contents read/write, Pull requests read/write.
4. Import the repo in Vercel and set env vars (see `.env.example`): `AUTH_SECRET`, `DATABASE_URL`, `ANTHROPIC_API_KEY`, `GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_BRANCH`.
5. Run `DATABASE_URL=... ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run db:setup` once from your machine.
6. Protect `main` on GitHub: require the `check` workflow to pass.

Saved edits go live after Vercel redeploys from the new commit (~1–2 min).
# MTR-SOP

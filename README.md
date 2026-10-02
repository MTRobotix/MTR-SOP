# MTR Home

The MTR staff app, behind one login:

- **SOP** (`/sop`) — standard operating procedures. Search with an AI answer, one card per department, in-app editing with review.
- **Hours** (`/hours`) — a weekly timesheet. Each person logs hours per project per day, or under a typed name when the work is not a project yet.
- **Projects** (`/projects`) — a dashboard of ongoing projects with status, lead, contributors, dates, hours against budget, and a task board per project.

## How it works

| Part | Where |
| - | - |
| SOP content (source of truth) | `content/<dept>/<slug>.md` on `main` |
| Users, projects, tasks, hours | Postgres (Neon) in production, PGlite in `.data/` locally. Schema: `src/lib/db.ts` |
| SOP saves | Admin → commit to `main`. Editor → pull request, approved in `/admin/reviews` |
| AI answer | Claude Haiku 4.5 over the top search hits (`src/lib/ai/`) |
| Rules | `.claude/skills/mtr-home-ui`, `.claude/skills/mtr-sop-content` |

## Who can do what

| | Viewer | Editor | Project lead | Admin |
| - | - | - | - | - |
| Read the SOP | yes | yes | yes | yes |
| Edit the SOP | no | via review | by role | publishes |
| Log own hours | yes | yes | yes | yes |
| See everyone's hours, CSV export | no | no | no | yes |
| Create projects, set lead and budget | no | no | no | yes |
| Change project status and dates, manage contributors, assign tasks | no | no | own projects | yes |
| Move a task on the board | own tasks | own tasks | own projects | yes |

"Project lead" is not a role: an admin picks a lead per project, and any user can be one.

Typed names on timesheets show up under **Team hours** (admin). Turn one into a project there: its hours move to the project and the people who logged it become contributors.

## Run locally

```bash
npm install
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='min4' npm run db:setup
npm run dev
```

Open `http://localhost:3000` and sign in. Locally, admin SOP saves write `content/` directly and editor saves go to `.drafts/`. Commit content changes with git.

Stop `npm run dev` before `npm run db:setup`: PGlite allows one process at a time.

Optional in `.env.local`:

- `ANTHROPIC_API_KEY=...` turns on the AI answer. Without it the bubble is hidden.
- `APP_TIME_ZONE=Asia/Ho_Chi_Minh` (any IANA name) decides which day is "today" for the timesheet and overdue dates. Default: UTC.

## Commands

| Command | Does |
| - | - |
| `npm run content:format` | Rewrite all SOP content into canonical Markdown |
| `npm run content:check` | Validate frontmatter, lint, allowed HTML, links, format |
| `npm run check` | content:check + typecheck + lint (CI runs this) |
| `npm run db:setup` | Create tables and the first admin |

## Deploy (Vercel)

1. Push this repo to a private GitHub repo.
2. Create a Neon Postgres database; copy the pooled connection string.
3. Create a fine-grained GitHub token for this repo only: Contents read/write, Pull requests read/write.
4. Import the repo in Vercel and set env vars (see `.env.example`): `AUTH_SECRET`, `DATABASE_URL`, `ANTHROPIC_API_KEY`, `GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_BRANCH`, `APP_TIME_ZONE`.
5. Run `DATABASE_URL=... ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run db:setup` once from your machine.
6. Protect `main` on GitHub: require the `check` workflow to pass.

New tables are created on the first request after a deploy; existing users and data stay. Saved SOP edits go live after Vercel redeploys from the new commit (~1–2 min).

## Renaming from MTR-SOP

This app was MTR-SOP. After renaming the GitHub repo to `MTR-HOME`:

1. In Vercel, set `GITHUB_REPO` to `<owner>/MTR-HOME` and redeploy. Optional: rename the Vercel project.
2. On your machine: `git remote set-url origin git@github.com:<owner>/MTR-HOME.git`, and rename the folder if you like.
3. Point the skill links in `~/MTR/.agents/skills/` at `.claude/skills/mtr-home-ui` (was `mtr-sop-ui`). `mtr-sop-content` keeps its name.

Sessions, users and the theme setting carry over: the cookie and storage names did not change.

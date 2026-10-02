---
name: mtr-sop-content
description: Source-of-truth, file format, writing and editing rules for SOP documents in MTR-SOP/content. Read before creating, editing, moving or reviewing any SOP section — whether through the app editor, VS Code, a script or an AI agent.
---

# MTR SOP — content and editing rules

The SOP is edited by different people through different tools (the in-app editor, VS Code, AI
agents, scripts). These rules make every tool produce the same files, so no editor can drift the
source of truth.

## 1. Source of truth

1. **The only source of truth is `MTR-SOP/content/**/*.md` on the `main` branch of the git repo.**
   The database stores users and roles only — never content. Browser drafts are not content.
2. One file = one SOP document. One `##` heading inside it = one section (the unit search returns
   and links jump to).
3. Every change reaches `main` through git: an app save is a commit (admin) or a pull request
   (editor). Nothing edits the deployed site directly.

## 2. Who can change what

| Role | Read | Edit | Result of saving | Create / delete doc | Approve PRs | Manage users |
|---|---|---|---|---|---|---|
| viewer | yes | no | — | no | no | no |
| editor | yes | yes | opens a pull request (branch `sop/<user>/<dept>-<slug>-<timestamp>`) | no | no | no |
| admin | yes | yes | commits to `main` | yes | yes | yes |

Humans and agents working outside the app follow the same table: editors and agents open a PR;
only an admin merges to `main`. Never force-push `main`.

## 3. File layout

```text
content/
  <dept>/                 # software, mechanical, marketing, sales, business — lowercase, kebab-case
    _department.md        # department card: frontmatter only (title, summary, order)
    <slug>.md             # one SOP document; slug = [a-z0-9-]+, max 60 chars
    attachments/          # optional: .pdf .docx .xlsx .csv embedded by docs in this dept
```

Renaming or moving a file breaks links. Do it only as an admin, and update every link
(`npm run content:check` fails on broken internal links).

## 4. Frontmatter (exact keys, this order)

```yaml
---
title: Run the SensQ stack locally      # string, sentence case, starts with a verb when it is a task
summary: Start ROS 2, backend and UI with one script.   # one line, max 160 chars
tags: [sensq, ros2, setup]              # lowercase kebab-case, 1–8 items
owner: Thong Huynh                      # a real person or "TODO"
featured: true                          # true = shown as a quick link on the home card (max 5 per dept)
order: 10                               # sort order inside the department, step of 10
updated: 2026-09-27                     # YYYY-MM-DD, set on every content change
---
```

`_department.md` uses only `title`, `summary`, `order`.

## 5. Body format (canonical Markdown)

The normalizer (`src/lib/content/normalize.ts`) rewrites files into this form. The app runs it on
every save; outside the app run `npm run content:format`. Do not fight it by hand.

- No `#` H1 — the title comes from frontmatter. Body starts with `##`. Heading levels 2–4 only.
- `##` heading text is unique within the file (it becomes the anchor id).
- Steps: ordered list `1.` `2.` `3.`. Unordered: `-`. Bold `**x**`. Italic `_x_`.
- Code: fenced with ```` ``` ```` and a language tag (`bash`, `python`, `ts`, `sql`, `yaml`, `text`).
  Inline code for every path, command, env var, port, topic or file name.
- Tables: GitHub-flavoured Markdown tables.
- Callouts: `> [!NOTE]`, `> [!WARNING]`, `> [!TODO]` (first line of a blockquote).
- Links: internal `/d/<dept>/<slug>#<heading-id>`; external full `https://` URLs.
- No hard line wraps inside paragraphs. One blank line between blocks. LF line endings. File ends
  with one newline.
- Images: not supported yet. Link to the file in its repo instead.
- Attachments: `.pdf`, `.docx`, `.xlsx`, `.csv` only, stored in `content/<dept>/attachments/`, file
  name `[a-z0-9._-]`. A paragraph holding only `[Title](attachments/<file>)` renders as an embedded
  preview; a link inside a sentence renders as a download link. `content:check` fails on a missing
  file or another type. Attachments follow the same source and no-secrets rules as Markdown.

### Visual editor safety

The app's visual editor may only edit a doc it can reproduce byte-for-byte. On open, it serializes
the untouched doc and the server compares it (after normalization) with the file. If they differ —
raw HTML, or code blocks inside numbered steps — the doc opens in **Markdown mode only**. Never
disable this check; it is what keeps the visual editor from silently rewriting content.

### Allowed HTML

Only: `<details>`, `<summary>`, `<kbd>`, `<sub>`, `<sup>`, `<mark>`, `<br>`. Anything else is
shown as plain text when rendered and blocks the save. A file that contains raw HTML opens in
Markdown mode only.

## 6. Writing rules

Write for someone who has never seen the project and must act correctly on the first try.

- Lead with the action. Section = goal line, prerequisites, numbered steps, check ("Expected:"),
  troubleshooting. Skip parts that do not apply.
- One action per step. Exact values: paths, ports, baud rates, versions, env var names.
- No filler: remove "simply", "just", "easily", "please note", "in order to", "basically",
  "it is important to". No history or opinions in steps.
- Present tense, imperative, second person implied: "Run", "Open", "Check".
- Every fact must have a source: a repo file, a command output, or a named person. Put the source
  path at the end of the section as `Source: \`<path>\``.
- Never invent prices, margins, customers, headcount, dates or product claims. Unknown →
  `> [!TODO]` with what is missing and who should fill it.
- Product names are fixed: BoltEye, SensQ, robot arm (work in progress — say so). Company: MTR.

## 7. Before committing (any tool)

1. `git pull` — start from current `main`.
2. Edit.
3. Set `updated:` to today.
4. `npm run content:format` then `npm run content:check` (schema, markdownlint
   `.markdownlint.jsonc`, allowed HTML, unique headings, internal links, format is stable).
5. Commit message: `sop(<dept>/<slug>): <what changed>`.
6. Open a PR unless you are an admin.

## 8. Conflicts

- The app saves with the file's git blob SHA it loaded. If `main` changed since, the save is
  rejected: "Someone changed this section. Reload to see their version." Reload, reapply, save.
- Agents and scripts: never overwrite a file you did not read in the same session. Re-read after
  pulling.

## 9. Agent-specific rules

- Load this skill and `mtr-sop-ui` before touching `MTR-SOP`.
- Change only the files the task names. Never mass-reformat content outside `content:format`.
- Never write secrets, tokens, passwords or customer data into `content/`.
- Report every section you changed with its path.

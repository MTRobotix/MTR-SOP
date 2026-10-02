---
title: Edit this SOP
summary: Roles, where the content lives, and the rules every editor follows.
tags: [sop, editing]
owner: Thong Huynh
featured: true
order: 90
updated: 2026-10-02
---

## Roles

| Role   | Can do                                      | Save result                     |
| ------ | ------------------------------------------- | ------------------------------- |
| Viewer | Read, search                                | —                               |
| Editor | Edit sections                               | Pull request; an admin approves |
| Admin  | Edit, create, delete, approve, manage users | Commit to `main`                |

## Source of truth

The only source of truth is `content/**/*.md` on `main` in the MTR-HOME repo. The database holds users, projects, tasks and hours — never SOP content. One file = one document. One `##` heading = one section that search returns.

## Edit in the app

1. Open the section, select **Edit**.
2. Use **Visual** for text, lists, tables. Use **Markdown / HTML** for callouts and HTML.
3. Fix every item in the issues panel. Save is blocked until it is empty.
4. Fill **What changed**, then **Save** (admin) or **Send for review** (editor).
5. If you see "Someone changed this section", select **Reload** and redo your edit.

## Edit outside the app (VS Code, agents)

```bash
git pull
# edit content/<dept>/<slug>.md
npm run content:format
npm run content:check
git commit -m "sop(<dept>/<slug>): <what changed>"
```

Open a pull request unless you are an admin.

## Writing rules

- Start with the action. One action per step.
- Exact values: paths, ports, versions, commands in backticks.
- No filler words: "simply", "just", "easily", "please note".
- Unknown fact → `> [!TODO]` with what is missing and who fills it. Never guess.
- End each section with `Source:` and the file or person.

Full rules: `.claude/skills/mtr-sop-content/SKILL.md` in the MTR-HOME repo.

Source: `.claude/skills/mtr-sop-content/SKILL.md` in the MTR-HOME repo

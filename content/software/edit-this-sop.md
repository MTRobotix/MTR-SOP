---
title: Edit this SOP
summary: Roles, where the content lives, and the rules every editor follows.
tags: [sop, editing]
owner: Thong Huynh
featured: true
order: 90
updated: 2026-10-08
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

## Embed files (Word, Excel, CSV, PDF)

Goal: show a `.docx`, `.xlsx`, `.csv` or `.pdf` file inside a SOP page, with **Open** and **Download** buttons.

1. Name the file in lowercase kebab-case, for example `metriq-cost-model.xlsx`. Allowed types: `.pdf`, `.docx`, `.xlsx`, `.csv`.
2. Copy it to `content/<dept>/attachments/` in the same department as the doc.
3. Put a link to it alone in its own paragraph, for example `[MetriQ cost model](attachments/metriq-cost-model.xlsx)`. The link text becomes the card title.
4. For a plain download link instead of a preview, put the link inside a sentence: `Download the [Word version](attachments/business-proposal.docx).`
5. Run `npm run content:check`. It fails if the file is missing or the type is not allowed.
6. Commit the file and the doc together.

Expected: PDF shows in a viewer; Word shows as formatted text; Excel shows one table per sheet; CSV shows as a table. Previews show the first 100 rows and 20 columns.

> [!NOTE]
> Upload from the app editor is not built yet. Add files through git. Never attach files with customer data, passwords or keys.

Source: `src/lib/content/embeds.ts`, `src/lib/content/attachments.ts`

## Writing rules

- Start with the action. One action per step.
- Exact values: paths, ports, versions, commands in backticks.
- No filler words: "simply", "just", "easily", "please note".
- Unknown fact → `> [!TODO]` with what is missing and who fills it. Never guess.
- End each section with `Source:` and the file or person.

Full rules: `.claude/skills/mtr-sop-content/SKILL.md` in the MTR-HOME repo.

Source: `.claude/skills/mtr-sop-content/SKILL.md` in the MTR-HOME repo

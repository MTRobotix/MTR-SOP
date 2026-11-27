---
title: Give an AI agent the MTR skills
summary: Install the MTR brand rules and design system skills in Claude Code, Claude or any other agent.
tags: [agents, skills, plugin, brand, design-system]
owner: Thong Huynh
featured: true
order: 10
updated: 2026-11-27
---

## What the plugin holds

The `mtr-brand` plugin lives in this repo under `agent-plugin/`. It has two skills that every agent making MTR work must load.

| Skill               | What it holds                                                                                           | Read in the SOP                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `mtr-brand-rules`   | Names, logo, colour, type, layout, motion, imagery, copy, approved facts, business documents, layout QA | [Brand rules skill](/d/agent-plugin/brand-rules-skill)     |
| `mtr-design-system` | Exact tokens, component styles, slide and Word layouts, layout QA                                       | [Design system skill](/d/agent-plugin/design-system-skill) |

Templates the skills point to: [Brand templates](/d/documents/brand-templates).

Source: `agent-plugin/README.md`

## What is in the kit

| Folder in `agent-plugin/` | Contents                                                                                                        |
| ------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `skills/`                 | `mtr-brand-rules` and `mtr-design-system` (`SKILL.md` each), plus `tokens.css`, `tokens.json`, `components.css` |
| `templates/`              | `mtr-slide-template.pptx` and `mtr-document-template.docx`, each with a PDF preview                             |
| `logos/`                  | The 13 logo files, the same as in the [Logo kit](/d/business/logo-kit)                                          |
| `fonts/`                  | Barlow web fonts (`.woff2`); `fonts/office/` has the `.ttf` files for Word and PowerPoint                       |
| `reference/`              | Design system brand book, website design rules, logo kit, product messaging, document set, this page            |

Install the three files in `fonts/office/` on every PC that edits MTR decks or documents. Without them PowerPoint falls back to Arial.

Source: `agent-plugin/README.md`

## Install in Claude Code

1. Open Claude Code in any project.
2. Run `/plugin marketplace add MTRobotix/MTR-SOP`.
3. Run `/plugin install mtr-brand@mtr-sop`.
4. Ask for MTR work, for example "make a MetriQ one-pager".

Expected: the agent loads `mtr-brand-rules` and `mtr-design-system` before it builds anything.

Source: `.claude-plugin/marketplace.json`, `agent-plugin/.claude-plugin/plugin.json`

## Add to Claude (claude.ai and the desktop app)

1. Download `agent-plugin/skills/mtr-brand-rules/` and `agent-plugin/skills/mtr-design-system/` from GitHub as folders.
2. Zip each folder on its own.
3. Open **Settings → Capabilities → Skills** and upload each zip.

Expected: both skills appear in the skills list and turn on for MTR requests.

> [!TODO]
> Confirm the exact Settings menu path in the current Claude app. Owner: Thong Huynh.

## Other agents

Give the agent the two `SKILL.md` files (and `tokens.css`, `tokens.json`, `components.css` for web work) as instructions or context. Tell it: read both before making anything for MTR, and run the layout QA before sending.

## Update a skill

1. Edit the file under `agent-plugin/skills/<skill>/` on a branch.
2. Copy the same change into the matching SOP page in `content/agent-plugin/`.
3. Bump `version` in `agent-plugin/.claude-plugin/plugin.json`.
4. Run `npm run content:format` and `npm run content:check`, then open a PR.

The website (`MTRobotix/MTR-Site` → `src/styles/tokens.css` and its `mtrobotix-web` skill) is the source of truth for design. When it changes, update `mtr-design-system` the same day.

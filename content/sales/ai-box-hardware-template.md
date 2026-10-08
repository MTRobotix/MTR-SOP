---
title: AI_BOX hardware template
summary: Category template for quoting an AI_BOX build. No prices here — see the priced file.
tags: [metriq, hardware, bom, ai-box]
owner: Thong Huynh
featured: true
order: 50
updated: 2026-10-08
---

## What this is

A category template for pricing an AI_BOX hardware build — the compute + camera + sensing
enclosure that runs MetriQ on a line. This file holds structure only: categories, items, and
spec fields. It has no dollar amounts, so it never goes stale and never needs a
`npm run content:check` update just because a supplier's price moved.

The priced version — real brands, models, and approximate market prices — is a separate
spreadsheet, embedded below. See [Priced BOM](#priced-bom).

## Compute

Pick one. Option A if MetriQ is running a trained detection/classification model at line speed.
Option B only if inference is classical CV, a very light model, or offloaded elsewhere — confirm
throughput before committing to it for a live line.

| Item                          | Model / Spec                   | Qty | Notes                                 |
| ----------------------------- | ------------------------------ | --- | ------------------------------------- |
| Compute — Option A (edge GPU) | On-device GPU module + dev kit | 1   | For on-device inference               |
| Storage (Option A)            | NVMe M.2 SSD                   | 1   | Dev kit ships with no/limited storage |
| Compute — Option B (CPU-only) | Fanless/IPC mini PC, no GPU    | 1   | Only if inference is light enough     |

## Vision

| Item         | Model / Spec                | Qty | Notes                                                      |
| ------------ | --------------------------- | --- | ---------------------------------------------------------- |
| Camera       | Depth + RGB camera, USB3    | 1   | Confirm range/FOV against conveyor width                   |
| Lighting     | Machine-vision LED bar, 24V | 1   | Consistent lighting affects recall more than camera choice |
| Camera cable | Active/locking USB3 cable   | 1   | Standard USB3 cables are unreliable past \~2m              |

## Sensing & I/O

| Item           | Model / Spec                 | Qty | Notes                                   |
| -------------- | ---------------------------- | --- | --------------------------------------- |
| Trigger sensor | Diffuse photoelectric, 24V   | 1   | Triggers capture in sync with each part |
| I/O module     | Digital I/O / relay, 24V out | 1   | Drives the reject actuator / diverter   |

## Enclosure & mounting

| Item      | Model / Spec                           | Qty | Notes                                      |
| --------- | -------------------------------------- | --- | ------------------------------------------ |
| Enclosure | IP54 aluminum, vented, DIN rail mount  | 1   | Houses compute + I/O module                |
| Mounting  | Aluminum extrusion + adjustable clamps | 1   | Positions the housing over the conveyor    |
| Cooling   | Enclosure fan + dust filter            | 1   | Skip if ambient temp keeps compute in spec |

## Power & networking

| Item       | Model / Spec                        | Qty | Notes                                             |
| ---------- | ----------------------------------- | --- | ------------------------------------------------- |
| Power      | 24V DC DIN rail supply, \~60W       | 1   | Compute unit uses its own included power brick    |
| Networking | Cat6 cable + connectors             | 1   | Rough allowance — actual run length varies        |
| Switch     | Unmanaged industrial switch, 5-port | 1   | Only needed if the box talks to a PLC/HMI/network |

## Optional add-ons

| Item      | Model / Spec                 | Qty | Notes                                      |
| --------- | ---------------------------- | --- | ------------------------------------------ |
| Indicator | Red/green stack light, 24V   | 1   | Visual pass/fail status on the line        |
| HMI       | Small industrial touchscreen | 1   | Operator-facing status/override display    |
| UPS       | Small UPS / line conditioner | 1   | Protects against factory power fluctuation |

## Priced BOM

The priced version fills every row above with a real brand, model number, and approximate
market price (sourced by web search, single-unit USD, before shipping/duty/VAT — reverify with
a distributor before quoting a customer).

[Priced BOM — AI_BOX](attachments/metriq-ai-box-bom.xlsx)

## Never

- Put a specific dollar figure into this template file. Prices live in the attachment only.
- Quote from this template without an engineering review of scope. See
  [How to quote](/d/sales/how-to-quote#before-you-quote).

Source: BOM built and priced in chat with Claude, September 2026; component brands (Omron,
Advantech, Mean Well, CCS, Newnex, Hammond, 80/20, Moxa, Patlite) are common industrial choices,
not confirmed suppliers for MTRobotics.

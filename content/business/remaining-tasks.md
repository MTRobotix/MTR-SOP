---
title: Remaining tasks
summary: Open work for the website, software and hardware, with priority and a clear "done when" for each task.
tags: [backlog, website, software, hardware, planning]
owner: Thong Huynh
featured: true
order: 20
updated: 2026-10-02
---

## How to use this list

1. Pick the highest-priority task in your area. **P1** blocks sales or the pitch, **P2** is needed for the first installations, **P3** can wait.
2. When a task is done, delete its row and note the change in the commit message.
3. Add new tasks to the right table with a "done when" line someone else can check.

Download the full list: [Word](attachments/remaining-tasks.docx) · [CSV for Excel or Sheets](attachments/remaining-tasks.csv).

Source: Review of `MTR-Site`, `MTR-SOP` and the MTR-Q BOM by Claude with Thong Huynh, October 2026.

## Website

| #    | Task                               | Done when                                                                                                      | Priority |
| ---- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------- |
| W-1  | Merge the website pull request     | `MTR-Site` PR #8 is merged to `main` and the live site shows the new home, MTR-Q and About pages               | P1       |
| W-2  | Activate the contact form          | First test message sent; FormSubmit confirmation email clicked in `mtrobotix@gmail.com`; a second test arrives | P1       |
| W-3  | Apply the Kick-leg logo everywhere | Nav, footer and social share image use logo concept 18 (favicon already done)                                  | P1       |
| W-4  | Write the real About story         | Story section has founder-approved text in English and Vietnamese                                              | P2       |
| W-5  | Confirm MTR-Q claims               | 100+ parts/s, < 1 mm and > 99.5% are measured on a real line, or the site is changed to measured numbers       | P1       |
| W-6  | Add MTR-M specs                    | MTR-M page shows measured payload, speed, runtime and footprint instead of "coming soon"                       | P2       |
| W-7  | Decide the robot arm page          | Page is either removed or clearly marked "in development, not for sale"                                        | P3       |
| W-8  | Add a first case study             | One pilot result (before/after numbers, customer permission) is published                                      | P2       |
| W-9  | Replace duplicate images           | The conveyor photo appears once; other slots use real MTR-Q photos                                             | P3       |
| W-10 | Fix Vietnamese text wrapping       | Home stats and hero do not break mid-word on a 320 px wide phone                                               | P3       |
| W-11 | Set up search and sharing          | Site added to Google Search Console, sitemap submitted, share image set for each page                          | P2       |
| W-12 | Company email on own domain        | `@mtrobotix` email address works and replaces the Gmail address on the site                                    | P2       |

Source: `MTR-Site` repository and PR #8, October 2026.

## Software

| #    | Task                           | Done when                                                                                                              | Priority |
| ---- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | -------- |
| S-1  | Package zero-shot detection    | A new defect type is set up by describing it, with no retraining, and works on the demo line the same day              | P1       |
| S-2  | Measure accuracy and speed     | Test report with parts per second, smallest defect found and catch rate on 3 product types                             | P1       |
| S-3  | Update approved numbers        | [Product one-liners](/d/marketing/product-messaging#approved-numbers) matches the test report and the website          | P1       |
| S-4  | Reject output                  | MTR-Q fires the I/O module (ADAM-6060) or a PLC signal and the diverter removes the flagged part                       | P1       |
| S-5  | Shift and batch reports        | A PDF or CSV report with counts and defect types is created at the end of each shift                                   | P2       |
| S-6  | Operator screen                | Touchscreen shows live pass/fail, counts and a stop/override button                                                    | P2       |
| S-7  | Installer and setup checklist  | A new unit goes from power-on to inspecting in under 4 hours by following one checklist                                | P1       |
| S-8  | Document MTR Vision AI Core V3 | [MTR Vision AI Core](/d/software/mtr-vision-ai-core) has run, train and deploy steps with no TODOs                     | P2       |
| S-9  | Remote support and updates     | A deployed unit can be updated and checked remotely without a site visit                                               | P2       |
| S-10 | MTR-M navigation               | MTR-M maps a room and docks itself to charge, repeatable 10 times in a row                                             | P3       |
| S-11 | SOP file upload                | Editors can upload Word, Excel, CSV and PDF files from the SOP editor (today: commit to `content/<dept>/attachments/`) | P3       |
| S-12 | Quote template and price list  | [How to quote](/d/sales/how-to-quote) has an approved price list and a quote template                                  | P1       |

Source: `MTR-SOP/content/software`, `MTR-SOP/content/sales/how-to-quote.md`, October 2026.

## Hardware

| #    | Task                                       | Done when                                                                                                            | Priority |
| ---- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- | -------- |
| H-1  | Choose the computer (Pro vs Lite)          | Throughput test on Jetson AGX Orin (Option A) and mini PC (Option B) recorded; the line speed each supports is known | P1       |
| H-2  | Build 2 demo stations                      | Two complete MTR-Q stations run on a demo conveyor (one for Vietnam, one for Canada)                                 | P1       |
| H-3  | Fix camera, lens and lighting part numbers | Bill of materials lists exact part numbers and a supplier for each; no "TBD" rows                                    | P1       |
| H-4  | Enclosure and mounting drawings            | CAD drawings and a cut list for the enclosure and conveyor mount, stored in the repo                                 | P2       |
| H-5  | Reject kit                                 | Air-jet or pusher diverter with sensor and wiring, tested at line speed                                              | P1       |
| H-6  | Calibration procedure                      | Step-by-step camera and lighting calibration in the SOP, done by a new person in under 30 minutes                    | P2       |
| H-7  | Maintenance schedule                       | Cleaning, inspection and spare-parts list for customers in the SOP                                                   | P3       |
| H-8  | Electrical safety certification            | Plan and quote for CE (Vietnam/export) and CSA (Canada) approval of the station                                      | P2       |
| H-9  | Supplier quotes for 10 units               | Volume quotes for every BOM line, with lead times, to replace single-unit prices                                     | P2       |
| H-10 | MTR-M measurements and motors              | Motor chosen (12 V 170 RPM or 24 V 330 RPM), payload, speed and runtime measured                                     | P3       |
| H-11 | Robot arm pick-and-place demo              | Arm picks rejected parts from the conveyor in a recorded demo                                                        | P3       |

Source: `MTR-SOP/content/sales/attachments/mtr-q-ai-box-bom.xlsx`, Google Drive "BOM" sheet (MTR-M motors), October 2026.

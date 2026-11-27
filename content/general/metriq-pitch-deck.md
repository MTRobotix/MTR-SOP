---
title: MetriQ pitch deck and demo video
summary: The 16-slide MetriQ deck on the MTR template and the demo video, each in English and Vietnamese, for customer meetings and outreach.
tags: [metriq, pitch, deck, video, sales]
owner: Thong Huynh
featured: true
order: 10
updated: 2026-11-27
---

## Demo video

[MetriQ demo video](attachments/metriq-demo.mp4)

1 min 39 s, 1920 × 1080, background music, no voice-over. It plays every slide of the 16-slide deck with its build steps and videos, except slide 6: the video shows the capabilities on the photo of real parts only. Send it with outreach emails or play it before a live demo.

[MetriQ demo video, Vietnamese](attachments/metriq-demo-vi.mp4)

The same video made from the Vietnamese deck, for Vietnamese customers.

Source: `content/general/attachments/metriq-demo.mp4`, `content/general/attachments/metriq-demo-vi.mp4`, rendered from the two decks on 2026-11-27.

## Slides

[MetriQ pitch deck](attachments/metriq-pitch-deck.pdf)

The PDF shows each slide as it ends after its animations. Download the [PowerPoint version](attachments/metriq-pitch-deck.pptx) to present.

| Slide | Shows                                                                                                          |
| ----- | -------------------------------------------------------------------------------------------------------------- |
| 1     | MetriQ — installed in hours, zero downtime, catch any defect, instantly                                        |
| 2     | Why MetriQ exists — a busy line, three questions, "This is where MetriQ comes in"                              |
| 3     | Every unit inspected, any defect caught — inspect, grade, send the reject signal                               |
| 4     | Real-time analysis — < 100 ms, ≤ 2 mm, every unit, hours to go live; accuracy measured on the customer's parts |
| 5     | Capabilities on a photo of real parts                                                                          |
| 6     | Capabilities on generated cartons — 2D, then 3D for height and damage                                          |
| 7     | Colour grading in CIELAB                                                                                       |
| 8     | Instant deploy — teach MetriQ a new product in minutes                                                         |
| 9     | Shift report                                                                                                   |
| 10    | See drift before parts fail — measurements screen                                                              |
| 11    | Live same day, fast commissioning — time and cost chart with Mount, Calibrate, Teach, Live                     |
| 12    | Benefits and competitiveness — comparison with manual QC, rule-based vision and AI vision platforms            |
| 13    | Built around your line — camera, frame, checks, connection, compute                                            |
| 14    | Section: MetriQ Expansion                                                                                      |
| 15    | Plug into any reject system — laser marking, pusher, robot pick, air jet (3D animations)                       |
| 16    | Close — book a 30-minute demo                                                                                  |

In both PDFs, slides 5 and 6 show only the final pass/reject boxes; the PowerPoint builds every check step by step.

Every slide uses the MTR slide template: warm white, Barlow fonts, halftone dots, logo files from the [Logo kit](/d/business/logo-kit). Rules: [Brand templates](/d/documents/brand-templates).

Source: `content/general/attachments/metriq-pitch-deck.pptx`

## Vietnamese version

[MetriQ pitch deck, Vietnamese](attachments/metriq-pitch-deck-vi.pdf)

The same 16 slides, layout and animations as the English deck, with every slide, speaker note, chart label and picture description in Vietnamese. Download the [PowerPoint version](attachments/metriq-pitch-deck-vi.pptx) to present; the steps under Present the deck apply unchanged.

- Kept in English: the MetriQ app screenshots on slides 9 and 10 (the app is in English), product codes (M4×20, M3×6) and prices ($30k–150k).
- Decimal commas in readings (20,1 mm, ΔE 1,2), as on the Vietnamese website.

> [!NOTE]
> Translated by Claude from the English deck on 2026-11-27, reusing the wording of the 2026-10-29 translation where the text did not change. Read it through once before the first customer meeting.

Source: `content/general/attachments/metriq-pitch-deck-vi.pptx`, translated from `content/general/attachments/metriq-pitch-deck.pptx`; Vietnamese terms from `MTR-Site/src/data/content.ts`.

## Present the deck

1. Download the [PowerPoint version](attachments/metriq-pitch-deck.pptx).
2. Open it in PowerPoint and start the slideshow.
3. Click to advance. Each click shows the next build step. The videos on slides 2, 3 and 15 play and loop on their own.
4. On slide 2, click once per question; the fourth click shows "This is where MetriQ comes in."
5. To return to the capabilities, click **All capabilities** at the bottom of slides 3, 7, 8, 9 and 10. It jumps to slide 5.

Expected: slide 12 shows the competitor columns first; the MetriQ column appears on the next click.

Install the Barlow fonts from `agent-plugin/fonts/office/` before presenting from PowerPoint; without them it falls back to Arial (the layout still fits). Send customers the PDF.

Source: `content/general/attachments/metriq-pitch-deck.pptx`

## Before sending

Slides 5 and 6 show the same capabilities two ways: on a photo of real parts and on generated cartons. Both stay in the deck.

> [!TODO]
> Slide 11 has no MetriQ price. Add it once the price is confirmed (see [Business proposal](/d/business/business-proposal)).

Slide 4 uses only the approved numbers from [Product one-liners](/d/marketing/product-messaging). Don't quote a catch-rate percentage: measure catch rate and false-reject rate on the customer's parts in a trial and record them in the FAT/SAT document.

Source: Thong Huynh; `content/marketing/product-messaging.md`.

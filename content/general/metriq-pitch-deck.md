---
title: MetriQ pitch deck and demo video
summary: The 14-slide MetriQ deck in English and Vietnamese (PowerPoint and PDF) and the 2-minute demo video for customer meetings and outreach.
tags: [metriq, pitch, deck, video, sales]
owner: Thong Huynh
featured: true
order: 10
updated: 2026-11-27
---

## Demo video

[MetriQ demo video](attachments/metriq-demo.mp4)

1 min 48 s, 1920 × 1080, background music, no voice-over. It plays every slide with its animations, except slide 5: the video shows the capabilities on the photo of real parts only. Send it with outreach emails or play it before a live demo.

> [!TODO]
> Remake the demo video. It still shows the earlier slides 1–3: the old render, a pusher removing parts, and unmeasured numbers (100+ parts/s, <1 mm, >99.5%). Owner: Thong Huynh.

Source: `content/general/attachments/metriq-demo.mp4`

## Slides

[MetriQ pitch deck](attachments/metriq-pitch-deck.pdf)

The PDF shows each slide as it ends after its animations. Download the [PowerPoint version](attachments/metriq-pitch-deck.pptx) to present.

| Slide | Shows                                                                        |
| ----- | ---------------------------------------------------------------------------- |
| 1     | MetriQ — installed in hours, zero downtime, catch any defect instantly       |
| 2     | How it works — the line animation: inspect, flag, send pass/fail to the line |
| 3     | Performance — ≤ 2 mm and < 100 ms, and how accuracy is scored on your parts  |
| 4     | Capabilities on a photo of real parts                                        |
| 5     | Capabilities on generated cartons — 2D, then 3D for height and damage        |
| 6     | Instant deploy — teach MetriQ a new product in minutes                       |
| 7     | Colour grading in CIELAB                                                     |
| 8     | Measurements screen — drift, recommendations, export                         |
| 9     | Time and cost to go live against integrators and AI vision platforms         |
| 10    | Integration — Mount, Calibrate, Teach, Live                                  |
| 11    | Comparison with manual QC, rule-based vision and AI vision platforms         |
| 12    | Shift report                                                                 |
| 13    | Customization — camera, frame, checks, connection, compute                   |
| 14    | Close — book a 30-minute demo                                                |

Source: `content/general/attachments/metriq-pitch-deck.pptx`

## Vietnamese version

[MetriQ pitch deck, Vietnamese](attachments/metriq-pitch-deck-vi.pdf)

The same 14 slides, layout and animations as the English deck, with every slide, speaker note, chart label and picture description in Vietnamese. Download the [PowerPoint version](attachments/metriq-pitch-deck-vi.pptx) to present; the steps under Present the deck apply unchanged.

- Kept in English: the MetriQ app screenshots on slides 8 and 12 (the app is in English), product codes (M4×20, M3×6) and prices ($30k–150k).
- Decimal commas in readings and figures (>99,5%, 20,1 mm, ΔE 1,2), as on the Vietnamese website.
- The demo video stays in English.

> [!NOTE]
> Translated by Claude from the English deck on 2026-10-29. Read it through once before the first customer meeting.

Source: `content/general/attachments/metriq-pitch-deck-vi.pptx`, translated from `content/general/attachments/metriq-pitch-deck.pptx`; Vietnamese terms from `MTR-Site/src/data/content.ts`.

## Present the deck

1. Download the [PowerPoint version](attachments/metriq-pitch-deck.pptx).
2. Open it in PowerPoint and start the slideshow.
3. Click to advance. Each click shows the next build step; slide 2's video plays and loops on its own.
4. To return to the capabilities, click **All capabilities** at the bottom of slides 2, 6, 7, 8 and 12. It jumps to slide 4.

Expected: slide 11 shows the competitor columns first; the MetriQ column appears on the next click.

> [!WARNING]
> The deck uses the brand fonts Barlow and Barlow Condensed SemiBold. Install both on the presenting PC (free from Google Fonts), or present the PDF. Without them PowerPoint swaps in another font and the slides lose the brand look.

Source: `content/general/attachments/metriq-pitch-deck.pptx`

## Before sending

Slides 4 and 5 show the same capabilities two ways: on a photo of real parts and on generated cartons. Both stay in the deck.

MetriQ detects and flags defects; it does not remove parts. The customer's PLC or reject system removes them, driven by MetriQ's pass/fail signal. Slide 2 says this; keep it that way in the talk.

On performance, quote only the published numbers (≤ 2 mm, < 100 ms). Catch rate is never a headline number: it is an escape rate and a false-reject rate, agreed with the customer's QA and proven at FAT on their parts ([Acceptance definitions](/d/sales/sales-roadmap#acceptance-definitions)).

> [!TODO]
> Slide 9's market ranges (integrator-built $30k–150k, AI vision platforms ≈ $16k–87k) have no source in the SOP, and the [Business proposal](/d/business/business-proposal) gives USD 50,000–150,000 plus install for mid-range systems. Confirm the source or correct the slide. Owner: Thong Huynh.
>
> Slide 9 has no MetriQ price. Add it once the price is confirmed (see [Business proposal](/d/business/business-proposal)).

Source: Thong Huynh.

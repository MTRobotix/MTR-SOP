---
title: MetriQ inspection rig
summary: What the rig is, its published specs, and what is still undocumented.
tags: [metriq, inspection, hardware]
owner: Thong Huynh
featured: true
order: 20
updated: 2026-10-08
---

## What it is

A conveyor with custom optical inspection hardware (overhead camera and lighting) feeding a real-time computer vision pipeline. Hardware and models were tuned together against the same production conditions.

## Published specs

| Spec                             | Value                       |
| -------------------------------- | --------------------------- |
| Smallest detected surface defect | ≤ 2 mm                      |
| End-to-end latency               | < 100 ms                    |
| Models                           | YOLOv11, Mask R-CNN, DINOv2 |

Use only these numbers in any document or conversation. Anything else needs a measurement first.

> [!TODO]
> Missing: camera and lens part numbers, lighting type and position, conveyor spec and speed, mounting drawings, calibration steps, maintenance schedule. Owner: Thong Huynh.

Source: `~/MTR/site/src/data/products.ts`

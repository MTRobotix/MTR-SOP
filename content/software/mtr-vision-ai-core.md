---
title: Run MTR Vision (AI Core V3)
summary: Install and start the camera, inspection and AI service on Windows.
tags: [vision, inspection, python]
owner: TODO
featured: false
order: 50
updated: 2026-09-27
---

## Goal

Start MTR Vision Inspection V3: FastAPI service for Basler line/area cameras and Intel RealSense D555, with inspection, product counting and optional AI detection.

## Rules

- Work only in `V3/`. `Archive/V1` and `Archive/V2` are frozen.
- UI is plain HTML/CSS in `V3/src/front/`. No framework, no build step.
- A new static asset folder needs an entry in the `StaticFiles` mount in `src/server/app.py` **and** in the `racer2.spec` `datas` list, or the frozen build ships without it.

## Prerequisites

- Python 3.11 or 3.12.
- Windows host for physical Basler cameras, with the pylon runtime.
- Roboflow credentials only if RF-DETR is enabled.

## Install

Run in PowerShell from `AI_CORE\V3`:

1. `py -3.12 -m venv .venv`
2. `.\.venv\Scripts\Activate.ps1`
3. `python -m pip install --upgrade pip`
4. `python -m pip install -r requirements.txt`
5. Network databases only: `python -m pip install -r requirements.database.txt`
6. `Copy-Item .env.example .env`, then fill `INFERENCE_API_HEADER`, `INFERENCE_API_KEY`, `RFDETR_MODEL_ID`, `ROBOFLOW_API_KEY`.
7. Set non-secret options in `settings.json` (`APP_PORT`, `CAMERA_MODE`, `AI_MODEL_NAME`, …).

## Run modes

| Mode                      | Command                                                    | Notes                                |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------ |
| Local Basler line cameras | `python .\main.py`                                         | `http://localhost:8000` (`APP_PORT`) |
| No hardware (debug)       | `$env:APP_ENV="debug"; python .\main.py`                   | Emulated camera, detection on        |
| No camera                 | `$env:CAMERA_ENABLED="false"; python .\main.py`            | API only                             |
| RealSense D555            | `$env:CAMERA_MODE="realsense"; python .\main.py`           | Depth under `/camera/realsense/*`    |
| Basler area-scan          | `$env:CAMERA_MODE="basler_area"; python .\main.py`         | Needs `pypylon`                      |
| Split deployment          | `python .\camera_main.py` then `docker compose up --build` | Camera service on `:8001`            |

## Test

```powershell
.\scripts\test.ps1
.\scripts\test.ps1 -IncludeModel -IncludeHardware -Coverage
```

Default run skips `model` and `hardware` tests.

## Versioning

Tag `vXX.XX.XX`. Label `[major]`, `[minor]` or `[patch]` (default `[patch]`).

> [!TODO]
> Confirm the owner of MTR Vision and whether it is the MTR-Q software. Owner: Thong Huynh.

Source: `~/MTR/MTR-vision/AI_CORE/README.md`, `~/MTR/MTR-vision/AI_CORE/CLAUDE.md`, `~/MTR/MTR-vision/AI_CORE/V3/README.md`

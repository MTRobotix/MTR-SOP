---
title: Robot arm (work in progress)
summary: 6-DOF arm status and known design facts. Not a product yet.
tags: [robot-arm, kinematics, wip]
owner: Thong Huynh
featured: true
order: 30
updated: 2026-09-27
---

## Status

> [!WARNING]
> Demo · Work in progress. Never describe the arm as shipped or for sale.

Current work: pick-and-place alongside a small conveyor.

## Known facts

| Item               | Value                                 |
| ------------------ | ------------------------------------- |
| Degrees of freedom | 6                                     |
| Kinematics         | Custom forward and inverse kinematics |
| Path planning      | L-BFGS-B constrained optimization     |
| Visualization      | Python + ROS / RViz                   |
| CAD                | SolidWorks                            |

## Design constraints to handle

- Singularities.
- Joint limits.
- Reachability.
- Self-collision during pick-and-place.

> [!TODO]
> Missing: repo location, CAD file location, motor/servo part numbers, link lengths, payload, controller wiring, calibration and homing steps. Owner: Thong Huynh.

Source: `~/MTR/site/src/data/products.ts`, `~/MTR/AGENTS.md`

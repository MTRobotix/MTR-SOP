---
title: How to quote
summary: Steps to build a quote. Prices and margins are not defined yet.
tags: [quote, pricing]
owner: TODO
featured: true
order: 10
updated: 2026-11-08
---

## Before you quote

1. Confirm the product is sellable: MetriQ or SensQ. See [What we can sell](/d/sales/what-we-sell).
2. Collect the requirements in [Scope checklist](#scope-checklist).
3. Get an engineering review of scope. Owner: Thong Huynh.

## Scope checklist

| Item                   | MetriQ                            | SensQ                            |
| ---------------------- | --------------------------------- | -------------------------------- |
| Site and contact       | Required                          | Required                         |
| Parts or items handled | Part type, size, defect types     | Load type, weight                |
| Rate                   | Line speed, parts per minute      | Moves per hour                   |
| Area                   | Conveyor width and mounting space | Floor area, map size, floor type |
| Integration            | PLC/reject signal, database       | Charging/dock location, Wi-Fi    |
| Timeline               | Required                          | Required                         |

## Build the quote

1. Hardware cost.
2. Engineering hours.
3. Installation and commissioning.
4. Support and warranty.
5. Margin.
6. Approval.

Templates: project proposal, quotation and BOM cost sheet in [Business document set](/d/documents/document-set#which-document-when). When to send them: [Proposal and quote](/d/sales/sales-roadmap#proposal-and-quote).

> [!TODO]
> Missing for every step: approved price list, labour rate, margin, taxes, approver. Currency, payment terms, warranty and validity have draft defaults in [Commercial defaults](/d/sales/sales-roadmap#commercial-defaults), not yet approved. Owner: TODO — add before anyone sends a quote.

## Never

- Quote the robot arm. It is work in progress.
- Promise specs beyond [Approved numbers](/d/marketing/product-messaging#approved-numbers).
- Send a quote without approval.

Source: `~/MTR/AGENTS.md`, `~/MTR/site/src/data/products.ts`

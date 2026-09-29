---
title: Update the website
summary: Change copy, product pages or photos on the MTR site.
tags: [website, copy]
owner: Thong Huynh
featured: false
order: 30
updated: 2026-09-27
---

## Change copy

1. Edit `~/MTR/site/src/data/site.ts` (home, about, contact) or `src/data/products.ts` (products).
2. Change the Vietnamese version in the same file.
3. Check against [Brand and copy rules](/d/marketing/brand-and-copy).
4. Run and build — see [Work on the MTR website](/d/software/mtr-website#check-and-build).

## Add a product photo

1. Put the image in `~/MTR/site/public/images/<product>/`.
2. Add `{ src, alt }` to that product's `gallery` in `src/data/products.ts`. `alt` describes what is in the photo.

> [!TODO]
> Missing: image size and format rules, photo approval, who publishes. Owner: Thong Huynh.

Source: `~/MTR/site/src/data/`, `~/MTR/AGENTS.md`

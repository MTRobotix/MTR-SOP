---
title: Business proposal — MTR-Q
summary: Pitch and bank-loan proposal for MTR-Q — problem, product, market, prices, costs, timeline and funding ask.
tags: [proposal, funding, pitch, mtr-q, pricing]
owner: Thong Huynh
featured: true
order: 10
updated: 2026-10-02
---

## Summary

MTRobotics builds MTR-Q: a camera inspection station that sits on an existing production line and removes bad products automatically. It finds new defect types without weeks of photo collection and model training (zero-shot detection), and it is installed in hours, without stopping the line.

We sell to small and mid-size food, agriculture and light manufacturing plants in Vietnam and Canada — plants that still check products by eye and cannot afford a USD 50,000+ vision system.

We ask for a **USD 120,000 loan** to build stock for 10 units, two demo stations, and the first paid installations. Each MTR-Q sold at the proposed price returns about **USD 8,900 gross profit**; selling 4 units a year covers the loan repayment.

| Item                     | Value                               |
| ------------------------ | ----------------------------------- |
| Product                  | MTR-Q AI inspection station (live)  |
| Markets                  | Vietnam (first), Canada             |
| Proposed price           | USD 9,000 (Lite) – USD 14,000 (Pro) |
| Hardware cost per unit   | USD 2,133 (Lite) – USD 3,619 (Pro)  |
| Gross margin per unit    | About 63%                           |
| Customer payback         | Under 12 months (Vietnam, 2 shifts) |
| Funding ask              | USD 120,000, 5-year term            |
| Monthly repayment (est.) | About USD 2,550 at 10% per year     |

> [!TODO]
> Prices, loan amount, term and interest rate are draft estimates built from the BOM and public market data. Confirm each before sending this to a bank or investor. Owner: Thong Huynh.

## The problem

- Most small and mid-size plants still inspect products by eye. People get tired, miss defects and judge differently from shift to shift.
- Existing vision systems are built for large factories. A mid-range system costs USD 50,000–150,000 plus USD 5,000–15,000 to install, and needs weeks of photo collection and tuning for each product.
- When the product or defect changes, the system has to be retrained. Small plants cannot wait or pay for that.

Source: averroes.ai and iFactory pricing guides (see [Sources](#sources)).

## What we do

MTR-Q is a complete inspection station: camera, lighting, edge computer, software and reject output, delivered and installed by one team.

1. Mount the station over the existing conveyor. No line changes, no downtime.
2. Tell MTR-Q what a defect looks like. It starts finding it the same day.
3. MTR-Q checks every product in real time and signals the reject system to remove bad ones.
4. The plant gets counts, defect types and reports for each shift.

What it does on the line:

- Finds defects and unusual products.
- Detects, tracks and counts products.
- Sorts and rejects bad products automatically.
- Produces shift and batch quality reports.

Published performance: 100+ parts per second, under 1 mm accuracy, more than 99.5% of defects caught.

> [!TODO]
> These numbers are from the website (`MTR-Site/src/data/products.ts`). Approved numbers in [Product one-liners](/d/marketing/product-messaging#approved-numbers) still say ≤ 2 mm and under 100 ms. Measure on a real line and update both before pitching. Owner: Thong Huynh.

Source: `MTR-Site/src/data/products.ts`, mtrobotix website (MTR-Q page).

## Why we are different

| What matters to the plant               | Typical vision system                       | MTR-Q                                                             |
| --------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------- |
| New defect type                         | Collect and label photos, retrain for weeks | **Zero-shot detection** — describe the defect, works the same day |
| Installation                            | Weeks, often a line stop                    | **Hours, no downtime**                                            |
| Who you deal with                       | Camera brand + integrator                   | One team: hardware, software, install                             |
| Price                                   | USD 50,000–150,000 + install                | USD 9,000–14,000, installed                                       |
| Natural products (fruit, nuts, seafood) | Hard — every item looks different           | Built for variable products                                       |

Zero-shot detection means the AI can find a defect it was never trained on. The plant does not need to collect thousands of example photos first. This is what makes fast installation and low price possible.

Source: Thong Huynh (product capability, October 2026); competitor data in `MTR-Q_Competitors_and_Customers` (Google Drive, September 2026).

## Market

| Market fact                                       | Number                                                                      |
| ------------------------------------------------- | --------------------------------------------------------------------------- |
| AI visual inspection, world                       | USD 29.8B (2025) → USD 85.2B (2030), 23% a year; Asia-Pacific grows fastest |
| Machine vision, Asia-Pacific                      | USD 6.3B (2025) → USD 9.8B (2030), 9% a year                                |
| Vietnam GDP growth 2025                           | 8.0%; manufacturing grew 10.0%                                              |
| Vietnam food processing                           | USD 88B in 2025, up 11%                                                     |
| Vietnam agriculture, forestry and fishery exports | USD 70.1B in 2025, up 12%                                                   |
| Canada food and beverage processing               | USD 173.4B (2024), largest manufacturing sector, 8,800 companies            |
| Vietnam manufacturing wage                        | About VND 8.4M (USD 332) per month (Q1 2025)                                |

Why now:

- Vietnam's food and farm exports are growing fast, and export buyers demand consistent quality.
- Labour costs are rising and plants are looking for automation they can afford.
- AI that works without large training data has only become practical in the last two years. Large competitors still sell the old, slow-to-train approach.

Source: ResearchAndMarkets, MarketsandMarkets, Vietnam Briefing, USDA FAS, SGGP (see [Sources](#sources)).

## Target customers

| Segment                                    | Country         | Why they buy                              |
| ------------------------------------------ | --------------- | ----------------------------------------- |
| Fruit, cashew, coffee, pepper processors   | Vietnam         | Export quality rules, many manual sorters |
| Seafood and food packing                   | Vietnam         | Food safety, labour cost                  |
| Mid-size food and beverage plants          | Canada          | High labour cost, hard to hire inspectors |
| Light manufacturing (plastic, metal parts) | Vietnam, Canada | Surface defects checked by hand today     |

Sales channels: direct sales to plant owners, plus partners — consultancies that deploy camera AI (OCD) and machine builders that ship complete processing lines (PSL Machinery).

> [!TODO]
> No signed customers or letters of intent yet. Add named pilot customers here once they agree to be listed. Owner: Thong Huynh.

Source: `MTR-Q_Competitors_and_Customers` (Google Drive, September 2026).

## Products and prices

| Product      | What it is                                         | Status           | Proposed price (USD)       |
| ------------ | -------------------------------------------------- | ---------------- | -------------------------- |
| MTR-Q Pro    | GPU edge computer, zero-shot detection, full speed | Live             | 14,000 one-time, installed |
| MTR-Q Lite   | CPU computer, for simpler or slower lines          | Live             | 9,000 one-time, installed  |
| Support plan | Remote support, updates, new defect setup          | Planned          | 1,200–1,500 per year       |
| Paid pilot   | 4-week trial on the customer's line                | Planned          | Credited to the purchase   |
| MTR-M        | Autonomous mobile robot for moving materials       | In development   | Not priced yet             |
| Robot arm    | Pick-and-place arm                                 | Work in progress | Not for sale               |

Market reference: entry-level AI inspection USD 3,000–10,000 (software or camera only), mid-range USD 50,000–150,000 plus installation. MTR-Q is a complete installed station priced near the entry level.

> [!TODO]
> Proposed prices are not yet in [How to quote](/d/sales/how-to-quote). Approve them, then add the price list there. Owner: Thong Huynh.

Source: `content/sales/attachments/mtr-q-ai-box-bom.xlsx`, averroes.ai and iFactory pricing guides.

## Cost and margin

Hardware cost comes from the priced AI_BOX BOM (single unit, before shipping, duty and VAT).

| Cost item (USD)                | MTR-Q Pro | MTR-Q Lite |
| ------------------------------ | --------- | ---------- |
| Edge computer + storage        | 2,075     | 589        |
| Camera, lighting, cable        | 584       | 584        |
| Trigger sensor and reject I/O  | 230       | 230        |
| Enclosure and mounting         | 300       | 300        |
| Power and networking           | 125       | 125        |
| Stack light, touchscreen, UPS  | 305       | 305        |
| **Hardware total**             | **3,619** | **2,133**  |
| Shipping, duty, assembly (20%) | 724       | 427        |
| Installation and travel        | 800       | 800        |
| **Delivered cost**             | **5,143** | **3,360**  |
| Proposed price                 | 14,000    | 9,000      |
| **Gross profit**               | **8,857** | **5,640**  |
| Gross margin                   | 63%       | 63%        |

Customer payback (Vietnam): one station replaces about 2 inspectors per shift. Two shifts × 2 inspectors × USD 332 × 12 months = USD 15,936 saved per year. A Pro unit pays back in under 11 months. Payback is faster in Canada, where wages are higher.

> [!TODO]
> 20% landed-cost allowance, USD 800 installation cost and "2 inspectors per shift" are assumptions. Replace with real numbers after the first two installations. Owner: Thong Huynh.

Source: `content/sales/attachments/mtr-q-ai-box-bom.xlsx`, `content/business/attachments/mtr-q-cost-model.xlsx`.

## Competition

| Competitor                           | What they sell                      | Our edge                                                                                                    |
| ------------------------------------ | ----------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Cognex, Keyence (via integrators)    | Smart cameras, needs integrator     | One team, installed in hours, no training data                                                              |
| TOMRA, Satake, Chinese color sorters | Full optical sorting lines          | Retrofit on existing lines at a fraction of the price; catches shape and surface defects color sorters miss |
| Musashi AI (Canada)                  | Turnkey AI for automotive parts     | We serve food, agriculture and light manufacturing                                                          |
| FaceNet, SmartSys (Vietnam)          | AI software, often bundled with MES | Complete station with hardware and reject output                                                            |
| UnitX, iFactory                      | AI inspection for large factories   | Priced and supported for mid-size local plants                                                              |

Source: `MTR-Q_Competitors_and_Customers` (Google Drive, September 2026).

## Timeline

| When    | Milestone                                                                        |
| ------- | -------------------------------------------------------------------------------- |
| Q4 2026 | Build 2 demo stations. Start 2 paid pilots with Vietnam food or farm processors. |
| Q1 2027 | First sales. Reject kit and shift reports ready. Support plan launched.          |
| Q2 2027 | First Canada pilot (Ontario food plant).                                         |
| H2 2027 | 12 units installed in total. MTR-M mobile robot pilot.                           |
| 2028    | Partner sales through consultancies and machine builders. 30 units per year.     |

> [!TODO]
> Timeline and unit targets are draft. Confirm dates against team capacity and funding date. Owner: Thong Huynh.

Source: Draft plan, October 2026.

## Funding request

We ask for **USD 120,000**, repaid over 5 years.

| Use of funds                                    | USD         | Share    |
| ----------------------------------------------- | ----------- | -------- |
| Stock for 10 stations (hardware, landed)        | 43,000      | 35.8%    |
| 2 demo stations (Vietnam, Canada)               | 12,000      | 10.0%    |
| Engineering: reject kit, reports, installer     | 30,000      | 25.0%    |
| Sales and marketing: trade shows, demos, travel | 12,000      | 10.0%    |
| Electrical safety certification (CE / CSA)      | 8,000       | 6.7%     |
| Contingency                                     | 15,000      | 12.5%    |
| **Total**                                       | **120,000** | **100%** |

### Repayment

- Estimated payment: about USD 2,550 per month (5 years, 10% per year; rate to be set by the lender).
- Each Pro unit returns about USD 8,857 gross profit. **4 Pro units a year cover all loan payments.**
- Year-1 target is 12 units (8 Pro, 4 Lite): about USD 148,000 revenue and USD 93,000 gross profit.
- Stock bought with the loan is converted to cash as each unit is sold; paid pilots bring cash in before full sales.

Source: `content/business/attachments/mtr-q-cost-model.xlsx`.

## Risks

| Risk                             | How we handle it                                                 |
| -------------------------------- | ---------------------------------------------------------------- |
| Slow first sales                 | Paid pilots credited to purchase; demo stations at trade shows   |
| Accuracy on a new product type   | 4-week pilot on the customer's own line before purchase          |
| Hardware price or supply changes | Two computer options (Pro, Lite); common industrial brands       |
| Small team                       | Standard installer and checklist; partners for sales and service |
| Currency (VND, CAD, USD)         | Price and buy hardware in USD                                    |

Source: Draft plan, October 2026.

## Team

- **Thong Huynh — Founder.** Robotics engineer, B.Eng. Mechatronics (Ontario Tech University). Robotics Software Engineer at ABI Ltd. Research assistant at MARS Lab; design lead, Ontario Tech RoboMaster team.
- Offices: Ho Chi Minh City, Vietnam and Toronto, Canada.
- Contact: <mtrobotix@gmail.com> · +84 835 760 735 · +1 905 924 5498.

> [!TODO]
> Add other team members, advisors and company registration details (legal name, registration number, founding date). Owner: Thong Huynh.

Source: mtrobotix website (About and Contact pages), Thong Huynh's resume.

## Files

Pitch-ready version of this proposal:

[Business proposal (PDF)](attachments/business-proposal.pdf)

Cost model — change the blue input cells to test other prices and volumes:

[MTR-Q cost model](attachments/mtr-q-cost-model.xlsx)

Editable Word version: [business-proposal.docx](attachments/business-proposal.docx).

## Sources

1. AI visual inspection market: ResearchAndMarkets, report 6226169 — <https://www.researchandmarkets.com/reports/6226169>
2. Asia-Pacific machine vision: MarketsandMarkets press release — <https://www.marketsandmarkets.com/PressReleases/asia-pacific-machine-vision.asp>
3. Vietnam GDP and manufacturing 2025: Vietnam Briefing manufacturing tracker — <https://www.vietnam-briefing.com/>
4. Vietnam food processing: USDA FAS, Vietnam Food Processing Ingredients report 2026 — <https://www.fas.usda.gov/data>
5. Vietnam agro-forestry-fishery exports 2025: SGGP — <https://en.sggp.org.vn/post123448.html>
6. Canada food and beverage processing: USDA FAS, Canada Food Processing Ingredients Annual 2025 — <https://www.fas.usda.gov/data>
7. Vietnam manufacturing wages 2025: Vietnam Briefing — <https://www.vietnam-briefing.com/>
8. AI inspection system cost: averroes.ai visual inspection system cost breakdown — <https://averroes.ai/blog/visual-inspection-system-cost-breakdown>; iFactory pricing guide — <https://ifactoryapp.com/>
9. Hardware prices: MTRobotics priced bill of materials, single-unit USD, September 2026 — [AI_BOX hardware template](/d/sales/ai-box-hardware-template#priced-bom)
10. Competitors: MTRobotics competitor and customer research, Google Drive, September 2026

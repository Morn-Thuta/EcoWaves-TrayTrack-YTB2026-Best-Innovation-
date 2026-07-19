# 🌱 TrayTrack Scripts — Mock Data Seeder

Hardware is great for a demo, but you can't show *history* with a scale you plugged in yesterday. This seeder fills a fresh Supabase project with **90 days of realistic breakfast-buffet data** so the dashboard, analytics charts, and cook suggestions look real from the first click — no ESP32 required.

## What it generates

[`seed-mock-data.ts`](./seed-mock-data.ts) builds a believable Singapore hotel buffet:

- **A menu of dishes** — Nasi Lemak, Scrambled Eggs, Roti Prata, Mixed Salad, and more — each with a full-tray weight, batch size, cook trigger %, cook time, and popularity score.
- **90 days of daily guest counts (pax)** that aren't just random noise — they model real demand patterns:

| Pattern | Effect on pax |
|---|---|
| **Year-end peak** (mid-Dec → early-Jan) | Highest (200–240) |
| **Public holidays** (2025–26 SG calendar) | High (180–220) |
| **School holidays** (Mar / Jun / Sep / Nov–Dec) | Elevated (150–180) |
| **Weekends** | Busier (130–160) |
| **Weekdays** | Baseline (80–120) |

Plus a ±10% day-to-day variance on top, so no two days look identical.

This seasonality is the whole point: it's what makes demand-scaled cook suggestions — and any future demand forecasting — have something meaningful to learn from. A June school-holiday spike or a Christmas peak actually shows up in the data.

## Running it

```bash
# From the repo root, with your Supabase env vars set:
export NEXT_PUBLIC_SUPABASE_URL="https://<ref>.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="<your-service-role-key>"

npx tsx scripts/seed-mock-data.ts
```

> ⚠️ Uses the **service-role key** (it writes past Row-Level Security to seed tables directly). Keep that key server-side only — never commit it or ship it to the browser.

## Prerequisites

1. The schema must already be applied — see [`supabase/README.md`](../supabase/README.md).
2. `date-fns` and `@supabase/supabase-js` (already in [`web/package.json`](../web/package.json)) — run from a context where those are installed, or install them alongside `tsx`.

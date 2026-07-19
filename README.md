<div align="center">

# 🍽️ TrayTrack

### Real-Time Buffet Tray Weight Monitoring — from load cell to live kitchen dashboard

**Stop guessing. Start weighing.** TrayTrack puts a smart scale under every buffet tray, streams the food level to a glanceable kitchen screen, and tells staff exactly what to cook and when — turning reactive over-preparation into predictive, waste-minimising service.

🏆 **Best Innovation Prize** · Young Trailblazers 2026 · Team **EcoWaves**, Republic Polytechnic Singapore

[![Live Demo](https://img.shields.io/badge/Live_Demo-web--three--weld--37.vercel.app-000000?style=for-the-badge&logo=vercel)](https://web-three-weld-37.vercel.app)
&nbsp;
![ESP32](https://img.shields.io/badge/Hardware-ESP32_+_HX711-E7352C?style=for-the-badge&logo=espressif&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)

*Live demo login: `admin@trailblazers.sg` / `Admin1234!` (shared demo account)*

</div>

---

## The problem in one paragraph

Hotel breakfast buffets systematically **over-prepare food** because kitchen staff have no live visibility into how much remains on each tray. Cooks prepare "just in case," react too late when a tray runs empty, and repeat the same mistakes every service with no data to learn from. Buffets are widely estimated to waste **25–40%** of food prepared. That's an environmental cost, a financial cost, and — under Singapore's *Resource Sustainability Act* — increasingly a regulatory one.

## What TrayTrack does about it

TrayTrack closes the loop between the **dining floor** and the **kitchen**:

| The old way | With TrayTrack |
|---|---|
| No idea how full each tray is | **Real-time weight** on a kitchen wall TV, updating live |
| "Is it low? Better cook more" | **Refill urgency** — OK · Refill Soon · Refill Now, colour-coded |
| React only when a tray is empty | **Cook suggestions** with a recommended batch size, *before* it empties |
| Over-portioning hidden by a capped "100%" | **Overfilled detection** flags trays loaded beyond capacity |
| No feedback loop | **Historical analytics** + guest-count-scaled demand |

---

## 🧠 How it works — end to end

```
┌──────────────────────────────────────────────────────────────────────────┐
│  HARDWARE (per tray)                                                       │
│                                                                            │
│   Tray platform → 4× 50 kg load cells (Wheatstone bridge)                  │
│        → HX711 24-bit ADC  → ESP32-WROOM-32U                               │
│        (grams, tared, averaged with outlier rejection, spike-debounced)    │
└───────────────────────────────┬────────────────────────────────────────────┘
                                 │  HTTPS POST every ~7 s  { sensor_id, weight_grams, ... }
                                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  BACKEND (Supabase)                                                        │
│   Edge Function `ingest-reading`  → validates, writes reading,            │
│        updates tray, marks sensor online, detects refills                 │
│   Postgres  → tray_dashboard_view computes food weight, % remaining,      │
│        colour code, sort order                                            │
└───────────────────────────────┬────────────────────────────────────────────┘
                                 │  Supabase Realtime (WebSocket)
                                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  FRONTEND (Next.js on Vercel)                                             │
│   Chef Dashboard   → glanceable tray grid + cook suggestions (TV)         │
│   Management screen → config, guests, procurement, analytics, admin       │
└──────────────────────────────────────────────────────────────────────────┘
```

**The core maths** — real-time and instant:

- `food weight = last sensor reading − container tare`
- `% remaining = food weight ÷ full-tray weight × 100`
- Urgency: `≤15%` → **Refill Now** (red) · `≤35%` → **Refill Soon** (amber) · else **OK** (green)
- Depletion rate and time-to-empty are derived from how fast the weight is dropping

---

## 📦 What's in this repository

TrayTrack is a monorepo. Each part has its **own detailed README** describing the design decisions and "how I built it":

| Part | Path | What it is | Deep-dive |
|---|---|---|---|
| 🔩 **Hardware & Firmware** | [`firmware/`](./firmware) | ESP32 + HX711 load-cell firmware: calibration, outlier-rejecting averaging, offline buffering, auto-reconnect. Wiring diagram + BOM included. | [firmware/README.md](./firmware/README.md) |
| 🗄️ **Backend & Database** | [`supabase/`](./supabase) | Postgres schema, Row-Level Security, the `tray_dashboard_view`, business-logic functions, and the `ingest-reading` Edge Function. | [supabase/README.md](./supabase/README.md) |
| 💻 **Web Dashboard** | [`web/`](./web) | Next.js 16 App Router app — the Chef TV dashboard and the Management screen, realtime hook, and the rules-based cook/consumption engines. | [web/README.md](./web/README.md) |
| 🌱 **Data Seeder** | [`scripts/`](./scripts) | 90-day mock-data generator modelling Singapore holiday & school-break seasonality, so the dashboard and analytics look real on day one. | [scripts/README.md](./scripts/README.md) |

```
EcoWaves-TrayTrack/
├── firmware/tray-sensor/     → ESP32 Arduino/PlatformIO firmware (modular C++)
├── supabase/
│   ├── migrations/           → full SQL schema, RLS, views, functions
│   └── functions/            → ingest-reading Edge Function (Deno/TS)
├── web/                      → Next.js 16 + TypeScript + Tailwind v4 dashboard
├── scripts/                  → mock-data seeder
└── PRD Real-Time Buffet Tray Weight v2.txt
```

---

## 🖥️ The two screens

| Screen | User | Route | What it does |
|---|---|---|---|
| **Chef Dashboard** | Kitchen staff, on a wall-mounted TV | `/chef` | Zero-interaction, glanceable live tray levels, urgency colours, cook prompts. Grid auto-fits a 16:9 screen — no scrolling. |
| **Management** | F&B manager / director, on a laptop | `/manage/*` | Configure dishes & sensors, log guest counts, procurement, analytics, sensor health, user roles. |

Role-based routing decides where you land: `chef` users go straight to the TV view; managers and admins land in `/manage`.

---

## 🛠️ Technology stack

| Layer | Technology |
|---|---|
| **Sensors** | 4× 50 kg strain-gauge load cells wired as a Wheatstone bridge + HX711 24-bit ADC |
| **Microcontroller** | ESP32-WROOM-32U, Arduino framework via PlatformIO |
| **Backend / Database** | Supabase — Postgres, Row-Level Security, Realtime, Edge Functions (Deno) |
| **Frontend** | Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn / Base UI · Recharts |
| **Hosting** | Vercel (Singapore region) |

---

## 🚀 Quick start

```bash
# 1. Clone
git clone https://github.com/morn-thuta/ecowaves-traytrack-ytb2026-best-innovation-.git
cd ecowaves-traytrack-ytb2026-best-innovation-

# 2. Backend — apply the schema to a Supabase project, then deploy the edge function
#    (see supabase/README.md for the full walk-through)

# 3. Web app
cd web
cp ../.env.local.example .env.local   # fill in your Supabase URL + keys
npm install
npm run dev                            # → http://localhost:3000

# 4. (Optional) seed 90 days of realistic demo data
npx tsx scripts/seed-mock-data.ts

# 5. Firmware — open firmware/tray-sensor in PlatformIO, set your WiFi + sensor
#    UUID in config.h, then Upload. See firmware/README.md.
```

Each subdirectory README has the full, step-by-step version.

---

## 📈 Why it matters (the pitch, honestly)

**Illustrative, benchmarkable savings model:**

```
350 covers/day × $10 food cost × 28% baseline waste × ~35% reduction × 365 days
   ≈ SGD 125,000 / year saved per outlet
```

- **Environmental** — cuts buffet food waste at the source; supports Singapore's food-waste reduction goals and hotel green certification.
- **Financial** — right-sized prep means less wasted food *and* less wasted labour cooking it.
- **Operational** — a reactive, experience-based kitchen becomes predictive and data-driven — and it's runnable by non-technical staff.

**Not hotel-specific.** The same hardware + software serves catering companies, corporate canteens, cruise lines, hospital/institutional buffets, and food courts. Luxury hotels are the beachhead, not the ceiling.

---

## 🗺️ Roadmap / in the live build

This repository is the working MVP foundation. A few features shown in the live competition build are on the roadmap to land in this codebase:

- **AI demand forecast** — an LLM (via OpenRouter) reasoning over 30 days of guest counts + per-dish data to recommend exact prep quantities for the next service, cached for instant display.
- **Guided onboarding tour** — a first-run walkthrough of the management screens.
- **CSV / PDF export** and bulk historical import.

---

## 👥 Team EcoWaves

Built by **Team EcoWaves** — Young Trailblazers, Republic Polytechnic Singapore. Winner of the **Best Innovation Prize**.

> *We turn a reactive, experience-based kitchen into a predictive, data-driven one.*

**Try it live → https://web-three-weld-37.vercel.app**

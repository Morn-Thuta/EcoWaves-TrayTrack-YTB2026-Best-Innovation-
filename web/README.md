# 💻 TrayTrack Web — Next.js Dashboard

The screens people actually look at. Two of them, on purpose:

- **Chef Dashboard** (`/chef`) — full-screen on a kitchen wall TV, readable from across the room, zero interaction required.
- **Management** (`/manage/*`) — a seated manager's control panel: configure dishes and sensors, log guests, run procurement, read analytics, manage users.

Built with **Next.js 16 (App Router)**, **TypeScript**, and **Tailwind CSS v4**. Data comes from [Supabase](../supabase/README.md) — read live via Realtime, computed server-side in a database view so the UI stays fast and simple.

---

## 🏗️ How it's put together

```
web/src/
├── app/
│   ├── page.tsx                → role-based redirect (chef → /chef, else → /manage)
│   ├── login/                  → Supabase email/password auth
│   ├── chef/                   → the TV dashboard (server component + realtime grid)
│   └── manage/
│       ├── layout.tsx          → tabbed shell, redirects chefs away
│       ├── config/             → dish + tray/sensor configuration
│       ├── guests/             → daily guest-count (pax) logging
│       ├── procurement/        → ingredient stock + purchase suggestions
│       ├── analytics/          → weight/refill/occupancy charts
│       ├── admin/              → user & role management
│       └── import/             → CSV bulk import
├── components/
│   ├── chef/                   → TrayGrid, TrayCard, CookSuggestionPanel, AlertBanner
│   ├── manage/                 → config tables, analytics, procurement, sensor status…
│   └── ui/                     → shadcn / Base UI primitives (button, card, dialog…)
├── hooks/
│   ├── useRealtimeTrays.ts     → live tray data via Supabase Realtime (+ 10 s poll fallback)
│   └── useAuth.ts              → auth state
├── lib/
│   ├── engine/                 → the decision logic (see below)
│   └── supabase/               → client / server / middleware helpers
└── types/
    ├── database.ts             → generated Supabase types
    └── domain.ts               → UI-facing types (TrayCardData, CookSuggestion…)
```

---

## 🖥️ Screen 1 — Chef Dashboard (`/chef`)

Designed to be read from **3–5 metres away** with **zero interaction** — it lives on a TV, not a desk.

- **`TrayGrid`** — subscribes to live data and lays cards out to **fit a 16:9 screen exactly**. The column/row count is computed (`cols = min(6, ceil(√(count × 16/9)))`) so *every* tray is visible at once — no scrolling, no pagination.
- **`TrayCard`** — the main tile: status pill (REFILL NOW / REFILL SOON / OK / OFFLINE / OVERFILLED), dish name, a big hero number, and a vertical fill bar. Overfill is detected by re-computing the raw (uncapped) percentage, so a tray loaded to 180% shows up instead of hiding behind a capped "100%".
- **`CookSuggestionPanel`** — a strip of up-to-4 cook prompts, sorted by urgency, each with a recommended batch size.
- **`AlertBanner`** — surfaces critical/offline conditions.

The Chef page is a **server component** that fetches today's occupancy and the 30-day historical average pax up front, then hands them to the client grid — so cook suggestions are demand-aware from first paint.

---

## 🖥️ Screen 2 — Management (`/manage/*`)

A tabbed shell (`manage/layout.tsx`) that redirects `chef`-role users back to the TV view. Tabs:

| Tab | Route | Purpose |
|---|---|---|
| **Config** | `/manage/config` | Edit dish settings and map sensors to trays |
| **Guests** | `/manage/guests` | Log today's pax, view occupancy history |
| **Procurement** | `/manage/procurement` | Ingredient stock and suggested purchase orders |
| **Analytics** | `/manage/analytics` | Weight / refill / occupancy charts (Recharts) |
| **Admin** | `/manage/admin` | User management and role assignment |
| **Import** | `/manage/import` | CSV bulk import |

---

## 🧠 The decision engines (`lib/engine/`)

The interesting logic is pure, testable TypeScript with no cloud calls — it runs client-side over the realtime data:

### `consumption.ts` — how fast is each tray emptying?
Keeps a rolling **5-minute in-memory history** per tray and derives:
- `getDepletionRate(trayId)` → grams/minute (positive = depleting)
- `getEstimatedMinutesToEmpty(tray)` → minutes until empty
- `getTrend(trayId)` → `up` (refilled) / `down` / `stable`
- `isStale(lastUpdatedAt)` → true if no update in > 60 s

### `cook-suggestion.ts` — what should I cook, and how much?
A **rules-based** engine (no ML, no API call). A suggestion fires when either:
1. `remaining_percent ≤ cook_trigger_percent` (per-dish threshold), **or**
2. the tray will empty before a fresh batch could be ready (`minutesToEmpty ≤ cookTime + 10`).

Then it **scales the batch size by demand** — if today's pax differs from the historical average, the recommended quantity scales proportionally — and tags each suggestion with an urgency (`immediate` / `soon` / `planned`) and a confidence level based on how much depletion data it has.

### `refill-detect.ts`
Client-side refill detection for display (a ≥ 500 g jump within 30 s). The **authoritative** detection lives in the database function `fn_detect_refill` — this is just for snappy UI feedback.

---

## 🔄 Realtime data flow

```
Edge Function updates trays.last_weight_grams
        │
        ▼  Supabase Realtime (WebSocket)
useRealtimeTrays()  → re-fetches tray_dashboard_view
        │             (+ 10 s poll fallback if the socket drops)
        ▼
TrayGrid re-renders  →  cards update live, no refresh
```

The frontend never computes urgency itself — it reads `color_code` and `remaining_percent` straight from the [database view](../supabase/README.md). One source of truth, browser and TV agree.

---

## 🚀 Local development

```bash
cd web
cp ../.env.local.example .env.local   # add your Supabase URL + anon key
npm install
npm run dev                            # → http://localhost:3000
```

| Script | Does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |

### Environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (browser) key for reads + realtime |

Both are safe to expose to the client — RLS on the database enforces what that key can actually do.

---

## 📦 Notable dependencies

| Package | Why |
|---|---|
| `next` 16 · `react` 19 | App Router, server components |
| `@supabase/ssr` · `@supabase/supabase-js` | Auth, data, realtime |
| `tailwindcss` v4 · `tw-animate-css` | Styling (uses `@import "tailwindcss"`, container queries) |
| `@base-ui/react` · `shadcn` · `lucide-react` | UI primitives + icons |
| `recharts` | Analytics charts |
| `papaparse` | CSV import parsing |
| `jspdf` · `jspdf-autotable` | PDF report export |
| `date-fns` | Date handling |

---

## 🎨 Design rules (why the Chef screen looks the way it does)

- **Glanceable first.** Font sizes use CSS **container queries** so text scales with the *card*, not the viewport — a tray card is legible whether there are 4 trays or 16.
- **No scroll on the Chef screen.** The grid fills the viewport exactly; cards shrink to fit.
- **Colour is meaning, not decoration.** Red = critical, amber = warning, green = healthy, blue = informational (overfilled), grey = offline/stale. Consistent everywhere.

> ℹ️ The in-app header currently reads "Tray Monitor" — the product brand is being standardised to **TrayTrack** across the UI.

Deployed on **Vercel** (Singapore region). Live: **https://web-three-weld-37.vercel.app**

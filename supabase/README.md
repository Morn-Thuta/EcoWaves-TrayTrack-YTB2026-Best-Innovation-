# 🗄️ TrayTrack Backend — Supabase (Postgres + Edge Functions + Realtime)

This is the brain between the sensors and the screens. It does four things:

1. **Ingests** weight readings from the ESP32 nodes (Edge Function).
2. **Stores** everything in Postgres — configuration, time-series readings, events.
3. **Computes** the derived numbers the dashboard needs (food weight, % remaining, urgency colour) in a database **view**, so the frontend stays dumb and fast.
4. **Pushes** live updates to every connected screen via **Supabase Realtime**.

Everything here is plain Postgres + Deno — no proprietary magic — so it's fully reproducible on any Supabase project.

---

## 📁 What's in this folder

```
supabase/
├── migrations/
│   └── 00001_create_tables.sql   → the entire schema: tables, enums, view,
│                                    functions, RLS policies, realtime, triggers
└── functions/
    └── ingest-reading/
        └── index.ts              → the HTTP endpoint the ESP32 posts to
```

---

## 🧩 Data model

### Enums

`user_role` · `tray_status` · `connection_status` · `alert_type` · `occupancy_source` — typed states instead of loose strings, so bad data can't sneak in.

### Core tables

| Table | What it holds |
|---|---|
| **`dishes`** | Menu items: full-tray weight, tare, batch size, cook trigger %, cook time, popularity, `dish_type`, soft-delete flag |
| **`trays`** | Physical tray slots: which dish, which sensor, last weight, tare, full weight, status, location |
| **`sensors`** | ESP32 units: calibration factor, connection status, last-seen, firmware version, battery |
| **`sensor_readings`** | Raw time-series weight data, retained indefinitely, indexed for time-range queries |
| **`daily_occupancy`** | Guest count (pax) per day — drives demand-scaled cook suggestions |
| **`refill_events`** | Auto-detected weight jumps (a tray got topped up) |
| **`batches`** | Cook-batch records: what was cooked, how much, why |
| **`ingredients`** | Per-dish ingredient list for procurement |
| **`procurement_suggestions`** | Rules/AI-based purchase suggestions with a confidence score |
| **`weight_aggregates`** | Pre-computed min/avg/max per tray per period, for fast analytics charts |
| **`alert_log`** | Triggered alerts (low / critical / offline / stale) |
| **`user_profiles`** | Role assignment, linked to Supabase Auth users |

### Relationships at a glance

```
dishes ──1:N──► trays ◄──1:1── sensors
                  │
                  ├──1:N──► sensor_readings
                  ├──1:N──► refill_events
                  ├──1:N──► weight_aggregates
                  └──1:N──► alert_log

dishes ──1:N──► ingredients ──1:N──► procurement_suggestions
dishes ──1:N──► batches
auth.users ──1:1──► user_profiles
```

---

## 👁️ The view that does the heavy lifting — `tray_dashboard_view`

Rather than make the frontend recompute urgency on every render, the logic lives in **one SQL view**. It joins `trays` + `dishes` + `sensors` and returns one flat, ready-to-render row per tray:

- **`food_weight_grams`** = `GREATEST(last_weight − tare, 0)` — food only, never negative
- **`remaining_percent`** = `food_weight ÷ full_tray_weight × 100`
- **`connection_status`** — from the sensor
- **`color_code`** — the single source of truth for urgency:

| Condition | Colour | Meaning |
|---|---|---|
| Sensor offline, or no update in > 60 s | `grey` | Can't trust it |
| `remaining ≤ 15%` | `red` | Refill Now |
| `remaining ≤ 35%` | `amber` | Refill Soon |
| otherwise | `green` | OK |

The view even **sorts** trays most-urgent-first (red → amber → green → grey), so the dashboard just renders in order.

---

## ⚙️ Business-logic functions

| Function | Purpose |
|---|---|
| `fn_update_tray_weight(sensor_id, weight, recorded_at)` | Updates a tray's weight and marks its sensor online |
| `fn_detect_refill(tray_id, threshold_grams)` | If the current weight jumped ≥ threshold above the recent 60-second minimum, logs a `refill_event` and returns true |
| `fn_calculate_consumption_rate(tray_id, window_minutes)` | Returns kg/min consumed over a time window (0 if weight isn't dropping) |
| `get_user_role()` | Returns the caller's role — used inside RLS policies |
| `update_updated_at()` | Trigger to keep `updated_at` columns honest |

---

## 🔐 Security — Row-Level Security (RLS)

Every table has RLS **enabled**, and access is gated by role via `get_user_role()`:

- **Everyone authenticated can read** dashboards, dishes, trays, readings.
- **Only `kitchen_manager` / `admin`** can edit dishes, trays, occupancy, ingredients.
- **Only `admin`** can create sensors, delete dishes, and manage other users' profiles.
- **Sensor readings are written by the Edge Function using the service-role key**, which bypasses RLS — so the public/anon key can never insert fake readings directly.

This means the browser client only ever holds the **anon key**, and the database itself enforces who can do what.

---

## 📡 Realtime

The migration ends with:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE trays;
```

That single line is what makes the kitchen TV update live: when the Edge Function updates a tray's `last_weight_grams`, Supabase broadcasts the change over a WebSocket, and the [`useRealtimeTrays`](../web/src/hooks/useRealtimeTrays.ts) hook re-fetches the view. A 10-second poll is kept as a fallback in case the socket drops.

---

## 🌐 The Edge Function — `ingest-reading`

This is the public HTTP endpoint the ESP32 nodes POST to. It runs on Deno at the edge and does everything in one round-trip:

1. **CORS preflight** handling for browser-based testing.
2. **Validate** the payload — `sensor_id` required, `weight_grams` must be within `−100…60000`.
3. **Verify** the sensor exists (404 if not — no phantom readings).
4. **Insert** the reading into `sensor_readings` (flagging whether it was averaged).
5. **Update** the tray's `last_weight_grams` → this is what fires Realtime.
6. **Mark** the sensor `online` and stamp `last_seen_at`.
7. **Detect refills** by calling `fn_detect_refill`.

It uses the **service-role key** (server-side only) so it can write past RLS, and returns clean JSON status codes the firmware branches on (`2xx` = success, anything else = buffer and retry).

---

## 🚀 Setup / local development

Using the [Supabase CLI](https://supabase.com/docs/guides/local-development):

```bash
# 1. Link to your project (or `supabase start` for a local stack)
supabase link --project-ref <your-project-ref>

# 2. Apply the schema
supabase db push
#   …or paste migrations/00001_create_tables.sql into the SQL editor

# 3. Deploy the ingestion endpoint
supabase functions deploy ingest-reading

# 4. Give the function its secrets
supabase secrets set SUPABASE_URL=https://<ref>.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

Then grab a sensor's UUID from the `sensors` table and drop it into the firmware's [`config.h`](../firmware/tray-sensor/config.h) as `SENSOR_ID`.

> 💡 Want realistic data without hardware? Run the [mock-data seeder](../scripts/README.md) to fill 90 days of history.

---

## 🔑 Environment variables

| Variable | Used by | Purpose |
|---|---|---|
| `SUPABASE_URL` | Edge Function | Project URL (server-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Function | Privileged writes past RLS |
| `NEXT_PUBLIC_SUPABASE_URL` | Web app | Project URL (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Web app | Public read/realtime key |

See [`.env.local.example`](../.env.local.example) at the repo root.

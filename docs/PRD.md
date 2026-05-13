# Product Requirements Document
## Tray Weightage Monitoring System — v1

**Project:** Hotel Breakfast Buffet Food Waste Reduction  
**Organisation:** Young Trailblazers  
**Stack:** Next.js (App Router) · Supabase · ESP32 + HX711 load cells  

---

## Problem

Hotel breakfast buffets over-prepare food because kitchen staff have no real-time visibility into how much food remains on each tray station. This leads to:
- Significant food waste at end of service (dishes cooked but not consumed)
- Rushed under-cooking if a dish empties unexpectedly
- No historical data to improve cook quantities service-over-service

---

## Solution

A real-time IoT monitoring system with two user-facing screens:

### 1 — Management Screen (`/manage/*`)
For hotel managers and F&B supervisors. Configure dishes, review analytics, log guest counts, and manage service settings.

### 2 — Chef / Kitchen TV Screen (`/chef`)
For kitchen staff. Full-screen, zero-interaction display on a wall-mounted TV. Shows all tray stations sorted by urgency with cook suggestions and estimated quantities.

---

## Features

### Dish Configuration (Stations tab)
- Create, edit, and delete dish definitions (name, full-tray weight, per-serving weight)
- Configure urgency thresholds: Low % / Medium % / High %
- Map physical sensor IDs to dishes

### Service Management (Service tab)
- Enter daily guest count (pax) — used to scale cook suggestions
- Log table arrivals (adults + children) — triggers live alert on chef screen
- Set service end time — drives countdown timer on chef screen

### Chef Screen
- Live tray cards sorted: RED (critical) → AMBER (low) → STALE → GREEN (healthy) → GREY (offline)
- Cook suggestion strip with estimated kg per dish
- Floating toast for table arrival alerts (auto-dismisses 15 s)
- No interaction required — designed for 2–3 metre viewing distance

### Analytics (Analytics tab)
- Historical waste trends per dish
- Busiest service windows
- Week-over-week waste delta

### Real-time Infrastructure
- Supabase Realtime for instant tray level updates
- 10-second polling fallback
- Stale data overlay if sensor hasn't reported in > 2 min

---

## Feature: Onboarding Tutorial

### Problem
A new manager landing on `/manage/config` for the first time has no guidance on:
- What order to set things up
- What each tab does
- How the chef screen relates to their configuration work

### Solution
A 9-step guided tutorial as a centered modal overlay, delivered as:
1. **Auto-trigger** on first login (gated by `localStorage` key `tray_monitor_tutorial_done`)
2. **Manual trigger** via a `?` button in the management header, accessible at any time

### Tutorial Steps

| # | Screen | Title |
|---|--------|-------|
| 0 | Any | Welcome to Tray Monitor |
| 1 | Stations | Dish Configuration |
| 2 | Stations | Tray Sensor Mapping |
| 3 | Service | Daily Guest Count |
| 4 | Service | Table Arrival Alerts |
| 5 | Service | Service Timer |
| 6 | Analytics | Analytics |
| 7 | Chef screen | The Chef Screen |
| 8 | Any | You're All Set! |

Each step navigates to the relevant tab so the user sees the actual UI behind the overlay.

### Behaviour
- Steps navigate the active tab via `router.push()` so context is visible behind the modal
- Keyboard: `→` / `Enter` = Next, `←` = Back, `Escape` = Skip
- Skip or completing the last step sets `tray_monitor_tutorial_done = "1"` in localStorage
- The `?` button always re-opens at step 0 without clearing the key
- Last step's "Next" button navigates to `/chef` and closes the overlay

### Success Metric
A first-time manager can complete initial setup (add a dish, map a sensor, enter pax, set service end time) within their first session without requiring support.

---

## Hardware

- **Sensors:** Platform-style 4-corner load cells (3-wire: RED/BLACK/WHITE), one per tray station
- **ADC:** HX711 24-bit ADC module
- **Wiring:** All RED → E+, all BLACK → E−, diagonal WHITE pairs → A+ / A−
- **MCU:** ESP32 — reads HX711 via SPI, POSTs JSON to Supabase Edge Function over Wi-Fi
- **Power:** USB or 5 V rail from hotel kitchen power strip

---

## Non-Goals (v1)

- Mobile app
- Multi-property / multi-hotel support
- Automated ordering / POS integration
- Customer-facing display

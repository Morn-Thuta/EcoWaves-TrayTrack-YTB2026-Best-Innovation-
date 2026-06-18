"use client";

import type { TrayCardData, ColorCode } from "@/types/domain";
import { getRefillStatus, REFILL_LABEL, refillToColorCode } from "@/lib/refill";

/* ── Colour map ─────────────────────────────────────────────────────── */
const COLOR_MAP: Record<
  ColorCode,
  { card: string; text: string; muted: string; badge: string; bar: string; barBg: string }
> = {
  green: {
    card:  "bg-green-950 border-green-600/50",
    text:  "text-green-50",
    muted: "text-green-300/50",
    badge: "bg-green-400/10 border border-green-500/30 text-green-300",
    bar:   "bg-green-400",
    barBg: "bg-black/40",
  },
  amber: {
    card:  "bg-amber-950 border-amber-600/50",
    text:  "text-amber-50",
    muted: "text-amber-300/50",
    badge: "bg-amber-400/10 border border-amber-500/30 text-amber-300",
    bar:   "bg-amber-400",
    barBg: "bg-black/40",
  },
  red: {
    card:  "bg-red-950 border-red-600/60 animate-urgent-glow",
    text:  "text-red-50",
    muted: "text-red-300/50",
    badge: "bg-red-500/15 border border-red-500/40 text-red-300",
    bar:   "bg-red-500",
    barBg: "bg-black/40",
  },
  grey: {
    card:  "bg-gray-800 border-gray-700/50",
    text:  "text-gray-400",
    muted: "text-gray-600",
    badge: "bg-gray-700/50 border border-gray-600/30 text-gray-500",
    bar:   "bg-gray-600",
    barBg: "bg-black/40",
  },
};

interface TrayCardProps {
  tray: TrayCardData;
}

export function TrayCard({ tray }: TrayCardProps) {
  const pct       = Math.min(100, Math.max(0, tray.remaining_percent ?? 0));
  const foodKg    = ((tray.food_weight_grams ?? 0) / 1000).toFixed(1);

  // Derive both the status (for label) and the colour from the fill %.
  // If the underlying state is "offline" (grey), keep that — refill makes no
  // sense for an offline sensor.
  const isOffline   = tray.color_code === "grey";
  const refill      = isOffline ? null : getRefillStatus(pct);
  const colorCode   = (isOffline ? "grey" : refillToColorCode(refill!)) as ColorCode;
  const colors      = COLOR_MAP[colorCode];
  const statusLabel = isOffline ? "OFFLINE" : REFILL_LABEL[refill!];

  return (
    <div
      className={[
        "relative rounded-2xl border-2 h-full flex gap-3 p-4",
        colors.card,
        // Smooth colour transition when urgency level changes
        "transition-colors duration-700",
      ].join(" ")}
    >
      {/* ── Vertical fill bar ──────────────────────────────────────── */}
      <div className="flex flex-col items-center flex-shrink-0 w-8 py-1">
        <div
          className={`relative w-full flex-1 rounded-full ${colors.barBg} overflow-hidden`}
        >
          {/* Guide lines at 75 / 50 / 25 % */}
          {[75, 50, 25].map((tick) => (
            <div
              key={tick}
              className="absolute left-0 right-0 border-t border-white/10"
              style={{ bottom: `${tick}%` }}
            />
          ))}
          {/* Fill — rises from bottom */}
          <div
            className={`absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out ${colors.bar}`}
            style={{ height: `${pct}%` }}
          />
        </div>
      </div>

      {/* ── Main content ───────────────────────────────────────────── */}
      <div className="flex flex-col justify-between flex-1 min-w-0 overflow-hidden">
        {/* Refill status badge */}
        <div>
          <span
            className={`inline-block text-[11px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full ${colors.badge}`}
          >
            {statusLabel}
          </span>
        </div>

        {/* Dish name — wraps at word boundaries to 2 lines */}
        <div className="flex-1 flex items-center my-2 min-w-0">
          <h2
            className={`font-black ${colors.text} leading-tight line-clamp-2 text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-3xl pr-1 w-full`}
            style={{ overflowWrap: "anywhere", wordBreak: "normal" }}
          >
            {tray.dish_name ?? "—"}
          </h2>
        </div>

        {/* Percentage + weight */}
        <div className="flex items-end gap-2">
          <span
            className={`font-black ${colors.text} leading-none text-5xl md:text-6xl xl:text-7xl 2xl:text-8xl`}
          >
            {Math.round(pct)}
            <span className="text-xl md:text-2xl xl:text-3xl font-bold opacity-60">%</span>
          </span>
          <span className={`font-bold ${colors.muted} pb-1 text-sm md:text-base xl:text-lg`}>
            {foodKg} kg
          </span>
        </div>
      </div>

      {/* ── Stale overlay ──────────────────────────────────────────── */}
      {tray.isStale && colorCode !== "grey" && (
        <div className="absolute inset-0 rounded-2xl bg-black/65 flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
          <span className="text-yellow-400 text-4xl">⚠</span>
          <span className="text-yellow-400 font-black tracking-widest text-lg">
            STALE DATA
          </span>
          <span className="text-yellow-200/60 text-sm">
            {tray.last_updated_at
              ? new Date(tray.last_updated_at).toLocaleTimeString("en-SG", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—"}
          </span>
        </div>
      )}
    </div>
  );
}

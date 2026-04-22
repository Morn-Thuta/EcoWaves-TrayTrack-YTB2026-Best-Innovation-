"use client";

import type { TrayCardData, ColorCode } from "@/types/domain";

const COLOR_MAP: Record<ColorCode, { bg: string; text: string; border: string; badge: string; bar: string; barBg: string }> = {
  green: { bg: "bg-green-900",  text: "text-green-100",  border: "border-green-700",  badge: "bg-green-300 text-green-900", bar: "bg-green-400",  barBg: "bg-green-950" },
  amber: { bg: "bg-amber-900",  text: "text-amber-100",  border: "border-amber-600",  badge: "bg-amber-500 text-white",     bar: "bg-amber-400",  barBg: "bg-amber-950" },
  red:   { bg: "bg-red-900",    text: "text-red-100",    border: "border-red-600",    badge: "bg-red-600 text-white",       bar: "bg-red-500",    barBg: "bg-red-950"  },
  grey:  { bg: "bg-gray-800",   text: "text-gray-300",   border: "border-gray-600",   badge: "bg-gray-600 text-white",      bar: "bg-gray-500",   barBg: "bg-gray-900" },
};

// Fill level labels
const LEVEL_LABEL: Record<ColorCode, string> = {
  green: "HIGH",
  amber: "MEDIUM",
  red:   "LOW",
  grey:  "OFFLINE",
};

interface TrayCardProps {
  tray: TrayCardData;
  onClick?: () => void;
}

export function TrayCard({ tray, onClick }: TrayCardProps) {
  const colorCode = (tray.color_code ?? "grey") as ColorCode;
  const colors = COLOR_MAP[colorCode];
  const pct = Math.min(100, Math.max(0, tray.remaining_percent ?? 0));
  const foodKg = ((tray.food_weight_grams ?? 0) / 1000).toFixed(1);
  const lastUpdateSeconds = Math.round(
    (Date.now() - new Date(tray.last_updated_at ?? Date.now()).getTime()) / 1000
  );

  return (
    <div
      onClick={onClick}
      className={`relative rounded-2xl border-2 ${colors.bg} ${colors.border} p-4 flex gap-4 min-h-[180px]${onClick ? " cursor-pointer hover:brightness-110 transition-all" : ""}`}
    >
      {/* ── Vertical fill bar (left) ─────────────────────────────────── */}
      <div className="flex flex-col items-center gap-1 flex-shrink-0">
        {/* Tick marks */}
        <span className={`text-[10px] font-bold ${colors.text} opacity-40`}>F</span>
        <div className={`relative w-6 flex-1 rounded-full ${colors.barBg} overflow-hidden`}>
          {/* Fill rises from the bottom */}
          <div
            className={`absolute bottom-0 left-0 right-0 rounded-full transition-all duration-700 ${colors.bar}`}
            style={{ height: `${pct}%` }}
          />
          {/* 50% tick line */}
          <div className="absolute left-0 right-0 border-t border-white/20" style={{ bottom: "50%" }} />
        </div>
        <span className={`text-[10px] font-bold ${colors.text} opacity-40`}>E</span>
      </div>

      {/* ── Main content (right of bar) ───────────────────────────────── */}
      <div className="flex flex-col justify-between flex-1 min-w-0">
        {/* Top row: badge + time */}
        <div className="flex items-start justify-between gap-2">
          <span className={`text-xs font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${colors.badge}`}>
            {LEVEL_LABEL[colorCode]}
          </span>
          <span className={`text-xs ${colors.text} opacity-40 flex-shrink-0`}>
            {lastUpdateSeconds < 60
              ? `${lastUpdateSeconds}s ago`
              : `${Math.floor(lastUpdateSeconds / 60)}m ago`}
          </span>
        </div>

        {/* Dish name */}
        <div className="mt-2">
          <h2 className={`text-xl font-bold ${colors.text} leading-tight truncate`}>
            {tray.dish_name}
          </h2>
          {tray.location && (
            <p className={`text-xs font-semibold ${colors.text} opacity-60 mt-0.5`}>
              📍 {tray.location}
            </p>
          )}
        </div>

        {/* Big percentage + kg */}
        <div className="flex items-end gap-2 mt-auto pt-3">
          <span className={`text-5xl font-black ${colors.text} leading-none`}>
            {Math.round(pct)}
            <span className="text-xl font-bold">%</span>
          </span>
          <span className={`text-base font-bold ${colors.text} opacity-70 pb-1`}>
            {foodKg} kg
          </span>
        </div>
      </div>

      {/* ── Stale overlay ─────────────────────────────────────────────── */}
      {tray.isStale && colorCode !== "grey" && (
        <div className="absolute inset-0 rounded-2xl bg-black/60 flex flex-col items-center justify-center gap-2">
          <span className="text-yellow-400 text-xl font-black tracking-widest">STALE DATA</span>
          <span className="text-yellow-200 text-xs">
            Last: {tray.last_updated_at ? new Date(tray.last_updated_at).toLocaleTimeString() : "—"}
          </span>
        </div>
      )}
    </div>
  );
}

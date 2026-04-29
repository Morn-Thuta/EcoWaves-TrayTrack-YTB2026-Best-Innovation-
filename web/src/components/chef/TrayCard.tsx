"use client";

import type { TrayCardData, ColorCode } from "@/types/domain";

const COLOR_MAP: Record<
  ColorCode,
  {
    card: string;
    text: string;
    muted: string;
    badge: string;
    bar: string;
    barBg: string;
  }
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
    card:  "bg-red-950 border-red-600/60 ring-1 ring-red-500/20",
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
      className={[
        "relative rounded-2xl border-2 flex gap-3 p-4 min-h-[180px]",
        colors.card,
        onClick
          ? "cursor-pointer transition-all duration-150 hover:brightness-110 hover:scale-[1.01] active:scale-95"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* ── Vertical fill bar ────────────────────────────────────────────── */}
      <div className="flex flex-col items-center flex-shrink-0 w-5 py-0.5">
        <div className={`relative w-full flex-1 rounded-full ${colors.barBg} overflow-hidden`}>
          {/* Guide lines at 75 / 50 / 25 % */}
          {[75, 50, 25].map((tick) => (
            <div
              key={tick}
              className="absolute left-0 right-0 border-t border-white/10"
              style={{ bottom: `${tick}%` }}
            />
          ))}
          {/* Fill — rises from bottom; no own rounding, container clips */}
          <div
            className={`absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out ${colors.bar}`}
            style={{ height: `${pct}%` }}
          />
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex flex-col justify-between flex-1 min-w-0">
        {/* Level badge + last-update */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-[11px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${colors.badge}`}
          >
            {LEVEL_LABEL[colorCode]}
          </span>
          <span className={`text-[10px] ${colors.muted} flex-shrink-0`}>
            {lastUpdateSeconds < 60
              ? `${lastUpdateSeconds}s ago`
              : `${Math.floor(lastUpdateSeconds / 60)}m ago`}
          </span>
        </div>

        {/* Dish name + location */}
        <div className="flex-1 mt-2">
          <h2 className={`text-lg font-bold ${colors.text} leading-tight line-clamp-2`}>
            {tray.dish_name ?? "—"}
          </h2>
          {tray.location && (
            <p className={`text-xs ${colors.muted} mt-0.5 truncate`}>
              {tray.location}
            </p>
          )}
        </div>

        {/* Percentage + weight */}
        <div className="flex items-end gap-2 mt-2">
          <span className={`text-5xl font-black ${colors.text} leading-none`}>
            {Math.round(pct)}
            <span className="text-xl font-bold opacity-60">%</span>
          </span>
          <span className={`text-sm font-semibold ${colors.muted} pb-1`}>
            {foodKg} kg
          </span>
        </div>
      </div>

      {/* ── Stale overlay ────────────────────────────────────────────────── */}
      {tray.isStale && colorCode !== "grey" && (
        <div className="absolute inset-0 rounded-2xl bg-black/65 flex flex-col items-center justify-center gap-1.5 backdrop-blur-sm">
          <span className="text-yellow-400 text-2xl">⚠</span>
          <span className="text-yellow-400 text-sm font-black tracking-widest">
            STALE DATA
          </span>
          <span className="text-yellow-200/60 text-xs">
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

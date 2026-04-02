"use client";

import type { TrayCardData } from "@/types/domain";
import type { ColorCode } from "@/types/database";

const COLOR_MAP: Record<ColorCode, { bg: string; text: string; border: string; badge: string }> = {
  green:  { bg: "bg-green-900",  text: "text-green-100",  border: "border-green-700",  badge: "bg-green-600 text-white" },
  amber:  { bg: "bg-amber-900",  text: "text-amber-100",  border: "border-amber-600",  badge: "bg-amber-500 text-white" },
  red:    { bg: "bg-red-900",    text: "text-red-100",    border: "border-red-600",    badge: "bg-red-600 text-white" },
  grey:   { bg: "bg-gray-800",   text: "text-gray-300",   border: "border-gray-600",   badge: "bg-gray-600 text-white" },
};

const STATUS_LABEL: Record<ColorCode, string> = {
  green: "HEALTHY",
  amber: "LOW",
  red:   "CRITICAL",
  grey:  "OFFLINE",
};

const TREND_ICONS: Record<TrayCardData["trend"], string> = {
  up:     "↑",
  down:   "↓",
  stable: "→",
};

interface TrayCardProps {
  tray: TrayCardData;
}

export function TrayCard({ tray }: TrayCardProps) {
  const colors = COLOR_MAP[tray.color_code];
  const foodKg = (tray.food_weight_grams / 1000).toFixed(1);
  const lastUpdateSeconds = Math.round(
    (Date.now() - new Date(tray.last_updated_at).getTime()) / 1000
  );

  return (
    <div
      className={`relative rounded-2xl border-2 ${colors.bg} ${colors.border} p-6 flex flex-col gap-3 min-h-[220px]`}
    >
      {/* Status badge */}
      <div className="flex items-start justify-between">
        <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${colors.badge}`}>
          {STATUS_LABEL[tray.color_code]}
        </span>
        <span className={`text-xs ${colors.text} opacity-70`}>
          {lastUpdateSeconds < 60
            ? `${lastUpdateSeconds}s ago`
            : `${Math.floor(lastUpdateSeconds / 60)}m ago`}
        </span>
      </div>

      {/* Dish name */}
      <h2 className={`text-2xl font-bold ${colors.text} leading-tight`}>
        {tray.dish_name}
      </h2>

      {/* Percentage — very large, primary info */}
      <div className="flex items-end gap-3">
        <span className={`text-7xl font-black ${colors.text} leading-none`}>
          {Math.round(tray.remaining_percent)}
          <span className="text-3xl font-bold">%</span>
        </span>
        <div className="flex flex-col pb-2 gap-1">
          <span className={`text-xl font-semibold ${colors.text}`}>
            {TREND_ICONS[tray.trend]}
          </span>
          <span className={`text-sm font-medium ${colors.text} opacity-80`}>
            {foodKg} kg
          </span>
        </div>
      </div>

      {/* Minutes to empty */}
      {tray.estimatedMinutesToEmpty !== null && tray.color_code !== "grey" && (
        <p className={`text-base font-semibold ${colors.text} opacity-90`}>
          ~{tray.estimatedMinutesToEmpty} min to empty
        </p>
      )}

      {/* Tray location */}
      {tray.location && (
        <p className={`text-xs ${colors.text} opacity-60 uppercase tracking-wide`}>
          {tray.location}
        </p>
      )}

      {/* Stale overlay */}
      {tray.isStale && tray.color_code !== "grey" && (
        <div className="absolute inset-0 rounded-2xl bg-black/60 flex flex-col items-center justify-center gap-2">
          <span className="text-yellow-400 text-2xl font-black tracking-widest">
            STALE DATA
          </span>
          <span className="text-yellow-200 text-sm">
            Last: {new Date(tray.last_updated_at).toLocaleTimeString()}
          </span>
        </div>
      )}
    </div>
  );
}

"use client";

import type { TrayCardData, ColorCode } from "@/types/domain";

const COLOR_MAP: Record<ColorCode, { bg: string; text: string; border: string; badge: string }> = {
  green: { bg: "bg-green-900",  text: "text-green-100",  border: "border-green-700",  badge: "bg-green-300 text-green-900" },
  amber: { bg: "bg-amber-900",  text: "text-amber-100",  border: "border-amber-600",  badge: "bg-amber-500 text-white" },
  red:   { bg: "bg-red-900",    text: "text-red-100",    border: "border-red-600",    badge: "bg-red-600 text-white" },
  grey:  { bg: "bg-gray-800",   text: "text-gray-300",   border: "border-gray-600",   badge: "bg-gray-600 text-white" },
};

// Fill level: HIGH = plenty, MEDIUM = getting low, LOW = near empty
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
  const foodKg = ((tray.food_weight_grams ?? 0) / 1000).toFixed(1);
  const lastUpdateSeconds = Math.round(
    (Date.now() - new Date(tray.last_updated_at ?? Date.now()).getTime()) / 1000
  );

  return (
    <div
      onClick={onClick}
      className={`relative rounded-2xl border-2 ${colors.bg} ${colors.border} p-6 flex flex-col gap-3 min-h-[200px]${onClick ? " cursor-pointer hover:brightness-110 transition-all" : ""}`}
    >
      {/* Level badge + last update */}
      <div className="flex items-start justify-between">
        <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${colors.badge}`}>
          {LEVEL_LABEL[colorCode]}
        </span>
        <span className={`text-xs font-medium ${colors.text} opacity-50`}>
          {lastUpdateSeconds < 60
            ? `${lastUpdateSeconds}s ago`
            : `${Math.floor(lastUpdateSeconds / 60)}m ago`}
        </span>
      </div>

      {/* Dish name + station */}
      <div>
        <h2 className={`text-2xl font-bold ${colors.text} leading-tight`}>
          {tray.dish_name}
        </h2>
        {tray.location && (
          <p className={`text-sm font-semibold ${colors.text} opacity-70 mt-1`}>
            📍 {tray.location}
          </p>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full">
        <div className="flex justify-between items-center mb-1.5">
          <span className={`text-xs font-medium ${colors.text} opacity-50`}>Level</span>
          <span className={`text-xs font-bold ${colors.text}`}>
            {Math.round(tray.remaining_percent ?? 0)}%
          </span>
        </div>
        <div className="w-full h-4 rounded-full bg-black/30 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              colorCode === "green" ? "bg-green-400" :
              colorCode === "amber" ? "bg-amber-400" :
              colorCode === "red"   ? "bg-red-500"   : "bg-gray-500"
            }`}
            style={{ width: `${Math.min(100, Math.max(0, tray.remaining_percent ?? 0))}%` }}
          />
        </div>
      </div>

      {/* Percentage + kg */}
      <div className="flex items-end gap-4">
        <span className={`text-6xl font-black ${colors.text} leading-none`}>
          {Math.round(tray.remaining_percent ?? 0)}
          <span className="text-2xl font-bold">%</span>
        </span>
        <span className={`text-xl font-bold ${colors.text} pb-2`}>
          {foodKg} kg
        </span>
      </div>

      {/* Stale overlay */}
      {tray.isStale && colorCode !== "grey" && (
        <div className="absolute inset-0 rounded-2xl bg-black/60 flex flex-col items-center justify-center gap-2">
          <span className="text-yellow-400 text-2xl font-black tracking-widest">
            STALE DATA
          </span>
          <span className="text-yellow-200 text-sm">
            Last: {tray.last_updated_at ? new Date(tray.last_updated_at).toLocaleTimeString() : "—"}
          </span>
        </div>
      )}
    </div>
  );
}

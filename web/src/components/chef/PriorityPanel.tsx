"use client";

import { useState } from "react";
import type { TrayCardData, ColorCode } from "@/types/domain";

interface PriorityPanelProps {
  trays: TrayCardData[];
  onSelectTray: (tray: TrayCardData) => void;
}

const URGENCY_ORDER: Record<ColorCode, number> = {
  red: 0, amber: 1, grey: 3, green: 2,
};

const DOT: Record<ColorCode, string> = {
  red:   "bg-red-500",
  amber: "bg-amber-400",
  green: "bg-green-400",
  grey:  "bg-gray-500",
};

const LEVEL_LABEL: Record<ColorCode, string> = {
  green: "HIGH",
  amber: "MEDIUM",
  red:   "LOW",
  grey:  "OFFLINE",
};

const LEVEL_PILL: Record<ColorCode, string> = {
  green: "text-green-300 bg-green-400/10 border border-green-500/30",
  amber: "text-amber-300 bg-amber-400/10 border border-amber-500/30",
  red:   "text-red-300 bg-red-500/15 border border-red-500/40",
  grey:  "text-gray-400 bg-gray-700/50 border border-gray-600/30",
};

export function PriorityPanel({ trays, onSelectTray }: PriorityPanelProps) {
  const [expanded, setExpanded] = useState(false);

  const alertTrays = trays
    .filter((t) => {
      const c = (t.color_code ?? "grey") as ColorCode;
      return c !== "green" || t.isStale;
    })
    .sort((a, b) => {
      const ca = (a.color_code ?? "grey") as ColorCode;
      const cb = (b.color_code ?? "grey") as ColorCode;
      const staleA = a.isStale && ca !== "grey" ? 2.5 : URGENCY_ORDER[ca];
      const staleB = b.isStale && cb !== "grey" ? 2.5 : URGENCY_ORDER[cb];
      return staleA - staleB;
    });

  // All stations healthy state
  if (alertTrays.length === 0) {
    return (
      <div className="bg-green-950/40 border border-green-700/40 rounded-xl px-5 py-3 flex items-center gap-3">
        <span className="relative flex h-3 w-3 flex-shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-50" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-green-400" />
        </span>
        <span className="text-green-100 font-semibold text-base">
          All stations healthy
        </span>
      </div>
    );
  }

  const visible = expanded ? alertTrays : alertTrays.slice(0, 4);

  return (
    <div className="rounded-xl border border-gray-700/60 overflow-hidden">
      <div className="divide-y divide-gray-800/80">
        {visible.map((tray) => {
          const c = (tray.color_code ?? "grey") as ColorCode;
          const isStaleAlert = tray.isStale && c !== "grey";
          return (
            <button
              key={tray.tray_id}
              onClick={() => onSelectTray(tray)}
              className="w-full flex items-center gap-3 px-5 py-3 bg-gray-950 hover:bg-gray-900 transition-colors duration-150 text-left active:brightness-90"
            >
              {/* Status dot */}
              <span
                className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  isStaleAlert ? "bg-yellow-400" : DOT[c]
                }`}
              />
              {/* Dish name */}
              <span className="text-white font-semibold flex-1 truncate text-sm">
                {tray.dish_name}
              </span>
              {/* Location */}
              <span className="text-gray-500 text-xs flex-shrink-0 hidden sm:block">
                {tray.location}
              </span>
              {/* Level pill */}
              <span
                className={`text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex-shrink-0 ${
                  isStaleAlert
                    ? "text-yellow-300 bg-yellow-400/10 border border-yellow-500/30"
                    : LEVEL_PILL[c]
                }`}
              >
                {isStaleAlert ? "STALE" : LEVEL_LABEL[c]}
              </span>
              {/* Percentage */}
              <span className="text-white font-bold text-sm w-10 text-right flex-shrink-0 tabular-nums">
                {Math.round(tray.remaining_percent ?? 0)}%
              </span>
              {/* Chevron */}
              <span className="text-gray-600 text-xs flex-shrink-0">›</span>
            </button>
          );
        })}
      </div>

      {alertTrays.length > 4 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full px-5 py-2 text-gray-400 hover:text-white text-xs font-semibold bg-gray-900 hover:bg-gray-800 transition-colors duration-150 text-center"
        >
          {expanded ? "Show less ↑" : `Show all ${alertTrays.length} ↓`}
        </button>
      )}
    </div>
  );
}

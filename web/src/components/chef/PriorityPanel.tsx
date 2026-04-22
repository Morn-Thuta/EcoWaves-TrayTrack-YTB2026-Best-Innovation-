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
  amber: "bg-amber-500",
  green: "bg-green-500",
  grey:  "bg-gray-500",
};

const LEVEL_LABEL: Record<ColorCode, string> = {
  green: "HIGH",
  amber: "MEDIUM",
  red:   "LOW",
  grey:  "OFFLINE",
};

const LEVEL_COLOR: Record<ColorCode, string> = {
  green: "text-green-400 bg-green-950",
  amber: "text-amber-400 bg-amber-950",
  red:   "text-red-400 bg-red-950",
  grey:  "text-gray-400 bg-gray-800",
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

  if (alertTrays.length === 0) {
    return (
      <div className="bg-green-900/30 border border-green-700 rounded-xl px-6 py-3 flex items-center gap-3">
        <span className="text-green-400 text-xl">✓</span>
        <span className="text-green-100 font-semibold text-lg">All stations healthy</span>
      </div>
    );
  }

  const visible = expanded ? alertTrays : alertTrays.slice(0, 4);

  return (
    <div className="rounded-xl border border-gray-700 overflow-hidden">
      <div className="divide-y divide-gray-800">
        {visible.map((tray) => {
          const c = (tray.color_code ?? "grey") as ColorCode;
          const isStaleAlert = tray.isStale && c !== "grey";
          return (
            <button
              key={tray.tray_id}
              onClick={() => onSelectTray(tray)}
              className="w-full flex items-center gap-3 px-5 py-3.5 bg-gray-950 hover:bg-gray-900 transition-colors text-left"
            >
              <span
                className={`w-3 h-3 rounded-full flex-shrink-0 ${
                  isStaleAlert ? "bg-yellow-400" : DOT[c]
                }`}
              />
              <span className="text-white font-semibold flex-1 truncate">
                {tray.dish_name}
              </span>
              <span className="text-gray-400 text-sm flex-shrink-0">
                {tray.location}
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                  isStaleAlert ? "text-yellow-400 bg-yellow-950" : LEVEL_COLOR[c]
                }`}
              >
                {isStaleAlert ? "STALE" : LEVEL_LABEL[c]}
              </span>
              <span className="text-white font-bold text-sm w-10 text-right flex-shrink-0">
                {Math.round(tray.remaining_percent ?? 0)}%
              </span>
            </button>
          );
        })}
      </div>

      {alertTrays.length > 4 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full px-5 py-2 text-gray-400 hover:text-white text-xs font-semibold bg-gray-900 hover:bg-gray-800 transition-colors text-center"
        >
          {expanded ? "Show less ↑" : `Show all ${alertTrays.length} ↓`}
        </button>
      )}
    </div>
  );
}

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

function formatMin(minutes: number | null): string {
  if (minutes === null) return "—";
  if (minutes < 60) return `~${minutes}m`;
  return `~${Math.floor(minutes / 60)}h ${minutes % 60 > 0 ? `${minutes % 60}m` : ""}`.trim();
}

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
      <div className="bg-green-900 border border-green-700 rounded-xl px-6 py-3 flex items-center gap-3">
        <span className="text-green-400 text-xl">✓</span>
        <span className="text-green-100 font-semibold text-lg">All trays healthy</span>
      </div>
    );
  }

  const visible = expanded ? alertTrays : alertTrays.slice(0, 3);
  const criticalCount = alertTrays.filter((t) => (t.color_code ?? "grey") === "red").length;
  const headerBg = criticalCount > 0 ? "bg-red-950 border-red-700" : "bg-amber-950 border-amber-700";
  const headerText = criticalCount > 0 ? "text-red-300" : "text-amber-300";

  return (
    <div className={`rounded-xl border ${headerBg} overflow-hidden`}>
      {/* Header */}
      <div className={`px-5 py-2.5 flex items-center justify-between`}>
        <span className={`text-xs font-black uppercase tracking-widest ${headerText}`}>
          ⚠ {alertTrays.length} tray{alertTrays.length > 1 ? "s" : ""} need attention
        </span>
        <span className="text-gray-500 text-xs">tap row to inspect</span>
      </div>

      {/* Ranked rows */}
      <div className="divide-y divide-gray-800">
        {visible.map((tray) => {
          const c = (tray.color_code ?? "grey") as ColorCode;
          return (
            <button
              key={tray.tray_id}
              onClick={() => onSelectTray(tray)}
              className="w-full flex items-center gap-3 px-5 py-3 bg-gray-950 hover:bg-gray-900 transition-colors text-left"
            >
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${tray.isStale && c !== "grey" ? "bg-yellow-400" : DOT[c]}`} />
              <span className="text-white font-semibold flex-1 truncate">{tray.dish_name}</span>
              <span className="text-gray-400 text-sm flex-shrink-0">{tray.location}</span>
              <span className="text-white font-bold text-sm w-10 text-right flex-shrink-0">
                {Math.round(tray.remaining_percent ?? 0)}%
              </span>
              <span className="text-gray-400 text-sm w-16 text-right flex-shrink-0">
                {tray.isStale ? "STALE" : formatMin(tray.estimatedMinutesToEmpty)}
              </span>
            </button>
          );
        })}
      </div>

      {alertTrays.length > 3 && (
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

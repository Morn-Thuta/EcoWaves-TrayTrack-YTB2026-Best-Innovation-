"use client";

import { useEffect, useState, useRef } from "react";
import { TrayCard } from "./TrayCard";
import { CookSuggestionPanel } from "./CookSuggestionPanel";
import { useRealtimeTrays } from "@/hooks/useRealtimeTrays";
import { useRealtimeOccupancy } from "@/hooks/useRealtimeOccupancy";
import {
  recordWeight,
  getEstimatedMinutesToEmpty,
  getTrend,
  isStale,
} from "@/lib/engine/consumption";
import { getAllCookSuggestions } from "@/lib/engine/cook-suggestion";
import { createClient } from "@/lib/supabase/client";
import type { TrayCardData, ColorCode } from "@/types/domain";

interface TrayGridProps {
  historicalAvgPax: number | null;
}

/* ── Urgency sort (red first, then amber, stale, green, grey) ────────── */
const URGENCY_ORDER: Record<ColorCode, number> = {
  red: 0,
  amber: 1,
  green: 2,
  grey: 3,
};

function sortByUrgency(trays: TrayCardData[]): TrayCardData[] {
  return [...trays].sort((a, b) => {
    const ca = (a.color_code ?? "grey") as ColorCode;
    const cb = (b.color_code ?? "grey") as ColorCode;
    const sa = a.isStale && ca !== "grey" ? 1.5 : URGENCY_ORDER[ca];
    const sb = b.isStale && cb !== "grey" ? 1.5 : URGENCY_ORDER[cb];
    return sa - sb;
  });
}

/* ── Dynamic grid config based on tray count ─────────────────────────── */
function getGridCols(count: number): number {
  if (count <= 3) return count;
  if (count <= 6) return Math.min(count, 4);
  if (count <= 8) return 4;
  if (count <= 10) return 5;
  return 4;
}

/* ── Table arrival toast ─────────────────────────────────────────────── */
interface TableToast {
  id: string;
  note: string;
  time: string;
}

export function TrayGrid({ historicalAvgPax }: TrayGridProps) {
  const { trays, loading } = useRealtimeTrays();
  const { todayPax } = useRealtimeOccupancy();

  /* ── Table alert toasts ──────────────────────────────────────────── */
  const [toasts, setToasts] = useState<TableToast[]>([]);
  const channelRef = useRef<ReturnType<
    ReturnType<typeof createClient>["channel"]
  > | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("service-alerts")
      .on("broadcast", { event: "table_arrived" }, ({ payload }: { payload: Record<string, unknown> }) => {
        const toast: TableToast = {
          id: `${Date.now()}`,
          note:
            (payload.note as string) ||
            `Table of ${payload.partySize} arrived`,
          time:
            (payload.time as string) ??
            new Date().toLocaleTimeString("en-SG", {
              hour: "2-digit",
              minute: "2-digit",
            }),
        };
        setToasts((prev) => [toast, ...prev].slice(0, 2));
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== toast.id));
        }, 15000);
      })
      .subscribe();

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Feed consumption engine ─────────────────────────────────────── */
  useEffect(() => {
    trays.forEach((tray) => {
      if (tray.tray_id) recordWeight(tray.tray_id, tray.last_weight_grams ?? 0);
    });
  }, [trays]);

  /* ── Loading skeleton ────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="h-full grid grid-cols-4 gap-3">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border-2 border-gray-800 bg-gray-900 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (trays.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
        <span className="text-5xl opacity-20">📦</span>
        <p className="text-gray-500 text-lg font-medium">
          No active trays configured.
        </p>
      </div>
    );
  }

  /* ── Enrich + sort ───────────────────────────────────────────────── */
  const enrichedTrays: TrayCardData[] = trays.map((tray) => ({
    ...tray,
    trend: getTrend(tray.tray_id ?? ""),
    estimatedMinutesToEmpty: getEstimatedMinutesToEmpty(tray),
    isStale: isStale(tray.last_updated_at ?? new Date(0).toISOString()),
    depletionRateGramsPerMin: null,
  }));

  const sortedTrays = sortByUrgency(enrichedTrays);
  const cookSuggestions = getAllCookSuggestions(trays, todayPax, historicalAvgPax);
  const cols = getGridCols(sortedTrays.length);

  return (
    <div className="h-full flex flex-col gap-3 relative">
      {/* ── Cook suggestion strip (conditional) ──────────────────────── */}
      {cookSuggestions.length > 0 && (
        <div className="flex-shrink-0">
          <CookSuggestionPanel suggestions={cookSuggestions} />
        </div>
      )}

      {/* ── Tray card grid — fills all remaining space ───────────────── */}
      <div
        className="flex-1 min-h-0 grid gap-3"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        }}
      >
        {sortedTrays.map((tray) => (
          <TrayCard key={tray.tray_id} tray={tray} />
        ))}
      </div>

      {/* ── Table arrival toast overlay ───────────────────────────────── */}
      {toasts.length > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-10 pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="animate-slide-down bg-blue-900/90 border border-blue-600/40 backdrop-blur-sm rounded-xl px-6 py-3 flex items-center gap-3 shadow-xl"
            >
              <span className="text-blue-300 text-lg">🪑</span>
              <span className="text-blue-100 font-bold text-sm">
                {toast.note}
              </span>
              <span className="text-blue-400/60 text-xs">{toast.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

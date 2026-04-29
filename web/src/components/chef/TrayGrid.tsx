"use client";

import { useEffect, useState } from "react";
import { TrayCard } from "./TrayCard";
import { TrayDetailModal } from "./TrayDetailModal";
import { PriorityPanel } from "./PriorityPanel";
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
import type { TrayCardData } from "@/types/domain";

interface TrayGridProps {
  historicalAvgPax: number | null;
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border-2 border-gray-800 bg-gray-900 p-4 min-h-[180px] flex gap-3 animate-pulse">
      <div className="w-5 rounded-full bg-gray-800 flex-shrink-0" />
      <div className="flex flex-col justify-between flex-1 gap-3">
        <div className="h-5 w-16 rounded-full bg-gray-800" />
        <div className="space-y-1.5">
          <div className="h-5 w-3/4 rounded bg-gray-800" />
          <div className="h-3 w-1/3 rounded bg-gray-800" />
        </div>
        <div className="h-10 w-24 rounded bg-gray-800" />
      </div>
    </div>
  );
}

export function TrayGrid({ historicalAvgPax }: TrayGridProps) {
  const { trays, loading, lastUpdated } = useRealtimeTrays();
  const { todayPax } = useRealtimeOccupancy();
  const [selectedTray, setSelectedTray] = useState<TrayCardData | null>(null);

  // Update consumption engine with new readings
  useEffect(() => {
    trays.forEach((tray) => {
      if (tray.tray_id) recordWeight(tray.tray_id, tray.last_weight_grams ?? 0);
    });
  }, [trays]);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Priority panel skeleton */}
        <div className="h-11 rounded-xl bg-gray-900 animate-pulse" />
        {/* Card skeletons */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (trays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
        <span className="text-4xl opacity-30">📦</span>
        <p className="text-gray-500 text-base font-medium">No active trays configured.</p>
        <a
          href="/manage/config"
          className="text-green-400 hover:text-green-300 text-sm underline transition-colors"
        >
          Set up stations in Management →
        </a>
      </div>
    );
  }

  // Enrich tray data with computed fields
  const enrichedTrays: TrayCardData[] = trays.map((tray) => ({
    ...tray,
    trend: getTrend(tray.tray_id ?? ""),
    estimatedMinutesToEmpty: getEstimatedMinutesToEmpty(tray),
    isStale: isStale(tray.last_updated_at ?? new Date(0).toISOString()),
    depletionRateGramsPerMin: null,
  }));

  const cookSuggestions = getAllCookSuggestions(trays, todayPax, historicalAvgPax);

  return (
    <div className="space-y-6">
      <PriorityPanel trays={enrichedTrays} onSelectTray={setSelectedTray} />

      {cookSuggestions.length > 0 && (
        <CookSuggestionPanel suggestions={cookSuggestions} todayPax={todayPax} />
      )}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {enrichedTrays.map((tray) => (
          <TrayCard key={tray.tray_id} tray={tray} onClick={() => setSelectedTray(tray)} />
        ))}
      </div>

      {lastUpdated && (
        <p className="text-gray-700 text-xs text-center tabular-nums">
          Last sync {lastUpdated.toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </p>
      )}

      {selectedTray && (
        <TrayDetailModal tray={selectedTray} onClose={() => setSelectedTray(null)} />
      )}
    </div>
  );
}

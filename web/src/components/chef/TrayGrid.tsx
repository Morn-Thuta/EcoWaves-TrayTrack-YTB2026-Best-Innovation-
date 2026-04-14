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
      <div className="flex items-center justify-center h-64 text-gray-400 text-xl">
        Loading tray data...
      </div>
    );
  }

  if (trays.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 text-xl">
        No active trays configured.
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

  // Cook suggestions
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
        <p className="text-gray-600 text-xs text-center">
          Updated {lastUpdated.toLocaleTimeString()}
        </p>
      )}

      {selectedTray && (
        <TrayDetailModal tray={selectedTray} onClose={() => setSelectedTray(null)} />
      )}
    </div>
  );
}

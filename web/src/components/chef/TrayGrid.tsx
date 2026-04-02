"use client";

import { useEffect } from "react";
import { TrayCard } from "./TrayCard";
import { AlertBanner } from "./AlertBanner";
import { CookSuggestionPanel } from "./CookSuggestionPanel";
import { useRealtimeTrays } from "@/hooks/useRealtimeTrays";
import {
  recordWeight,
  getEstimatedMinutesToEmpty,
  getTrend,
  isStale,
} from "@/lib/engine/consumption";
import { getAllCookSuggestions } from "@/lib/engine/cook-suggestion";
import type { TrayCardData, AlertSummary } from "@/types/domain";

interface TrayGridProps {
  todayPax: number | null;
  historicalAvgPax: number | null;
}

export function TrayGrid({ todayPax, historicalAvgPax }: TrayGridProps) {
  const { trays, loading, lastUpdated } = useRealtimeTrays();

  // Update consumption engine with new readings
  useEffect(() => {
    trays.forEach((tray) => {
      recordWeight(tray.tray_id, tray.last_weight_grams);
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
    trend: getTrend(tray.tray_id),
    estimatedMinutesToEmpty: getEstimatedMinutesToEmpty(tray),
    isStale: isStale(tray.last_updated_at),
    depletionRateGramsPerMin: null,
  }));

  // Alert summary
  const alertSummary: AlertSummary = {
    critical: enrichedTrays.filter((t) => t.color_code === "red").length,
    low: enrichedTrays.filter((t) => t.color_code === "amber").length,
    offline: enrichedTrays.filter((t) => t.status === "offline").length,
    stale: enrichedTrays.filter((t) => t.isStale && t.color_code !== "grey").length,
  };

  // Cook suggestions
  const cookSuggestions = getAllCookSuggestions(trays, todayPax, historicalAvgPax);

  return (
    <div className="space-y-6">
      <AlertBanner summary={alertSummary} />

      {cookSuggestions.length > 0 && (
        <CookSuggestionPanel suggestions={cookSuggestions} />
      )}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {enrichedTrays.map((tray) => (
          <TrayCard key={tray.tray_id} tray={tray} />
        ))}
      </div>

      {lastUpdated && (
        <p className="text-gray-600 text-xs text-center">
          Updated {lastUpdated.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}

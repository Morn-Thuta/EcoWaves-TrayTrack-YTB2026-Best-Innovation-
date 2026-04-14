"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface OccupancyData {
  todayPax: number | null;
  expectedPax: number | null;
  actualPax: number | null;
  recentAvgPax: number | null;
  paxTrend: { arrow: string; label: string; color: string } | null;
}

export function useRealtimeOccupancy(): OccupancyData & { loading: boolean } {
  const channelName = useRef(`occupancy-rt-${Math.random().toString(36).slice(2, 8)}`);
  const [data, setData] = useState<OccupancyData>({
    todayPax: null,
    expectedPax: null,
    actualPax: null,
    recentAvgPax: null,
    paxTrend: null,
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchOccupancy = useCallback(async () => {
    const today = new Date().toISOString().split("T")[0];

    const [{ data: todayRow }, { data: recentRows }] = await Promise.all([
      supabase
        .from("daily_occupancy")
        .select("expected_pax, actual_pax")
        .eq("date", today)
        .maybeSingle(),
      supabase
        .from("daily_occupancy")
        .select("actual_pax, expected_pax")
        .lt("date", today)
        .order("date", { ascending: false })
        .limit(7),
    ]);

    const todayPax = todayRow?.actual_pax ?? todayRow?.expected_pax ?? null;

    // Compute 7-day average
    const recent = (recentRows ?? []) as Array<{ actual_pax: number | null; expected_pax: number }>;
    const paxValues = recent.map((r) => r.actual_pax ?? r.expected_pax).filter(Boolean) as number[];
    const recentAvgPax = paxValues.length > 0
      ? Math.round(paxValues.reduce((a, b) => a + b, 0) / paxValues.length)
      : null;

    // Compute trend
    let paxTrend: OccupancyData["paxTrend"] = null;
    if (todayPax && recentAvgPax) {
      const ratio = todayPax / recentAvgPax;
      if (ratio > 1.1)      paxTrend = { arrow: "\u2191", label: "Above avg", color: "text-green-400" };
      else if (ratio < 0.9) paxTrend = { arrow: "\u2193", label: "Below avg", color: "text-amber-400" };
      else                  paxTrend = { arrow: "\u2192", label: "Avg",        color: "text-gray-400" };
    }

    setData({
      todayPax,
      expectedPax: todayRow?.expected_pax ?? null,
      actualPax: todayRow?.actual_pax ?? null,
      recentAvgPax,
      paxTrend,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOccupancy();

    // Subscribe to real-time changes on daily_occupancy
    const channel = supabase
      .channel(channelName.current)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "daily_occupancy" },
        () => fetchOccupancy()
      )
      .subscribe();

    // 30-second polling fallback
    const interval = setInterval(fetchOccupancy, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchOccupancy]);

  return { ...data, loading };
}

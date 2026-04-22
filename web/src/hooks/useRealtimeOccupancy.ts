"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface OccupancyData {
  todayPax:     number | null;
  expectedPax:  number | null;
  actualPax:    number | null;
  adultCount:   number | null;
  childCount:   number | null;
  recentAvgPax: number | null;
  paxTrend:     { arrow: string; label: string; color: string } | null;
}

export function useRealtimeOccupancy(): OccupancyData & { loading: boolean } {
  const channelName = useRef(
    `occupancy-rt-${Math.random().toString(36).slice(2, 8)}`
  );

  const [data, setData] = useState<OccupancyData>({
    todayPax:     null,
    expectedPax:  null,
    actualPax:    null,
    adultCount:   null,
    childCount:   null,
    recentAvgPax: null,
    paxTrend:     null,
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchOccupancy = useCallback(async () => {
    const today = new Date().toISOString().split("T")[0];

    const [{ data: todayRow }, { data: recentRows }] = await Promise.all([
      supabase
        .from("daily_occupancy")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .select("expected_pax, actual_pax, adult_count, child_count" as any)
        .eq("date", today)
        .maybeSingle(),
      supabase
        .from("daily_occupancy")
        .select("actual_pax, expected_pax")
        .lt("date", today)
        .order("date", { ascending: false })
        .limit(7),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = todayRow as any;
    const todayPax     = row?.actual_pax ?? row?.expected_pax ?? null;
    const adultCount   = row?.adult_count   ?? null;
    const childCount   = row?.child_count   ?? null;

    // 7-day trailing average
    const recent = (recentRows ?? []) as Array<{
      actual_pax: number | null;
      expected_pax: number;
    }>;
    const paxValues = recent
      .map((r) => r.actual_pax ?? r.expected_pax)
      .filter(Boolean) as number[];
    const recentAvgPax =
      paxValues.length > 0
        ? Math.round(paxValues.reduce((a, b) => a + b, 0) / paxValues.length)
        : null;

    let paxTrend: OccupancyData["paxTrend"] = null;
    if (todayPax && recentAvgPax) {
      const ratio = todayPax / recentAvgPax;
      if (ratio > 1.1)      paxTrend = { arrow: "↑", label: "Above avg", color: "text-green-400" };
      else if (ratio < 0.9) paxTrend = { arrow: "↓", label: "Below avg", color: "text-amber-400" };
      else                  paxTrend = { arrow: "→", label: "Avg",        color: "text-gray-400" };
    }

    setData({
      todayPax,
      expectedPax:  row?.expected_pax ?? null,
      actualPax:    row?.actual_pax   ?? null,
      adultCount,
      childCount,
      recentAvgPax,
      paxTrend,
    });
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchOccupancy();

    const channel = supabase
      .channel(channelName.current)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "daily_occupancy" },
        () => fetchOccupancy()
      )
      .subscribe();

    const interval = setInterval(fetchOccupancy, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchOccupancy]);

  return { ...data, loading };
}

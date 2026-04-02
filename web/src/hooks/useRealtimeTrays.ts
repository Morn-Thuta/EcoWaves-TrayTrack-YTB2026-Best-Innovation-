"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { TrayDashboardItem } from "@/types/domain";

export function useRealtimeTrays() {
  const [trays, setTrays] = useState<TrayDashboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const supabase = createClient();
  const traysRef = useRef<TrayDashboardItem[]>([]);

  const fetchTrays = useCallback(async () => {
    const { data, error } = await supabase
      .from("tray_dashboard_view")
      .select("*");

    if (!error && data) {
      traysRef.current = data;
      setTrays([...data]);
      setLastUpdated(new Date());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTrays();

    // Supabase Realtime subscription on trays table
    const channel = supabase
      .channel("tray-realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "trays",
        },
        () => {
          // Re-fetch the full view on any tray update
          // (view includes dish info, color_code, etc.)
          fetchTrays();
        }
      )
      .subscribe();

    // 10-second polling fallback in case Realtime disconnects
    const interval = setInterval(fetchTrays, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchTrays]);

  return { trays, loading, lastUpdated, refetch: fetchTrays };
}

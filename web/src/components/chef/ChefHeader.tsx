"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ServiceTimer } from "./ServiceTimer";
import { useRealtimeOccupancy } from "@/hooks/useRealtimeOccupancy";
import { createClient } from "@/lib/supabase/client";

interface TableAlert {
  id: string;
  note: string;
  time: string;
}

export function ChefHeader() {
  const { todayPax, adultCount, childCount, paxTrend, loading } = useRealtimeOccupancy();
  const [tableAlerts, setTableAlerts] = useState<TableAlert[]>([]);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel("service-alerts")
      .on("broadcast", { event: "table_arrived" }, ({ payload }) => {
        const alert: TableAlert = {
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
        setTableAlerts((prev) => [alert, ...prev].slice(0, 3));
        // Auto-dismiss after 30 seconds
        setTimeout(() => {
          setTableAlerts((prev) => prev.filter((a) => a.id !== alert.id));
        }, 30000);
      })
      .subscribe();

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function dismissAlert(id: string) {
    setTableAlerts((prev) => prev.filter((a) => a.id !== id));
  }

  const showAdultChild = adultCount !== null || childCount !== null;

  return (
    <div>
      {/* ── Table arrival alerts (slide down from top) ─────────────────── */}
      <div className="overflow-hidden">
        {tableAlerts.map((alert) => (
          <div
            key={alert.id}
            className="animate-slide-down bg-blue-900/90 border-b border-blue-600/50 px-6 py-2.5 flex items-center justify-between backdrop-blur-sm"
          >
            <div className="flex items-center gap-3">
              <span className="text-blue-300 text-lg flex-shrink-0">🪑</span>
              <span className="text-blue-100 font-bold">{alert.note}</span>
              <span className="text-blue-400/70 text-xs font-medium">{alert.time}</span>
            </div>
            <button
              onClick={() => dismissAlert(alert.id)}
              className="text-blue-400 hover:text-blue-100 text-sm font-bold px-2 ml-4 transition-colors duration-150 active:scale-95"
              aria-label="Dismiss alert"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* ── Main header bar ────────────────────────────────────────────── */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between gap-4">
        {/* Left: title */}
        <div>
          <h1 className="text-white text-2xl font-black tracking-wide">
            BREAKFAST BUFFET
          </h1>
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mt-0.5">
            Live Tray Monitor
          </p>
        </div>

        {/* Right: service timer + pax + nav */}
        <div className="flex items-center gap-6">
          {/* Service timer (display-only on chef) */}
          <ServiceTimer editable={false} />

          {/* Current Pax */}
          <div className="text-right">
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 block">
              Current Pax
            </span>
            {loading ? (
              <div className="h-8 w-16 bg-gray-800 animate-pulse rounded mt-1" />
            ) : todayPax ? (
              <div className="flex flex-col items-end gap-0.5">
                <div className="flex items-baseline gap-2">
                  <p className="text-white text-3xl font-black leading-none">{todayPax}</p>
                  {paxTrend && (
                    <span className={`text-sm font-bold ${paxTrend.color}`}>
                      {paxTrend.arrow} {paxTrend.label}
                    </span>
                  )}
                </div>
                {showAdultChild && (
                  <p className="text-gray-500 text-xs">
                    {adultCount ?? "—"} Adults · {childCount ?? "—"} Children
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm mt-0.5">
                Not set —{" "}
                <Link
                  href="/manage/guests"
                  className="text-green-400 hover:text-green-300 underline transition-colors"
                >
                  enter here
                </Link>
              </p>
            )}
          </div>

          {/* Management link */}
          <Link
            href="/manage/config"
            className="text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg px-3 py-1.5 transition-all duration-150 active:scale-95"
          >
            ← Manage
          </Link>
        </div>
      </header>
    </div>
  );
}

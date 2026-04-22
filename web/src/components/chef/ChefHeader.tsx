"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ServiceTimer } from "./ServiceTimer";
import { useRealtimeOccupancy } from "@/hooks/useRealtimeOccupancy";
import { createClient } from "@/lib/supabase/client";

interface TableAlert {
  id: string;
  partySize: number;
  time: string;
}

export function ChefHeader() {
  const { todayPax, adultCount, childCount, paxTrend, loading } = useRealtimeOccupancy();
  const [tableAlerts, setTableAlerts] = useState<TableAlert[]>([]);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const supabase = createClient();

  // Subscribe to table arrival broadcast alerts
  useEffect(() => {
    const channel = supabase
      .channel("service-alerts")
      .on("broadcast", { event: "table_arrived" }, ({ payload }) => {
        const alert: TableAlert = {
          id: `${Date.now()}`,
          partySize: payload.partySize as number,
          time: payload.time as string,
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
      {/* Table arrival alerts */}
      {tableAlerts.map((alert) => (
        <div
          key={alert.id}
          className="bg-blue-900 border-b border-blue-600 px-6 py-2 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="text-blue-300 text-lg">🪑</span>
            <span className="text-blue-100 font-bold text-sm">
              Table of {alert.partySize} just arrived
            </span>
            <span className="text-blue-400 text-xs">{alert.time}</span>
          </div>
          <button
            onClick={() => dismissAlert(alert.id)}
            className="text-blue-400 hover:text-blue-200 text-xs font-semibold px-2"
          >
            ✕
          </button>
        </div>
      ))}

      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-black tracking-wide">
            BREAKFAST BUFFET
          </h1>
          <p className="text-gray-400 text-sm">Live Tray Monitor</p>
        </div>

        <div className="flex items-center gap-6">
          {/* Service timer — display only, edit in Management */}
          <ServiceTimer editable={false} />

          {/* Current Pax */}
          <div className="text-right">
            <span className="text-gray-400 text-xs uppercase tracking-wide block">
              Current Pax
            </span>
            {loading ? (
              <p className="text-gray-500 text-lg">...</p>
            ) : todayPax ? (
              <div className="flex flex-col items-end gap-0.5">
                <div className="flex items-baseline gap-2">
                  <p className="text-white text-3xl font-black">{todayPax}</p>
                  {paxTrend && (
                    <span className={`text-sm font-bold ${paxTrend.color}`}>
                      {paxTrend.arrow} {paxTrend.label}
                    </span>
                  )}
                </div>
                {showAdultChild && (
                  <p className="text-gray-400 text-xs">
                    {adultCount ?? "—"} Adults · {childCount ?? "—"} Children
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                Not set —{" "}
                <Link href="/manage/guests" className="text-green-400 underline">
                  enter in Management
                </Link>
              </p>
            )}
          </div>

          <Link
            href="/manage/config"
            className="text-sm text-gray-300 border border-gray-600 rounded-md px-3 py-1.5 hover:bg-gray-800 transition-colors"
          >
            ← Management
          </Link>
        </div>
      </header>
    </div>
  );
}

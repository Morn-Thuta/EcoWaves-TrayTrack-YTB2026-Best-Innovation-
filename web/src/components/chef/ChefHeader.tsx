"use client";

import Link from "next/link";
import { ServiceTimer } from "./ServiceTimer";
import { useRealtimeOccupancy } from "@/hooks/useRealtimeOccupancy";

export function ChefHeader() {
  const { todayPax, paxTrend, loading } = useRealtimeOccupancy();

  return (
    <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-white text-2xl font-black tracking-wide">
          BREAKFAST BUFFET
        </h1>
        <p className="text-gray-400 text-sm">Live Tray Monitor</p>
      </div>
      <div className="flex items-center gap-6">
        <ServiceTimer />
        <div className="text-right">
          <span className="text-gray-400 text-xs uppercase tracking-wide">
            Today&apos;s Pax
          </span>
          {loading ? (
            <p className="text-gray-500 text-lg">...</p>
          ) : todayPax ? (
            <div className="flex items-baseline gap-2 justify-end">
              <p className="text-white text-3xl font-black">{todayPax}</p>
              {paxTrend && (
                <span className={`text-sm font-bold ${paxTrend.color}`}>
                  {paxTrend.arrow} {paxTrend.label}
                </span>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              Not set — enter in{" "}
              <Link href="/manage/guests" className="text-green-400 underline">
                Guests
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
  );
}

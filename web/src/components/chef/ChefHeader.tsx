"use client";

import { useState, useEffect } from "react";
import { useRealtimeOccupancy } from "@/hooks/useRealtimeOccupancy";
import { getMinutesRemaining, STORAGE_KEY, DEFAULT_END } from "./ServiceTimer";

export function ChefHeader() {
  const { todayPax, loading } = useRealtimeOccupancy();
  const [clock, setClock] = useState("");
  const [serviceEnd, setServiceEnd] = useState(DEFAULT_END);
  const [serviceMinLeft, setServiceMinLeft] = useState(0);

  // Clock — updates every second
  useEffect(() => {
    function tick() {
      setClock(
        new Date().toLocaleTimeString("en-SG", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Service end time from localStorage (shared with management ServiceTimer)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) ?? DEFAULT_END;
    setServiceEnd(saved);
    setServiceMinLeft(getMinutesRemaining(saved));

    const id = setInterval(() => {
      const s = localStorage.getItem(STORAGE_KEY) ?? DEFAULT_END;
      setServiceEnd(s);
      setServiceMinLeft(getMinutesRemaining(s));
    }, 30000);
    return () => clearInterval(id);
  }, []);

  const serviceColor =
    serviceMinLeft <= 0
      ? "text-gray-500"
      : serviceMinLeft < 15
        ? "text-red-400"
        : serviceMinLeft < 60
          ? "text-amber-400"
          : "text-green-400";

  return (
    <header className="flex-shrink-0 bg-gray-900 border-b border-gray-800 px-5 h-11 flex items-center justify-between gap-6">
      {/* Left: meal label */}
      <span className="text-gray-400 text-sm font-bold tracking-widest uppercase flex-shrink-0">
        Breakfast
      </span>

      {/* Service end */}
      <span className={`text-xs font-semibold flex-shrink-0 ${serviceColor}`}>
        {serviceMinLeft <= 0 ? "Service ended" : `ends ${serviceEnd}`}
      </span>

      {/* Center: clock */}
      <span className="text-white text-lg font-black tabular-nums tracking-wide">
        {clock}
      </span>

      {/* Pax */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          Pax
        </span>
        {loading ? (
          <span className="w-8 h-5 bg-gray-800 rounded animate-pulse" />
        ) : (
          <span className="text-white text-lg font-black tabular-nums">
            {todayPax ?? "—"}
          </span>
        )}
      </div>

      {/* Sync dot */}
      <span className="relative flex h-2 w-2 flex-shrink-0" title="Live data">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-40" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
      </span>
    </header>
  );
}

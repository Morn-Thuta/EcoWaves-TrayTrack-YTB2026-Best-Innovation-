"use client";

import { useState, useEffect } from "react";
import { useRealtimeOccupancy } from "@/hooks/useRealtimeOccupancy";
import { getMinutesRemaining, STORAGE_KEY, DEFAULT_END } from "./ServiceTimer";
import { BrandMark } from "@/components/manage/BrandMark";
import { ViewToggle } from "@/components/ui/ViewToggle";
import { DisplayModeToggle } from "./DisplayModeContext";
import { canSwitchViews } from "@/lib/roles";

interface ChefHeaderProps {
  role: string | null;
  /** Server-computed count of offline sensors (initial render only — updates on
   *  reload, not live, to avoid duplicate-subscription with TrayGrid). */
  initialOfflineCount: number;
}

export function ChefHeader({ role, initialOfflineCount }: ChefHeaderProps) {
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

  // Sensor health label — server-computed at page load
  const sensorsOk = initialOfflineCount === 0;
  const sensorLabel = sensorsOk
    ? "Sensors online"
    : `${initialOfflineCount} sensor${initialOfflineCount > 1 ? "s" : ""} offline`;

  const showToggle = canSwitchViews(role);

  return (
    <header className="flex-shrink-0 bg-ink-1 border-b border-ink-3 px-5 h-11 flex items-center justify-between gap-4">
      {/* Left: brand mark + meal label */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <BrandMark size={18} />
        <span className="text-ink-6 text-sm font-bold tracking-widest uppercase">
          Breakfast
        </span>
      </div>

      {/* Center-right cluster: status segments with vertical dividers */}
      <div className="flex items-center divide-x divide-ink-3 text-sm flex-shrink min-w-0">
        {/* Service end — labelled */}
        <span className={`px-3 text-xs font-semibold whitespace-nowrap ${serviceColor}`}>
          {serviceMinLeft <= 0 ? "Service ended" : `Ends ${serviceEnd}`}
        </span>

        {/* Clock */}
        <span className="px-3 text-ink-8 text-base font-bold tabular-nums tracking-wide whitespace-nowrap">
          {clock}
        </span>

        {/* Pax — with explicit label */}
        <span className="px-3 flex items-center gap-1.5 whitespace-nowrap">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-6">
            Pax
          </span>
          {loading ? (
            <span className="w-8 h-4 bg-ink-3 rounded animate-pulse" />
          ) : (
            <span className="text-ink-8 text-base font-bold tabular-nums">
              {todayPax ?? "—"}
            </span>
          )}
        </span>

        {/* Sensor status — coloured dot + label */}
        <span
          className="px-3 flex items-center gap-1.5 whitespace-nowrap"
          title={sensorLabel}
        >
          <span className="relative flex h-2 w-2">
            <span
              className={[
                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-40",
                sensorsOk ? "bg-green-400" : "bg-red-400",
              ].join(" ")}
            />
            <span
              className={[
                "relative inline-flex h-2 w-2 rounded-full",
                sensorsOk ? "bg-green-400" : "bg-red-400",
              ].join(" ")}
            />
          </span>
          <span
            className={[
              "text-[11px] font-medium tracking-wide",
              sensorsOk ? "text-ink-6" : "text-red-300",
            ].join(" ")}
          >
            {sensorLabel}
          </span>
        </span>
      </div>

      {/* Right: % / kg display toggle (always) + ViewToggle for mgmt roles */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <DisplayModeToggle />
        {showToggle && <ViewToggle />}
      </div>
    </header>
  );
}

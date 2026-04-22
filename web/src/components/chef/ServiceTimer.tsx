"use client";

import { useEffect, useState } from "react";

export const STORAGE_KEY = "service_end_time";
export const DEFAULT_END  = "10:30";

export function parseTime(hhmm: string): { h: number; m: number } {
  const [h, m] = hhmm.split(":").map(Number);
  return { h: h ?? 10, m: m ?? 30 };
}

export function getMinutesRemaining(endTime: string): number {
  const now = new Date();
  const { h, m } = parseTime(endTime);
  const end = new Date(now);
  end.setHours(h, m, 0, 0);
  return Math.round((end.getTime() - now.getTime()) / 60000);
}

function formatRemaining(minutes: number): string {
  if (minutes <= 0) return "Ended";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function urgencyColor(minutes: number) {
  if (minutes <= 0)  return { text: "text-gray-500", ring: "border-gray-700",  bg: "bg-gray-800" };
  if (minutes < 15)  return { text: "text-red-400",  ring: "border-red-700",   bg: "bg-red-950"  };
  if (minutes < 60)  return { text: "text-amber-400",ring: "border-amber-700", bg: "bg-amber-950"};
  return              { text: "text-green-400",       ring: "border-green-700", bg: "bg-green-950"};
}

interface ServiceTimerProps {
  /** true = show edit controls (management view), false = display only (chef view) */
  editable?: boolean;
}

export function ServiceTimer({ editable = false }: ServiceTimerProps) {
  const [endTime,    setEndTime]    = useState<string>(DEFAULT_END);
  const [minutesLeft, setMinutes]   = useState<number>(0);
  const [editing,    setEditing]    = useState(false);
  const [draft,      setDraft]      = useState<string>(DEFAULT_END);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) ?? DEFAULT_END;
    setEndTime(saved);
    setDraft(saved);
  }, []);

  useEffect(() => {
    setMinutes(getMinutesRemaining(endTime));
    const id = setInterval(() => setMinutes(getMinutesRemaining(endTime)), 30000);
    return () => clearInterval(id);
  }, [endTime]);

  function saveEdit() {
    if (/^\d{1,2}:\d{2}$/.test(draft)) {
      localStorage.setItem(STORAGE_KEY, draft);
      setEndTime(draft);
    }
    setEditing(false);
  }

  const { text, ring, bg } = urgencyColor(minutesLeft);
  const pctLeft = minutesLeft <= 0 ? 0 : Math.min(100, (minutesLeft / 240) * 100); // 4h = full

  if (editable) {
    // ── Management card ──────────────────────────────────────────────────────
    return (
      <div className={`rounded-xl border ${ring} ${bg} p-5 space-y-4`}>
        <div className="flex items-center justify-between">
          <p className="text-gray-400 text-xs uppercase tracking-widest font-semibold">
            Service End Time
          </p>
          {!editing && (
            <button
              onClick={() => { setEditing(true); setDraft(endTime); }}
              className="text-xs text-gray-400 hover:text-white border border-gray-700 rounded px-2 py-0.5 transition-colors"
            >
              ✎ Edit
            </button>
          )}
        </div>

        {/* Big time display */}
        <div className="flex items-end gap-3">
          <span className={`text-5xl font-black ${text}`}>
            {formatRemaining(minutesLeft)}
          </span>
          <span className="text-gray-500 text-sm pb-1.5">left</span>
        </div>

        {/* Progress bar: time remaining */}
        <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              minutesLeft < 15 ? "bg-red-500" : minutesLeft < 60 ? "bg-amber-400" : "bg-green-400"
            }`}
            style={{ width: `${pctLeft}%` }}
          />
        </div>

        <p className="text-gray-500 text-xs">
          Ends at <span className="text-gray-300 font-semibold">{endTime}</span>
        </p>

        {editing && (
          <div className="flex items-center gap-2 pt-1">
            <input
              type="time"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditing(false); }}
              className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
              autoFocus
            />
            <button
              onClick={saveEdit}
              className="bg-green-700 hover:bg-green-600 text-white text-sm font-bold px-3 py-2 rounded-lg transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="text-gray-500 hover:text-gray-300 text-sm px-2 py-2"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Chef header (compact, display only) ─────────────────────────────────
  return (
    <div className="text-right">
      <span className="text-gray-400 text-xs uppercase tracking-wide block">Service ends</span>
      <p className={`text-lg font-black ${text}`}>{formatRemaining(minutesLeft)} left</p>
      <p className="text-gray-600 text-xs">ends {endTime}</p>
    </div>
  );
}

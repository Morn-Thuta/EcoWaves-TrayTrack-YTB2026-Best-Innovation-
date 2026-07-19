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
  if (minutes <= 0)  return { text: "text-ink-6",    ring: "border-ink-4",     bar: "bg-ink-5"     };
  if (minutes < 15)  return { text: "text-red-400",  ring: "border-red-500/30",   bar: "bg-red-500"   };
  if (minutes < 60)  return { text: "text-amber-400",ring: "border-amber-500/30", bar: "bg-amber-400" };
  return              { text: "text-accent",          ring: "border-accent/30",    bar: "bg-accent"    };
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

  const { text, bar } = urgencyColor(minutesLeft);
  const pctLeft = minutesLeft <= 0 ? 0 : Math.min(100, (minutesLeft / 240) * 100); // 4h = full

  if (editable) {
    const ended = minutesLeft <= 0;
    // ── Management view (content only, parent provides section frame) ──────
    return (
      <div className="flex flex-col gap-3 flex-1">
        {/* ── HERO: time remaining ───────────────────────────────────── */}
        <div className="flex items-baseline gap-3 -mt-1">
          {ended ? (
            <span className="inline-flex items-center gap-2 mt-2">
              <span className="h-1.5 w-1.5 rounded-full bg-ink-5" />
              <span className="text-ink-6 text-base font-medium">Service ended</span>
            </span>
          ) : (
            <>
              <span className={`text-6xl font-bold tabular font-mono leading-none tracking-tight ${text}`}>
                {formatRemaining(minutesLeft)}
              </span>
              <span className="text-ink-6 text-sm">left</span>
            </>
          )}
        </div>

        {/* Subtext: ends at HH:MM */}
        <p className="text-ink-6 text-[12px] -mt-2">
          {ended ? "Ended at " : "Ends at "}
          <span className="text-ink-7 font-mono tabular">{endTime}</span>
        </p>

        {/* Progress bar — fine, instrument-like */}
        <div className="w-full h-1 rounded-full bg-ink-3 overflow-hidden mt-1">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${bar}`}
            style={{ width: `${pctLeft}%` }}
          />
        </div>

        {/* Edit / form footer */}
        <div className="flex items-center gap-2 mt-auto pt-2">
          {editing ? (
            <>
              <input
                type="time"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditing(false); }}
                className="bg-ink-2 border border-ink-3 rounded-md px-3 h-9 text-ink-8 text-[14px] font-mono tabular focus:outline-none focus:border-[oklch(0.70_0.18_160)]"
                autoFocus
              />
              <button
                onClick={saveEdit}
                className="inline-flex items-center h-9 px-4 rounded-md bg-[oklch(0.70_0.18_160)] hover:bg-[oklch(0.62_0.17_160)] text-ink-0 text-[13px] font-semibold transition-colors duration-150 active:scale-95"
              >
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="text-ink-6 hover:text-ink-8 text-[13px] font-medium h-9 px-3"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => { setEditing(true); setDraft(endTime); }}
              className="inline-flex items-center h-8 px-3 rounded-md border border-ink-3 hover:border-ink-4 text-ink-7 hover:text-ink-8 text-[13px] font-medium transition-colors duration-150 active:scale-95"
            >
              {ended ? "Start next service" : "Change end time"}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Chef header (compact, display only) ─────────────────────────────────
  return (
    <div className="text-right">
      <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 block">
        Service ends
      </span>
      <p className={`text-lg font-black ${text}`}>
        {minutesLeft <= 0 ? "Ended" : `${formatRemaining(minutesLeft)} left`}
      </p>
      <p className="text-gray-600 text-xs">ends {endTime}</p>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

export const STORAGE_KEY = "service_end_time";
export const DEFAULT_END = "10:30";

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
  if (minutes <= 0) return "Service ended";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m left`;
  if (h > 0) return `${h}h left`;
  return `${m}m left`;
}

interface ServiceTimerProps {
  /** If true, shows an edit control. False (default) = display only. */
  editable?: boolean;
}

export function ServiceTimer({ editable = false }: ServiceTimerProps) {
  const [endTime, setEndTime] = useState<string>(DEFAULT_END);
  const [minutesLeft, setMinutesLeft] = useState<number>(0);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>(DEFAULT_END);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const t = saved ?? DEFAULT_END;
    setEndTime(t);
    setDraft(t);
  }, []);

  useEffect(() => {
    setMinutesLeft(getMinutesRemaining(endTime));
    const interval = setInterval(() => {
      setMinutesLeft(getMinutesRemaining(endTime));
    }, 60000);
    return () => clearInterval(interval);
  }, [endTime]);

  function saveEdit() {
    if (/^\d{1,2}:\d{2}$/.test(draft)) {
      localStorage.setItem(STORAGE_KEY, draft);
      setEndTime(draft);
    }
    setEditing(false);
  }

  const color =
    minutesLeft <= 0 ? "text-gray-500" :
    minutesLeft < 15 ? "text-red-400"  :
    minutesLeft < 60 ? "text-amber-400" :
                       "text-green-400";

  return (
    <div className="text-right">
      <span className="text-gray-400 text-xs uppercase tracking-wide block">Service ends</span>

      {editable && editing ? (
        <div className="flex items-center gap-1 justify-end mt-0.5">
          <input
            type="time"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveEdit();
              if (e.key === "Escape") setEditing(false);
            }}
            className="bg-gray-800 border border-gray-600 rounded px-2 py-0.5 text-white text-sm w-24"
            autoFocus
          />
          <button onClick={saveEdit} className="text-green-400 text-sm font-bold px-1">✓</button>
          <button onClick={() => setEditing(false)} className="text-gray-500 text-sm px-1">✕</button>
        </div>
      ) : (
        <div
          className={editable ? "cursor-pointer group" : ""}
          onClick={editable ? () => { setEditing(true); setDraft(endTime); } : undefined}
          title={editable ? "Click to change service end time" : undefined}
        >
          <p className={`text-lg font-black ${color}${editable ? " group-hover:opacity-80" : ""}`}>
            {formatRemaining(minutesLeft)}
          </p>
          <p className="text-gray-600 text-xs">
            ends {endTime}{editable ? " · click to edit" : ""}
          </p>
        </div>
      )}
    </div>
  );
}

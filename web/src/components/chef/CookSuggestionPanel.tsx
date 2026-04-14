"use client";

import { useState, useEffect } from "react";
import type { CookSuggestion } from "@/types/domain";

interface CookSuggestionPanelProps {
  suggestions: CookSuggestion[];
  todayPax: number | null;
}

const URGENCY_STYLE: Record<CookSuggestion["urgency"], { bg: string; border: string; label: string; labelColor: string }> = {
  immediate: { bg: "bg-red-950",   border: "border-red-600",   label: "COOK NOW",      labelColor: "text-red-400" },
  soon:      { bg: "bg-amber-950", border: "border-amber-600", label: "COOK SOON",     labelColor: "text-amber-400" },
  planned:   { bg: "bg-gray-900",  border: "border-gray-700",  label: "START COOKING", labelColor: "text-gray-400" },
};

const CONFIDENCE_STYLE: Record<CookSuggestion["confidence"], { dots: string; label: string; filled: number }> = {
  high:   { dots: "bg-green-400",  label: "High confidence",   filled: 3 },
  medium: { dots: "bg-amber-400",  label: "Medium confidence", filled: 2 },
  low:    { dots: "bg-gray-500",   label: "Low confidence",    filled: 1 },
};

interface AckEntry {
  trayId: string;
  ackedAt: number;       // epoch ms
  cookTimeMinutes: number;
}

const ACK_KEY = "cook_acks";

function loadAcks(): AckEntry[] {
  try {
    return JSON.parse(localStorage.getItem(ACK_KEY) ?? "[]");
  } catch { return []; }
}

function saveAcks(acks: AckEntry[]) {
  localStorage.setItem(ACK_KEY, JSON.stringify(acks));
}

export function CookSuggestionPanel({ suggestions, todayPax }: CookSuggestionPanelProps) {
  const [acks, setAcks] = useState<AckEntry[]>([]);

  // Load acks from localStorage on mount, prune expired ones
  useEffect(() => {
    const now = Date.now();
    const fresh = loadAcks().filter(
      (a) => now - a.ackedAt < (a.cookTimeMinutes + 15) * 60 * 1000
    );
    saveAcks(fresh);
    setAcks(fresh);
  }, []);

  function acknowledge(s: CookSuggestion) {
    const entry: AckEntry = {
      trayId: s.trayId,
      ackedAt: Date.now(),
      cookTimeMinutes: s.cookTimeMinutes,
    };
    const updated = [...acks.filter((a) => a.trayId !== s.trayId), entry];
    saveAcks(updated);
    setAcks(updated);
  }

  function unacknowledge(trayId: string) {
    const updated = acks.filter((a) => a.trayId !== trayId);
    saveAcks(updated);
    setAcks(updated);
  }

  function getAck(trayId: string): AckEntry | undefined {
    return acks.find((a) => a.trayId === trayId);
  }

  if (suggestions.length === 0) return null;

  const now = Date.now();

  return (
    <div className="space-y-2">
      <h2 className="text-gray-400 text-sm font-bold uppercase tracking-widest px-1">
        Cook Suggestions
      </h2>

      {/* Pax warning */}
      {todayPax === null && (
        <div className="flex items-center gap-2 bg-amber-950 border border-amber-700 rounded-lg px-4 py-2 text-amber-300 text-sm">
          <span className="text-lg">⚠</span>
          <span>No pax entered for today — quantities are based on historical average only.{" "}
            <a href="/manage/guests" className="underline font-semibold hover:text-amber-100">Enter pax →</a>
          </span>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {suggestions.map((s) => {
          const style = URGENCY_STYLE[s.urgency];
          const conf = CONFIDENCE_STYLE[s.confidence];
          const ack = getAck(s.trayId);
          const minsAgo = ack ? Math.round((now - ack.ackedAt) / 60000) : 0;
          const minsLeft = ack ? Math.max(0, s.cookTimeMinutes - minsAgo) : 0;

          return (
            <div
              key={s.trayId}
              className={`${style.bg} border ${style.border} rounded-xl px-5 py-4 flex flex-col gap-1 transition-opacity ${ack ? "opacity-60" : ""}`}
            >
              <span className={`text-xs font-black uppercase tracking-widest ${style.labelColor}`}>
                {style.label}
              </span>

              <span className="text-white text-xl font-bold">{s.dishName}</span>

              {ack ? (
                <div className="flex flex-col gap-1 py-1">
                  <span className="text-green-400 text-base font-bold">✓ Cooking in progress</span>
                  <span className="text-gray-400 text-xs">
                    Started {minsAgo}m ago · ~{minsLeft}m left
                  </span>
                </div>
              ) : (
                <span className="text-white text-3xl font-black">
                  Cook ~{s.recommendedWeightKg} kg
                </span>
              )}

              <span className="text-gray-300 text-sm">
                {s.batchSize} portions · {s.cookTimeMinutes} min cook
              </span>

              {/* Confidence indicator */}
              <div className="flex items-center gap-1.5 mt-0.5">
                {[1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={`inline-block w-2 h-2 rounded-full ${i <= conf.filled ? conf.dots : "bg-gray-700"}`}
                  />
                ))}
                <span className="text-gray-400 text-xs ml-0.5">{conf.label}</span>
              </div>

              {/* Action button */}
              <div className="mt-2">
                {ack ? (
                  <button
                    onClick={() => unacknowledge(s.trayId)}
                    className="text-xs text-gray-500 hover:text-gray-300 underline"
                  >
                    Mark as done
                  </button>
                ) : (
                  <button
                    onClick={() => acknowledge(s)}
                    className="w-full bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-lg py-1.5 transition-colors"
                  >
                    ✓ Cooking Started
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

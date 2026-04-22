"use client";

import type { CookSuggestion } from "@/types/domain";

interface CookSuggestionPanelProps {
  suggestions: CookSuggestion[];
  todayPax: number | null;
}

const URGENCY_STYLE: Record<
  CookSuggestion["urgency"],
  { bg: string; border: string; label: string; labelColor: string; kgColor: string }
> = {
  immediate: {
    bg: "bg-red-950",
    border: "border-red-600",
    label: "COOK NOW",
    labelColor: "text-red-400",
    kgColor: "text-red-100",
  },
  soon: {
    bg: "bg-amber-950",
    border: "border-amber-600",
    label: "COOK SOON",
    labelColor: "text-amber-400",
    kgColor: "text-amber-100",
  },
  planned: {
    bg: "bg-gray-900",
    border: "border-gray-700",
    label: "PREPARE",
    labelColor: "text-gray-400",
    kgColor: "text-gray-100",
  },
};

export function CookSuggestionPanel({ suggestions, todayPax }: CookSuggestionPanelProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-gray-400 text-sm font-bold uppercase tracking-widest px-1">
        Cook Suggestions
      </h2>

      {/* No pax warning */}
      {todayPax === null && (
        <div className="flex items-center gap-2 bg-amber-950 border border-amber-700 rounded-lg px-4 py-2 text-amber-300 text-sm">
          <span className="text-lg">⚠</span>
          <span>
            No pax entered — quantities based on historical average only.{" "}
            <a href="/manage/guests" className="underline font-semibold hover:text-amber-100">
              Enter in Management →
            </a>
          </span>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {suggestions.map((s) => {
          const style = URGENCY_STYLE[s.urgency];
          return (
            <div
              key={s.trayId}
              className={`${style.bg} border ${style.border} rounded-xl px-5 py-4 flex flex-col gap-2`}
            >
              <span className={`text-xs font-black uppercase tracking-widest ${style.labelColor}`}>
                {style.label}
              </span>
              <span className="text-white text-xl font-bold leading-tight">
                {s.dishName}
              </span>
              <span className={`text-4xl font-black ${style.kgColor}`}>
                ~{s.recommendedWeightKg} kg
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

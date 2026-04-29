"use client";

import type { CookSuggestion } from "@/types/domain";

interface CookSuggestionPanelProps {
  suggestions: CookSuggestion[];
  todayPax: number | null;
}

const URGENCY_STYLE: Record<
  CookSuggestion["urgency"],
  {
    card: string;
    label: string;
    labelColor: string;
    kgColor: string;
    pulse: boolean;
  }
> = {
  immediate: {
    card:       "bg-red-950 border-red-600/60 ring-1 ring-red-500/20",
    label:      "COOK NOW",
    labelColor: "text-red-400",
    kgColor:    "text-red-100",
    pulse:      true,
  },
  soon: {
    card:       "bg-amber-950 border-amber-600/50",
    label:      "COOK SOON",
    labelColor: "text-amber-400",
    kgColor:    "text-amber-100",
    pulse:      false,
  },
  planned: {
    card:       "bg-gray-900 border-gray-700/60",
    label:      "PREPARE",
    labelColor: "text-gray-400",
    kgColor:    "text-gray-100",
    pulse:      false,
  },
};

export function CookSuggestionPanel({ suggestions, todayPax }: CookSuggestionPanelProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 px-1">
        Cook Suggestions
      </h2>

      {/* No pax warning */}
      {todayPax === null && (
        <div className="flex items-center gap-2 bg-amber-950 border border-amber-700/60 rounded-xl px-4 py-3 text-amber-300 text-sm">
          <span className="text-base">⚠</span>
          <span>
            No pax entered — quantities based on historical average only.{" "}
            <a
              href="/manage/guests"
              className="underline font-semibold hover:text-amber-100 transition-colors"
            >
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
              className={`border-2 rounded-xl px-5 py-4 flex flex-col gap-2 transition-all duration-150 hover:brightness-110 active:scale-95 ${style.card}`}
            >
              {/* Urgency label — animate-pulse only for COOK NOW */}
              <span
                className={`text-xs font-black uppercase tracking-widest ${style.labelColor} ${
                  style.pulse ? "animate-pulse" : ""
                }`}
              >
                {style.label}
              </span>

              {/* Dish name */}
              <span className="text-white text-lg font-bold leading-tight">
                {s.dishName}
              </span>

              {/* Recommended kg — the hero number */}
              <span className={`text-4xl font-black ${style.kgColor} leading-none`}>
                ~{s.recommendedWeightKg}
                <span className="text-xl font-bold opacity-70"> kg</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

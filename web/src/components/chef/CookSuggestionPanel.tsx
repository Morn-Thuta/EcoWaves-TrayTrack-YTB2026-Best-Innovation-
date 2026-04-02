"use client";

import type { CookSuggestion } from "@/types/domain";

interface CookSuggestionPanelProps {
  suggestions: CookSuggestion[];
}

const URGENCY_STYLE: Record<CookSuggestion["urgency"], { bg: string; border: string; label: string; labelColor: string }> = {
  immediate: {
    bg: "bg-red-950",
    border: "border-red-600",
    label: "COOK NOW",
    labelColor: "text-red-400",
  },
  soon: {
    bg: "bg-amber-950",
    border: "border-amber-600",
    label: "COOK SOON",
    labelColor: "text-amber-400",
  },
  planned: {
    bg: "bg-gray-900",
    border: "border-gray-700",
    label: "START COOKING",
    labelColor: "text-gray-400",
  },
};

const CONFIDENCE_LABEL: Record<CookSuggestion["confidence"], string> = {
  high:   "High confidence",
  medium: "Medium confidence",
  low:    "Low confidence",
};

export function CookSuggestionPanel({ suggestions }: CookSuggestionPanelProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-2">
      <h2 className="text-gray-400 text-sm font-bold uppercase tracking-widest px-1">
        Cook Suggestions
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {suggestions.map((s) => {
          const style = URGENCY_STYLE[s.urgency];
          return (
            <div
              key={s.trayId}
              className={`${style.bg} border ${style.border} rounded-xl px-5 py-4 flex flex-col gap-1`}
            >
              <span className={`text-xs font-black uppercase tracking-widest ${style.labelColor}`}>
                {style.label}
              </span>
              <span className="text-white text-xl font-bold">{s.dishName}</span>
              <span className="text-gray-300 text-base">
                {s.batchSize} portions · {s.cookTimeMinutes} min cook
              </span>
              <span className="text-gray-500 text-xs">{CONFIDENCE_LABEL[s.confidence]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

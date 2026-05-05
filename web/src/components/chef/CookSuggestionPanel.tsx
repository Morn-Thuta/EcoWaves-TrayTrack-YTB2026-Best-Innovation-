"use client";

import type { CookSuggestion } from "@/types/domain";

interface CookSuggestionPanelProps {
  suggestions: CookSuggestion[];
}

const STYLE: Record<
  CookSuggestion["urgency"],
  { card: string; label: string; labelClass: string; kgClass: string; pulse: boolean }
> = {
  immediate: {
    card:       "bg-red-950 border-red-500/70 animate-urgent-glow",
    label:      "COOK NOW",
    labelClass: "text-red-400",
    kgClass:    "text-red-100",
    pulse:      true,
  },
  soon: {
    card:       "bg-amber-950 border-amber-500/60",
    label:      "COOK SOON",
    labelClass: "text-amber-400",
    kgClass:    "text-amber-100",
    pulse:      false,
  },
  planned: {
    card:       "bg-gray-900 border-gray-700/60",
    label:      "PREPARE",
    labelClass: "text-gray-400",
    kgClass:    "text-gray-100",
    pulse:      false,
  },
};

export function CookSuggestionPanel({ suggestions }: CookSuggestionPanelProps) {
  if (suggestions.length === 0) return null;

  // Max 4 suggestions shown — engine rarely returns more
  const visible = suggestions.slice(0, 4);

  return (
    <div className="flex gap-3 h-24">
      {visible.map((s) => {
        const st = STYLE[s.urgency];
        return (
          <div
            key={s.trayId}
            className={`flex-1 border-2 rounded-xl px-4 flex flex-col justify-between py-2.5 ${st.card}`}
          >
            {/* Urgency label */}
            <span
              className={`text-[11px] font-black uppercase tracking-widest ${st.labelClass} ${
                st.pulse ? "animate-pulse" : ""
              }`}
            >
              {st.label}
            </span>

            {/* Dish name */}
            <span className="text-white text-base font-bold leading-tight truncate">
              {s.dishName}
            </span>

            {/* Hero kg */}
            <span className={`text-2xl font-black ${st.kgClass} leading-none`}>
              ~{s.recommendedWeightKg}
              <span className="text-sm font-semibold opacity-60"> kg</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

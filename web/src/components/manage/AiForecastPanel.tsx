"use client";

import { useState } from "react";
import { AppButton } from "@/components/ui/AppButton";
import type { ForecastResult } from "@/lib/ai/forecast";

interface ForecastRow {
  id: string;
  forecast_date: string;
  payload: ForecastResult;
  model: string | null;
  generated_at: string;
}

export function AiForecastPanel({ initial }: { initial: ForecastRow | null }) {
  const [row, setRow] = useState<ForecastRow | null>(initial);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const forecast = row?.payload ?? null;

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/forecast", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to generate forecast.");
      setRow(json.forecast);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to generate forecast.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="bg-ink-1 border border-ink-3 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 p-5 border-b border-ink-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[15px]" aria-hidden="true">🧠</span>
            <h3 className="text-ink-8 text-[15px] font-semibold tracking-tight">
              AI Demand Forecast
            </h3>
          </div>
          <p className="text-ink-6 text-[12px] mt-0.5">
            Predicts tomorrow&apos;s prep to cut overproduction — generated from your
            consumption history.
          </p>
        </div>
        <AppButton onClick={generate} disabled={generating} size="sm">
          {generating ? "Analyzing…" : forecast ? "Regenerate" : "Generate forecast"}
        </AppButton>
      </div>

      <div className="p-5">
        {error && (
          <div className="mb-4 rounded-lg border border-red-700/50 bg-red-950/60 px-4 py-3 text-[13px] text-red-200">
            {error}
          </div>
        )}

        {generating && !forecast && (
          <div className="border border-dashed border-ink-3 rounded-xl py-10 text-center">
            <div className="animate-pulse text-ink-6 text-sm">
              Asking the model to analyze your data… (free tier can take ~10s)
            </div>
          </div>
        )}

        {!forecast && !generating && (
          <div className="border border-dashed border-ink-3 rounded-xl py-10 px-4 text-center">
            <div className="text-3xl mb-2" aria-hidden="true">📊</div>
            <p className="text-ink-7 text-sm font-medium">No forecast generated yet</p>
            <p className="text-ink-6 text-[12px] mt-1 max-w-sm mx-auto">
              Click <strong>Generate forecast</strong> to have the AI predict tomorrow&apos;s
              demand and recommend exactly how much of each dish to prepare.
            </p>
          </div>
        )}

        {forecast && (
          <div className="space-y-5">
            {/* Predicted pax hero */}
            <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
              <div>
                <p className="text-ink-6 text-[11px] font-semibold uppercase tracking-wide">
                  Predicted guests · {forecast.day_of_week}, {forecast.forecast_date}
                </p>
                <p className="text-ink-8 text-5xl font-bold tabular font-mono leading-none mt-1">
                  {forecast.predicted_pax}
                  <span className="text-ink-6 text-lg font-semibold ml-2">pax</span>
                </p>
              </div>
              <p className="text-ink-6 text-[13px] max-w-md flex-1 min-w-[200px]">
                {forecast.pax_reasoning}
              </p>
            </div>

            {/* Per-dish prep plan */}
            <div>
              <p className="text-ink-6 text-[11px] font-semibold uppercase tracking-wide mb-2">
                Recommended prep
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {forecast.dishes.map((d) => (
                  <div
                    key={d.dish}
                    className="rounded-xl border border-ink-3 bg-ink-2 p-4 flex flex-col gap-1"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-ink-8 text-[14px] font-semibold">{d.dish}</span>
                      <span className="text-ink-6 text-[11px] whitespace-nowrap">
                        {d.batches} batch{d.batches === 1 ? "" : "es"}
                      </span>
                    </div>
                    <span className="text-[oklch(0.78_0.15_160)] text-2xl font-bold tabular font-mono leading-none">
                      {d.recommended_kg.toFixed(1)}
                      <span className="text-sm font-semibold ml-1 opacity-70">kg</span>
                    </span>
                    <span className="text-ink-6 text-[12px] leading-snug mt-0.5">
                      {d.reasoning}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Waste + savings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-xl border border-amber-700/40 bg-amber-950/40 p-4">
                <p className="text-amber-300 text-[11px] font-semibold uppercase tracking-wide mb-1">
                  ⚠ Overproduction risk
                </p>
                <p className="text-amber-100 text-[13px] leading-snug">
                  {forecast.waste_insight}
                </p>
              </div>
              <div className="rounded-xl border border-[oklch(0.70_0.18_160)]/40 bg-[oklch(0.70_0.18_160)]/10 p-4">
                <p className="text-[oklch(0.80_0.15_160)] text-[11px] font-semibold uppercase tracking-wide mb-1">
                  ✓ Potential savings
                </p>
                <p className="text-[oklch(0.90_0.08_160)] text-[13px] leading-snug">
                  {forecast.savings_estimate}
                </p>
              </div>
            </div>

            {/* Key insights */}
            {forecast.key_insights.length > 0 && (
              <div>
                <p className="text-ink-6 text-[11px] font-semibold uppercase tracking-wide mb-2">
                  Key insights
                </p>
                <ul className="space-y-1.5">
                  {forecast.key_insights.map((insight, i) => (
                    <li key={i} className="flex gap-2 text-ink-7 text-[13px] leading-snug">
                      <span className="text-[oklch(0.70_0.18_160)] mt-0.5">▸</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Provenance */}
            <p className="text-ink-5 text-[11px] pt-1 border-t border-ink-3">
              Generated{" "}
              {row && new Date(row.generated_at).toLocaleString("en-SG", {
                dateStyle: "medium",
                timeStyle: "short",
              })}{" "}
              · model: <span className="font-mono">{row?.model ?? forecast.model}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

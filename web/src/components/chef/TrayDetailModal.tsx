"use client";

import { useEffect, useRef, useState } from "react";
import type { TrayCardData } from "@/types/domain";
import { createClient } from "@/lib/supabase/client";

interface TrayDetailModalProps {
  tray: TrayCardData;
  onClose: () => void;
}

type Reading = { weight: number; timestamp: number };

const W = 520;
const H = 160;
const PAD = { top: 8, right: 16, bottom: 24, left: 52 };

function WeightChart({ points, capacityGrams }: { points: Reading[]; capacityGrams: number }) {
  if (points.length < 2) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-600 text-sm">
        Not enough history to chart
      </div>
    );
  }

  const weights = points.map((p) => p.weight);
  const minW = Math.max(0, Math.min(...weights) - 200);
  const maxW = Math.max(capacityGrams, ...weights);
  const range = maxW - minW || 1;

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const toX = (i: number) => PAD.left + (i / (points.length - 1)) * innerW;
  const toY = (w: number) => PAD.top + (1 - (w - minW) / range) * innerH;

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(p.weight).toFixed(1)}`)
    .join(" ");

  const yLabels = [0, 0.5, 1].map((fraction) => ({
    y: PAD.top + (1 - fraction) * innerH,
    label: `${Math.round(minW + fraction * range)}g`,
  }));

  const fmt = (ts: number) =>
    new Date(ts).toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      {yLabels.map(({ y, label }) => (
        <g key={label}>
          <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="#374151" strokeWidth="1" strokeDasharray="4 3" />
          <text x={PAD.left - 6} y={y + 4} fill="#6b7280" fontSize="10" textAnchor="end">{label}</text>
        </g>
      ))}
      <path d={pathD} fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={toX(points.length - 1)} cy={toY(points[points.length - 1].weight)} r="4" fill="#22d3ee" />
      <text x={PAD.left} y={H - 4} fill="#6b7280" fontSize="9">{fmt(points[0].timestamp)}</text>
      <text x={W - PAD.right} y={H - 4} fill="#6b7280" fontSize="9" textAnchor="end">{fmt(points[points.length - 1].timestamp)}</text>
    </svg>
  );
}

function calcDepletionRate(points: Reading[]): number | null {
  if (points.length < 2) return null;
  const oldest = points[0];
  const newest = points[points.length - 1];
  const elapsedMin = (newest.timestamp - oldest.timestamp) / 60000;
  if (elapsedMin < 0.5) return null;
  const delta = oldest.weight - newest.weight;
  if (delta <= 0) return 0;
  return delta / elapsedMin;
}

export function TrayDetailModal({ tray, onClose }: TrayDetailModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loadingChart, setLoadingChart] = useState(true);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Fetch last 10 min of sensor readings from DB
  useEffect(() => {
    if (!tray.tray_id) { setLoadingChart(false); return; }
    const supabase = createClient();
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    supabase
      .from("sensor_readings")
      .select("weight_grams, recorded_at")
      .eq("tray_id", tray.tray_id)
      .gte("recorded_at", since)
      .order("recorded_at", { ascending: true })
      .limit(100)
      .then(({ data }: { data: Array<{ weight_grams: number; recorded_at: string }> | null }) => {
        if (data && data.length >= 2) {
          setReadings(
            data.map((r) => ({
              weight: r.weight_grams,
              timestamp: new Date(r.recorded_at).getTime(),
            }))
          );
        }
        setLoadingChart(false);
      });
  }, [tray.tray_id]);

  const depletionRate = calcDepletionRate(readings);
  const foodKg = ((tray.food_weight_grams ?? 0) / 1000).toFixed(2);

  // Compute est. minutes to empty from DB-based depletion rate
  const estEmpty =
    depletionRate && depletionRate > 0 && (tray.food_weight_grams ?? 0) > 0
      ? Math.round((tray.food_weight_grams ?? 0) / depletionRate)
      : tray.estimatedMinutesToEmpty;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-800">
          <div>
            <h2 className="text-white text-xl font-bold">{tray.dish_name}</h2>
            {tray.location && (
              <p className="text-gray-500 text-xs uppercase tracking-wide mt-1">{tray.location}</p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none mt-1 ml-4" aria-label="Close">
            ✕
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 divide-x divide-gray-800 border-b border-gray-800">
          <div className="px-5 py-4">
            <p className="text-gray-500 text-xs uppercase tracking-wide">Remaining</p>
            <p className="text-white text-2xl font-black mt-1">
              {Math.round(tray.remaining_percent ?? 0)}<span className="text-base font-semibold">%</span>
            </p>
            <p className="text-gray-400 text-sm mt-0.5">{foodKg} kg</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-gray-500 text-xs uppercase tracking-wide">Depletion Rate</p>
            <p className="text-white text-2xl font-black mt-1">
              {depletionRate != null ? depletionRate.toFixed(1) : "—"}
              <span className="text-sm font-normal text-gray-400"> g/min</span>
            </p>
            {depletionRate != null && depletionRate > 0 && (
              <p className="text-gray-400 text-sm mt-0.5">{(depletionRate / 1000 * 60).toFixed(2)} kg/hr</p>
            )}
          </div>
          <div className="px-5 py-4">
            <p className="text-gray-500 text-xs uppercase tracking-wide">Est. Empty</p>
            <p className="text-white text-2xl font-black mt-1">
              {estEmpty != null ? estEmpty : "—"}
              {estEmpty != null && <span className="text-sm font-normal text-gray-400"> min</span>}
            </p>
            <p className="text-gray-400 text-sm mt-0.5">
              Last: {tray.last_updated_at ? new Date(tray.last_updated_at).toLocaleTimeString("en-SG") : "—"}
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="p-5">
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-3">
            Weight History (last 10 min · {readings.length} readings)
          </p>
          <div className="bg-gray-950 rounded-xl p-3">
            {loadingChart ? (
              <div className="flex items-center justify-center h-40 text-gray-600 text-sm">Loading…</div>
            ) : (
              <WeightChart points={readings} capacityGrams={tray.full_tray_weight_grams ?? 5000} />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex justify-end">
          <button onClick={onClose} className="text-sm text-gray-400 border border-gray-700 rounded-md px-4 py-1.5 hover:bg-gray-800 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

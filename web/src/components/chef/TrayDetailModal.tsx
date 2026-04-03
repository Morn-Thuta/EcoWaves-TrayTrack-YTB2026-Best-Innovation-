"use client";

import { useEffect, useRef } from "react";
import type { TrayCardData } from "@/types/domain";
import { getWeightHistory, getDepletionRate } from "@/lib/engine/consumption";

interface TrayDetailModalProps {
  tray: TrayCardData;
  onClose: () => void;
}

const W = 520;
const H = 160;
const PAD = { top: 8, right: 16, bottom: 24, left: 52 };

function WeightChart({ trayId, capacityGrams }: { trayId: string; capacityGrams: number }) {
  const points = getWeightHistory(trayId).reverse(); // oldest → newest

  if (points.length < 2) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-600 text-sm">
        Not enough history to chart (need ≥2 readings)
      </div>
    );
  }

  const weights = points.map((p) => p.weight);
  const minW = Math.min(...weights);
  const maxW = Math.max(capacityGrams, ...weights);
  const range = maxW - minW || 1;

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const toX = (i: number) => PAD.left + (i / (points.length - 1)) * innerW;
  const toY = (w: number) => PAD.top + (1 - (w - minW) / range) * innerH;

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(p.weight).toFixed(1)}`)
    .join(" ");

  // Y-axis labels
  const yLabels = [0, 0.25, 0.5, 0.75, 1].map((fraction) => ({
    y: PAD.top + (1 - fraction) * innerH,
    label: `${Math.round(minW + fraction * range)}g`,
  }));

  // X-axis: first and last timestamps
  const firstTime = new Date(points[0].timestamp).toLocaleTimeString("en-SG", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const lastTime = new Date(points[points.length - 1].timestamp).toLocaleTimeString("en-SG", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      {/* Grid lines */}
      {yLabels.map(({ y, label }) => (
        <g key={label}>
          <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="#374151" strokeWidth="1" strokeDasharray="4 3" />
          <text x={PAD.left - 6} y={y + 4} fill="#6b7280" fontSize="10" textAnchor="end">{label}</text>
        </g>
      ))}

      {/* Line */}
      <path d={pathD} fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

      {/* Dots for last point */}
      <circle
        cx={toX(points.length - 1)}
        cy={toY(points[points.length - 1].weight)}
        r="4"
        fill="#22d3ee"
      />

      {/* X-axis labels */}
      <text x={PAD.left} y={H - 4} fill="#6b7280" fontSize="9">{firstTime}</text>
      <text x={W - PAD.right} y={H - 4} fill="#6b7280" fontSize="9" textAnchor="end">{lastTime}</text>
    </svg>
  );
}

export function TrayDetailModal({ tray, onClose }: TrayDetailModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const depletionRate = getDepletionRate(tray.tray_id ?? "");
  const foodKg = ((tray.food_weight_grams ?? 0) / 1000).toFixed(2);

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
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white text-xl leading-none mt-1 ml-4"
            aria-label="Close"
          >
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
            {depletionRate != null && (
              <p className="text-gray-400 text-sm mt-0.5">{(depletionRate / 1000 * 60).toFixed(2)} kg/hr</p>
            )}
          </div>
          <div className="px-5 py-4">
            <p className="text-gray-500 text-xs uppercase tracking-wide">Est. Empty</p>
            <p className="text-white text-2xl font-black mt-1">
              {tray.estimatedMinutesToEmpty != null ? tray.estimatedMinutesToEmpty : "—"}
              {tray.estimatedMinutesToEmpty != null && (
                <span className="text-sm font-normal text-gray-400"> min</span>
              )}
            </p>
            <p className="text-gray-400 text-sm mt-0.5">
              Last: {tray.last_updated_at ? new Date(tray.last_updated_at).toLocaleTimeString("en-SG") : "—"}
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="p-5">
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-3">Weight History (last 5 min)</p>
          <div className="bg-gray-950 rounded-xl p-3">
            <WeightChart trayId={tray.tray_id ?? ""} capacityGrams={tray.full_tray_weight_grams ?? 5000} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex justify-end">
          <button
            onClick={onClose}
            className="text-sm text-gray-400 border border-gray-700 rounded-md px-4 py-1.5 hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

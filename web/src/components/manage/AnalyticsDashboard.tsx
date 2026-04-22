"use client";

import {
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis,
  CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell,
} from "recharts";
import { format } from "date-fns";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = any;

interface AnalyticsDashboardProps {
  refillEvents: AnyRecord[];
  occupancy:    AnyRecord[];
  aggregates:   AnyRecord[];
}

const DISH_COLORS = [
  "#10B981", "#3B82F6", "#F59E0B", "#EF4444",
  "#8B5CF6", "#EC4899", "#14B8A6", "#F97316",
];

export function AnalyticsDashboard({
  refillEvents,
  occupancy,
  aggregates,
}: AnalyticsDashboardProps) {
  // ── Summary stats ──────────────────────────────────────────────────────────
  const totalRefills = refillEvents.length;
  const avgPax = occupancy.length
    ? Math.round(
        occupancy.reduce(
          (sum: number, r: AnyRecord) => sum + (r.actual_pax ?? r.expected_pax),
          0
        ) / occupancy.length
      )
    : null;

  // ── Occupancy chart ────────────────────────────────────────────────────────
  const occupancyChartData = occupancy.map((r: AnyRecord) => ({
    date:     format(new Date(r.date), "MMM d"),
    expected: r.expected_pax,
    actual:   r.actual_pax ?? null,
  }));

  // ── Refills per day ────────────────────────────────────────────────────────
  const refillsByDay = refillEvents.reduce(
    (acc: Record<string, number>, ev: AnyRecord) => {
      const day = format(new Date(ev.detected_at), "MMM d");
      acc[day] = (acc[day] ?? 0) + 1;
      return acc;
    },
    {}
  );
  const refillChartData = Object.entries(refillsByDay).map(([date, count]) => ({
    date,
    refills: count,
  }));

  // ── Per-dish refill frequency ──────────────────────────────────────────────
  const refillsByDish = refillEvents.reduce(
    (acc: Record<string, number>, ev: AnyRecord) => {
      const name: string =
        ev.trays?.dishes?.name ?? ev.trays?.dish_id ?? "Unknown";
      acc[name] = (acc[name] ?? 0) + 1;
      return acc;
    },
    {}
  );
  const dishRefillData = Object.entries(refillsByDish)
    .map(([dish, count]) => ({ dish, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-8">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Refills (30d)" value={totalRefills.toString()} />
        <StatCard label="Avg Daily Pax"        value={avgPax?.toString() ?? "—"} />
        <StatCard
          label="Avg Refills/Day"
          value={
            occupancy.length > 0
              ? (totalRefills / occupancy.length).toFixed(1)
              : "—"
          }
        />
        <StatCard label="Days of Data" value={occupancy.length.toString()} />
      </div>

      {/* Per-dish refill frequency */}
      {dishRefillData.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-1">
            Refills by Dish — Last 30 Days
          </h3>
          <p className="text-gray-500 text-xs mb-4">
            More refills = higher demand. Use this to prioritise larger batch
            sizes or more frequent checks.
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={dishRefillData}
              layout="vertical"
              margin={{ left: 8, right: 24 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#374151"
                horizontal={false}
              />
              <XAxis type="number" stroke="#6B7280" tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="dish"
                stroke="#6B7280"
                tick={{ fontSize: 11 }}
                width={120}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111827",
                  border: "1px solid #374151",
                  color: "#F9FAFB",
                }}
              />
              <Bar dataKey="count" name="Refills" radius={[0, 4, 4, 0]}>
                {dishRefillData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={DISH_COLORS[index % DISH_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Guest count chart */}
      {occupancyChartData.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">
            Guest Count — Last 30 Days
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={occupancyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#6B7280" tick={{ fontSize: 11 }} />
              <YAxis stroke="#6B7280" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111827",
                  border: "1px solid #374151",
                  color: "#F9FAFB",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="expected"
                stroke="#6B7280"
                strokeDasharray="4 2"
                name="Expected"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#10B981"
                strokeWidth={2}
                name="Actual"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Refills per day */}
      {refillChartData.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">Refills per Day</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={refillChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#6B7280" tick={{ fontSize: 11 }} />
              <YAxis stroke="#6B7280" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111827",
                  border: "1px solid #374151",
                  color: "#F9FAFB",
                }}
              />
              <Bar dataKey="refills" fill="#3B82F6" name="Refills" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {occupancyChartData.length === 0 &&
        refillChartData.length === 0 &&
        dishRefillData.length === 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center text-gray-500">
            No data yet. Analytics will appear once sensor readings and guest
            counts are recorded.
          </div>
        )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
      <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">{label}</p>
      <p className="text-white text-3xl font-black">{value}</p>
    </div>
  );
}

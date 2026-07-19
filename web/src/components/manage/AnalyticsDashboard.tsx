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

const TOOLTIP_STYLE = {
  backgroundColor: "oklch(0.13 0.006 240)",
  border: "1px solid oklch(0.30 0.010 240)",
  borderRadius: "8px",
  color: "oklch(0.96 0.003 240)",
  fontSize: "13px",
};

export function AnalyticsDashboard({
  refillEvents,
  occupancy,
}: AnalyticsDashboardProps) {
  // ── Summary stats ──────────────────────────────────────────────────────────
  const totalRefills = refillEvents.length;
  const occupancyNums = occupancy
    .map((r: AnyRecord) => Number(r.actual_pax ?? r.expected_pax))
    .filter((n) => Number.isFinite(n));
  const avgPax = occupancyNums.length
    ? Math.round(occupancyNums.reduce((s, n) => s + n, 0) / occupancyNums.length)
    : null;

  // ── Occupancy chart data — coerce to Number so Recharts plots it ───────────
  const occupancyChartData = occupancy
    .map((r: AnyRecord) => {
      const expected = Number(r.expected_pax);
      const actual   = r.actual_pax == null ? null : Number(r.actual_pax);
      return {
        date: format(new Date(r.date), "MMM d"),
        expected: Number.isFinite(expected) ? expected : null,
        actual:   Number.isFinite(actual!) ? actual : null,
      };
    })
    .filter((d) => d.expected != null || d.actual != null);

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
    .sort((a, b) => (b.count as number) - (a.count as number));

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Refills (30d)" value={totalRefills.toString()} />
        <StatCard label="Avg Daily Pax"        value={avgPax?.toString() ?? "—"} />
        <StatCard
          label="Avg Refills/Day"
          value={
            occupancyChartData.length > 0
              ? (totalRefills / occupancyChartData.length).toFixed(1)
              : "—"
          }
        />
        <StatCard label="Days of Data" value={occupancyChartData.length.toString()} />
      </div>

      {/* ── Guest count chart ─────────────────────────────────────────────── */}
      <ChartPanel
        title="Guest Count — Recent History"
        subtitle="Dashed = expected (planned), solid = actual (recorded after service)"
        hasData={occupancyChartData.length >= 2}
        emptyState={
          <EmptyState
            icon="👥"
            title={
              occupancyChartData.length === 0
                ? "No guest counts yet"
                : "Need at least 2 days to show a trend"
            }
            hint="Use Service tab to log today's pax, or import a CSV via the Bulk Import tile."
          />
        }
      >
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={occupancyChartData} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.010 240)" />
            <XAxis dataKey="date" stroke="oklch(0.62 0.008 240)" tick={{ fontSize: 11 }} />
            <YAxis stroke="oklch(0.62 0.008 240)" tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              type="monotone" dataKey="expected"
              stroke="oklch(0.62 0.008 240)" strokeDasharray="4 2"
              name="Expected" dot={{ r: 2 }}
              connectNulls
            />
            <Line
              type="monotone" dataKey="actual"
              stroke="oklch(0.70 0.18 160)" strokeWidth={2}
              name="Actual" dot={{ r: 3 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartPanel>

      {/* ── Per-dish refill frequency ────────────────────────────────────── */}
      <ChartPanel
        title="Refills by Dish — Last 30 Days"
        subtitle="More refills = higher demand. Use this to set larger batch sizes."
        hasData={dishRefillData.length > 0}
        emptyState={
          <EmptyState
            icon="🍽️"
            title="No refill events yet"
            hint="Refills are detected automatically once sensors report weight increases. Connect a sensor or wait for sensor data."
          />
        }
      >
        <ResponsiveContainer width="100%" height={Math.max(140, dishRefillData.length * 28 + 60)}>
          <BarChart
            data={dishRefillData}
            layout="vertical"
            margin={{ left: 8, right: 24 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.010 240)" horizontal={false} />
            <XAxis type="number" stroke="oklch(0.62 0.008 240)" tick={{ fontSize: 11 }} allowDecimals={false} />
            <YAxis type="category" dataKey="dish" stroke="oklch(0.62 0.008 240)" tick={{ fontSize: 11 }} width={120} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="count" name="Refills" radius={[0, 4, 4, 0]}>
              {dishRefillData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={DISH_COLORS[index % DISH_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartPanel>

      {/* ── Refills per day ──────────────────────────────────────────────── */}
      <ChartPanel
        title="Refills per Day"
        subtitle="How often the kitchen had to top up trays each day."
        hasData={refillChartData.length > 0}
        emptyState={
          <EmptyState
            icon="📈"
            title="No daily refill history yet"
            hint="Once sensors run for a full service, this chart will show daily refill frequency."
          />
        }
      >
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={refillChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.010 240)" />
            <XAxis dataKey="date" stroke="oklch(0.62 0.008 240)" tick={{ fontSize: 11 }} />
            <YAxis stroke="oklch(0.62 0.008 240)" tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="refills" fill="oklch(0.65 0.18 230)" name="Refills" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartPanel>
    </div>
  );
}

/* ─── Reusable building blocks ─────────────────────────────────────────────── */

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-ink-1 border border-ink-3 rounded-xl p-4 text-center">
      <p className="text-ink-6 text-[11px] font-semibold uppercase tracking-wide mb-1.5">
        {label}
      </p>
      <p className="text-ink-8 text-2xl md:text-3xl font-bold tabular font-mono">{value}</p>
    </div>
  );
}

function ChartPanel({
  title,
  subtitle,
  hasData,
  emptyState,
  children,
}: {
  title:    string;
  subtitle: string;
  hasData:  boolean;
  emptyState: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-ink-1 border border-ink-3 rounded-2xl p-5">
      <div className="mb-4">
        <h3 className="text-ink-8 text-[15px] font-semibold tracking-tight">{title}</h3>
        <p className="text-ink-6 text-[12px] mt-0.5">{subtitle}</p>
      </div>
      {hasData ? children : emptyState}
    </div>
  );
}

function EmptyState({ icon, title, hint }: { icon: string; title: string; hint: string }) {
  return (
    <div className="border border-dashed border-ink-3 rounded-xl py-10 px-4 text-center">
      <div className="text-3xl mb-2 leading-none" aria-hidden="true">{icon}</div>
      <p className="text-ink-7 text-sm font-medium">{title}</p>
      <p className="text-ink-6 text-[12px] mt-1 max-w-sm mx-auto">{hint}</p>
    </div>
  );
}

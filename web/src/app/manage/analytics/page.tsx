import { createClient } from "@/lib/supabase/server";
import { AnalyticsDashboard } from "@/components/manage/AnalyticsDashboard";
import { AiForecastPanel } from "@/components/manage/AiForecastPanel";
import { AnalyticsExport } from "@/components/manage/AnalyticsExport";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const supabase = await createClient();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoff = thirtyDaysAgo.toISOString();

  const [{ data: refills }, { data: occupancy }, { data: aggregates }, { data: forecastRows }] = await Promise.all([
    supabase
      .from("refill_events")
      .select("*, trays(tray_name, dish_id, dishes(name))")
      .gte("detected_at", cutoff)
      .order("detected_at"),
    // Most recent 30 records that EXIST (not a fixed calendar window), so
    // imported/historical guest counts always render even if they're not from
    // the last 30 calendar days. Reversed to ascending below for the chart.
    supabase
      .from("daily_occupancy")
      .select("*")
      .order("date", { ascending: false })
      .limit(30),
    supabase
      .from("weight_aggregates")
      .select("*")
      .gte("period_start", cutoff)
      .eq("period_minutes", 5)
      .order("period_start"),
    // ai_forecasts isn't in the generated DB types yet — cast to query it.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("ai_forecasts")
      .select("*")
      .order("generated_at", { ascending: false })
      .limit(1),
  ]);

  const occupancyAsc = (occupancy ?? []).slice().reverse();

  return (
    <div className="space-y-6">
      <AnalyticsExport
        occupancy={occupancyAsc}
        refills={refills ?? []}
        forecast={forecastRows?.[0]?.payload ?? null}
      />
      <AiForecastPanel initial={forecastRows?.[0] ?? null} />
      <AnalyticsDashboard
        refillEvents={refills ?? []}
        occupancy={occupancyAsc}
        aggregates={aggregates ?? []}
      />
    </div>
  );
}

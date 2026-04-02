import { createClient } from "@/lib/supabase/server";
import { AnalyticsDashboard } from "@/components/manage/AnalyticsDashboard";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const supabase = await createClient();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoff = thirtyDaysAgo.toISOString();

  const [{ data: refills }, { data: occupancy }, { data: aggregates }] = await Promise.all([
    supabase
      .from("refill_events")
      .select("*, trays(tray_name, dish_id, dishes(name))")
      .gte("detected_at", cutoff)
      .order("detected_at"),
    supabase
      .from("daily_occupancy")
      .select("*")
      .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
      .order("date"),
    supabase
      .from("weight_aggregates")
      .select("*")
      .gte("period_start", cutoff)
      .eq("period_minutes", 5)
      .order("period_start"),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-white text-xl font-bold mb-2">Analytics (Last 30 Days)</h2>
        <p className="text-gray-400 text-sm">
          Consumption trends, refill frequency, and guest count patterns.
        </p>
      </div>
      <AnalyticsDashboard
        refillEvents={refills ?? []}
        occupancy={occupancy ?? []}
        aggregates={aggregates ?? []}
      />
    </div>
  );
}

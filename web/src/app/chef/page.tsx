import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TrayGrid } from "@/components/chef/TrayGrid";

export const dynamic = "force-dynamic";

type OccupancyData = { expected_pax: number; actual_pax: number | null } | null;

async function getTodayOccupancy(): Promise<OccupancyData> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("daily_occupancy")
    .select("expected_pax, actual_pax")
    .eq("date", today)
    .maybeSingle();

  return data as OccupancyData;
}

async function getHistoricalAvgPax(): Promise<number | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("daily_occupancy")
    .select("actual_pax")
    .order("date", { ascending: false })
    .limit(30);

  if (!data || data.length === 0) return null;

  const rows = data as Array<{ actual_pax: number | null }>;
  const withActual = rows.filter((r) => r.actual_pax != null);
  if (withActual.length === 0) return null;

  const sum = withActual.reduce((acc, row) => acc + (row.actual_pax ?? 0), 0);
  return Math.round(sum / withActual.length);
}

export default async function ChefDashboardPage() {
  const [todayOccupancy, historicalAvgPax] = await Promise.all([
    getTodayOccupancy(),
    getHistoricalAvgPax(),
  ]);

  const todayPax =
    todayOccupancy?.actual_pax ?? todayOccupancy?.expected_pax ?? null;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-black tracking-wide">
            BREAKFAST BUFFET
          </h1>
          <p className="text-gray-400 text-sm">Live Tray Monitor</p>
        </div>
        <div className="flex items-center gap-6">
          {todayPax && (
            <div className="text-right">
              <span className="text-gray-400 text-xs uppercase tracking-wide">Today&apos;s Pax</span>
              <p className="text-white text-3xl font-black">{todayPax}</p>
            </div>
          )}
          <Link
            href="/manage/config"
            className="text-sm text-gray-300 border border-gray-600 rounded-md px-3 py-1.5 hover:bg-gray-800 transition-colors"
          >
            ← Management
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-6">
        <TrayGrid
          todayPax={todayPax}
          historicalAvgPax={historicalAvgPax}
        />
      </main>
    </div>
  );
}

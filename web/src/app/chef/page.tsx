import { createClient } from "@/lib/supabase/server";
import { TrayGrid } from "@/components/chef/TrayGrid";
import { ChefHeader } from "@/components/chef/ChefHeader";

export const dynamic = "force-dynamic";

async function getHistoricalAvgPax(): Promise<number | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("daily_occupancy")
    .select("actual_pax, expected_pax")
    .order("date", { ascending: false })
    .limit(30);

  if (!data || data.length === 0) return null;

  const rows = data as Array<{ actual_pax: number | null; expected_pax: number }>;
  const values = rows.map((r) => r.actual_pax ?? r.expected_pax).filter(Boolean) as number[];
  if (values.length === 0) return null;

  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

export default async function ChefDashboardPage() {
  const historicalAvgPax = await getHistoricalAvgPax();

  return (
    <div className="h-dvh overflow-hidden bg-ink-0 flex flex-col">
      <ChefHeader />

      {/* Main content — flex-1 + min-h-0 prevents overflow */}
      <main className="flex-1 min-h-0 p-4">
        <TrayGrid historicalAvgPax={historicalAvgPax} />
      </main>
    </div>
  );
}

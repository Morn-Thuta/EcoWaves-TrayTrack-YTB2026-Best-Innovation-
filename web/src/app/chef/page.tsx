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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch the viewer's role so the chef header can show the back-to-manage
  // affordance only for admin / F&B / kitchen manager users. Kitchen-floor
  // chefs (or signed-out viewers like a TV display) see the pure chef UI.
  let role: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();
    role = profile?.role ?? null;
  }

  // Offline sensor count for the header status pill (initial render only —
  // updated on full page reload so we don't double-subscribe the realtime
  // channel that TrayGrid already owns).
  const { data: sensors } = await supabase
    .from("sensors")
    .select("connection_status");
  const initialOfflineCount = (sensors ?? []).filter(
    (s: { connection_status?: string }) =>
      s.connection_status !== "online"
  ).length;

  const historicalAvgPax = await getHistoricalAvgPax();

  return (
    <div className="h-dvh overflow-hidden bg-ink-0 flex flex-col">
      <ChefHeader role={role} initialOfflineCount={initialOfflineCount} />

      {/* Main content — flex-1 + min-h-0 prevents overflow */}
      <main className="flex-1 min-h-0 p-4">
        <TrayGrid historicalAvgPax={historicalAvgPax} />
      </main>
    </div>
  );
}

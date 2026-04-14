import { createClient } from "@/lib/supabase/server";
import { ProcurementView } from "@/components/manage/ProcurementView";

export const dynamic = "force-dynamic";

export default async function ProcurementPage() {
  const supabase = await createClient();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const today = new Date().toISOString().split("T")[0];

  const [
    { data: ingredients },
    { data: dishes },
    { data: tomorrowOccupancy },
    { data: recentOccupancy },
  ] = await Promise.all([
    supabase
      .from("ingredients")
      .select("*, dishes(name, batch_size)")
      .order("name"),
    supabase
      .from("dishes")
      .select("dish_id, name, batch_size")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("daily_occupancy")
      .select("expected_pax, actual_pax")
      .eq("date", tomorrowStr)
      .maybeSingle(),
    supabase
      .from("daily_occupancy")
      .select("actual_pax, expected_pax")
      .lt("date", today)
      .order("date", { ascending: false })
      .limit(30),
  ]);

  // Compute avg pax from recent history
  const recentRows = (recentOccupancy ?? []) as Array<{ actual_pax: number | null; expected_pax: number }>;
  const paxValues = recentRows.map((r) => r.actual_pax ?? r.expected_pax).filter(Boolean) as number[];
  const avgPax = paxValues.length > 0 ? Math.round(paxValues.reduce((a, b) => a + b, 0) / paxValues.length) : null;

  const tomorrowPax = (tomorrowOccupancy as { expected_pax: number; actual_pax: number | null } | null)?.expected_pax ?? avgPax ?? 100;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-white text-xl font-bold mb-1">Procurement</h2>
        <p className="text-gray-400 text-sm">
          What to buy for tomorrow&apos;s service ({tomorrowStr}).
          Formula: <span className="text-gray-300">batches needed × recipe qty − current stock = to buy.</span>
        </p>
      </div>
      <ProcurementView
        ingredients={ingredients ?? []}
        dishes={dishes ?? []}
        tomorrowPax={tomorrowPax}
        avgPax={avgPax ?? tomorrowPax}
      />
    </div>
  );
}

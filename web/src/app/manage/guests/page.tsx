import { createClient } from "@/lib/supabase/server";
import { OccupancyForm } from "@/components/manage/OccupancyForm";
import { OccupancyTable } from "@/components/manage/OccupancyTable";

export const dynamic = "force-dynamic";

export default async function GuestsPage() {
  const supabase = await createClient();

  const { data: occupancy } = await supabase
    .from("daily_occupancy")
    .select("*")
    .order("date", { ascending: false })
    .limit(30);

  const today = new Date().toISOString().split("T")[0];
  const todayRecord = occupancy?.find((r) => r.date === today) ?? null;

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-white text-xl font-bold mb-2">Daily Guest Count</h2>
        <p className="text-gray-400 text-sm mb-6">
          Enter expected and actual guest counts for today&apos;s breakfast service.
          Actual count overrides expected for all cook suggestions.
          Future: this data will be pulled automatically from the hotel PMS.
        </p>
        <OccupancyForm today={today} existing={todayRecord} />
      </section>

      <section>
        <h2 className="text-white text-xl font-bold mb-4">Recent Guest Counts</h2>
        <OccupancyTable records={occupancy ?? []} />
      </section>
    </div>
  );
}

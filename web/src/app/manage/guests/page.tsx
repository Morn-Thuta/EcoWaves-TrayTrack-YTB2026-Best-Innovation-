import { createClient } from "@/lib/supabase/server";
import { OccupancyForm } from "@/components/manage/OccupancyForm";
import { TableArrivalPanel } from "@/components/manage/TableArrivalPanel";
import { CsvImporter } from "@/components/manage/CsvImporter";

export const dynamic = "force-dynamic";

export default async function ServicePage() {
  const supabase = await createClient();

  const today = new Date().toISOString().split("T")[0];
  const { data: todayRecord } = await supabase
    .from("daily_occupancy")
    .select("*")
    .eq("date", today)
    .maybeSingle();

  return (
    <div className="space-y-10 max-w-2xl">

      {/* Section 1: Current pax */}
      <section>
        <h2 className="text-white text-xl font-bold mb-1">Current Pax</h2>
        <p className="text-gray-400 text-sm mb-5">
          Enter today&apos;s guest count split by adults and children.
          This immediately updates cook suggestions on the chef screen.
        </p>
        <OccupancyForm today={today} existing={todayRecord ?? null} />
      </section>

      {/* Section 2: Table arrival alert */}
      <section>
        <h2 className="text-white text-xl font-bold mb-1">Notify Chef of Table Arrival</h2>
        <p className="text-gray-400 text-sm mb-5">
          Push a real-time alert to the chef screen when a large group arrives.
          Alert auto-dismisses after 30 seconds.
        </p>
        <TableArrivalPanel />
      </section>

      {/* Section 3: CSV import (moved from Import tab) */}
      <section>
        <h2 className="text-white text-xl font-bold mb-1">Import Guest Count Data</h2>
        <p className="text-gray-400 text-sm mb-5">
          Import historical guest counts from a CSV file.
          Duplicates (same date) are automatically skipped.
        </p>
        <CsvImporter defaultType="daily_occupancy" />
      </section>

    </div>
  );
}

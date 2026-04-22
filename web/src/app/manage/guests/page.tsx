import { createClient } from "@/lib/supabase/server";
import { OccupancyForm } from "@/components/manage/OccupancyForm";
import { TableArrivalPanel } from "@/components/manage/TableArrivalPanel";
import { ServiceTimer } from "@/components/chef/ServiceTimer";
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
    <div className="space-y-4">

      {/* ── Row 1: Pax + Service Timer ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Current Pax */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-white font-bold text-base mb-4 flex items-center gap-2">
            <span className="text-green-400">👥</span> Current Pax
          </h2>
          <OccupancyForm today={today} existing={todayRecord ?? null} />
        </div>

        {/* Service End Time */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-white font-bold text-base mb-4 flex items-center gap-2">
            <span className="text-blue-400">🕐</span> Service Window
          </h2>
          <p className="text-gray-500 text-xs mb-4">
            Countdown shown on the chef screen. Update before each service.
          </p>
          <ServiceTimer editable={true} />
        </div>
      </div>

      {/* ── Row 2: Notify Chef + Import ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Table arrival alert */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-white font-bold text-base mb-1 flex items-center gap-2">
            <span className="text-blue-400">🪑</span> Notify Chef
          </h2>
          <p className="text-gray-500 text-xs mb-4">
            Push an alert to the chef screen. Auto-dismisses in 30 seconds.
          </p>
          <TableArrivalPanel />
        </div>

        {/* CSV import */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-white font-bold text-base mb-1 flex items-center gap-2">
            <span className="text-gray-400">📁</span> Import Guest Data
          </h2>
          <p className="text-gray-500 text-xs mb-4">
            Import historical pax counts from a CSV. Duplicate dates are skipped.
          </p>
          <CsvImporter defaultType="daily_occupancy" />
        </div>
      </div>

    </div>
  );
}

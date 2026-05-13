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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 auto-rows-min">

      {/* ── TILE 1 — Pax (large, primary) ────────────────────────────── */}
      <Tile id="tour-current-pax" className="lg:col-span-7 lg:row-span-2">
        <TileHead label="Pax Today" />
        <OccupancyForm today={today} existing={todayRecord ?? null} />
      </Tile>

      {/* ── TILE 2 — Service Timer ──────────────────────────────────── */}
      <Tile id="tour-service-timer" className="lg:col-span-5">
        <TileHead label="Service Window" />
        <ServiceTimer editable={true} />
      </Tile>

      {/* ── TILE 3 — Notify Chef ────────────────────────────────────── */}
      <Tile id="tour-notify-chef" className="lg:col-span-5">
        <TileHead label="Notify Kitchen" />
        <TableArrivalPanel />
      </Tile>

      {/* ── TILE 4 — Bulk Import ────────────────────────────────────── */}
      <Tile className="lg:col-span-12">
        <TileHead label="Bulk Import" helper="Upload historical CSV data. Duplicate dates are skipped." />
        <CsvImporter defaultType="daily_occupancy" />
      </Tile>
    </div>
  );
}

/* ─── Bento tile shell ─────────────────────────────────────────────────── */
function Tile({
  id,
  children,
  className = "",
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      id={id}
      className={[
        "bg-ink-1 border border-ink-3 rounded-2xl p-5",
        "flex flex-col gap-4",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

/* ─── Tile header: small eyebrow label only ─── */
function TileHead({ label, helper }: { label: string; helper?: string }) {
  return (
    <div>
      <p className="text-ink-6 text-[11px] font-semibold uppercase tracking-[0.14em]">
        {label}
      </p>
      {helper && <p className="text-ink-6 text-[12px] mt-1.5">{helper}</p>}
    </div>
  );
}

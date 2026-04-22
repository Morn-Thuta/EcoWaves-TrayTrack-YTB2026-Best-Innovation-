import { createClient } from "@/lib/supabase/server";
import { DishConfigTable } from "@/components/manage/DishConfigTable";
import { TrayMappingTable } from "@/components/manage/TrayMappingTable";

export const dynamic = "force-dynamic";

export default async function ConfigPage() {
  const supabase = await createClient();

  const [{ data: dishes }, { data: trays }, { data: sensors }] = await Promise.all([
    supabase.from("dishes").select("*").order("name"),
    supabase.from("trays").select("*").order("tray_name"),
    supabase.from("sensors").select("*").order("created_at"),
  ]);

  return (
    <div className="space-y-10">

      {/* ── Dish Configuration ──────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-white text-xl font-bold">Dish Configuration</h2>
            <p className="text-gray-400 text-sm mt-0.5">
              Define each dish, its full tray weight, and whether it is active.
            </p>
          </div>
        </div>
        <DishConfigTable initialDishes={dishes ?? []} />
      </section>

      {/* ── Station Mapping ─────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-white text-xl font-bold">Station Mapping</h2>
            <p className="text-gray-400 text-sm mt-0.5">
              Assign a dish and sensor to each physical tray station. Calibrate after swapping trays.
            </p>
          </div>
        </div>
        <TrayMappingTable
          initialTrays={trays ?? []}
          dishes={dishes ?? []}
          sensors={sensors ?? []}
        />
      </section>

    </div>
  );
}

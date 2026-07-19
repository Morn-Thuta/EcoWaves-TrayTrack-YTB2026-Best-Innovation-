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
    <div className="space-y-8">
      <section id="tour-dish-config">
        <DishConfigTable initialDishes={dishes ?? []} />
      </section>

      <section id="tour-station-mapping">
        <TrayMappingTable
          initialTrays={trays ?? []}
          dishes={dishes ?? []}
          sensors={sensors ?? []}
        />
      </section>
    </div>
  );
}

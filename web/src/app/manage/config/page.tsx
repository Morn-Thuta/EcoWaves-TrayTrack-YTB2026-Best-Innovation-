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
      <section>
        <h2 className="text-white text-xl font-bold mb-4">Dish Configuration</h2>
        <p className="text-gray-400 text-sm mb-6">
          Set the full tray weight, cook trigger, and batch size for each dish.
          These values determine when refill alerts and cook suggestions fire.
        </p>
        <DishConfigTable initialDishes={dishes ?? []} />
      </section>

      <section>
        <h2 className="text-white text-xl font-bold mb-4">Tray → Sensor → Dish Mapping</h2>
        <p className="text-gray-400 text-sm mb-6">
          Assign which physical sensor is in which tray, and which dish is currently on that tray.
          Recalibrate the tare weight whenever you change trays.
        </p>
        <TrayMappingTable
          initialTrays={trays ?? []}
          dishes={dishes ?? []}
          sensors={sensors ?? []}
        />
      </section>
    </div>
  );
}

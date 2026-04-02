import { createClient } from "@/lib/supabase/server";
import { ProcurementView } from "@/components/manage/ProcurementView";

export const dynamic = "force-dynamic";

export default async function ProcurementPage() {
  const supabase = await createClient();

  const [{ data: suggestions }, { data: ingredients }, { data: dishes }] = await Promise.all([
    supabase
      .from("procurement_suggestions")
      .select("*, ingredients(name, unit_of_measure, dish_id, dishes(name))")
      .order("target_date", { ascending: true })
      .limit(100),
    supabase.from("ingredients").select("*, dishes(name)").order("name"),
    supabase.from("dishes").select("dish_id, name").eq("is_active", true).order("name"),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-white text-xl font-bold mb-2">Procurement Suggestions</h2>
        <p className="text-gray-400 text-sm mb-6">
          Ingredient quantities predicted from historical consumption patterns and guest count trends.
          Accuracy improves as more data is collected. Export as PDF or CSV for purchasing.
        </p>
      </div>
      <ProcurementView
        suggestions={suggestions ?? []}
        ingredients={ingredients ?? []}
        dishes={dishes ?? []}
      />
    </div>
  );
}

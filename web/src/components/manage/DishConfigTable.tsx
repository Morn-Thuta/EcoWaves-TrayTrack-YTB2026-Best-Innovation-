"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { Dish, DishInsert } from "@/types/domain";

interface DishConfigTableProps {
  initialDishes: Dish[];
}

const EMPTY_FORM: DishInsert = {
  name: "",
  category: "",
  dish_type: "cooked",
  full_tray_weight_grams: 5000,
  tare_weight_grams: 0,
  batch_size: 50,
  cook_trigger_percent: 25,
  average_cook_time_minutes: 30,
  popularity_score: 5,
  is_active: true,
};

export function DishConfigTable({ initialDishes }: DishConfigTableProps) {
  const [dishes, setDishes] = useState<Dish[]>(initialDishes);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Dish | null>(null);
  const [form, setForm] = useState<DishInsert>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
    setOpen(true);
  }

  function openEdit(dish: Dish) {
    setEditing(dish);
    setForm({
      name: dish.name,
      category: dish.category ?? "",
      dish_type: dish.dish_type ?? "cooked",
      full_tray_weight_grams: dish.full_tray_weight_grams,
      tare_weight_grams: dish.tare_weight_grams,
      batch_size: dish.batch_size,
      cook_trigger_percent: dish.cook_trigger_percent,
      average_cook_time_minutes: dish.average_cook_time_minutes,
      popularity_score: dish.popularity_score,
      is_active: dish.is_active,
    });
    setOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    if (!form.name.trim()) {
      setError("Dish name is required.");
      setSaving(false);
      return;
    }
    if (form.full_tray_weight_grams <= 0) {
      setError("Full tray weight must be greater than 0.");
      setSaving(false);
      return;
    }

    if (editing) {
      const { data, error: dbError } = await supabase
        .from("dishes")
        .update(form)
        .eq("dish_id", editing.dish_id)
        .select()
        .single();

      if (dbError) { setError(dbError.message); setSaving(false); return; }
      if (data) setDishes((prev) => prev.map((d) => (d.dish_id === data.dish_id ? data : d)));
    } else {
      const { data, error: dbError } = await supabase
        .from("dishes")
        .insert(form)
        .select()
        .single();

      if (dbError) { setError(dbError.message); setSaving(false); return; }
      if (data) setDishes((prev) => [...prev, data]);
    }

    setSaving(false);
    setOpen(false);
  }

  async function toggleActive(dish: Dish) {
    const { data } = await supabase
      .from("dishes")
      .update({ is_active: !dish.is_active })
      .eq("dish_id", dish.dish_id)
      .select()
      .single();

    if (data) setDishes((prev) => prev.map((d) => (d.dish_id === data.dish_id ? data : d)));
  }

  return (
    <>
      <div className="space-y-4">
        <Button onClick={openAdd} className="bg-green-700 hover:bg-green-600 text-white">
          + Add Dish
        </Button>

        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-900 text-gray-400 uppercase text-xs tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Dish</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-right">Full Tray (kg)</th>
                <th className="px-4 py-3 text-center">Active</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {dishes.map((dish) => (
                <tr
                  key={dish.dish_id}
                  className={`bg-gray-950 hover:bg-gray-900 ${!dish.is_active ? "opacity-50" : ""}`}
                >
                  <td className="px-4 py-3 text-white font-medium">{dish.name}</td>
                  <td className="px-4 py-3 text-gray-400">{dish.category ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-400 capitalize">
                    {dish.dish_type ?? "cooked"}
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-right">
                    {(dish.full_tray_weight_grams / 1000).toFixed(1)}
                  </td>
                  {/* Toggle switch */}
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleActive(dish)}
                      role="switch"
                      aria-checked={dish.is_active}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        dish.is_active ? "bg-green-600" : "bg-gray-700"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                          dish.is_active ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEdit(dish)}
                      className="text-gray-400 hover:text-white"
                    >
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
              {dishes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-600">
                    No dishes configured yet. Add your first dish above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Dish" : "Add Dish"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <Field label="Dish Name *">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Category (e.g. Main)">
                <Input
                  value={form.category ?? ""}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </Field>
              <Field label="Type">
                <select
                  value={form.dish_type ?? "cooked"}
                  onChange={(e) => setForm({ ...form, dish_type: e.target.value })}
                  className="w-full rounded-md bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm"
                >
                  <option value="cooked">Cooked</option>
                  <option value="ready-to-serve">Ready to Serve</option>
                </select>
              </Field>
            </div>

            <Field label="Full Tray Weight (kg) *">
              <Input
                type="number"
                min={0.1}
                step={0.1}
                value={form.full_tray_weight_grams / 1000}
                onChange={(e) =>
                  setForm({
                    ...form,
                    full_tray_weight_grams: parseFloat(e.target.value) * 1000,
                  })
                }
                className="bg-gray-800 border-gray-700 text-white"
              />
            </Field>
          </div>

          {error && <p className="text-red-400 text-sm px-1 pb-1">{error}</p>}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} className="text-gray-400">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.name}
              className="bg-green-700 hover:bg-green-600 text-white"
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-gray-400 text-xs">{label}</Label>
      {children}
    </div>
  );
}

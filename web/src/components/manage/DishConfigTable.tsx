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
      <div className="space-y-3">
        {/* Single compact header row: title + helper left, action right */}
        <div className="flex items-end justify-between gap-6 pb-2 border-b border-ink-3">
          <div>
            <h2 className="text-ink-8 text-[15px] font-semibold tracking-tight">
              Dish Configuration
            </h2>
            <p className="text-ink-6 text-[13px] mt-0.5">
              Each dish has a full-tray weight and cook trigger threshold.
            </p>
          </div>
          <Button
            onClick={openAdd}
            className="bg-accent hover:bg-accent-dim text-ink-0 text-[13px] font-semibold h-8 px-3 rounded-md transition-colors duration-150 active:scale-95 shrink-0"
          >
            <span className="mr-1">+</span> Add Dish
          </Button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-ink-3">
          <table className="w-full text-[15px]">
            <thead className="bg-ink-1 text-ink-6 uppercase text-[12px] font-semibold tracking-wide">
              <tr>
                <th className="px-5 py-3 text-left">Dish</th>
                <th className="px-5 py-3 text-left">Category</th>
                <th className="px-5 py-3 text-left">Type</th>
                <th className="px-5 py-3 text-right">Full Tray (kg)</th>
                <th className="px-5 py-3 text-center">Active</th>
                <th className="px-5 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-3">
              {dishes.map((dish) => (
                <tr
                  key={dish.dish_id}
                  className={`bg-ink-2 hover:bg-ink-3 transition-colors duration-150 ${
                    !dish.is_active ? "opacity-50" : ""
                  }`}
                >
                  <td className="px-5 py-3.5 text-ink-8 font-medium">{dish.name}</td>
                  <td className="px-5 py-3.5 text-ink-6">{dish.category ?? "—"}</td>
                  <td className="px-5 py-3.5 text-ink-6 capitalize">
                    {dish.dish_type ?? "cooked"}
                  </td>
                  <td className="px-5 py-3.5 text-ink-7 text-right font-mono tabular">
                    {(dish.full_tray_weight_grams / 1000).toFixed(1)}
                  </td>
                  {/* Toggle switch — compact, inline styles for guaranteed render */}
                  <td className="px-5 py-3.5 text-center">
                    <button
                      onClick={() => toggleActive(dish)}
                      role="switch"
                      aria-checked={dish.is_active}
                      className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.70_0.18_160)]/40"
                      style={{
                        backgroundColor: dish.is_active
                          ? "oklch(0.70 0.18 160)"          // emerald track
                          : "oklch(0.22 0.010 240)",        // dark ink-3 track
                        boxShadow: dish.is_active
                          ? "none"
                          : "inset 0 0 0 1px oklch(0.30 0.010 240)",  // subtle inner border when off
                        transition: "background-color 150ms ease",
                      }}
                    >
                      <span
                        className="inline-block h-3.5 w-3.5 rounded-full shadow"
                        style={{
                          backgroundColor: dish.is_active
                            ? "oklch(0.96 0.003 240)"        // bright knob on emerald
                            : "oklch(0.62 0.008 240)",       // muted knob when off
                          transform: dish.is_active
                            ? "translateX(18px)"
                            : "translateX(3px)",
                          transition: "transform 150ms ease, background-color 150ms ease",
                        }}
                      />
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEdit(dish)}
                      className="text-ink-6 hover:text-ink-8 hover:bg-ink-3 h-8 text-[13px] font-medium"
                    >
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
              {dishes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-ink-6 text-sm">
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

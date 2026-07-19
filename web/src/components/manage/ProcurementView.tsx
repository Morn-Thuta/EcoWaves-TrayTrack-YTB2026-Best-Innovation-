"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Ingredient {
  ingredient_id: string;
  name: string;
  dish_id: string;
  recipe_quantity: number;
  unit_of_measure: string;
  current_stock: number;
  stock_updated_at: string | null;
  dishes: { name: string; batch_size: number } | null;
}

interface Dish {
  dish_id: string;
  name: string;
  batch_size: number;
}

interface ProcurementViewProps {
  ingredients: Ingredient[];
  dishes: Dish[];
  tomorrowPax: number;
  avgPax: number;
}

interface ComputedRow {
  ingredient_id: string;
  ingredientName: string;
  dishName: string;
  currentStock: number;
  neededTomorrow: number;
  toBuy: number;
  unit: string;
}

function computeRows(ingredients: Ingredient[], tomorrowPax: number, avgPax: number): ComputedRow[] {
  return ingredients.map((ing) => {
    const demandFactor = avgPax > 0 ? tomorrowPax / avgPax : 1;
    const neededTomorrow = Math.ceil(demandFactor * ing.recipe_quantity * 10) / 10;
    const toBuy = Math.max(0, Math.ceil((neededTomorrow - ing.current_stock) * 10) / 10);
    return {
      ingredient_id: ing.ingredient_id,
      ingredientName: ing.name,
      dishName: ing.dishes?.name ?? "—",
      currentStock: ing.current_stock,
      neededTomorrow,
      toBuy,
      unit: ing.unit_of_measure,
    };
  });
}

function exportCSV(rows: ComputedRow[], tomorrowPax: number) {
  const header = "Ingredient,Dish,Current Stock,Needed Tomorrow,To Buy,Unit";
  const lines = rows.map((r) =>
    `"${r.ingredientName}","${r.dishName}",${r.currentStock},${r.neededTomorrow},${r.toBuy},"${r.unit}"`
  );
  const csv = [header, ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `procurement-${new Date().toISOString().split("T")[0]}-pax${tomorrowPax}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportPDF(rows: ComputedRow[], tomorrowPax: number) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split("T")[0];

  const tableRows = rows
    .map(
      (r) => `<tr style="background:${r.toBuy > 0 ? "#fff3cd" : "#fff"}">
        <td>${r.ingredientName}</td><td>${r.dishName}</td>
        <td>${r.currentStock} ${r.unit}</td><td>${r.neededTomorrow} ${r.unit}</td>
        <td style="font-weight:bold;color:${r.toBuy > 0 ? "#856404" : "#155724"}">${r.toBuy > 0 ? r.toBuy + " " + r.unit : "&#10003; OK"}</td>
      </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html><html><head><title>Procurement ${dateStr}</title>
  <style>body{font-family:Arial,sans-serif;padding:24px}h1{font-size:18px}
  table{width:100%;border-collapse:collapse;margin-top:16px}
  th{background:#1a1a2e;color:white;padding:8px 12px;text-align:left;font-size:12px}
  td{padding:8px 12px;border-bottom:1px solid #ddd;font-size:12px}
  .meta{color:#666;font-size:12px;margin-bottom:8px}
  @media print{body{padding:0}}</style></head><body>
  <h1>Procurement Shopping List &#8212; ${dateStr}</h1>
  <p class="meta">Tomorrow&#39;s expected pax: <strong>${tomorrowPax}</strong> &#xB7; Generated: ${new Date().toLocaleString()}</p>
  <table><thead><tr><th>Ingredient</th><th>Dish</th><th>Current Stock</th><th>Needed</th><th>To Buy</th></tr></thead>
  <tbody>${tableRows}</tbody></table></body></html>`;

  // Hidden iframe instead of window.open() — avoids the popup blocker.
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow?.document;
  if (!doc) { iframe.remove(); return; }
  doc.open();
  doc.write(html);
  doc.close();
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => iframe.remove(), 1000);
  }, 300);
}

export function ProcurementView({ ingredients, dishes: _dishes, tomorrowPax, avgPax }: ProcurementViewProps) {
  const [items, setItems] = useState<Ingredient[]>(ingredients);
  const [saving, setSaving] = useState<string | null>(null);
  const supabase = createClient();

  const rows = computeRows(items, tomorrowPax, avgPax);
  const toBuyCount = rows.filter((r) => r.toBuy > 0).length;

  async function updateStock(ingredientId: string, value: number) {
    setSaving(ingredientId);
    await supabase
      .from("ingredients")
      .update({ current_stock: value, stock_updated_at: new Date().toISOString() })
      .eq("ingredient_id", ingredientId);
    setItems((prev) =>
      prev.map((i) => i.ingredient_id === ingredientId ? { ...i, current_stock: value } : i)
    );
    setSaving(null);
  }

  const byDish = rows.reduce<Record<string, ComputedRow[]>>((acc, r) => {
    (acc[r.dishName] = acc[r.dishName] ?? []).push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2">
            <span className="text-gray-400 text-xs uppercase tracking-wide">Tomorrow&apos;s Pax</span>
            <p className="text-white text-2xl font-black">{tomorrowPax}</p>
          </div>
          <div className={`border rounded-lg px-4 py-2 ${toBuyCount > 0 ? "bg-amber-950 border-amber-700" : "bg-green-950 border-green-700"}`}>
            <span className="text-gray-400 text-xs uppercase tracking-wide">Items to Buy</span>
            <p className={`text-2xl font-black ${toBuyCount > 0 ? "text-amber-300" : "text-green-300"}`}>{toBuyCount}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportCSV(rows, tomorrowPax)}
            className="text-sm text-gray-300 border border-gray-600 rounded-md px-3 py-1.5 hover:bg-gray-800 transition-colors"
          >
            Download CSV
          </button>
          <button
            onClick={() => exportPDF(rows, tomorrowPax)}
            className="text-sm text-gray-300 border border-gray-600 rounded-md px-3 py-1.5 hover:bg-gray-800 transition-colors"
          >
            Download PDF
          </button>
        </div>
      </div>

      {/* Table grouped by dish */}
      {Object.entries(byDish).map(([dishName, dishRows]) => (
        <div key={dishName} className="rounded-xl border border-gray-800 overflow-hidden">
          <div className="bg-gray-900 px-4 py-2.5 flex items-center justify-between">
            <span className="text-white font-semibold">{dishName}</span>
            <span className="text-gray-500 text-xs">{dishRows.length} ingredient{dishRows.length > 1 ? "s" : ""}</span>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-950 text-gray-400 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-2 text-left">Ingredient</th>
                <th className="px-4 py-2 text-right">Current Stock</th>
                <th className="px-4 py-2 text-right">Needed Tomorrow</th>
                <th className="px-4 py-2 text-right">To Buy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {dishRows.map((row) => {
                const ing = items.find((i) => i.ingredient_id === row.ingredient_id)!;
                return (
                  <tr key={row.ingredient_id} className={row.toBuy > 0 ? "bg-amber-950/20" : "bg-gray-950"}>
                    <td className="px-4 py-3 text-white font-medium">{row.ingredientName}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          defaultValue={ing.current_stock}
                          onBlur={(e) => {
                            const v = parseFloat(e.target.value);
                            if (!isNaN(v) && v !== ing.current_stock) updateStock(row.ingredient_id, v);
                          }}
                          className="w-20 bg-gray-800 border border-gray-700 rounded px-2 py-0.5 text-white text-right text-sm focus:border-green-500 outline-none"
                        />
                        <span className="text-gray-400 text-xs w-8">{row.unit}</span>
                        {saving === row.ingredient_id && <span className="text-green-400 text-xs">✓</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-right">
                      {row.neededTomorrow} {row.unit}
                    </td>
                    <td className="px-4 py-3 text-right font-bold">
                      {row.toBuy > 0 ? (
                        <span className="text-amber-400">{row.toBuy} {row.unit}</span>
                      ) : (
                        <span className="text-green-500 text-xs">✓ OK</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}

      <p className="text-gray-600 text-xs text-center">
        Edit the current stock field and click away to save. Changes update the To Buy column instantly.
      </p>
    </div>
  );
}

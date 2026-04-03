"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Ingredient, Dish } from "@/types/domain";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SuggestionWithRelations = any;

interface ProcurementViewProps {
  suggestions: SuggestionWithRelations[];
  ingredients: (Ingredient & { dishes?: { name: string } | null })[];
  dishes: Pick<Dish, "dish_id" | "name">[];
}

export function ProcurementView({ suggestions, ingredients }: ProcurementViewProps) {
  const [exporting, setExporting] = useState(false);

  function exportPDF() {
    const date = new Date().toISOString().split("T")[0];
    const rows = suggestions
      .map(
        (s: SuggestionWithRelations) =>
          `<tr>
            <td>${s.ingredients?.name ?? "—"}</td>
            <td>${s.ingredients?.dishes?.name ?? "—"}</td>
            <td style="text-align:right">${s.suggested_quantity}</td>
            <td>${s.ingredients?.unit_of_measure ?? "—"}</td>
            <td>${s.target_date}</td>
            <td style="text-align:center">${Math.round(s.confidence_score * 100)}%</td>
          </tr>`
      )
      .join("");

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Procurement Report ${date}</title>
  <style>
    body { font-family: sans-serif; font-size: 12px; margin: 24px; }
    h1 { font-size: 18px; margin-bottom: 4px; }
    p { color: #555; margin-bottom: 16px; font-size: 11px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f3f4f6; text-align: left; padding: 6px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e5e7eb; }
    td { padding: 6px 10px; border-bottom: 1px solid #e5e7eb; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <h1>Procurement Suggestions</h1>
  <p>Generated: ${new Date().toLocaleString("en-SG")} &nbsp;|&nbsp; ${suggestions.length} item(s)</p>
  <table>
    <thead><tr><th>Ingredient</th><th>Dish</th><th style="text-align:right">Suggested Qty</th><th>Unit</th><th>Target Date</th><th style="text-align:center">Confidence</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  }

  async function exportCSV() {
    setExporting(true);
    const rows = [
      ["Ingredient", "Dish", "Suggested Qty", "Unit", "Target Date", "Confidence"],
      ...suggestions.map((s: SuggestionWithRelations) => [
        s.ingredients?.name ?? "—",
        s.ingredients?.dishes?.name ?? "—",
        s.suggested_quantity,
        s.ingredients?.unit_of_measure ?? "—",
        s.target_date,
        `${Math.round(s.confidence_score * 100)}%`,
      ]),
    ];

    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `procurement-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Button
          onClick={exportCSV}
          disabled={exporting || suggestions.length === 0}
          className="bg-blue-700 hover:bg-blue-600 text-white"
        >
          Download CSV
        </Button>
        <Button
          onClick={exportPDF}
          disabled={suggestions.length === 0}
          className="bg-gray-700 hover:bg-gray-600 text-white"
        >
          Download PDF
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-900 text-gray-400 uppercase text-xs tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Ingredient</th>
              <th className="px-4 py-3 text-left">Dish</th>
              <th className="px-4 py-3 text-right">Suggested Qty</th>
              <th className="px-4 py-3 text-left">Unit</th>
              <th className="px-4 py-3 text-left">Target Date</th>
              <th className="px-4 py-3 text-center">Confidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {suggestions.map((s: SuggestionWithRelations) => (
              <tr key={s.suggestion_id} className="bg-gray-950 hover:bg-gray-900">
                <td className="px-4 py-3 text-white font-medium">
                  {s.ingredients?.name ?? "—"}
                </td>
                <td className="px-4 py-3 text-gray-400">
                  {s.ingredients?.dishes?.name ?? "—"}
                </td>
                <td className="px-4 py-3 text-gray-300 text-right font-mono">
                  {s.suggested_quantity}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {s.ingredients?.unit_of_measure ?? "—"}
                </td>
                <td className="px-4 py-3 text-gray-400">{s.target_date}</td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-full ${
                      s.confidence_score >= 0.7
                        ? "bg-green-900 text-green-300"
                        : s.confidence_score >= 0.4
                        ? "bg-amber-900 text-amber-300"
                        : "bg-gray-800 text-gray-400"
                    }`}
                  >
                    {Math.round(s.confidence_score * 100)}%
                  </span>
                </td>
              </tr>
            ))}
            {suggestions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-600">
                  No procurement suggestions yet. More data needed from sensor readings.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {ingredients.length > 0 && (
        <details className="mt-4">
          <summary className="text-gray-500 text-sm cursor-pointer hover:text-gray-300">
            Ingredient recipe mappings ({ingredients.length})
          </summary>
          <div className="mt-2 overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-900 text-gray-400 uppercase text-xs tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Ingredient</th>
                  <th className="px-4 py-3 text-left">Dish</th>
                  <th className="px-4 py-3 text-right">Qty per Batch</th>
                  <th className="px-4 py-3 text-left">Unit</th>
                  <th className="px-4 py-3 text-left">Supplier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {ingredients.map((ing) => (
                  <tr key={ing.ingredient_id} className="bg-gray-950 hover:bg-gray-900">
                    <td className="px-4 py-3 text-white">{ing.name}</td>
                    <td className="px-4 py-3 text-gray-400">{ing.dishes?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-300 text-right font-mono">
                      {ing.recipe_quantity}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{ing.unit_of_measure}</td>
                    <td className="px-4 py-3 text-gray-500">{ing.supplier_name ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}

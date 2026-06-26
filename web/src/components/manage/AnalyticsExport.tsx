"use client";

import { AppButton } from "@/components/ui/AppButton";
import type { ForecastResult } from "@/lib/ai/forecast";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

interface AnalyticsExportProps {
  occupancy: Row[];
  refills: Row[];
  forecast: ForecastResult | null;
}

/** Count refills per dish for the report. */
function refillsByDish(refills: Row[]): Array<{ dish: string; count: number }> {
  const map: Record<string, number> = {};
  for (const r of refills) {
    const name = r.trays?.dishes?.name ?? "Unknown";
    map[name] = (map[name] ?? 0) + 1;
  }
  return Object.entries(map)
    .map(([dish, count]) => ({ dish, count }))
    .sort((a, b) => b.count - a.count);
}

/** CSV of the guest-count time series — universal input for Excel / Power BI / Tableau. */
function downloadCSV(occupancy: Row[]) {
  const header = "date,expected_pax,actual_pax";
  const lines = occupancy.map(
    (r) => `${r.date},${r.expected_pax ?? ""},${r.actual_pax ?? ""}`
  );
  const csv = [header, ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `traytrack-guest-counts-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Printable PDF "service report" — shareable artifact for F&B reporting workflows. */
function openReport(occupancy: Row[], refills: Row[], forecast: ForecastResult | null) {
  const now = new Date().toLocaleString("en-SG");
  const pax = occupancy
    .map((r) => Number(r.actual_pax ?? r.expected_pax))
    .filter((n) => Number.isFinite(n));
  const avgPax = pax.length ? Math.round(pax.reduce((s, n) => s + n, 0) / pax.length) : "—";
  const dishes = refillsByDish(refills);

  const forecastSection = forecast
    ? `
    <h2>AI Demand Forecast &#8212; ${forecast.day_of_week}, ${forecast.forecast_date}</h2>
    <p class="meta">Predicted guests: <strong>${forecast.predicted_pax} pax</strong> &#xB7; ${forecast.pax_reasoning}</p>
    <table>
      <thead><tr><th>Dish</th><th>Recommended</th><th>Batches</th><th>Rationale</th></tr></thead>
      <tbody>
        ${forecast.dishes
          .map(
            (d) =>
              `<tr><td>${d.dish}</td><td><strong>${d.recommended_kg.toFixed(1)} kg</strong></td><td>${d.batches}</td><td>${d.reasoning}</td></tr>`
          )
          .join("")}
      </tbody>
    </table>
    <p class="callout"><strong>Overproduction risk:</strong> ${forecast.waste_insight}</p>
    <p class="callout savings"><strong>Potential savings:</strong> ${forecast.savings_estimate}</p>
  `
    : `<p class="meta">No AI forecast generated yet.</p>`;

  const occupancyRows = occupancy
    .slice()
    .reverse()
    .map(
      (r) =>
        `<tr><td>${r.date}</td><td>${r.expected_pax ?? "&#8212;"}</td><td>${r.actual_pax ?? "&#8212;"}</td></tr>`
    )
    .join("");

  const dishRows = dishes
    .map((d) => `<tr><td>${d.dish}</td><td>${d.count}</td></tr>`)
    .join("");

  const html = `<!DOCTYPE html><html><head><title>TrayTrack Service Report</title>
  <style>
    body{font-family:Arial,Helvetica,sans-serif;padding:28px;color:#1a1a2e;max-width:800px;margin:auto}
    h1{font-size:20px;margin-bottom:2px}
    h2{font-size:15px;margin-top:24px;border-bottom:2px solid #10b981;padding-bottom:4px}
    .meta{color:#555;font-size:12px;margin:4px 0}
    table{width:100%;border-collapse:collapse;margin-top:10px;font-size:12px}
    th{background:#1a1a2e;color:#fff;padding:7px 10px;text-align:left}
    td{padding:7px 10px;border-bottom:1px solid #e5e5e5}
    .callout{font-size:12px;background:#f5f5f5;border-left:3px solid #10b981;padding:8px 12px;margin-top:8px}
    .callout.savings{border-left-color:#0ea5e9}
    @media print{body{padding:0}}
  </style></head><body>
    <h1>TrayTrack &#8212; F&amp;B Service Report</h1>
    <p class="meta">Generated: ${now} &#xB7; Avg guests (recent): <strong>${avgPax}</strong></p>
    ${forecastSection}
    <h2>Guest Count History</h2>
    <table><thead><tr><th>Date</th><th>Expected</th><th>Actual</th></tr></thead><tbody>${occupancyRows}</tbody></table>
    <h2>Refills by Dish (demand signal)</h2>
    <table><thead><tr><th>Dish</th><th>Refills</th></tr></thead><tbody>${dishRows || "<tr><td colspan=2>No refill data yet</td></tr>"}</tbody></table>
    <script>window.onload=()=>window.print()</script>
  </body></html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

export function AnalyticsExport({ occupancy, refills, forecast }: AnalyticsExportProps) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div>
        <h2 className="text-ink-8 text-xl font-bold tracking-tight">Analytics &amp; Reports</h2>
        <p className="text-ink-6 text-[13px] mt-0.5">
          Export your data into any BI tool, or share a printable service report.
        </p>
      </div>
      <div className="flex gap-2 shrink-0">
        <AppButton variant="secondary" size="sm" onClick={() => downloadCSV(occupancy)}>
          ↓ Export CSV
        </AppButton>
        <AppButton
          variant="secondary"
          size="sm"
          onClick={() => openReport(occupancy, refills, forecast)}
        >
          ↓ Export PDF report
        </AppButton>
      </div>
    </div>
  );
}

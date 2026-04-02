"use client";

import type { DailyOccupancy } from "@/types/domain";

interface OccupancyTableProps {
  records: DailyOccupancy[];
}

export function OccupancyTable({ records }: OccupancyTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-800">
      <table className="w-full text-sm">
        <thead className="bg-gray-900 text-gray-400 uppercase text-xs tracking-wide">
          <tr>
            <th className="px-4 py-3 text-left">Date</th>
            <th className="px-4 py-3 text-right">Expected Pax</th>
            <th className="px-4 py-3 text-right">Actual Pax</th>
            <th className="px-4 py-3 text-right">Variance</th>
            <th className="px-4 py-3 text-left">Source</th>
            <th className="px-4 py-3 text-left">Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {records.map((r) => {
            const variance =
              r.actual_pax != null ? r.actual_pax - r.expected_pax : null;
            return (
              <tr key={r.id} className="bg-gray-950 hover:bg-gray-900">
                <td className="px-4 py-3 text-white font-medium">{r.date}</td>
                <td className="px-4 py-3 text-gray-300 text-right">{r.expected_pax}</td>
                <td className="px-4 py-3 text-gray-300 text-right">
                  {r.actual_pax ?? "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  {variance != null ? (
                    <span className={variance >= 0 ? "text-green-400" : "text-red-400"}>
                      {variance >= 0 ? "+" : ""}
                      {variance}
                    </span>
                  ) : (
                    <span className="text-gray-600">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500 capitalize">{r.source}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{r.notes ?? "—"}</td>
              </tr>
            );
          })}
          {records.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-gray-600">
                No occupancy data yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

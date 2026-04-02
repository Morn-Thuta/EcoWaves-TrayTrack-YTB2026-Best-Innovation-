"use client";

import { formatDistanceToNow } from "date-fns";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SensorWithRelations = any;

interface SensorStatusTableProps {
  sensors: SensorWithRelations[];
}

const STATUS_COLOR: Record<string, string> = {
  online:  "text-green-400",
  offline: "text-red-400",
  stale:   "text-amber-400",
};

export function SensorStatusTable({ sensors }: SensorStatusTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-800">
      <table className="w-full text-sm">
        <thead className="bg-gray-900 text-gray-400 uppercase text-xs tracking-wide">
          <tr>
            <th className="px-4 py-3 text-left">Sensor ID</th>
            <th className="px-4 py-3 text-left">Tray</th>
            <th className="px-4 py-3 text-left">Dish</th>
            <th className="px-4 py-3 text-center">Status</th>
            <th className="px-4 py-3 text-left">Last Seen</th>
            <th className="px-4 py-3 text-left">Firmware</th>
            <th className="px-4 py-3 text-right">Cal Factor</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {sensors.map((s: SensorWithRelations) => (
            <tr key={s.sensor_id} className="bg-gray-950 hover:bg-gray-900">
              <td className="px-4 py-3 text-white font-mono text-xs">
                {s.sensor_id.slice(0, 8)}…
              </td>
              <td className="px-4 py-3 text-gray-400">
                {s.trays?.tray_name ?? "—"}
              </td>
              <td className="px-4 py-3 text-gray-400">
                {s.trays?.dishes?.name ?? "—"}
              </td>
              <td className="px-4 py-3 text-center">
                <span className={`font-bold uppercase text-xs ${STATUS_COLOR[s.connection_status] ?? "text-gray-400"}`}>
                  {s.connection_status}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-500 text-xs">
                {s.last_seen_at
                  ? formatDistanceToNow(new Date(s.last_seen_at), { addSuffix: true })
                  : "Never"}
              </td>
              <td className="px-4 py-3 text-gray-500 text-xs">
                {s.firmware_version ?? "—"}
              </td>
              <td className="px-4 py-3 text-gray-500 font-mono text-xs text-right">
                {s.calibration_factor.toFixed(1)}
              </td>
            </tr>
          ))}
          {sensors.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-gray-600">
                No sensors registered. Use the Admin panel to add sensor UUIDs.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

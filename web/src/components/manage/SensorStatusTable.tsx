"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow, differenceInMinutes } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

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

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function SensorStatusTable({ sensors: initialSensors }: SensorStatusTableProps) {
  const [sensors, setSensors] = useState<SensorWithRelations[]>(initialSensors);
  const [now, setNow] = useState(() => new Date());

  // Tick every 30s so "last seen" and health warnings stay fresh
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  const [adding, setAdding] = useState(false);
  const [sensorId, setSensorId] = useState("");
  const [firmware, setFirmware] = useState("1.0.0");
  const [calFactor, setCalFactor] = useState("-7050");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  async function registerSensor() {
    if (!sensorId.trim()) { setError("Sensor ID is required."); return; }
    setSaving(true); setError(null);

    const { data, error: insertError } = await supabase
      .from("sensors")
      .insert({
        sensor_id: sensorId.trim(),
        firmware_version: firmware.trim() || null,
        calibration_factor: parseFloat(calFactor) || -7050,
        connection_status: "offline",
      })
      .select()
      .single();

    setSaving(false);
    if (insertError) { setError(insertError.message); return; }
    if (data) {
      setSensors((prev) => [...prev, data]);
      setSensorId("");
      setFirmware("1.0.0");
      setCalFactor("-7050");
      setAdding(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => { setAdding(true); setSensorId(generateUUID()); setError(null); }}
          className="bg-blue-700 hover:bg-blue-600 text-white text-sm"
        >
          + Register Sensor
        </Button>
      </div>

      {adding && (
        <div className="rounded-xl border border-blue-800 bg-blue-950 p-4 space-y-3">
          <p className="text-blue-200 text-sm font-semibold">Register new ESP32 sensor</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-3">
              <label className="text-gray-400 text-xs uppercase tracking-wide block mb-1">Sensor UUID — flash this onto the ESP32</label>
              <div className="flex gap-2">
                <input
                  value={sensorId}
                  onChange={(e) => setSensorId(e.target.value)}
                  className="flex-1 rounded-md bg-gray-800 border border-gray-700 text-white font-mono px-3 py-1.5 text-sm"
                  placeholder="xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
                />
                <Button size="sm" variant="ghost" onClick={() => setSensorId(generateUUID())} className="text-gray-400 text-xs">
                  Regenerate
                </Button>
              </div>
            </div>
            <div>
              <label className="text-gray-400 text-xs uppercase tracking-wide block mb-1">Firmware</label>
              <input
                value={firmware}
                onChange={(e) => setFirmware(e.target.value)}
                className="w-full rounded-md bg-gray-800 border border-gray-700 text-white px-2 py-1.5 text-sm"
                placeholder="1.0.0"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs uppercase tracking-wide block mb-1">Cal Factor (HX711)</label>
              <input
                value={calFactor}
                onChange={(e) => setCalFactor(e.target.value)}
                className="w-full rounded-md bg-gray-800 border border-gray-700 text-white px-2 py-1.5 text-sm"
                placeholder="-7050"
              />
            </div>
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-2">
            <Button onClick={registerSensor} disabled={saving} className="bg-blue-700 hover:bg-blue-600 text-white text-sm">
              {saving ? "Saving…" : "Register"}
            </Button>
            <Button variant="ghost" onClick={() => setAdding(false)} className="text-gray-400 text-sm">Cancel</Button>
          </div>
          <p className="text-gray-500 text-xs">After registering, flash this UUID into your ESP32 firmware and point it to the <code className="text-gray-300">ingest-reading</code> Edge Function URL.</p>
        </div>
      )}

    {/* Health alerts banner */}
    {sensors.some((s: SensorWithRelations) => {
      if (!s.last_seen_at) return true;
      return differenceInMinutes(now, new Date(s.last_seen_at)) >= 5;
    }) && (
      <div className="flex items-start gap-3 bg-amber-950 border border-amber-700 rounded-xl px-4 py-3">
        <span className="text-amber-400 text-lg mt-0.5">⚠</span>
        <div>
          <p className="text-amber-300 font-semibold text-sm">Sensor health warning</p>
          <p className="text-amber-400/80 text-xs mt-0.5">
            {sensors.filter((s: SensorWithRelations) => {
              if (!s.last_seen_at) return true;
              return differenceInMinutes(now, new Date(s.last_seen_at)) >= 5;
            }).map((s: SensorWithRelations) => s.trays?.tray_name ?? s.sensor_id.slice(0, 8)).join(", ")}{" "}
            {sensors.filter((s: SensorWithRelations) => {
              if (!s.last_seen_at) return true;
              return differenceInMinutes(now, new Date(s.last_seen_at)) >= 5;
            }).length === 1 ? "has" : "have"} not reported in the last 5 minutes. Check power and Wi-Fi.
          </p>
        </div>
      </div>
    )}

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
                {(() => {
                  if (!s.last_seen_at) return <span className="text-red-400">Never</span>;
                  const mins = differenceInMinutes(now, new Date(s.last_seen_at));
                  const label = formatDistanceToNow(new Date(s.last_seen_at), { addSuffix: true });
                  if (mins >= 10) return (
                    <span className="flex items-center gap-1 text-red-400 font-semibold">
                      <span>⚠</span><span>{label}</span>
                    </span>
                  );
                  if (mins >= 5) return (
                    <span className="flex items-center gap-1 text-amber-400 font-semibold">
                      <span>⚠</span><span>{label}</span>
                    </span>
                  );
                  return <span className="text-gray-400">{label}</span>;
                })()}
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
                No sensors registered. Click &quot;+ Register Sensor&quot; to add one.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
    </div>
  );
}

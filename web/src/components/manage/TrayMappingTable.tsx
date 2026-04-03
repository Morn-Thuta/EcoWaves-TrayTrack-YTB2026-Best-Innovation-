"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import type { Tray, Dish, Sensor } from "@/types/domain";

interface TrayMappingTableProps {
  initialTrays: Tray[];
  dishes: Dish[];
  sensors: Sensor[];
}

export function TrayMappingTable({ initialTrays, dishes, sensors }: TrayMappingTableProps) {
  const [trays, setTrays] = useState<Tray[]>(initialTrays);
  const [saving, setSaving] = useState<string | null>(null);
  const [calibrating, setCalibrating] = useState<string | null>(null);
  const [calibStep, setCalibStep] = useState<"empty" | "weight">("empty");
  const [knownWeight, setKnownWeight] = useState("");
  const supabase = createClient();

  async function updateTrayMapping(
    trayId: string,
    field: "dish_id" | "sensor_id",
    value: string | null
  ) {
    setSaving(trayId);
    const { data } = await supabase
      .from("trays")
      .update({ [field]: value || null })
      .eq("tray_id", trayId)
      .select()
      .single();

    if (data) {
      setTrays((prev) => prev.map((t) => (t.tray_id === data.tray_id ? data : t)));
    }
    setSaving(null);
  }

  async function updateTrayStatus(trayId: string, status: Tray["status"]) {
    const { data } = await supabase
      .from("trays")
      .update({ status })
      .eq("tray_id", trayId)
      .select()
      .single();

    if (data) {
      setTrays((prev) => prev.map((t) => (t.tray_id === data.tray_id ? data : t)));
    }
  }

  // Calibration: Step 1 — record empty tray tare weight
  async function startCalibration(trayId: string) {
    setCalibrating(trayId);
    setCalibStep("empty");
  }

  // Calibration: Step 2 — set tare weight to 0 (empty tray = 0 food weight)
  async function recordTare(trayId: string) {
    // Tare weight = 0 means "empty tray reads 0g food weight"
    // The actual HX711 calibration happens on the device; here we store tare_weight_grams = 0
    await supabase
      .from("trays")
      .update({ tare_weight_grams: 0 })
      .eq("tray_id", trayId);

    setCalibStep("weight");
  }

  // Calibration: Step 3 — set full tray weight based on dish
  async function completeCalibration(trayId: string) {
    const tray = trays.find((t) => t.tray_id === trayId);
    if (!tray?.dish_id || !knownWeight) return;

    const fullWeight = parseFloat(knownWeight) * 1000; // convert kg to grams
    const { data } = await supabase
      .from("trays")
      .update({ full_tray_weight_grams: fullWeight })
      .eq("tray_id", trayId)
      .select()
      .single();

    if (data) {
      setTrays((prev) => prev.map((t) => (t.tray_id === data.tray_id ? data : t)));
    }

    setCalibrating(null);
    setKnownWeight("");
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-900 text-gray-400 uppercase text-xs tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Tray</th>
              <th className="px-4 py-3 text-left">Location</th>
              <th className="px-4 py-3 text-left">Dish Assigned</th>
              <th className="px-4 py-3 text-left">Sensor</th>
              <th className="px-4 py-3 text-right">Full Weight (kg)</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-center">Calibrate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {trays.map((tray) => (
              <React.Fragment key={tray.tray_id}>
                <tr className="bg-gray-950 hover:bg-gray-900">
                  <td className="px-4 py-3 text-white font-medium">{tray.tray_name}</td>
                  <td className="px-4 py-3 text-gray-400">{tray.location ?? "—"}</td>

                  {/* Dish selector */}
                  <td className="px-4 py-3">
                    <select
                      value={tray.dish_id ?? ""}
                      onChange={(e) => updateTrayMapping(tray.tray_id, "dish_id", e.target.value)}
                      disabled={saving === tray.tray_id}
                      className="w-full rounded-md bg-gray-800 border border-gray-700 text-white px-2 py-1 text-sm"
                    >
                      <option value="">— No dish —</option>
                      {dishes.map((d) => (
                        <option key={d.dish_id} value={d.dish_id}>{d.name}</option>
                      ))}
                    </select>
                  </td>

                  {/* Sensor selector */}
                  <td className="px-4 py-3">
                    <select
                      value={tray.sensor_id ?? ""}
                      onChange={(e) => updateTrayMapping(tray.tray_id, "sensor_id", e.target.value)}
                      disabled={saving === tray.tray_id}
                      className="w-full rounded-md bg-gray-800 border border-gray-700 text-white px-2 py-1 text-sm"
                    >
                      <option value="">— No sensor —</option>
                      {sensors.map((s) => (
                        <option key={s.sensor_id} value={s.sensor_id}>
                          {s.sensor_id.slice(0, 8)}… ({s.connection_status})
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="px-4 py-3 text-gray-300 text-right">
                    {(tray.full_tray_weight_grams / 1000).toFixed(1)}
                  </td>

                  {/* Status toggle */}
                  <td className="px-4 py-3 text-center">
                    <select
                      value={tray.status}
                      onChange={(e) => updateTrayStatus(tray.tray_id, e.target.value as Tray["status"])}
                      className="rounded-md bg-gray-800 border border-gray-700 text-white px-2 py-1 text-xs"
                    >
                      <option value="active">Active</option>
                      <option value="offline">Offline</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </td>

                  <td className="px-4 py-3 text-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startCalibration(tray.tray_id)}
                      className="text-blue-400 hover:text-blue-200 text-xs"
                    >
                      Calibrate
                    </Button>
                  </td>
                </tr>

                {/* Inline calibration flow */}
                {calibrating === tray.tray_id && (
                  <tr key={`${tray.tray_id}-calib`} className="bg-blue-950 border-blue-800">
                    <td colSpan={7} className="px-6 py-4">
                      {calibStep === "empty" ? (
                        <div className="flex items-center gap-4">
                          <span className="text-blue-200 font-medium">
                            Step 1: Place the <strong>empty tray</strong> on the load cells.
                          </span>
                          <Button
                            size="sm"
                            onClick={() => recordTare(tray.tray_id)}
                            className="bg-blue-600 hover:bg-blue-500 text-white"
                          >
                            Tare (set zero)
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setCalibrating(null)}
                            className="text-gray-400"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4">
                          <span className="text-blue-200 font-medium">
                            Step 2: Enter the <strong>full tray weight</strong> for this dish (kg):
                          </span>
                          <input
                            type="number"
                            min={0.1}
                            step={0.1}
                            value={knownWeight}
                            onChange={(e) => setKnownWeight(e.target.value)}
                            placeholder="e.g. 8.0"
                            className="w-24 rounded-md bg-gray-800 border border-gray-700 text-white px-2 py-1 text-sm"
                          />
                          <Button
                            size="sm"
                            onClick={() => completeCalibration(tray.tray_id)}
                            disabled={!knownWeight}
                            className="bg-green-700 hover:bg-green-600 text-white"
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setCalibrating(null)}
                            className="text-gray-400"
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {trays.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-600">
                  No trays configured. Contact admin to add trays.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

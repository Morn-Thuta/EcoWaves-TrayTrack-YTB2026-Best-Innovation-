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

const BLANK_TRAY = { tray_name: "", location: "", dish_id: "", sensor_id: "", full_tray_weight_grams: "" };

export function TrayMappingTable({ initialTrays, dishes, sensors }: TrayMappingTableProps) {
  const [trays, setTrays] = useState<Tray[]>(initialTrays);
  const [saving, setSaving] = useState<string | null>(null);
  const [calibrating, setCalibrating] = useState<string | null>(null);
  const [calibStep, setCalibStep] = useState<"empty" | "weight">("empty");
  const [knownWeight, setKnownWeight] = useState("");
  const [liveWeight, setLiveWeight] = useState<number | null>(null);
  const [manualTare, setManualTare] = useState("");
  const [adding, setAdding] = useState(false);
  const [newTray, setNewTray] = useState(BLANK_TRAY);
  const [addError, setAddError] = useState<string | null>(null);
  const supabase = createClient();

  async function addTray() {
    if (!newTray.tray_name.trim()) { setAddError("Tray name is required."); return; }
    if (!newTray.full_tray_weight_grams || parseFloat(newTray.full_tray_weight_grams) <= 0) {
      setAddError("Full tray weight must be > 0."); return;
    }
    setAddError(null);
    setSaving("new");

    const { data, error } = await supabase
      .from("trays")
      .insert({
        tray_name: newTray.tray_name.trim(),
        location: newTray.location.trim() || null,
        dish_id: newTray.dish_id || null,
        sensor_id: newTray.sensor_id || null,
        full_tray_weight_grams: parseFloat(newTray.full_tray_weight_grams) * 1000,
        tare_weight_grams: 0,
        status: "active",
        last_weight_grams: 0,
      })
      .select()
      .single();

    setSaving(null);
    if (error) { setAddError(error.message); return; }
    if (data) {
      setTrays((prev) => [...prev, data]);
      setNewTray(BLANK_TRAY);
      setAdding(false);
    }
  }

  async function updateTrayMapping(
    trayId: string,
    field: "dish_id" | "sensor_id",
    value: string | null
  ) {
    setSaving(trayId);

    // When reassigning a sensor, keep sensors.tray_id in sync
    if (field === "sensor_id") {
      const oldSensorId = trays.find((t) => t.tray_id === trayId)?.sensor_id;

      // Clear old sensor's tray_id
      if (oldSensorId) {
        await supabase.from("sensors").update({ tray_id: null }).eq("sensor_id", oldSensorId);
      }
      // Set new sensor's tray_id
      if (value) {
        await supabase.from("sensors").update({ tray_id: trayId }).eq("sensor_id", value);
      }
    }

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

  // Calibration: Step 1 — capture the empty container's weight as the tare
  async function startCalibration(trayId: string) {
    setCalibrating(trayId);
    setCalibStep("empty");
    setManualTare("");
    setLiveWeight(null);
    fetchLiveWeight(trayId);
  }

  // Pull the tray's current sensor reading (the empty container sitting on it)
  async function fetchLiveWeight(trayId: string) {
    const { data } = await supabase
      .from("trays")
      .select("last_weight_grams")
      .eq("tray_id", trayId)
      .single();
    if (data) setLiveWeight(Number(data.last_weight_grams));
  }

  // Store the container weight as tare so only food is measured afterwards.
  // food_weight = sensor_reading − tare_weight_grams
  async function captureContainerTare(trayId: string, grams: number) {
    const tare = Math.max(0, Math.round(grams));
    const { data } = await supabase
      .from("trays")
      .update({ tare_weight_grams: tare })
      .eq("tray_id", trayId)
      .select()
      .single();
    if (data) {
      setTrays((prev) => prev.map((t) => (t.tray_id === data.tray_id ? data : t)));
    }
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
    <div className="space-y-3">
      {/* Single compact header row: title + helper left, action right */}
      <div className="flex items-end justify-between gap-6 pb-2 border-b border-ink-3">
        <div>
          <h2 className="text-ink-8 text-[15px] font-semibold tracking-tight">
            Station Mapping
          </h2>
          <p className="text-ink-6 text-[13px] mt-0.5">
            Assign a dish and a sensor to each physical tray station.
          </p>
        </div>
        <Button
          onClick={() => { setAdding(true); setAddError(null); }}
          className="bg-accent hover:bg-accent-dim text-ink-0 text-[13px] font-semibold h-8 px-3 rounded-md transition-colors duration-150 active:scale-95 shrink-0"
        >
          <span className="mr-1">+</span> Add Tray
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-ink-3">
        <table className="w-full text-[15px]">
          <thead className="bg-ink-1 text-ink-6 uppercase text-[12px] font-semibold tracking-wide">
            <tr>
              <th className="px-5 py-3 text-left">Tray</th>
              <th className="px-5 py-3 text-left">Location</th>
              <th className="px-5 py-3 text-left">Dish Assigned</th>
              <th className="px-5 py-3 text-left">Sensor</th>
              <th className="px-5 py-3 text-right">Full Weight (kg)</th>
              <th className="px-5 py-3 text-center">Status</th>
              <th className="px-5 py-3 text-center">Calibrate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-3">
            {trays.map((tray) => (
              <React.Fragment key={tray.tray_id}>
                <tr className="bg-ink-2 hover:bg-ink-3 transition-colors duration-150">
                  <td className="px-5 py-3.5 text-ink-8 font-medium">{tray.tray_name}</td>
                  <td className="px-5 py-3.5 text-ink-6">{tray.location ?? "—"}</td>

                  {/* Dish selector */}
                  <td className="px-5 py-3">
                    <select
                      value={tray.dish_id ?? ""}
                      onChange={(e) => updateTrayMapping(tray.tray_id, "dish_id", e.target.value)}
                      disabled={saving === tray.tray_id}
                      className="w-full rounded-md bg-ink-3 border border-ink-4 text-ink-8 px-2.5 py-1.5 text-[13px]"
                    >
                      <option value="">— No dish —</option>
                      {dishes.map((d) => (
                        <option key={d.dish_id} value={d.dish_id}>{d.name}</option>
                      ))}
                    </select>
                  </td>

                  {/* Sensor selector */}
                  <td className="px-5 py-3">
                    <select
                      value={tray.sensor_id ?? ""}
                      onChange={(e) => updateTrayMapping(tray.tray_id, "sensor_id", e.target.value)}
                      disabled={saving === tray.tray_id}
                      className="w-full rounded-md bg-ink-3 border border-ink-4 text-ink-8 px-2.5 py-1.5 text-[13px] font-mono"
                    >
                      <option value="">— No sensor —</option>
                      {sensors.map((s) => (
                        <option key={s.sensor_id} value={s.sensor_id}>
                          {s.sensor_id.slice(0, 8)}… ({s.connection_status})
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="px-5 py-3.5 text-ink-7 text-right font-mono tabular">
                    {(tray.full_tray_weight_grams / 1000).toFixed(1)}
                  </td>

                  {/* Status toggle */}
                  <td className="px-5 py-3 text-center">
                    <select
                      value={tray.status}
                      onChange={(e) => updateTrayStatus(tray.tray_id, e.target.value as Tray["status"])}
                      className="rounded-md bg-ink-3 border border-ink-4 text-ink-7 px-2.5 py-1.5 text-[12px]"
                    >
                      <option value="active">Active</option>
                      <option value="offline">Offline</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </td>

                  <td className="px-5 py-3.5 text-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startCalibration(tray.tray_id)}
                      className="text-blue-400 hover:text-blue-300 hover:bg-ink-3 text-[13px] font-medium h-8"
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
                        <div className="flex flex-col gap-3">
                          <p className="text-blue-200 font-medium leading-snug">
                            Step 1 — Container tare. Boot the sensor on the{" "}
                            <strong>bare empty platform</strong>, then place the{" "}
                            <strong>empty container</strong> on the tray and capture its weight.
                            Only food will be measured after this.
                          </p>
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="rounded-lg bg-ink-2 border border-ink-4 px-4 py-2">
                              <span className="text-ink-6 text-[11px] uppercase tracking-wide block">
                                Live reading
                              </span>
                              <span className="text-ink-8 text-xl font-mono tabular">
                                {liveWeight != null ? `${(liveWeight / 1000).toFixed(2)} kg` : "—"}
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => fetchLiveWeight(tray.tray_id)}
                              className="text-blue-300 hover:text-blue-200"
                            >
                              ↻ Refresh
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => captureContainerTare(tray.tray_id, liveWeight ?? 0)}
                              disabled={liveWeight == null}
                              className="bg-blue-600 hover:bg-blue-500 text-white"
                            >
                              Capture as container weight
                            </Button>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-ink-6 text-[13px]">or enter manually:</span>
                            <input
                              type="number"
                              min={0}
                              step={10}
                              value={manualTare}
                              onChange={(e) => setManualTare(e.target.value)}
                              placeholder="grams"
                              className="w-28 rounded-md bg-gray-800 border border-gray-700 text-white px-2 py-1 text-sm"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => captureContainerTare(tray.tray_id, parseFloat(manualTare) || 0)}
                              disabled={!manualTare}
                              className="text-blue-300 hover:text-blue-200"
                            >
                              Set
                            </Button>
                            <span className="text-ink-5 text-[12px] mx-1">·</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => captureContainerTare(tray.tray_id, 0)}
                              className="text-ink-6 hover:text-ink-8"
                            >
                              No container (tare 0)
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
            {/* Inline add-tray form */}
            {adding && (
              <tr className="bg-green-950 border-t border-green-800">
                <td className="px-3 py-3">
                  <input
                    autoFocus
                    placeholder="Tray name *"
                    value={newTray.tray_name}
                    onChange={(e) => setNewTray((p) => ({ ...p, tray_name: e.target.value }))}
                    className="w-full rounded-md bg-gray-800 border border-gray-700 text-white px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-3 py-3">
                  <input
                    placeholder="e.g. Station 4"
                    value={newTray.location}
                    onChange={(e) => setNewTray((p) => ({ ...p, location: e.target.value }))}
                    className="w-full rounded-md bg-gray-800 border border-gray-700 text-white px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-3 py-3">
                  <select
                    value={newTray.dish_id}
                    onChange={(e) => setNewTray((p) => ({ ...p, dish_id: e.target.value }))}
                    className="w-full rounded-md bg-gray-800 border border-gray-700 text-white px-2 py-1 text-sm"
                  >
                    <option value="">— No dish —</option>
                    {dishes.map((d) => <option key={d.dish_id} value={d.dish_id}>{d.name}</option>)}
                  </select>
                </td>
                <td className="px-3 py-3">
                  <select
                    value={newTray.sensor_id}
                    onChange={(e) => setNewTray((p) => ({ ...p, sensor_id: e.target.value }))}
                    className="w-full rounded-md bg-gray-800 border border-gray-700 text-white px-2 py-1 text-sm"
                  >
                    <option value="">— No sensor yet —</option>
                    {sensors.map((s) => (
                      <option key={s.sensor_id} value={s.sensor_id}>
                        {s.sensor_id.slice(0, 8)}… ({s.connection_status})
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-3">
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    placeholder="kg *"
                    value={newTray.full_tray_weight_grams}
                    onChange={(e) => setNewTray((p) => ({ ...p, full_tray_weight_grams: e.target.value }))}
                    className="w-full rounded-md bg-gray-800 border border-gray-700 text-white px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-3 py-3 text-center text-xs text-gray-500">active</td>
                <td className="px-3 py-3">
                  <div className="flex gap-2 justify-center">
                    <Button size="sm" onClick={addTray} disabled={saving === "new"} className="bg-green-700 hover:bg-green-600 text-white text-xs">
                      {saving === "new" ? "Saving…" : "Save"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setAddError(null); }} className="text-gray-400 text-xs">
                      Cancel
                    </Button>
                  </div>
                  {addError && <p className="text-red-400 text-xs mt-1 text-center">{addError}</p>}
                </td>
              </tr>
            )}

            {trays.length === 0 && !adding && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-ink-6 text-sm">
                  No trays configured. Click &quot;+ Add Tray&quot; to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

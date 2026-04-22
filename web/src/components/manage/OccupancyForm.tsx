"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ServiceTimer, STORAGE_KEY as SERVICE_KEY } from "@/components/chef/ServiceTimer";
import type { DailyOccupancy } from "@/types/domain";

interface OccupancyFormProps {
  today: string;
  existing: DailyOccupancy | null;
}

export function OccupancyForm({ today, existing }: OccupancyFormProps) {
  const [adultCount, setAdultCount]   = useState(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (existing as any)?.adult_count?.toString() ?? ""
  );
  const [childCount, setChildCount]   = useState(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (existing as any)?.child_count?.toString() ?? ""
  );
  const [notes, setNotes]             = useState(existing?.notes ?? "");
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const supabase = createClient();

  const adults    = parseInt(adultCount)  || 0;
  const children  = parseInt(childCount) || 0;
  const totalPax  = adults + children;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (adults === 0 && children === 0) {
      setError("Enter at least Adults or Children count.");
      setSaving(false);
      return;
    }

    const payload = {
      date:         today,
      expected_pax: totalPax,
      actual_pax:   totalPax,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      adult_count:  adults  || null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      child_count:  children || null,
      notes:        notes || null,
      source:       "manual" as const,
    };

    let dbError;
    if (existing) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ({ error: dbError } = await (supabase.from("daily_occupancy") as any)
        .update(payload)
        .eq("id", existing.id));
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ({ error: dbError } = await (supabase.from("daily_occupancy") as any)
        .upsert(payload, { onConflict: "date" }));
    }

    setSaving(false);
    if (dbError) {
      setError(dbError.message);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Pax entry */}
      <form
        onSubmit={handleSave}
        className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-lg space-y-5"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">Today — {today}</h3>
          {totalPax > 0 && (
            <span className="text-green-400 font-black text-xl">{totalPax} total</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Adults">
            <Input
              type="number"
              min={0}
              value={adultCount}
              onChange={(e) => setAdultCount(e.target.value)}
              placeholder="e.g. 80"
              className="bg-gray-800 border-gray-700 text-white"
            />
          </Field>
          <Field label="Children">
            <Input
              type="number"
              min={0}
              value={childCount}
              onChange={(e) => setChildCount(e.target.value)}
              placeholder="e.g. 20"
              className="bg-gray-800 border-gray-700 text-white"
            />
          </Field>
        </div>

        <Field label="Notes (optional)">
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Group booking, school holiday"
            className="bg-gray-800 border-gray-700 text-white"
          />
        </Field>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <Button
          type="submit"
          disabled={saving}
          className="bg-green-700 hover:bg-green-600 text-white"
        >
          {saving ? "Saving..." : saved ? "✓ Saved" : "Save Guest Count"}
        </Button>
      </form>

      {/* Service end time */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-lg space-y-3">
        <h3 className="text-white font-semibold">Service End Time</h3>
        <p className="text-gray-500 text-sm">
          Used for the chef countdown timer. Updates immediately on the chef screen.
        </p>
        <ServiceTimer editable={true} />
      </div>
    </div>
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

// Re-export for any legacy imports
export { SERVICE_KEY };

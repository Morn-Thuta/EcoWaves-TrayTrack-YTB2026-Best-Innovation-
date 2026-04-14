"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { DailyOccupancy } from "@/types/domain";

interface OccupancyFormProps {
  today: string;
  existing: DailyOccupancy | null;
}

export function OccupancyForm({ today, existing }: OccupancyFormProps) {
  const [expectedPax, setExpectedPax] = useState(existing?.expected_pax?.toString() ?? "");
  const [actualPax, setActualPax] = useState(existing?.actual_pax?.toString() ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      date: today,
      expected_pax: parseInt(expectedPax) || 0,
      actual_pax: actualPax ? parseInt(actualPax) : null,
      notes: notes || null,
      source: "manual" as const,
    };

    let dbError;
    if (existing) {
      ({ error: dbError } = await supabase.from("daily_occupancy").update(payload).eq("id", existing.id));
    } else {
      ({ error: dbError } = await supabase.from("daily_occupancy").upsert(payload, { onConflict: "date" }));
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
    <form onSubmit={handleSave} className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-lg space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white font-semibold">Today — {today}</h3>
        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">Manual entry</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-gray-400 text-xs">Expected Pax</Label>
          <Input
            type="number"
            min={0}
            value={expectedPax}
            onChange={(e) => setExpectedPax(e.target.value)}
            placeholder="e.g. 100"
            className="bg-gray-800 border-gray-700 text-white"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-gray-400 text-xs">Actual Pax (update during service)</Label>
          <Input
            type="number"
            min={0}
            value={actualPax}
            onChange={(e) => setActualPax(e.target.value)}
            placeholder="e.g. 115"
            className="bg-gray-800 border-gray-700 text-white"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-gray-400 text-xs">Notes</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any special notes (e.g. group booking, school holiday)"
          rows={2}
          className="bg-gray-800 border-gray-700 text-white"
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <Button
        type="submit"
        disabled={saving || !expectedPax}
        className="bg-green-700 hover:bg-green-600 text-white"
      >
        {saving ? "Saving..." : saved ? "✓ Saved" : "Save Guest Count"}
      </Button>
    </form>
  );
}

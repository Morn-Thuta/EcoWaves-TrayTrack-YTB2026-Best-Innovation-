"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  // Live breakdown caption
  const breakdown =
    totalPax > 0
      ? `${adults || 0} adults · ${children || 0} children`
      : "Enter today's guest count below";

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4 flex-1">
      {/* ── HERO: big live total ─────────────────────────────────────── */}
      <div className="flex items-baseline gap-3 -mt-1">
        <span className="text-ink-8 text-6xl font-bold tabular font-mono leading-none tracking-tight">
          {totalPax > 0 ? totalPax : "—"}
        </span>
        <span className="text-ink-6 text-sm">pax</span>
      </div>
      <p className="text-ink-6 text-[12px] -mt-2">{breakdown}</p>

      {/* ── Adult / Child grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Adults">
          <Input
            type="number"
            min={0}
            value={adultCount}
            onChange={(e) => setAdultCount(e.target.value)}
            placeholder="0"
            className="bg-ink-2 border-ink-3 text-ink-8 placeholder:text-ink-5 h-9 text-[14px] font-mono tabular"
          />
        </Field>
        <Field label="Children">
          <Input
            type="number"
            min={0}
            value={childCount}
            onChange={(e) => setChildCount(e.target.value)}
            placeholder="0"
            className="bg-ink-2 border-ink-3 text-ink-8 placeholder:text-ink-5 h-9 text-[14px] font-mono tabular"
          />
        </Field>
      </div>

      <Field label="Notes (optional)">
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Group booking, school holiday"
          className="bg-ink-2 border-ink-3 text-ink-8 placeholder:text-ink-5 h-9 text-[14px]"
        />
      </Field>

      {error && <p className="text-red-400 text-[12px]">{error}</p>}

      {/* Plain button — avoids shadcn Button's bg-primary fallback */}
      <button
        type="submit"
        disabled={saving}
        className="self-start inline-flex items-center h-9 px-4 rounded-md bg-[oklch(0.70_0.18_160)] hover:bg-[oklch(0.62_0.17_160)] text-ink-0 text-[13px] font-semibold transition-colors duration-150 active:scale-95 disabled:opacity-60 disabled:active:scale-100"
      >
        {saving ? "Saving…" : saved ? "✓ Saved" : "Save Guest Count"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-ink-6 text-[11px] font-medium uppercase tracking-wide">
        {label}
      </Label>
      {children}
    </div>
  );
}

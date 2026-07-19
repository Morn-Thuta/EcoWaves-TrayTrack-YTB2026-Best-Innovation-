"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function TableArrivalPanel() {
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  async function sendAlert() {
    if (!note.trim()) return;
    setSending(true);
    setError(null);

    try {
      // Subscribe first, then send — broadcast requires an active subscription
      const channel = supabase.channel("service-alerts");

      await new Promise<void>((resolve, reject) => {
        channel.subscribe((status: string) => {
          if (status === "SUBSCRIBED") resolve();
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") reject(new Error(status));
        });
      });

      const sendResult = await channel.send({
        type: "broadcast",
        event: "table_arrived",
        payload: {
          note: note.trim(),
          time: new Date().toLocaleTimeString("en-SG", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      });

      supabase.removeChannel(channel);

      if (sendResult === "ok") {
        setSent(true);
        setNote("");
        setTimeout(() => setSent(false), 3000);
      } else {
        setError("Failed to send — check your connection.");
      }
    } catch (e) {
      setError(`Could not connect: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 flex-1">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAlert(); }
        }}
        placeholder='e.g. "6 Adults 3 Children just arrived"'
        rows={3}
        className="w-full rounded-lg bg-ink-2 border border-ink-3 text-ink-8 px-3.5 py-2.5 text-[14px] resize-none focus:outline-none focus:border-blue-500/60 placeholder:text-ink-5"
      />

      {/* Plain button — emerald when sent, blue (info) otherwise */}
      <button
        onClick={sendAlert}
        disabled={sending || !note.trim()}
        className={[
          "w-full h-9 rounded-md text-[13px] font-semibold transition-colors duration-150 active:scale-[0.99]",
          "disabled:opacity-60 disabled:active:scale-100",
          sent
            ? "bg-[oklch(0.70_0.18_160)] text-ink-0"
            : "bg-[oklch(0.65_0.18_230)] hover:bg-[oklch(0.58_0.17_230)] text-ink-0",
        ].join(" ")}
      >
        {sending ? "Sending…" : sent ? "✓ Chef Notified" : "Notify Chef Screen"}
      </button>

      {error && <p className="text-red-400 text-[12px]">{error}</p>}

      <p className="text-ink-6 text-[11px] mt-auto">
        Appears on chef screen for 30s · Press Enter to send
      </p>
    </div>
  );
}

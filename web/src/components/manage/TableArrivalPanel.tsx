"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

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
    <div className="space-y-3">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAlert(); }
        }}
        placeholder='e.g. "6 Adults 3 Children just arrived" or "Large group at table 4"'
        rows={2}
        className="w-full rounded-xl bg-gray-800 border border-gray-700 text-white px-4 py-3 text-sm resize-none focus:outline-none focus:border-blue-500 placeholder:text-gray-600"
      />

      <Button
        onClick={sendAlert}
        disabled={sending || !note.trim()}
        className={`w-full font-bold py-3 transition-colors ${
          sent
            ? "bg-green-700 hover:bg-green-700 text-white"
            : "bg-blue-700 hover:bg-blue-600 text-white"
        }`}
      >
        {sending ? "Sending..." : sent ? "✓ Chef Notified" : "🪑 Notify Chef Screen"}
      </Button>

      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      <p className="text-gray-600 text-xs">
        Appears on the chef screen for 30 seconds · Press Enter to send
      </p>
    </div>
  );
}

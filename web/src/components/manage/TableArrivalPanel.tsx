"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TableArrivalPanel() {
  const [partySize, setPartySize] = useState("");
  const [guestType, setGuestType] = useState<"adults" | "children" | "mixed">("mixed");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  async function sendAlert() {
    const size = parseInt(partySize);
    if (!size || size <= 0) return;
    setSending(true);

    const channel = supabase.channel("service-alerts");
    await channel.subscribe();
    await channel.send({
      type: "broadcast",
      event: "table_arrived",
      payload: {
        partySize: size,
        guestType,
        time: new Date().toLocaleTimeString("en-SG", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    });
    supabase.removeChannel(channel);

    setSending(false);
    setSent(true);
    setPartySize("");
    setTimeout(() => setSent(false), 3000);
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-lg space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-gray-400 text-xs">Party Size</Label>
          <Input
            type="number"
            min={1}
            max={100}
            value={partySize}
            onChange={(e) => setPartySize(e.target.value)}
            placeholder="e.g. 6"
            className="bg-gray-800 border-gray-700 text-white text-lg font-bold"
            onKeyDown={(e) => { if (e.key === "Enter") sendAlert(); }}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-gray-400 text-xs">Guest Type</Label>
          <select
            value={guestType}
            onChange={(e) => setGuestType(e.target.value as typeof guestType)}
            className="w-full rounded-md bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm h-10"
          >
            <option value="mixed">Mixed (Adults + Children)</option>
            <option value="adults">Adults only</option>
            <option value="children">Children only</option>
          </select>
        </div>
      </div>

      <Button
        onClick={sendAlert}
        disabled={sending || !partySize || parseInt(partySize) <= 0}
        className={`w-full font-bold transition-colors ${
          sent
            ? "bg-green-700 text-white"
            : "bg-blue-700 hover:bg-blue-600 text-white"
        }`}
      >
        {sending ? "Sending..." : sent ? "✓ Alert Sent to Chef Screen" : "🪑 Notify Chef"}
      </Button>

      <p className="text-gray-600 text-xs text-center">
        Alert appears on the chef screen for 30 seconds then auto-dismisses.
      </p>
    </div>
  );
}

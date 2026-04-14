import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface IngestPayload {
  sensor_id: string;
  weight_grams: number;
  readings_count: number;
  recorded_at?: number; // epoch ms from ESP32
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const payload: IngestPayload = await req.json();

    // Validate payload
    if (!payload.sensor_id) {
      return new Response(
        JSON.stringify({ error: "sensor_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (
      typeof payload.weight_grams !== "number" ||
      payload.weight_grams < -100 ||
      payload.weight_grams > 60000
    ) {
      return new Response(
        JSON.stringify({ error: "weight_grams must be between -100 and 60000" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find or auto-register sensor
    let { data: sensor } = await supabase
      .from("sensors")
      .select("sensor_id, tray_id")
      .eq("sensor_id", payload.sensor_id)
      .single();

    if (!sensor) {
      // Auto-register: new ESP32 just turned on for the first time
      const { data: newSensor } = await supabase
        .from("sensors")
        .insert({
          sensor_id: payload.sensor_id,
          connection_status: "online",
          last_seen_at: new Date().toISOString(),
        })
        .select("sensor_id, tray_id")
        .single();

      if (!newSensor) {
        return new Response(
          JSON.stringify({ error: "Failed to register sensor" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      sensor = newSensor;
      console.log(`Auto-registered new sensor: ${payload.sensor_id}`);
    }

    const recordedAt = payload.recorded_at
      ? new Date(payload.recorded_at).toISOString()
      : new Date().toISOString();

    // 1. Insert sensor reading
    const { error: readingError } = await supabase
      .from("sensor_readings")
      .insert({
        sensor_id: payload.sensor_id,
        tray_id: sensor.tray_id,
        weight_grams: payload.weight_grams,
        recorded_at: recordedAt,
        is_averaged: (payload.readings_count || 1) > 1,
        batch_source_count: payload.readings_count || 1,
      });

    if (readingError) {
      console.error("Insert reading error:", readingError);
      return new Response(
        JSON.stringify({ error: "Failed to insert reading" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Update tray weight (triggers Realtime)
    if (sensor.tray_id) {
      const { error: trayError } = await supabase
        .from("trays")
        .update({
          last_weight_grams: payload.weight_grams,
          last_updated_at: recordedAt,
        })
        .eq("tray_id", sensor.tray_id);

      if (trayError) {
        console.error("Update tray error:", trayError);
      }

      // 3. Update sensor connection status
      const { error: sensorUpdateError } = await supabase
        .from("sensors")
        .update({
          connection_status: "online",
          last_seen_at: recordedAt,
        })
        .eq("sensor_id", payload.sensor_id);

      if (sensorUpdateError) {
        console.error("Update sensor error:", sensorUpdateError);
      }

      // 4. Check for refill event
      const { data: refillDetected } = await supabase.rpc("fn_detect_refill", {
        p_tray_id: sensor.tray_id,
        p_threshold_grams: 500,
      });

      if (refillDetected) {
        console.log(`Refill detected on tray ${sensor.tray_id}`);
      }
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Ingest error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

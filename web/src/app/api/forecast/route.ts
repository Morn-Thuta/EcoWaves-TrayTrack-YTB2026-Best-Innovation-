import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildForecastInput, generateForecast } from "@/lib/ai/forecast";

export const dynamic = "force-dynamic";

/** GET — return the latest cached forecast (so the demo never waits on the LLM). */
export async function GET() {
  const supabase = await createClient();
  // ai_forecasts isn't in the generated DB types yet — cast to query it.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("ai_forecasts")
    .select("*")
    .order("generated_at", { ascending: false })
    .limit(1);
  return NextResponse.json({ forecast: data?.[0] ?? null });
}

/** POST — generate a fresh forecast via the LLM, cache it, and return it. */
export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();
  if (!profile?.role || profile.role === "chef") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const input = await buildForecastInput(supabase);
    const result = await generateForecast(input);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("ai_forecasts")
      .insert({
        forecast_date: result.forecast_date,
        payload: result,
        model: result.model,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ forecast: data });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Forecast generation failed.";
    console.error("Forecast error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

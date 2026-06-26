/**
 * AI demand forecaster — powered by an LLM via OpenRouter (free tier).
 *
 * Aggregates historical occupancy + dish data into a compact summary, asks the
 * model to forecast tomorrow's per-dish demand, and returns structured JSON.
 * Server-only: reads OPENROUTER_API_KEY from the environment.
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Tried in order — falls through to the next if one is rate-limited/unavailable.
const MODELS = [
  "openai/gpt-oss-120b:free",
  "qwen/qwen3-next-80b-a3b-instruct:free",
  "meta-llama/llama-3.3-70b-instruct:free",
];

export interface DishForecast {
  dish: string;
  recommended_kg: number;
  batches: number;
  reasoning: string;
}

export interface ForecastResult {
  forecast_date: string;
  day_of_week: string;
  predicted_pax: number;
  pax_reasoning: string;
  dishes: DishForecast[];
  waste_insight: string;
  savings_estimate: string;
  key_insights: string[];
  model: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

const DOW = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

/** Pull and compress 30 days of history into a small object for the model. */
export async function buildForecastInput(supabase: SB) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowISO = tomorrow.toISOString().split("T")[0];

  const since = new Date(today);
  since.setDate(today.getDate() - 30);
  const sinceDate = since.toISOString().split("T")[0];

  const [{ data: occ }, { data: dishes }, { data: refills }] = await Promise.all([
    supabase
      .from("daily_occupancy")
      .select("date, expected_pax, actual_pax")
      .gte("date", sinceDate)
      .order("date"),
    supabase
      .from("dishes")
      .select(
        "name, full_tray_weight_grams, popularity_score, batch_size, cook_trigger_percent, dish_type, category"
      )
      .eq("is_active", true),
    supabase
      .from("refill_events")
      .select("detected_at, trays(dishes(name))")
      .gte("detected_at", since.toISOString()),
  ]);

  const occupancy_history = (occ ?? []).map((r: SB) => ({
    date: r.date,
    dow: DOW[new Date(r.date).getDay()],
    pax: r.actual_pax ?? r.expected_pax,
  }));

  const refillByDish: Record<string, number> = {};
  for (const r of refills ?? []) {
    const n = r.trays?.dishes?.name ?? "Unknown";
    refillByDish[n] = (refillByDish[n] ?? 0) + 1;
  }

  const dishRows = (dishes ?? []).map((d: SB) => ({
    name: d.name,
    full_tray_kg: Number(d.full_tray_weight_grams) / 1000,
    popularity: Number(d.popularity_score),
    batch_size: d.batch_size,
    type: d.dish_type,
    refills_30d: refillByDish[d.name] ?? 0,
  }));

  return {
    forecast_date: tomorrowISO,
    day_of_week: DOW[tomorrow.getDay()],
    occupancy_history,
    dishes: dishRows,
  };
}

function buildMessages(input: SB) {
  const system =
    "You are a kitchen demand forecaster for a hotel breakfast buffet in " +
    "Singapore. Your goal is to reduce food waste by predicting how much of " +
    "each dish to prepare. Note: June and December are school-holiday periods " +
    "with sustained higher occupancy (150-180 pax). Respond ONLY with a single " +
    "valid JSON object — no markdown, no commentary.";

  const user = `Using this historical data, forecast tomorrow's demand.

DATA:
${JSON.stringify(input, null, 2)}

Return a JSON object with EXACTLY this shape:
{
  "forecast_date": "${input.forecast_date}",
  "day_of_week": "${input.day_of_week}",
  "predicted_pax": <integer>,
  "pax_reasoning": "<1 sentence>",
  "dishes": [
    { "dish": "<name>", "recommended_kg": <number>, "batches": <integer>, "reasoning": "<short>" }
  ],
  "waste_insight": "<1-2 sentences on the biggest overproduction risk>",
  "savings_estimate": "<1 sentence quantifying potential kg or % waste reduction>",
  "key_insights": ["<insight>", "<insight>", "<insight>"]
}

Include EVERY dish from the data. Keep recommended_kg realistic versus each dish's full_tray_kg and the predicted pax.`;

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

async function callOpenRouter(
  messages: SB
): Promise<{ content: string; model: string }> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not set in the environment.");

  let lastErr: unknown;
  for (const model of MODELS) {
    try {
      const res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.3,
          max_tokens: 1500,
        }),
      });
      if (!res.ok) {
        lastErr = new Error(`${model} → HTTP ${res.status}`);
        continue;
      }
      const json = await res.json();
      const content = json?.choices?.[0]?.message?.content;
      if (typeof content === "string" && content.trim()) {
        return { content, model };
      }
      lastErr = new Error(`${model} → empty response`);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("All forecast models failed.");
}

/** Extract the first {...} block — free models sometimes wrap JSON in prose. */
function extractJson(text: string): SB {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  const slice = start >= 0 && end > start ? text.slice(start, end + 1) : text;
  return JSON.parse(slice);
}

export async function generateForecast(input: SB): Promise<ForecastResult> {
  const { content, model } = await callOpenRouter(buildMessages(input));
  const p = extractJson(content);

  return {
    forecast_date: input.forecast_date,
    day_of_week: input.day_of_week,
    predicted_pax: Number(p.predicted_pax) || 0,
    pax_reasoning: p.pax_reasoning ?? "",
    dishes: Array.isArray(p.dishes)
      ? p.dishes.map((d: SB) => ({
          dish: d.dish ?? d.name ?? "—",
          recommended_kg: Number(d.recommended_kg) || 0,
          batches: Number(d.batches) || 1,
          reasoning: d.reasoning ?? "",
        }))
      : [],
    waste_insight: p.waste_insight ?? "",
    savings_estimate: p.savings_estimate ?? "",
    key_insights: Array.isArray(p.key_insights) ? p.key_insights : [],
    model,
  };
}

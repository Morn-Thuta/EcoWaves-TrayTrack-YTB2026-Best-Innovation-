// Client-side refill detection (for display purposes).
// Authoritative detection happens in the Supabase Edge Function.

const REFILL_THRESHOLD_GRAMS = 500;
const WINDOW_MS = 30000; // 30 seconds

const trayWeightWindows = new Map<
  string,
  Array<{ weight: number; timestamp: number }>
>();

export function updateRefillWindow(trayId: string, weightGrams: number): boolean {
  const now = Date.now();
  const window = trayWeightWindows.get(trayId) ?? [];

  window.push({ weight: weightGrams, timestamp: now });

  // Keep only last 30 seconds
  const trimmed = window.filter((r) => r.timestamp >= now - WINDOW_MS);
  trayWeightWindows.set(trayId, trimmed);

  if (trimmed.length < 2) return false;

  const minWeight = Math.min(...trimmed.map((r) => r.weight));
  const latestWeight = trimmed[trimmed.length - 1].weight;
  const delta = latestWeight - minWeight;

  return delta >= REFILL_THRESHOLD_GRAMS;
}

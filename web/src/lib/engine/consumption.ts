import type { TrayDashboardItem } from "@/types/domain";

const READING_HISTORY_MS = 5 * 60 * 1000; // 5 minutes

// Track weight history per tray for trend + depletion rate calculation
const trayHistory = new Map<
  string,
  Array<{ weight: number; timestamp: number }>
>();

export function recordWeight(trayId: string, weightGrams: number) {
  const now = Date.now();
  const history = trayHistory.get(trayId) ?? [];

  history.push({ weight: weightGrams, timestamp: now });

  // Keep only last 5 minutes
  const cutoff = now - READING_HISTORY_MS;
  const trimmed = history.filter((r) => r.timestamp >= cutoff);
  trayHistory.set(trayId, trimmed);
}

/**
 * Returns depletion rate in grams per minute (positive = depleting).
 * Returns null if insufficient data.
 */
export function getDepletionRate(trayId: string): number | null {
  const history = trayHistory.get(trayId);
  if (!history || history.length < 2) return null;

  const oldest = history[0];
  const newest = history[history.length - 1];
  const elapsedMinutes = (newest.timestamp - oldest.timestamp) / 60000;

  if (elapsedMinutes < 0.5) return null; // Need at least 30 seconds of data

  const weightDelta = oldest.weight - newest.weight; // Positive = depleting
  if (weightDelta <= 0) return 0; // Weight stable or increasing (refill)

  return weightDelta / elapsedMinutes; // g/min
}

/**
 * Returns estimated minutes until tray is empty.
 * Returns null if depletion rate is unknown or zero.
 */
export function getEstimatedMinutesToEmpty(tray: TrayDashboardItem): number | null {
  const rate = getDepletionRate(tray.tray_id);
  if (!rate || rate <= 0) return null;

  const foodWeightGrams = tray.food_weight_grams;
  if (foodWeightGrams <= 0) return 0;

  return Math.round(foodWeightGrams / rate);
}

/**
 * Returns trend direction based on recent history.
 */
export function getTrend(trayId: string): "up" | "down" | "stable" {
  const history = trayHistory.get(trayId);
  if (!history || history.length < 3) return "stable";

  // Compare last 3 readings
  const recent = history.slice(-3);
  const firstWeight = recent[0].weight;
  const lastWeight = recent[recent.length - 1].weight;
  const delta = lastWeight - firstWeight;

  if (delta < -50) return "down"; // Lost more than 50g
  if (delta > 200) return "up";   // Gained more than 200g (refill)
  return "stable";
}

/**
 * Returns how many minutes of history we have for this tray.
 * Used to determine confidence in depletion-based suggestions.
 */
export function getHistoryAgeMinutes(trayId: string): number {
  const history = trayHistory.get(trayId);
  if (!history || history.length < 2) return 0;
  const oldest = history[0];
  const newest = history[history.length - 1];
  return (newest.timestamp - oldest.timestamp) / 60000;
}

/**
 * Returns the raw weight history for a tray (newest first, up to 50 points).
 */
export function getWeightHistory(trayId: string): Array<{ weight: number; timestamp: number }> {
  const history = trayHistory.get(trayId);
  if (!history) return [];
  return [...history].reverse().slice(0, 50);
}

/**
 * Returns true if the tray reading is stale (>60 seconds old).
 */
export function isStale(lastUpdatedAt: string): boolean {
  const lastUpdate = new Date(lastUpdatedAt).getTime();
  return Date.now() - lastUpdate > 60000;
}

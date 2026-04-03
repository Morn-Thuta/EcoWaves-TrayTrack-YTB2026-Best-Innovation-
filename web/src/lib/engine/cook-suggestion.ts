import type { TrayDashboardItem, CookSuggestion } from "@/types/domain";
import { getDepletionRate, getHistoryAgeMinutes } from "./consumption";

const BUFFER_MINUTES = 10; // Extra buffer beyond cook time

/**
 * Rules-based cook suggestion engine.
 * Returns a suggestion if the tray needs cooking, or null if no action needed.
 */
export function getCookSuggestion(
  tray: TrayDashboardItem,
  todayPax: number | null,
  historicalAvgPax: number | null
): CookSuggestion | null {
  // Don't suggest for offline or maintenance trays
  if (tray.status !== "active") return null;
  if (tray.color_code === "grey") return null;
  // Ready-to-serve dishes (salads, fruit, etc.) don't need cooking
  if (tray.dish_type === "ready-to-serve") return null;

  const remainingPercent = tray.remaining_percent;
  const depletionRate = getDepletionRate(tray.tray_id); // g/min

  // Calculate minutes to empty
  let minutesToEmpty: number | null = null;
  if (depletionRate && depletionRate > 0) {
    minutesToEmpty = Math.round(tray.food_weight_grams / depletionRate);
  }

  const cookTime = tray.average_cook_time_minutes;
  const triggerThreshold = tray.cook_trigger_percent;

  // Determine if action is needed
  const shouldSuggest =
    remainingPercent <= triggerThreshold ||
    (minutesToEmpty !== null && minutesToEmpty <= cookTime + BUFFER_MINUTES);

  if (!shouldSuggest) return null;

  // Calculate suggested batch size
  let batchSize = tray.batch_size;
  if (todayPax && historicalAvgPax && historicalAvgPax > 0) {
    const demandFactor = todayPax / historicalAvgPax;
    batchSize = Math.ceil(batchSize * demandFactor);
  }

  // Determine urgency
  let urgency: CookSuggestion["urgency"] = "planned";
  if (tray.color_code === "red") {
    urgency = "immediate";
  } else if (minutesToEmpty !== null && minutesToEmpty <= cookTime + BUFFER_MINUTES) {
    urgency = "soon";
  }

  // Determine confidence based on how much history we have for this tray
  let confidence: CookSuggestion["confidence"] = "low";
  if (depletionRate && minutesToEmpty !== null) {
    const historyAge = getHistoryAgeMinutes(tray.tray_id); // actual minutes of data
    if (historyAge >= 3 || remainingPercent <= 10) {
      confidence = "high";
    } else if (historyAge >= 1) {
      confidence = "medium";
    }
  } else if (remainingPercent <= triggerThreshold) {
    confidence = "medium"; // Threshold-based, no depletion data
  }

  return {
    dishName: tray.dish_name,
    dishId: tray.dish_id,
    trayId: tray.tray_id,
    batchSize,
    cookTimeMinutes: cookTime,
    minutesToEmpty: minutesToEmpty ?? cookTime,
    urgency,
    confidence,
  };
}

/**
 * Returns all cook suggestions from a list of trays, sorted by urgency.
 */
export function getAllCookSuggestions(
  trays: TrayDashboardItem[],
  todayPax: number | null,
  historicalAvgPax: number | null
): CookSuggestion[] {
  return trays
    .map((tray) => getCookSuggestion(tray, todayPax, historicalAvgPax))
    .filter((s): s is CookSuggestion => s !== null)
    .sort((a, b) => {
      const urgencyOrder = { immediate: 0, soon: 1, planned: 2 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    });
}

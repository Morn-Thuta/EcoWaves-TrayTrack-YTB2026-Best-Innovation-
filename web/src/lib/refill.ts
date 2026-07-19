/**
 * Urgency model for tray fill levels — chef-facing semantics.
 *
 * Earlier we showed HIGH / MEDIUM / LOW which inverted meaning at a glance
 * ("HIGH" reads as urgent action). This file replaces that with a refill
 * urgency model where the strongest label means the most urgent kitchen action.
 */

export type RefillStatus = "ok" | "refill_soon" | "refill_now";

export const REFILL_LABEL: Record<RefillStatus, string> = {
  ok:          "OK",
  refill_soon: "REFILL SOON",
  refill_now:  "REFILL NOW",
};

/** Single threshold config — keep it here, not inline in components. */
export const REFILL_THRESHOLDS = {
  refill_now:  15, // ≤ 15% → red, urgent
  refill_soon: 40, // ≤ 40% → amber, prepare next batch
};

export function getRefillStatus(pct: number): RefillStatus {
  if (pct <= REFILL_THRESHOLDS.refill_now)  return "refill_now";
  if (pct <= REFILL_THRESHOLDS.refill_soon) return "refill_soon";
  return "ok";
}

/** Map a refill status to our existing chef-screen colour code. */
export function refillToColorCode(
  status: RefillStatus
): "green" | "amber" | "red" {
  return status === "refill_now"  ? "red"
       : status === "refill_soon" ? "amber"
       : "green";
}

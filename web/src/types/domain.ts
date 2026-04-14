import type { Database } from "./database";

export type ColorCode = "green" | "amber" | "red" | "grey";
export type UserRole = Database["public"]["Enums"]["user_role"];

// Convenience type aliases
export type Dish = Database["public"]["Tables"]["dishes"]["Row"];
export type DishInsert = Database["public"]["Tables"]["dishes"]["Insert"];
export type DishUpdate = Database["public"]["Tables"]["dishes"]["Update"];

export type Tray = Database["public"]["Tables"]["trays"]["Row"];
export type TrayInsert = Database["public"]["Tables"]["trays"]["Insert"];
export type TrayUpdate = Database["public"]["Tables"]["trays"]["Update"];

export type Sensor = Database["public"]["Tables"]["sensors"]["Row"];
export type SensorReading =
  Database["public"]["Tables"]["sensor_readings"]["Row"];
export type DailyOccupancy =
  Database["public"]["Tables"]["daily_occupancy"]["Row"];
export type RefillEvent = Database["public"]["Tables"]["refill_events"]["Row"];
export type Batch = Database["public"]["Tables"]["batches"]["Row"];
export type Ingredient = Database["public"]["Tables"]["ingredients"]["Row"];
export type ProcurementSuggestion =
  Database["public"]["Tables"]["procurement_suggestions"]["Row"];
export type AlertLog = Database["public"]["Tables"]["alert_log"]["Row"];
export type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];

// Dashboard view type
export type TrayDashboardItem =
  Database["public"]["Views"]["tray_dashboard_view"]["Row"];

// UI-specific types
export interface TrayCardData extends TrayDashboardItem {
  trend: "up" | "down" | "stable";
  estimatedMinutesToEmpty: number | null;
  isStale: boolean;
  depletionRateGramsPerMin: number | null;
}

export interface CookSuggestion {
  dishName: string;
  dishId: string;
  trayId: string;
  batchSize: number;
  cookTimeMinutes: number;
  minutesToEmpty: number;
  recommendedWeightKg: number;
  urgency: "immediate" | "soon" | "planned";
  confidence: "high" | "medium" | "low";
}

export interface AlertSummary {
  critical: number;
  low: number;
  offline: number;
  stale: number;
}


// Auto-generated types will replace this file via `supabase gen types typescript`
// For now, define the schema manually to unblock development

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole =
  | "chef"
  | "kitchen_manager"
  | "procurement"
  | "fb_director"
  | "admin";

export type TrayStatus = "active" | "offline" | "maintenance";
export type ConnectionStatus = "online" | "offline" | "stale";
export type AlertType = "low" | "critical" | "offline" | "stale";
export type OccupancySource = "manual" | "mock" | "pms";
export type ColorCode = "green" | "amber" | "red" | "grey";

export interface Database {
  public: {
    Tables: {
      dishes: {
        Row: {
          dish_id: string;
          name: string;
          category: string | null;
          dish_type: string | null;
          full_tray_weight_grams: number;
          tare_weight_grams: number;
          batch_size: number;
          cook_trigger_percent: number;
          average_cook_time_minutes: number;
          popularity_score: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["dishes"]["Row"],
          "dish_id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["dishes"]["Insert"]>;
      };
      trays: {
        Row: {
          tray_id: string;
          dish_id: string | null;
          sensor_id: string | null;
          tray_name: string;
          location: string | null;
          tare_weight_grams: number;
          full_tray_weight_grams: number;
          status: TrayStatus;
          last_weight_grams: number;
          last_updated_at: string;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["trays"]["Row"],
          "tray_id" | "created_at" | "last_updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["trays"]["Insert"]>;
      };
      sensors: {
        Row: {
          sensor_id: string;
          tray_id: string | null;
          sensor_type: string;
          calibration_factor: number;
          firmware_version: string | null;
          connection_status: ConnectionStatus;
          battery_level: number | null;
          installed_at: string | null;
          last_seen_at: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["sensors"]["Row"],
          "sensor_id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["sensors"]["Insert"]>;
      };
      sensor_readings: {
        Row: {
          reading_id: string;
          sensor_id: string;
          tray_id: string;
          weight_grams: number;
          recorded_at: string;
          is_averaged: boolean;
          batch_source_count: number | null;
          synced_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["sensor_readings"]["Row"],
          "reading_id" | "synced_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["sensor_readings"]["Insert"]
        >;
      };
      daily_occupancy: {
        Row: {
          id: string;
          date: string;
          expected_pax: number;
          actual_pax: number | null;
          source: OccupancySource;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["daily_occupancy"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["daily_occupancy"]["Insert"]
        >;
      };
      refill_events: {
        Row: {
          refill_id: string;
          tray_id: string;
          detected_at: string;
          weight_before_grams: number;
          weight_after_grams: number;
          delta_grams: number;
        };
        Insert: Omit<
          Database["public"]["Tables"]["refill_events"]["Row"],
          "refill_id"
        >;
        Update: Partial<
          Database["public"]["Tables"]["refill_events"]["Insert"]
        >;
      };
      batches: {
        Row: {
          batch_id: string;
          dish_id: string;
          batch_size: number;
          cooked_quantity: number | null;
          refill_quantity: number | null;
          cooked_at: string;
          reason: string | null;
        };
        Insert: Omit<
          Database["public"]["Tables"]["batches"]["Row"],
          "batch_id"
        >;
        Update: Partial<Database["public"]["Tables"]["batches"]["Insert"]>;
      };
      ingredients: {
        Row: {
          ingredient_id: string;
          name: string;
          unit_of_measure: string;
          recipe_quantity: number;
          dish_id: string;
          supplier_name: string | null;
          substitution_group: string | null;
        };
        Insert: Omit<
          Database["public"]["Tables"]["ingredients"]["Row"],
          "ingredient_id"
        >;
        Update: Partial<Database["public"]["Tables"]["ingredients"]["Insert"]>;
      };
      procurement_suggestions: {
        Row: {
          suggestion_id: string;
          generated_at: string;
          ingredient_id: string;
          suggested_quantity: number;
          confidence_score: number;
          target_date: string;
          export_status: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["procurement_suggestions"]["Row"],
          "suggestion_id" | "generated_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["procurement_suggestions"]["Insert"]
        >;
      };
      alert_log: {
        Row: {
          alert_id: string;
          tray_id: string;
          alert_type: AlertType;
          triggered_at: string;
          resolved_at: string | null;
          acknowledged_by: string | null;
        };
        Insert: Omit<
          Database["public"]["Tables"]["alert_log"]["Row"],
          "alert_id" | "triggered_at"
        >;
        Update: Partial<Database["public"]["Tables"]["alert_log"]["Insert"]>;
      };
      user_profiles: {
        Row: {
          user_id: string;
          display_name: string;
          role: UserRole;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["user_profiles"]["Row"],
          "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["user_profiles"]["Insert"]>;
      };
    };
    Views: {
      tray_dashboard_view: {
        Row: {
          tray_id: string;
          tray_name: string;
          location: string | null;
          status: TrayStatus;
          dish_name: string;
          category: string | null;
          dish_type: string | null;
          cook_trigger_percent: number;
          average_cook_time_minutes: number;
          batch_size: number;
          last_weight_grams: number;
          food_weight_grams: number;
          remaining_percent: number;
          last_updated_at: string;
          connection_status: ConnectionStatus;
          color_code: ColorCode;
          sensor_id: string | null;
          dish_id: string;
          full_tray_weight_grams: number;
        };
      };
    };
    Functions: Record<string, unknown>;
    Enums: {
      user_role: UserRole;
      tray_status: TrayStatus;
      connection_status: ConnectionStatus;
      alert_type: AlertType;
      occupancy_source: OccupancySource;
    };
  };
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      alert_log: {
        Row: {
          acknowledged_by: string | null
          alert_id: string
          alert_type: Database["public"]["Enums"]["alert_type"]
          resolved_at: string | null
          tray_id: string
          triggered_at: string
        }
        Insert: {
          acknowledged_by?: string | null
          alert_id?: string
          alert_type: Database["public"]["Enums"]["alert_type"]
          resolved_at?: string | null
          tray_id: string
          triggered_at?: string
        }
        Update: {
          acknowledged_by?: string | null
          alert_id?: string
          alert_type?: Database["public"]["Enums"]["alert_type"]
          resolved_at?: string | null
          tray_id?: string
          triggered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_log_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "alert_log_tray_id_fkey"
            columns: ["tray_id"]
            isOneToOne: false
            referencedRelation: "tray_dashboard_view"
            referencedColumns: ["tray_id"]
          },
          {
            foreignKeyName: "alert_log_tray_id_fkey"
            columns: ["tray_id"]
            isOneToOne: false
            referencedRelation: "trays"
            referencedColumns: ["tray_id"]
          },
        ]
      }
      batches: {
        Row: {
          batch_id: string
          batch_size: number
          cooked_at: string
          cooked_quantity: number | null
          dish_id: string
          reason: string | null
          refill_quantity: number | null
        }
        Insert: {
          batch_id?: string
          batch_size: number
          cooked_at?: string
          cooked_quantity?: number | null
          dish_id: string
          reason?: string | null
          refill_quantity?: number | null
        }
        Update: {
          batch_id?: string
          batch_size?: number
          cooked_at?: string
          cooked_quantity?: number | null
          dish_id?: string
          reason?: string | null
          refill_quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "batches_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["dish_id"]
          },
          {
            foreignKeyName: "batches_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "tray_dashboard_view"
            referencedColumns: ["dish_id"]
          },
        ]
      }
      daily_occupancy: {
        Row: {
          actual_pax: number | null
          created_at: string
          date: string
          expected_pax: number
          id: string
          notes: string | null
          source: Database["public"]["Enums"]["occupancy_source"]
          updated_at: string
        }
        Insert: {
          actual_pax?: number | null
          created_at?: string
          date: string
          expected_pax: number
          id?: string
          notes?: string | null
          source?: Database["public"]["Enums"]["occupancy_source"]
          updated_at?: string
        }
        Update: {
          actual_pax?: number | null
          created_at?: string
          date?: string
          expected_pax?: number
          id?: string
          notes?: string | null
          source?: Database["public"]["Enums"]["occupancy_source"]
          updated_at?: string
        }
        Relationships: []
      }
      dishes: {
        Row: {
          average_cook_time_minutes: number
          batch_size: number
          category: string | null
          cook_trigger_percent: number
          created_at: string
          dish_id: string
          dish_type: string | null
          full_tray_weight_grams: number
          is_active: boolean
          name: string
          popularity_score: number
          tare_weight_grams: number
          updated_at: string
        }
        Insert: {
          average_cook_time_minutes?: number
          batch_size?: number
          category?: string | null
          cook_trigger_percent?: number
          created_at?: string
          dish_id?: string
          dish_type?: string | null
          full_tray_weight_grams: number
          is_active?: boolean
          name: string
          popularity_score?: number
          tare_weight_grams?: number
          updated_at?: string
        }
        Update: {
          average_cook_time_minutes?: number
          batch_size?: number
          category?: string | null
          cook_trigger_percent?: number
          created_at?: string
          dish_id?: string
          dish_type?: string | null
          full_tray_weight_grams?: number
          is_active?: boolean
          name?: string
          popularity_score?: number
          tare_weight_grams?: number
          updated_at?: string
        }
        Relationships: []
      }
      ingredients: {
        Row: {
          current_stock: number
          dish_id: string
          ingredient_id: string
          name: string
          recipe_quantity: number
          stock_updated_at: string | null
          substitution_group: string | null
          supplier_name: string | null
          unit_of_measure: string
        }
        Insert: {
          current_stock?: number
          dish_id: string
          ingredient_id?: string
          name: string
          recipe_quantity: number
          stock_updated_at?: string | null
          substitution_group?: string | null
          supplier_name?: string | null
          unit_of_measure: string
        }
        Update: {
          current_stock?: number
          dish_id?: string
          ingredient_id?: string
          name?: string
          recipe_quantity?: number
          stock_updated_at?: string | null
          substitution_group?: string | null
          supplier_name?: string | null
          unit_of_measure?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredients_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["dish_id"]
          },
          {
            foreignKeyName: "ingredients_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "tray_dashboard_view"
            referencedColumns: ["dish_id"]
          },
        ]
      }
      procurement_suggestions: {
        Row: {
          confidence_score: number
          export_status: string
          generated_at: string
          ingredient_id: string
          suggested_quantity: number
          suggestion_id: string
          target_date: string
        }
        Insert: {
          confidence_score: number
          export_status?: string
          generated_at?: string
          ingredient_id: string
          suggested_quantity: number
          suggestion_id?: string
          target_date: string
        }
        Update: {
          confidence_score?: number
          export_status?: string
          generated_at?: string
          ingredient_id?: string
          suggested_quantity?: number
          suggestion_id?: string
          target_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "procurement_suggestions_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["ingredient_id"]
          },
        ]
      }
      refill_events: {
        Row: {
          delta_grams: number
          detected_at: string
          refill_id: string
          tray_id: string
          weight_after_grams: number
          weight_before_grams: number
        }
        Insert: {
          delta_grams: number
          detected_at?: string
          refill_id?: string
          tray_id: string
          weight_after_grams: number
          weight_before_grams: number
        }
        Update: {
          delta_grams?: number
          detected_at?: string
          refill_id?: string
          tray_id?: string
          weight_after_grams?: number
          weight_before_grams?: number
        }
        Relationships: [
          {
            foreignKeyName: "refill_events_tray_id_fkey"
            columns: ["tray_id"]
            isOneToOne: false
            referencedRelation: "tray_dashboard_view"
            referencedColumns: ["tray_id"]
          },
          {
            foreignKeyName: "refill_events_tray_id_fkey"
            columns: ["tray_id"]
            isOneToOne: false
            referencedRelation: "trays"
            referencedColumns: ["tray_id"]
          },
        ]
      }
      sensor_readings: {
        Row: {
          batch_source_count: number | null
          is_averaged: boolean
          reading_id: string
          recorded_at: string
          sensor_id: string
          synced_at: string
          tray_id: string
          weight_grams: number
        }
        Insert: {
          batch_source_count?: number | null
          is_averaged?: boolean
          reading_id?: string
          recorded_at?: string
          sensor_id: string
          synced_at?: string
          tray_id: string
          weight_grams: number
        }
        Update: {
          batch_source_count?: number | null
          is_averaged?: boolean
          reading_id?: string
          recorded_at?: string
          sensor_id?: string
          synced_at?: string
          tray_id?: string
          weight_grams?: number
        }
        Relationships: [
          {
            foreignKeyName: "sensor_readings_sensor_id_fkey"
            columns: ["sensor_id"]
            isOneToOne: false
            referencedRelation: "sensors"
            referencedColumns: ["sensor_id"]
          },
          {
            foreignKeyName: "sensor_readings_tray_id_fkey"
            columns: ["tray_id"]
            isOneToOne: false
            referencedRelation: "tray_dashboard_view"
            referencedColumns: ["tray_id"]
          },
          {
            foreignKeyName: "sensor_readings_tray_id_fkey"
            columns: ["tray_id"]
            isOneToOne: false
            referencedRelation: "trays"
            referencedColumns: ["tray_id"]
          },
        ]
      }
      sensors: {
        Row: {
          battery_level: number | null
          calibration_factor: number
          connection_status: Database["public"]["Enums"]["connection_status"]
          created_at: string
          firmware_version: string | null
          installed_at: string | null
          last_seen_at: string | null
          sensor_id: string
          sensor_type: string
          tray_id: string | null
        }
        Insert: {
          battery_level?: number | null
          calibration_factor?: number
          connection_status?: Database["public"]["Enums"]["connection_status"]
          created_at?: string
          firmware_version?: string | null
          installed_at?: string | null
          last_seen_at?: string | null
          sensor_id?: string
          sensor_type?: string
          tray_id?: string | null
        }
        Update: {
          battery_level?: number | null
          calibration_factor?: number
          connection_status?: Database["public"]["Enums"]["connection_status"]
          created_at?: string
          firmware_version?: string | null
          installed_at?: string | null
          last_seen_at?: string | null
          sensor_id?: string
          sensor_type?: string
          tray_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_sensors_tray"
            columns: ["tray_id"]
            isOneToOne: false
            referencedRelation: "tray_dashboard_view"
            referencedColumns: ["tray_id"]
          },
          {
            foreignKeyName: "fk_sensors_tray"
            columns: ["tray_id"]
            isOneToOne: false
            referencedRelation: "trays"
            referencedColumns: ["tray_id"]
          },
        ]
      }
      trays: {
        Row: {
          created_at: string
          dish_id: string | null
          full_tray_weight_grams: number
          last_updated_at: string
          last_weight_grams: number
          location: string | null
          sensor_id: string | null
          status: Database["public"]["Enums"]["tray_status"]
          tare_weight_grams: number
          tray_id: string
          tray_name: string
        }
        Insert: {
          created_at?: string
          dish_id?: string | null
          full_tray_weight_grams?: number
          last_updated_at?: string
          last_weight_grams?: number
          location?: string | null
          sensor_id?: string | null
          status?: Database["public"]["Enums"]["tray_status"]
          tare_weight_grams?: number
          tray_id?: string
          tray_name: string
        }
        Update: {
          created_at?: string
          dish_id?: string | null
          full_tray_weight_grams?: number
          last_updated_at?: string
          last_weight_grams?: number
          location?: string | null
          sensor_id?: string | null
          status?: Database["public"]["Enums"]["tray_status"]
          tare_weight_grams?: number
          tray_id?: string
          tray_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "trays_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["dish_id"]
          },
          {
            foreignKeyName: "trays_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "tray_dashboard_view"
            referencedColumns: ["dish_id"]
          },
          {
            foreignKeyName: "trays_sensor_id_fkey"
            columns: ["sensor_id"]
            isOneToOne: false
            referencedRelation: "sensors"
            referencedColumns: ["sensor_id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string
          display_name: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      weight_aggregates: {
        Row: {
          avg_weight_grams: number
          created_at: string
          id: string
          max_weight_grams: number
          min_weight_grams: number
          period_minutes: number
          period_start: string
          reading_count: number
          tray_id: string
        }
        Insert: {
          avg_weight_grams: number
          created_at?: string
          id?: string
          max_weight_grams: number
          min_weight_grams: number
          period_minutes: number
          period_start: string
          reading_count: number
          tray_id: string
        }
        Update: {
          avg_weight_grams?: number
          created_at?: string
          id?: string
          max_weight_grams?: number
          min_weight_grams?: number
          period_minutes?: number
          period_start?: string
          reading_count?: number
          tray_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weight_aggregates_tray_id_fkey"
            columns: ["tray_id"]
            isOneToOne: false
            referencedRelation: "tray_dashboard_view"
            referencedColumns: ["tray_id"]
          },
          {
            foreignKeyName: "weight_aggregates_tray_id_fkey"
            columns: ["tray_id"]
            isOneToOne: false
            referencedRelation: "trays"
            referencedColumns: ["tray_id"]
          },
        ]
      }
    }
    Views: {
      tray_dashboard_view: {
        Row: {
          average_cook_time_minutes: number | null
          batch_size: number | null
          category: string | null
          color_code: string | null
          connection_status:
            | Database["public"]["Enums"]["connection_status"]
            | null
          cook_trigger_percent: number | null
          dish_id: string | null
          dish_name: string | null
          dish_type: string | null
          food_weight_grams: number | null
          full_tray_weight_grams: number | null
          last_updated_at: string | null
          last_weight_grams: number | null
          location: string | null
          remaining_percent: number | null
          sensor_id: string | null
          status: Database["public"]["Enums"]["tray_status"] | null
          tray_id: string | null
          tray_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trays_sensor_id_fkey"
            columns: ["sensor_id"]
            isOneToOne: false
            referencedRelation: "sensors"
            referencedColumns: ["sensor_id"]
          },
        ]
      }
    }
    Functions: {
      fn_calculate_consumption_rate: {
        Args: { p_tray_id: string; p_window_minutes?: number }
        Returns: number
      }
      fn_detect_refill: {
        Args: { p_threshold_grams?: number; p_tray_id: string }
        Returns: boolean
      }
      fn_simulate_sensor_tick: { Args: never; Returns: undefined }
      fn_update_tray_weight: {
        Args: {
          p_recorded_at?: string
          p_sensor_id: string
          p_weight_grams: number
        }
        Returns: undefined
      }
      get_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      alert_type: "low" | "critical" | "offline" | "stale"
      connection_status: "online" | "offline" | "stale"
      occupancy_source: "manual" | "mock" | "pms"
      tray_status: "active" | "offline" | "maintenance"
      user_role:
        | "chef"
        | "kitchen_manager"
        | "procurement"
        | "fb_director"
        | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      alert_type: ["low", "critical", "offline", "stale"],
      connection_status: ["online", "offline", "stale"],
      occupancy_source: ["manual", "mock", "pms"],
      tray_status: ["active", "offline", "maintenance"],
      user_role: [
        "chef",
        "kitchen_manager",
        "procurement",
        "fb_director",
        "admin",
      ],
    },
  },
} as const

-- ============================================
-- Tray Weight Monitoring System - Schema
-- ============================================

-- Enum types
CREATE TYPE user_role AS ENUM ('chef', 'kitchen_manager', 'procurement', 'fb_director', 'admin');
CREATE TYPE tray_status AS ENUM ('active', 'offline', 'maintenance');
CREATE TYPE connection_status AS ENUM ('online', 'offline', 'stale');
CREATE TYPE alert_type AS ENUM ('low', 'critical', 'offline', 'stale');
CREATE TYPE occupancy_source AS ENUM ('manual', 'mock', 'pms');

-- ============================================
-- Core Tables
-- ============================================

-- Dishes: menu items served at the buffet
CREATE TABLE dishes (
  dish_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,                            -- e.g., 'Main', 'Side', 'Dessert'
  dish_type TEXT,                           -- e.g., 'cooked', 'ready-to-serve'
  full_tray_weight_grams NUMERIC(8,1) NOT NULL,  -- weight of a full tray of this dish (food only)
  tare_weight_grams NUMERIC(8,1) NOT NULL DEFAULT 0,
  batch_size INTEGER NOT NULL DEFAULT 1,    -- portions per batch
  cook_trigger_percent NUMERIC(5,1) NOT NULL DEFAULT 25.0,
  average_cook_time_minutes INTEGER NOT NULL DEFAULT 30,
  popularity_score NUMERIC(3,1) NOT NULL DEFAULT 5.0,  -- 1-10 scale
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sensors: physical ESP32+HX711 units
CREATE TABLE sensors (
  sensor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tray_id UUID,  -- FK added after trays table
  sensor_type TEXT NOT NULL DEFAULT 'hx711_esp32',
  calibration_factor NUMERIC(12,4) NOT NULL DEFAULT -7050.0,
  firmware_version TEXT,
  connection_status connection_status NOT NULL DEFAULT 'offline',
  battery_level NUMERIC(5,1),
  installed_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trays: physical tray positions in the buffet line
CREATE TABLE trays (
  tray_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dish_id UUID REFERENCES dishes(dish_id) ON DELETE SET NULL,
  sensor_id UUID REFERENCES sensors(sensor_id) ON DELETE SET NULL,
  tray_name TEXT NOT NULL,
  location TEXT,                            -- e.g., 'Station 1', 'Hot Counter Left'
  tare_weight_grams NUMERIC(8,1) NOT NULL DEFAULT 0,
  full_tray_weight_grams NUMERIC(8,1) NOT NULL DEFAULT 0,
  status tray_status NOT NULL DEFAULT 'active',
  last_weight_grams NUMERIC(8,1) NOT NULL DEFAULT 0,
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add FK from sensors to trays
ALTER TABLE sensors ADD CONSTRAINT fk_sensors_tray FOREIGN KEY (tray_id) REFERENCES trays(tray_id) ON DELETE SET NULL;

-- Sensor readings: time-series weight data (retained indefinitely)
CREATE TABLE sensor_readings (
  reading_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sensor_id UUID NOT NULL REFERENCES sensors(sensor_id),
  tray_id UUID NOT NULL REFERENCES trays(tray_id),
  weight_grams NUMERIC(8,1) NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_averaged BOOLEAN NOT NULL DEFAULT false,
  batch_source_count INTEGER,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- BRIN index for efficient time-range queries on sensor_readings
CREATE INDEX idx_sensor_readings_recorded_at ON sensor_readings USING BRIN (recorded_at);
CREATE INDEX idx_sensor_readings_tray_id ON sensor_readings (tray_id);

-- Weight aggregates: pre-computed averages for fast queries
CREATE TABLE weight_aggregates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tray_id UUID NOT NULL REFERENCES trays(tray_id),
  period_start TIMESTAMPTZ NOT NULL,
  period_minutes INTEGER NOT NULL,           -- 1 or 5
  avg_weight_grams NUMERIC(8,1) NOT NULL,
  min_weight_grams NUMERIC(8,1) NOT NULL,
  max_weight_grams NUMERIC(8,1) NOT NULL,
  reading_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_weight_aggregates_tray_period ON weight_aggregates (tray_id, period_start);

-- Daily occupancy: guest counts per day
CREATE TABLE daily_occupancy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  expected_pax INTEGER NOT NULL,
  actual_pax INTEGER,
  source occupancy_source NOT NULL DEFAULT 'manual',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Refill events: detected tray refills
CREATE TABLE refill_events (
  refill_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tray_id UUID NOT NULL REFERENCES trays(tray_id),
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  weight_before_grams NUMERIC(8,1) NOT NULL,
  weight_after_grams NUMERIC(8,1) NOT NULL,
  delta_grams NUMERIC(8,1) NOT NULL
);

CREATE INDEX idx_refill_events_tray_id ON refill_events (tray_id, detected_at);

-- Batches: cook batch records
CREATE TABLE batches (
  batch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dish_id UUID NOT NULL REFERENCES dishes(dish_id),
  batch_size INTEGER NOT NULL,
  cooked_quantity NUMERIC(8,1),
  refill_quantity NUMERIC(8,1),
  cooked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason TEXT
);

-- Ingredients: recipe-to-ingredient mapping
CREATE TABLE ingredients (
  ingredient_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  unit_of_measure TEXT NOT NULL,            -- e.g., 'kg', 'liters', 'pieces'
  recipe_quantity NUMERIC(8,2) NOT NULL,    -- quantity needed per batch
  dish_id UUID NOT NULL REFERENCES dishes(dish_id),
  supplier_name TEXT,
  substitution_group TEXT
);

-- Procurement suggestions
CREATE TABLE procurement_suggestions (
  suggestion_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ingredient_id UUID NOT NULL REFERENCES ingredients(ingredient_id),
  suggested_quantity NUMERIC(8,2) NOT NULL,
  confidence_score NUMERIC(3,2) NOT NULL,   -- 0.00 to 1.00
  target_date DATE NOT NULL,
  export_status TEXT NOT NULL DEFAULT 'pending'
);

-- Alert log
CREATE TABLE alert_log (
  alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tray_id UUID NOT NULL REFERENCES trays(tray_id),
  alert_type alert_type NOT NULL,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES user_profiles(user_id)
);

-- User profiles (extends Supabase auth.users)
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'chef',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Views
-- ============================================

CREATE OR REPLACE VIEW tray_dashboard_view AS
SELECT
  t.tray_id,
  t.tray_name,
  t.location,
  t.status,
  d.name AS dish_name,
  d.dish_id,
  d.category,
  d.dish_type,
  d.cook_trigger_percent,
  d.average_cook_time_minutes,
  d.batch_size,
  t.last_weight_grams,
  t.full_tray_weight_grams,
  t.sensor_id,
  GREATEST(t.last_weight_grams - t.tare_weight_grams, 0) AS food_weight_grams,
  CASE
    WHEN t.full_tray_weight_grams > 0
    THEN ROUND(GREATEST(t.last_weight_grams - t.tare_weight_grams, 0) / t.full_tray_weight_grams * 100, 1)
    ELSE 0
  END AS remaining_percent,
  t.last_updated_at,
  COALESCE(s.connection_status, 'offline') AS connection_status,
  CASE
    WHEN t.status = 'offline' THEN 'grey'
    WHEN COALESCE(s.connection_status, 'offline') = 'offline' THEN 'grey'
    WHEN now() - t.last_updated_at > interval '60 seconds' THEN 'grey'
    WHEN t.full_tray_weight_grams > 0
      AND (GREATEST(t.last_weight_grams - t.tare_weight_grams, 0) / t.full_tray_weight_grams * 100) <= 15
    THEN 'red'
    WHEN t.full_tray_weight_grams > 0
      AND (GREATEST(t.last_weight_grams - t.tare_weight_grams, 0) / t.full_tray_weight_grams * 100) <= 35
    THEN 'amber'
    ELSE 'green'
  END AS color_code
FROM trays t
LEFT JOIN dishes d ON t.dish_id = d.dish_id
LEFT JOIN sensors s ON t.sensor_id = s.sensor_id
WHERE d.is_active = true OR d.dish_id IS NULL
ORDER BY
  CASE
    WHEN t.status = 'offline' THEN 4
    WHEN t.full_tray_weight_grams > 0
      AND (GREATEST(t.last_weight_grams - t.tare_weight_grams, 0) / t.full_tray_weight_grams * 100) <= 15
    THEN 1
    WHEN t.full_tray_weight_grams > 0
      AND (GREATEST(t.last_weight_grams - t.tare_weight_grams, 0) / t.full_tray_weight_grams * 100) <= 35
    THEN 2
    ELSE 3
  END;

-- ============================================
-- Functions
-- ============================================

-- Update tray weight (called by edge function)
CREATE OR REPLACE FUNCTION fn_update_tray_weight(
  p_sensor_id UUID,
  p_weight_grams NUMERIC,
  p_recorded_at TIMESTAMPTZ DEFAULT now()
)
RETURNS void AS $$
DECLARE
  v_tray_id UUID;
BEGIN
  -- Find the tray associated with this sensor
  SELECT tray_id INTO v_tray_id
  FROM trays
  WHERE sensor_id = p_sensor_id;

  IF v_tray_id IS NULL THEN
    RAISE EXCEPTION 'No tray found for sensor %', p_sensor_id;
  END IF;

  -- Update tray weight
  UPDATE trays
  SET last_weight_grams = p_weight_grams,
      last_updated_at = p_recorded_at
  WHERE tray_id = v_tray_id;

  -- Update sensor last seen
  UPDATE sensors
  SET connection_status = 'online',
      last_seen_at = p_recorded_at
  WHERE sensor_id = p_sensor_id;
END;
$$ LANGUAGE plpgsql;

-- Detect refill events
CREATE OR REPLACE FUNCTION fn_detect_refill(
  p_tray_id UUID,
  p_threshold_grams NUMERIC DEFAULT 500
)
RETURNS BOOLEAN AS $$
DECLARE
  v_recent_min NUMERIC;
  v_current NUMERIC;
  v_delta NUMERIC;
BEGIN
  -- Get the minimum weight in the last 60 seconds
  SELECT MIN(weight_grams) INTO v_recent_min
  FROM sensor_readings
  WHERE tray_id = p_tray_id
    AND recorded_at > now() - interval '60 seconds';

  -- Get current weight
  SELECT last_weight_grams INTO v_current
  FROM trays
  WHERE tray_id = p_tray_id;

  IF v_recent_min IS NULL OR v_current IS NULL THEN
    RETURN FALSE;
  END IF;

  v_delta := v_current - v_recent_min;

  IF v_delta >= p_threshold_grams THEN
    INSERT INTO refill_events (tray_id, weight_before_grams, weight_after_grams, delta_grams)
    VALUES (p_tray_id, v_recent_min, v_current, v_delta);
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Calculate consumption rate (kg/min)
CREATE OR REPLACE FUNCTION fn_calculate_consumption_rate(
  p_tray_id UUID,
  p_window_minutes INTEGER DEFAULT 5
)
RETURNS NUMERIC AS $$
DECLARE
  v_start_weight NUMERIC;
  v_end_weight NUMERIC;
  v_elapsed_minutes NUMERIC;
BEGIN
  -- Get weight at start of window
  SELECT weight_grams INTO v_start_weight
  FROM sensor_readings
  WHERE tray_id = p_tray_id
    AND recorded_at >= now() - (p_window_minutes || ' minutes')::interval
  ORDER BY recorded_at ASC
  LIMIT 1;

  -- Get most recent weight
  SELECT weight_grams INTO v_end_weight
  FROM sensor_readings
  WHERE tray_id = p_tray_id
  ORDER BY recorded_at DESC
  LIMIT 1;

  IF v_start_weight IS NULL OR v_end_weight IS NULL THEN
    RETURN NULL;
  END IF;

  -- Only calculate if weight is decreasing (consumption)
  IF v_start_weight <= v_end_weight THEN
    RETURN 0;
  END IF;

  v_elapsed_minutes := p_window_minutes;
  RETURN ROUND((v_start_weight - v_end_weight) / v_elapsed_minutes / 1000, 3); -- kg/min
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE trays ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_occupancy ENABLE ROW LEVEL SECURITY;
ALTER TABLE refill_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM user_profiles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Dishes: everyone can read, kitchen_manager and admin can write
CREATE POLICY "dishes_select" ON dishes FOR SELECT TO authenticated USING (true);
CREATE POLICY "dishes_insert" ON dishes FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('kitchen_manager', 'admin'));
CREATE POLICY "dishes_update" ON dishes FOR UPDATE TO authenticated
  USING (get_user_role() IN ('kitchen_manager', 'admin'));
CREATE POLICY "dishes_delete" ON dishes FOR DELETE TO authenticated
  USING (get_user_role() = 'admin');

-- Trays: everyone can read, kitchen_manager and admin can write
CREATE POLICY "trays_select" ON trays FOR SELECT TO authenticated USING (true);
CREATE POLICY "trays_insert" ON trays FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('kitchen_manager', 'admin'));
CREATE POLICY "trays_update" ON trays FOR UPDATE TO authenticated
  USING (get_user_role() IN ('kitchen_manager', 'admin'));

-- Sensors: everyone can read, admin can manage
CREATE POLICY "sensors_select" ON sensors FOR SELECT TO authenticated USING (true);
CREATE POLICY "sensors_insert" ON sensors FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "sensors_update" ON sensors FOR UPDATE TO authenticated
  USING (get_user_role() IN ('kitchen_manager', 'admin'));

-- Sensor readings: dashboard users can read (service role writes via edge function)
CREATE POLICY "readings_select" ON sensor_readings FOR SELECT TO authenticated USING (true);

-- Daily occupancy
CREATE POLICY "occupancy_select" ON daily_occupancy FOR SELECT TO authenticated USING (true);
CREATE POLICY "occupancy_insert" ON daily_occupancy FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('kitchen_manager', 'admin'));
CREATE POLICY "occupancy_update" ON daily_occupancy FOR UPDATE TO authenticated
  USING (get_user_role() IN ('kitchen_manager', 'admin'));

-- Refill events: read only for authenticated users
CREATE POLICY "refill_select" ON refill_events FOR SELECT TO authenticated USING (true);

-- Batches
CREATE POLICY "batches_select" ON batches FOR SELECT TO authenticated USING (true);
CREATE POLICY "batches_insert" ON batches FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('kitchen_manager', 'admin'));

-- Ingredients
CREATE POLICY "ingredients_select" ON ingredients FOR SELECT TO authenticated USING (true);
CREATE POLICY "ingredients_insert" ON ingredients FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('kitchen_manager', 'admin'));
CREATE POLICY "ingredients_update" ON ingredients FOR UPDATE TO authenticated
  USING (get_user_role() IN ('kitchen_manager', 'admin'));

-- Procurement suggestions
CREATE POLICY "procurement_select" ON procurement_suggestions FOR SELECT TO authenticated USING (true);

-- Alert log
CREATE POLICY "alerts_select" ON alert_log FOR SELECT TO authenticated USING (true);

-- User profiles: users can read own, admin can manage all
CREATE POLICY "profiles_select_own" ON user_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR get_user_role() = 'admin');
CREATE POLICY "profiles_insert" ON user_profiles FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin' OR user_id = auth.uid());
CREATE POLICY "profiles_update" ON user_profiles FOR UPDATE TO authenticated
  USING (get_user_role() = 'admin');

-- ============================================
-- Enable Realtime on trays table
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE trays;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER dishes_updated_at
  BEFORE UPDATE ON dishes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER daily_occupancy_updated_at
  BEFORE UPDATE ON daily_occupancy
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

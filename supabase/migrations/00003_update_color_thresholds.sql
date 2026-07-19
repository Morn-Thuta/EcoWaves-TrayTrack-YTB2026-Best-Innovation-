-- Update tray_dashboard_view color thresholds
-- HIGH (green)  > 50% remaining
-- MEDIUM (amber) 25–50% remaining  ← was 35%, now 50% per mentor feedback
-- LOW (red)     < 25% remaining

DROP VIEW IF EXISTS tray_dashboard_view;

CREATE VIEW tray_dashboard_view AS
SELECT
  t.tray_id,
  t.tray_name,
  t.location,
  t.status,
  t.dish_id,
  t.sensor_id,
  t.full_tray_weight_grams,
  t.tare_weight_grams,
  t.last_weight_grams,
  t.last_updated_at,
  d.name          AS dish_name,
  d.dish_type,
  d.cook_trigger_percent,
  d.average_cook_time_minutes,
  d.batch_size,
  d.popularity_score,
  s.connection_status,
  s.battery_level,
  GREATEST(t.last_weight_grams - t.tare_weight_grams, 0) AS food_weight_grams,
  CASE
    WHEN t.full_tray_weight_grams > 0 THEN
      LEAST(
        GREATEST(t.last_weight_grams - t.tare_weight_grams, 0)
          / t.full_tray_weight_grams * 100,
        100
      )
    ELSE 0
  END AS remaining_percent,
  CASE
    WHEN t.status = 'offline'            THEN 'grey'
    WHEN t.full_tray_weight_grams = 0    THEN 'grey'
    WHEN (GREATEST(t.last_weight_grams - t.tare_weight_grams, 0)
          / t.full_tray_weight_grams * 100) < 25 THEN 'red'
    WHEN (GREATEST(t.last_weight_grams - t.tare_weight_grams, 0)
          / t.full_tray_weight_grams * 100) < 50 THEN 'amber'
    ELSE 'green'
  END AS color_code
FROM trays t
LEFT JOIN dishes  d ON t.dish_id   = d.dish_id
LEFT JOIN sensors s ON t.sensor_id = s.sensor_id
WHERE d.is_active = true OR d.dish_id IS NULL
ORDER BY
  CASE
    WHEN t.status = 'offline' THEN 4
    WHEN t.full_tray_weight_grams > 0
      AND (GREATEST(t.last_weight_grams - t.tare_weight_grams, 0)
           / t.full_tray_weight_grams * 100) < 25 THEN 1
    WHEN t.full_tray_weight_grams > 0
      AND (GREATEST(t.last_weight_grams - t.tare_weight_grams, 0)
           / t.full_tray_weight_grams * 100) < 50 THEN 2
    ELSE 3
  END;

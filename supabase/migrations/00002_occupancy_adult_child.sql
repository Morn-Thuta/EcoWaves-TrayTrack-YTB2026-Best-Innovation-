-- Migration: add adult_count and child_count columns to daily_occupancy
-- These allow management to track pax split by adult/child for the chef dashboard

ALTER TABLE daily_occupancy
  ADD COLUMN IF NOT EXISTS adult_count INT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS child_count INT DEFAULT NULL;

-- Update expected_pax / actual_pax to equal adult_count + child_count when both are provided.
-- This is handled at the application layer (OccupancyForm computes total = adults + children).

COMMENT ON COLUMN daily_occupancy.adult_count IS 'Number of adult guests for this day';
COMMENT ON COLUMN daily_occupancy.child_count IS 'Number of child guests for this day';

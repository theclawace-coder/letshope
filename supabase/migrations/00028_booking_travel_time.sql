-- Add travel time tracking to bookings
-- Allows workers to log travel time (minutes) and distance (km) for NDIS provider travel claims

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS travel_time_minutes integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS travel_distance_km numeric(8, 2) DEFAULT NULL;

COMMENT ON COLUMN bookings.travel_time_minutes IS 'Travel time in minutes to reach this booking location';
COMMENT ON COLUMN bookings.travel_distance_km IS 'Travel distance in kilometres to reach this booking location';

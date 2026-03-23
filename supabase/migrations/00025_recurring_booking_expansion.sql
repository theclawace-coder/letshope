-- ============================================================
-- Migration 00024: Recurring Booking Expansion
-- Adds fields to support recurring booking series
-- ============================================================

-- Add recurrence_parent_id to link expanded bookings back to the first in a series
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS recurrence_parent_id UUID REFERENCES bookings(id) ON DELETE SET NULL;

-- Add recurrence_end_date to define when a recurring series stops
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS recurrence_end_date DATE;

-- Index for fast lookup of all bookings in a series
CREATE INDEX IF NOT EXISTS idx_bookings_recurrence_parent ON bookings(recurrence_parent_id) WHERE recurrence_parent_id IS NOT NULL;

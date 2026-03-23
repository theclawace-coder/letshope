-- Phase: Cancellation Rules (NDIS-compliant)
-- Adds cancellation tracking fields to bookings table
-- NDIS rules: 2 clear business days notice required, short notice = 90% charge, no-show = 100%

-- Add cancellation tracking columns to bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS cancellation_type TEXT CHECK (cancellation_type IN (
    'standard',           -- >= 2 business days notice (no charge)
    'short_notice',       -- < 2 business days notice (90% charge)
    'no_show'             -- participant did not attend (100% charge)
  )),
  ADD COLUMN IF NOT EXISTS cancelled_by TEXT CHECK (cancelled_by IN (
    'participant',
    'provider',
    'worker',
    'system'
  )),
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancellation_charge NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cancellation_charge_rate NUMERIC(5,4),  -- e.g. 0.90 for 90%
  ADD COLUMN IF NOT EXISTS time_slot_filled BOOLEAN DEFAULT FALSE;  -- provider filled the slot with another participant

-- Index for cancellation queries and reporting
CREATE INDEX IF NOT EXISTS idx_bookings_cancellation_type ON bookings (cancellation_type) WHERE cancellation_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_cancelled_at ON bookings (cancelled_at) WHERE cancelled_at IS NOT NULL;

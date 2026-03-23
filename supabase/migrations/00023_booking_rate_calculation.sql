-- Add rate calculation fields to bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS support_item_number TEXT,
  ADD COLUMN IF NOT EXISTS unit_price NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS estimated_cost NUMERIC(10,2);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_bookings_support_item ON bookings(support_item_number);

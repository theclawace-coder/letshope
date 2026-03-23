-- Group Bookings & Ratios
-- Adds support for multiple participants per booking with worker-to-participant ratios

-- Add group booking fields to bookings table
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS is_group_booking BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS group_ratio TEXT DEFAULT NULL,        -- e.g. '1:2', '1:3', '1:5'
  ADD COLUMN IF NOT EXISTS group_size INTEGER DEFAULT NULL;       -- total participants in group

-- Junction table: links multiple participants to a single group booking
CREATE TABLE IF NOT EXISTS booking_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  estimated_cost NUMERIC DEFAULT NULL,         -- per-participant estimated cost
  notes TEXT DEFAULT NULL,                      -- per-participant notes for this session
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(booking_id, participant_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_booking_participants_booking ON booking_participants(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_participants_participant ON booking_participants(participant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_group ON bookings(is_group_booking) WHERE is_group_booking = true;

-- RLS policies
ALTER TABLE booking_participants ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can manage booking_participants"
    ON booking_participants FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

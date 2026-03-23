-- Phase 3: Progress Notes, Shift Check-in/Check-out, Concern Flagging
-- Migration: 00002_phase3_progress_notes_concerns.sql

-- =============================================================
-- 1. ALTER BOOKINGS TABLE - Add check-in/check-out fields
-- =============================================================

ALTER TABLE bookings
  ADD COLUMN actual_start_time TIMESTAMPTZ,
  ADD COLUMN actual_end_time TIMESTAMPTZ,
  ADD COLUMN check_in_location JSONB,
  ADD COLUMN check_out_location JSONB;

-- Expand status constraint to include checked_in and checked_out
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('scheduled', 'checked_in', 'checked_out', 'completed', 'cancelled', 'no_show'));

-- =============================================================
-- 2. CREATE PROGRESS NOTES TABLE
-- =============================================================

CREATE TABLE progress_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id),
  worker_id UUID NOT NULL REFERENCES workers(id),
  booking_id UUID REFERENCES bookings(id),
  note_date DATE NOT NULL DEFAULT CURRENT_DATE,
  service_type TEXT,
  goals_addressed TEXT[] DEFAULT '{}',
  presentation TEXT,
  actions_taken TEXT,
  content TEXT NOT NULL,
  audio_url TEXT,
  is_transcribed BOOLEAN DEFAULT false,
  concern_flagged BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_progress_notes_participant ON progress_notes(participant_id);
CREATE INDEX idx_progress_notes_worker ON progress_notes(worker_id);
CREATE INDEX idx_progress_notes_date ON progress_notes(note_date);
CREATE INDEX idx_progress_notes_booking ON progress_notes(booking_id);

-- =============================================================
-- 3. CREATE CONCERNS TABLE
-- =============================================================

CREATE TABLE concerns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id),
  progress_note_id UUID REFERENCES progress_notes(id),
  raised_by UUID NOT NULL REFERENCES profiles(id),
  concern_type TEXT NOT NULL CHECK (concern_type IN ('safety', 'health', 'behavioral', 'environmental', 'financial', 'other')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  actions_requested TEXT,
  status TEXT CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed')) DEFAULT 'open',
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_concerns_participant ON concerns(participant_id);
CREATE INDEX idx_concerns_severity ON concerns(severity);
CREATE INDEX idx_concerns_status ON concerns(status);

-- =============================================================
-- 4. ROW LEVEL SECURITY
-- =============================================================

ALTER TABLE progress_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE concerns ENABLE ROW LEVEL SECURITY;

-- Staff (non-portal users) can manage progress notes
CREATE POLICY "Staff manage progress_notes" ON progress_notes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role != 'participant_portal'
    )
  );

-- Staff (non-portal users) can manage concerns
CREATE POLICY "Staff manage concerns" ON concerns
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role != 'participant_portal'
    )
  );

-- Portal users can view their own progress notes (read-only)
CREATE POLICY "Portal users view own progress_notes" ON progress_notes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'participant_portal'
    )
    AND participant_id IN (
      SELECT id FROM participants
      WHERE id = progress_notes.participant_id
    )
  );

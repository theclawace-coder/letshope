-- v2 Phase 7: Smart Rostering & Worker Matching
-- Structured worker availability, shift management, roster templates,
-- smart worker-participant matching, shift swaps, and conflict detection
-- Fully idempotent: safe to re-run

-- =============================================
-- ENUMS
-- =============================================

DO $$ BEGIN
  CREATE TYPE day_of_week AS ENUM (
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE availability_type AS ENUM (
    'available', 'preferred', 'unavailable'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE shift_status AS ENUM (
    'draft', 'published', 'assigned', 'confirmed', 'in_progress',
    'completed', 'cancelled', 'no_show'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE swap_request_status AS ENUM (
    'pending', 'approved', 'rejected', 'cancelled', 'expired'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE roster_status AS ENUM (
    'draft', 'published', 'archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE skill_category AS ENUM (
    'personal_care', 'domestic_assistance', 'community_access',
    'transport', 'meal_preparation', 'medication_support',
    'behaviour_support', 'complex_health', 'allied_health_assistant',
    'manual_handling', 'first_aid', 'mental_health',
    'communication_support', 'assistive_technology',
    'cultural_competency', 'language', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- 1. WORKER SKILLS (structured competencies)
-- =============================================
CREATE TABLE IF NOT EXISTS worker_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  category skill_category NOT NULL,
  skill_name TEXT NOT NULL,
  proficiency_level INTEGER NOT NULL DEFAULT 3 CHECK (proficiency_level BETWEEN 1 AND 5),
  certified BOOLEAN NOT NULL DEFAULT false,
  certification_name TEXT,
  certification_expiry DATE,
  notes TEXT,
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(worker_id, category, skill_name)
);

CREATE INDEX IF NOT EXISTS idx_worker_skills_worker ON worker_skills(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_skills_category ON worker_skills(category);

-- =============================================
-- 2. WORKER AVAILABILITY (recurring weekly patterns)
-- =============================================
CREATE TABLE IF NOT EXISTS worker_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  day_of_week day_of_week NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  availability_type availability_type NOT NULL DEFAULT 'available',
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_until DATE, -- NULL = ongoing
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

CREATE INDEX IF NOT EXISTS idx_worker_avail_worker ON worker_availability(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_avail_day ON worker_availability(day_of_week);
CREATE INDEX IF NOT EXISTS idx_worker_avail_effective ON worker_availability(effective_from, effective_until);

-- =============================================
-- 3. WORKER BLACKOUT DATES (leave, unavailable dates)
-- =============================================
CREATE TABLE IF NOT EXISTS worker_blackout_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN (
    'annual_leave', 'sick_leave', 'personal_leave', 'public_holiday',
    'training', 'workers_comp', 'other'
  )),
  notes TEXT,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (start_date <= end_date)
);

CREATE INDEX IF NOT EXISTS idx_worker_blackout_worker ON worker_blackout_dates(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_blackout_dates ON worker_blackout_dates(start_date, end_date);

-- =============================================
-- 4. PARTICIPANT SUPPORT PREFERENCES
-- =============================================
CREATE TABLE IF NOT EXISTS participant_support_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  preferred_gender TEXT CHECK (preferred_gender IN ('male', 'female', 'non_binary', 'no_preference')),
  preferred_languages TEXT[] DEFAULT '{}',
  required_skills skill_category[] DEFAULT '{}',
  preferred_worker_ids UUID[] DEFAULT '{}', -- explicitly preferred workers
  excluded_worker_ids UUID[] DEFAULT '{}',  -- workers to avoid
  preferred_times JSONB DEFAULT '{}',       -- e.g. {"monday": {"start": "09:00", "end": "15:00"}}
  max_different_workers INTEGER,            -- consistency preference
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(participant_id)
);

-- =============================================
-- 5. ROSTER TEMPLATES (reusable weekly patterns)
-- =============================================
CREATE TABLE IF NOT EXISTS roster_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status roster_status NOT NULL DEFAULT 'draft',
  is_default BOOLEAN NOT NULL DEFAULT false,
  effective_from DATE,
  effective_until DATE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roster_template_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES roster_templates(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id),
  worker_id UUID REFERENCES workers(id),       -- NULL = unassigned
  day_of_week day_of_week NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  registration_group TEXT,
  service_description TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT template_valid_time CHECK (start_time < end_time)
);

CREATE INDEX IF NOT EXISTS idx_roster_template_entries_template ON roster_template_entries(template_id);
CREATE INDEX IF NOT EXISTS idx_roster_template_entries_worker ON roster_template_entries(worker_id);
CREATE INDEX IF NOT EXISTS idx_roster_template_entries_participant ON roster_template_entries(participant_id);

-- =============================================
-- 6. ROSTERS (generated weekly schedules)
-- =============================================
CREATE TABLE IF NOT EXISTS rosters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  week_start DATE NOT NULL, -- always a Monday
  week_end DATE NOT NULL,
  template_id UUID REFERENCES roster_templates(id),
  status roster_status NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(week_start)
);

CREATE INDEX IF NOT EXISTS idx_rosters_week ON rosters(week_start);
CREATE INDEX IF NOT EXISTS idx_rosters_status ON rosters(status);

-- =============================================
-- 7. SHIFTS (individual shift records)
-- =============================================
CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roster_id UUID REFERENCES rosters(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL, -- links back to existing bookings
  participant_id UUID NOT NULL REFERENCES participants(id),
  worker_id UUID REFERENCES workers(id),                      -- NULL = open/unassigned shift
  registration_group TEXT,
  service_description TEXT,
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status shift_status NOT NULL DEFAULT 'draft',
  actual_start_time TIMESTAMPTZ,
  actual_end_time TIMESTAMPTZ,
  check_in_location JSONB,
  check_out_location JSONB,
  break_minutes INTEGER DEFAULT 0,
  travel_km DECIMAL(6,1),
  is_sleepover BOOLEAN NOT NULL DEFAULT false,
  is_active_night BOOLEAN NOT NULL DEFAULT false,
  pay_rate_override DECIMAL(8,2),    -- override standard rate if needed
  match_score DECIMAL(5,2),          -- auto-calculated match quality (0-100)
  match_reasons JSONB DEFAULT '[]',  -- why this worker was matched
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT shift_valid_time CHECK (start_time < end_time OR is_sleepover = true)
);

CREATE INDEX IF NOT EXISTS idx_shifts_roster ON shifts(roster_id);
CREATE INDEX IF NOT EXISTS idx_shifts_booking ON shifts(booking_id);
CREATE INDEX IF NOT EXISTS idx_shifts_participant ON shifts(participant_id);
CREATE INDEX IF NOT EXISTS idx_shifts_worker ON shifts(worker_id);
CREATE INDEX IF NOT EXISTS idx_shifts_date ON shifts(shift_date);
CREATE INDEX IF NOT EXISTS idx_shifts_status ON shifts(status);
CREATE INDEX IF NOT EXISTS idx_shifts_worker_date ON shifts(worker_id, shift_date);
CREATE INDEX IF NOT EXISTS idx_shifts_open ON shifts(shift_date, status) WHERE worker_id IS NULL;

-- =============================================
-- 8. SHIFT SWAP REQUESTS
-- =============================================
CREATE TABLE IF NOT EXISTS shift_swap_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  requesting_worker_id UUID NOT NULL REFERENCES workers(id),
  proposed_worker_id UUID REFERENCES workers(id),  -- NULL = open swap (anyone can take it)
  reason TEXT,
  status swap_request_status NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_swap_requests_shift ON shift_swap_requests(shift_id);
CREATE INDEX IF NOT EXISTS idx_swap_requests_requesting ON shift_swap_requests(requesting_worker_id);
CREATE INDEX IF NOT EXISTS idx_swap_requests_proposed ON shift_swap_requests(proposed_worker_id);
CREATE INDEX IF NOT EXISTS idx_swap_requests_status ON shift_swap_requests(status);

-- =============================================
-- 9. SHIFT NOTES / HANDOVER
-- =============================================
CREATE TABLE IF NOT EXISTS shift_handover_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES workers(id),
  note_type TEXT NOT NULL CHECK (note_type IN ('handover', 'observation', 'alert', 'task_incomplete')),
  content TEXT NOT NULL,
  is_flagged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_handover_shift ON shift_handover_notes(shift_id);
CREATE INDEX IF NOT EXISTS idx_handover_flagged ON shift_handover_notes(is_flagged) WHERE is_flagged = true;

-- =============================================
-- 10. WORKER LOCATION ZONES (for proximity matching)
-- =============================================
ALTER TABLE workers ADD COLUMN IF NOT EXISTS service_radius_km DECIMAL(5,1) DEFAULT 25.0;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS home_latitude DECIMAL(10,7);
ALTER TABLE workers ADD COLUMN IF NOT EXISTS home_longitude DECIMAL(10,7);
ALTER TABLE workers ADD COLUMN IF NOT EXISTS preferred_languages TEXT[] DEFAULT '{}';
ALTER TABLE workers ADD COLUMN IF NOT EXISTS max_hours_per_week DECIMAL(4,1) DEFAULT 38.0;

ALTER TABLE participants ADD COLUMN IF NOT EXISTS home_latitude DECIMAL(10,7);
ALTER TABLE participants ADD COLUMN IF NOT EXISTS home_longitude DECIMAL(10,7);

-- =============================================
-- UPDATE TRIGGERS
-- =============================================
CREATE OR REPLACE FUNCTION update_rostering_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS worker_skills_updated_at ON worker_skills;
CREATE TRIGGER worker_skills_updated_at
  BEFORE UPDATE ON worker_skills
  FOR EACH ROW EXECUTE FUNCTION update_rostering_updated_at();

DROP TRIGGER IF EXISTS worker_availability_updated_at ON worker_availability;
CREATE TRIGGER worker_availability_updated_at
  BEFORE UPDATE ON worker_availability
  FOR EACH ROW EXECUTE FUNCTION update_rostering_updated_at();

DROP TRIGGER IF EXISTS participant_support_prefs_updated_at ON participant_support_preferences;
CREATE TRIGGER participant_support_prefs_updated_at
  BEFORE UPDATE ON participant_support_preferences
  FOR EACH ROW EXECUTE FUNCTION update_rostering_updated_at();

DROP TRIGGER IF EXISTS roster_templates_updated_at ON roster_templates;
CREATE TRIGGER roster_templates_updated_at
  BEFORE UPDATE ON roster_templates
  FOR EACH ROW EXECUTE FUNCTION update_rostering_updated_at();

DROP TRIGGER IF EXISTS rosters_updated_at ON rosters;
CREATE TRIGGER rosters_updated_at
  BEFORE UPDATE ON rosters
  FOR EACH ROW EXECUTE FUNCTION update_rostering_updated_at();

DROP TRIGGER IF EXISTS shifts_updated_at ON shifts;
CREATE TRIGGER shifts_updated_at
  BEFORE UPDATE ON shifts
  FOR EACH ROW EXECUTE FUNCTION update_rostering_updated_at();

DROP TRIGGER IF EXISTS swap_requests_updated_at ON shift_swap_requests;
CREATE TRIGGER swap_requests_updated_at
  BEFORE UPDATE ON shift_swap_requests
  FOR EACH ROW EXECUTE FUNCTION update_rostering_updated_at();

-- =============================================
-- 11. CONFLICT DETECTION FUNCTION
-- Prevents double-booking a worker
-- =============================================
CREATE OR REPLACE FUNCTION check_shift_conflicts()
RETURNS TRIGGER AS $$
DECLARE
  conflict_count INTEGER;
BEGIN
  -- Only check when a worker is assigned
  IF NEW.worker_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Skip cancelled shifts
  IF NEW.status = 'cancelled' THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO conflict_count
  FROM shifts
  WHERE id != NEW.id
    AND worker_id = NEW.worker_id
    AND shift_date = NEW.shift_date
    AND status NOT IN ('cancelled', 'draft')
    AND (
      (NEW.start_time >= start_time AND NEW.start_time < end_time)
      OR (NEW.end_time > start_time AND NEW.end_time <= end_time)
      OR (NEW.start_time <= start_time AND NEW.end_time >= end_time)
    );

  IF conflict_count > 0 THEN
    RAISE EXCEPTION 'Worker already has a shift during this time on %', NEW.shift_date;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS shifts_conflict_check ON shifts;
CREATE TRIGGER shifts_conflict_check
  BEFORE INSERT OR UPDATE ON shifts
  FOR EACH ROW
  EXECUTE FUNCTION check_shift_conflicts();

-- =============================================
-- 12. BLACKOUT DATE CHECK
-- Prevents assigning shifts during leave
-- =============================================
CREATE OR REPLACE FUNCTION check_worker_blackout()
RETURNS TRIGGER AS $$
DECLARE
  blackout_count INTEGER;
BEGIN
  IF NEW.worker_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'cancelled' THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO blackout_count
  FROM worker_blackout_dates
  WHERE worker_id = NEW.worker_id
    AND NEW.shift_date BETWEEN start_date AND end_date;

  IF blackout_count > 0 THEN
    RAISE EXCEPTION 'Worker has a blackout date (leave) on %', NEW.shift_date;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS shifts_blackout_check ON shifts;
CREATE TRIGGER shifts_blackout_check
  BEFORE INSERT OR UPDATE ON shifts
  FOR EACH ROW
  EXECUTE FUNCTION check_worker_blackout();

-- =============================================
-- 13. SMART MATCHING FUNCTION
-- Scores worker-participant compatibility (0-100)
-- =============================================
CREATE OR REPLACE FUNCTION calculate_worker_match_score(
  p_worker_id UUID,
  p_participant_id UUID,
  p_shift_date DATE,
  p_start_time TIME,
  p_end_time TIME
)
RETURNS TABLE (
  score DECIMAL(5,2),
  reasons JSONB
)
LANGUAGE plpgsql AS $$
DECLARE
  v_score DECIMAL(5,2) := 0;
  v_reasons JSONB := '[]'::JSONB;
  v_worker RECORD;
  v_participant RECORD;
  v_prefs RECORD;
  v_day day_of_week;
  v_avail_count INTEGER;
  v_skill_match INTEGER;
  v_required_skills INTEGER;
  v_has_assignment BOOLEAN;
  v_booking_count INTEGER;
  v_distance_km DECIMAL;
BEGIN
  -- Get worker info
  SELECT * INTO v_worker FROM workers WHERE id = p_worker_id AND status = 'active';
  IF v_worker IS NULL THEN
    score := 0;
    reasons := '[{"factor": "inactive_worker", "detail": "Worker is not active"}]'::JSONB;
    RETURN NEXT;
    RETURN;
  END IF;

  -- Get participant info
  SELECT * INTO v_participant FROM participants WHERE id = p_participant_id;

  -- Get participant preferences
  SELECT * INTO v_prefs FROM participant_support_preferences WHERE participant_id = p_participant_id;

  -- Determine day of week
  v_day := LOWER(TO_CHAR(p_shift_date, 'fmday'))::day_of_week;

  -- ---- FACTOR 1: Availability match (0-25 points) ----
  SELECT COUNT(*) INTO v_avail_count
  FROM worker_availability
  WHERE worker_id = p_worker_id
    AND day_of_week = v_day
    AND start_time <= p_start_time
    AND end_time >= p_end_time
    AND availability_type IN ('available', 'preferred')
    AND effective_from <= p_shift_date
    AND (effective_until IS NULL OR effective_until >= p_shift_date);

  IF v_avail_count > 0 THEN
    v_score := v_score + 25;
    v_reasons := v_reasons || '{"factor": "availability", "points": 25, "detail": "Available at requested time"}'::JSONB;

    -- Bonus for preferred time
    SELECT COUNT(*) INTO v_avail_count
    FROM worker_availability
    WHERE worker_id = p_worker_id
      AND day_of_week = v_day
      AND availability_type = 'preferred'
      AND start_time <= p_start_time
      AND end_time >= p_end_time
      AND effective_from <= p_shift_date
      AND (effective_until IS NULL OR effective_until >= p_shift_date);

    IF v_avail_count > 0 THEN
      v_score := v_score + 5;
      v_reasons := v_reasons || '{"factor": "preferred_time", "points": 5, "detail": "Preferred working time"}'::JSONB;
    END IF;
  END IF;

  -- ---- FACTOR 2: Skills match (0-25 points) ----
  IF v_prefs IS NOT NULL AND array_length(v_prefs.required_skills, 1) > 0 THEN
    v_required_skills := array_length(v_prefs.required_skills, 1);

    SELECT COUNT(*) INTO v_skill_match
    FROM worker_skills ws
    WHERE ws.worker_id = p_worker_id
      AND ws.category = ANY(v_prefs.required_skills);

    IF v_required_skills > 0 THEN
      v_score := v_score + LEAST(25, (v_skill_match::DECIMAL / v_required_skills) * 25);
      v_reasons := v_reasons || format(
        '{"factor": "skills", "points": %s, "detail": "%s of %s required skills matched"}',
        LEAST(25, (v_skill_match::DECIMAL / v_required_skills) * 25),
        v_skill_match, v_required_skills
      )::JSONB;
    END IF;
  ELSE
    -- No specific skills required, give base points
    v_score := v_score + 15;
    v_reasons := v_reasons || '{"factor": "skills", "points": 15, "detail": "No specific skills required"}'::JSONB;
  END IF;

  -- ---- FACTOR 3: Existing relationship / continuity (0-20 points) ----
  SELECT EXISTS(
    SELECT 1 FROM worker_participant_assignments
    WHERE worker_id = p_worker_id
      AND participant_id = p_participant_id
      AND is_active = true
  ) INTO v_has_assignment;

  IF v_has_assignment THEN
    v_score := v_score + 15;
    v_reasons := v_reasons || '{"factor": "continuity", "points": 15, "detail": "Active assignment to participant"}'::JSONB;
  END IF;

  -- Recent booking history (familiarity)
  SELECT COUNT(*) INTO v_booking_count
  FROM shifts
  WHERE worker_id = p_worker_id
    AND participant_id = p_participant_id
    AND status IN ('completed', 'confirmed', 'in_progress')
    AND shift_date >= p_shift_date - INTERVAL '90 days';

  IF v_booking_count >= 5 THEN
    v_score := v_score + 5;
    v_reasons := v_reasons || format(
      '{"factor": "familiarity", "points": 5, "detail": "%s shifts in last 90 days"}',
      v_booking_count
    )::JSONB;
  END IF;

  -- ---- FACTOR 4: Participant preferences (0-15 points) ----
  IF v_prefs IS NOT NULL THEN
    -- Preferred worker list
    IF p_worker_id = ANY(v_prefs.preferred_worker_ids) THEN
      v_score := v_score + 15;
      v_reasons := v_reasons || '{"factor": "preferred_worker", "points": 15, "detail": "On participant preferred list"}'::JSONB;
    -- Excluded worker
    ELSIF p_worker_id = ANY(v_prefs.excluded_worker_ids) THEN
      v_score := 0; -- Automatic disqualification
      reasons := '[{"factor": "excluded_worker", "points": -100, "detail": "On participant exclusion list"}]'::JSONB;
      score := 0;
      RETURN NEXT;
      RETURN;
    END IF;

    -- Language match
    IF array_length(v_prefs.preferred_languages, 1) > 0
       AND v_worker.preferred_languages && v_prefs.preferred_languages THEN
      v_score := v_score + 5;
      v_reasons := v_reasons || '{"factor": "language", "points": 5, "detail": "Language preference matched"}'::JSONB;
    END IF;
  END IF;

  -- ---- FACTOR 5: Proximity / distance (0-10 points) ----
  IF v_worker.home_latitude IS NOT NULL AND v_participant.home_latitude IS NOT NULL THEN
    -- Haversine approximation (good enough for local distances)
    v_distance_km := 6371 * ACOS(
      LEAST(1, COS(RADIANS(v_worker.home_latitude)) * COS(RADIANS(v_participant.home_latitude))
      * COS(RADIANS(v_participant.home_longitude) - RADIANS(v_worker.home_longitude))
      + SIN(RADIANS(v_worker.home_latitude)) * SIN(RADIANS(v_participant.home_latitude)))
    );

    IF v_distance_km <= 5 THEN
      v_score := v_score + 10;
      v_reasons := v_reasons || format('{"factor": "proximity", "points": 10, "detail": "%.1f km away"}', v_distance_km)::JSONB;
    ELSIF v_distance_km <= 15 THEN
      v_score := v_score + 7;
      v_reasons := v_reasons || format('{"factor": "proximity", "points": 7, "detail": "%.1f km away"}', v_distance_km)::JSONB;
    ELSIF v_distance_km <= COALESCE(v_worker.service_radius_km, 25) THEN
      v_score := v_score + 3;
      v_reasons := v_reasons || format('{"factor": "proximity", "points": 3, "detail": "%.1f km away (within radius)"}', v_distance_km)::JSONB;
    ELSE
      v_reasons := v_reasons || format('{"factor": "proximity", "points": 0, "detail": "%.1f km away (outside radius)"}', v_distance_km)::JSONB;
    END IF;
  END IF;

  -- Cap at 100
  v_score := LEAST(100, v_score);

  score := v_score;
  reasons := v_reasons;
  RETURN NEXT;
  RETURN;
END;
$$;

-- =============================================
-- 14. FIND BEST WORKERS FOR A SHIFT
-- Returns ranked list of available workers
-- =============================================
CREATE OR REPLACE FUNCTION find_matching_workers(
  p_participant_id UUID,
  p_shift_date DATE,
  p_start_time TIME,
  p_end_time TIME,
  p_registration_group TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  worker_id UUID,
  worker_name TEXT,
  match_score DECIMAL(5,2),
  match_reasons JSONB,
  is_available BOOLEAN,
  has_conflict BOOLEAN,
  on_leave BOOLEAN
)
LANGUAGE plpgsql AS $$
DECLARE
  v_day day_of_week;
  v_worker RECORD;
  v_match RECORD;
  v_conflict_count INTEGER;
  v_leave_count INTEGER;
BEGIN
  v_day := LOWER(TO_CHAR(p_shift_date, 'fmday'))::day_of_week;

  FOR v_worker IN
    SELECT w.id, w.first_name || ' ' || w.last_name AS name
    FROM workers w
    WHERE w.status = 'active'
      AND (p_registration_group IS NULL OR p_registration_group = ANY(w.qualified_registration_groups))
    ORDER BY w.first_name
  LOOP
    -- Check conflicts
    SELECT COUNT(*) INTO v_conflict_count
    FROM shifts s
    WHERE s.worker_id = v_worker.id
      AND s.shift_date = p_shift_date
      AND s.status NOT IN ('cancelled', 'draft')
      AND (
        (p_start_time >= s.start_time AND p_start_time < s.end_time)
        OR (p_end_time > s.start_time AND p_end_time <= s.end_time)
        OR (p_start_time <= s.start_time AND p_end_time >= s.end_time)
      );

    -- Check leave
    SELECT COUNT(*) INTO v_leave_count
    FROM worker_blackout_dates bd
    WHERE bd.worker_id = v_worker.id
      AND p_shift_date BETWEEN bd.start_date AND bd.end_date;

    -- Calculate match score
    SELECT * INTO v_match
    FROM calculate_worker_match_score(v_worker.id, p_participant_id, p_shift_date, p_start_time, p_end_time);

    worker_id := v_worker.id;
    worker_name := v_worker.name;
    match_score := v_match.score;
    match_reasons := v_match.reasons;
    is_available := (v_conflict_count = 0 AND v_leave_count = 0);
    has_conflict := (v_conflict_count > 0);
    on_leave := (v_leave_count > 0);

    RETURN NEXT;
  END LOOP;

  -- Re-sort by availability first, then score
  RETURN QUERY
  SELECT * FROM (SELECT NULL::UUID, NULL::TEXT, NULL::DECIMAL, NULL::JSONB, NULL::BOOLEAN, NULL::BOOLEAN, NULL::BOOLEAN LIMIT 0) empty
  ORDER BY is_available DESC, match_score DESC
  LIMIT p_limit;

  RETURN;
END;
$$;

-- Simpler wrapper: find_matching_workers as a proper ordered query
CREATE OR REPLACE VIEW open_shifts AS
SELECT
  s.id,
  s.shift_date,
  s.start_time,
  s.end_time,
  s.registration_group,
  s.service_description,
  s.status,
  s.notes,
  p.first_name || ' ' || p.last_name AS participant_name,
  p.id AS participant_id,
  s.created_at
FROM shifts s
JOIN participants p ON p.id = s.participant_id
WHERE s.worker_id IS NULL
  AND s.status IN ('published', 'draft')
  AND s.shift_date >= CURRENT_DATE
ORDER BY s.shift_date, s.start_time;

-- =============================================
-- 15. ROSTER GENERATION FROM TEMPLATE
-- =============================================
CREATE OR REPLACE FUNCTION generate_roster_from_template(
  p_template_id UUID,
  p_week_start DATE, -- Must be a Monday
  p_created_by UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql AS $$
DECLARE
  v_roster_id UUID;
  v_template RECORD;
  v_entry RECORD;
  v_shift_date DATE;
  v_day_offset INTEGER;
BEGIN
  -- Validate week_start is a Monday
  IF EXTRACT(ISODOW FROM p_week_start) != 1 THEN
    RAISE EXCEPTION 'week_start must be a Monday, got %', TO_CHAR(p_week_start, 'Day');
  END IF;

  -- Get template
  SELECT * INTO v_template FROM roster_templates WHERE id = p_template_id;
  IF v_template IS NULL THEN
    RAISE EXCEPTION 'Template not found: %', p_template_id;
  END IF;

  -- Create roster
  INSERT INTO rosters (name, week_start, week_end, template_id, status, created_by)
  VALUES (
    v_template.name || ' - ' || TO_CHAR(p_week_start, 'DD Mon YYYY'),
    p_week_start,
    p_week_start + 6,
    p_template_id,
    'draft',
    p_created_by
  )
  RETURNING id INTO v_roster_id;

  -- Generate shifts from template entries
  FOR v_entry IN
    SELECT * FROM roster_template_entries WHERE template_id = p_template_id
  LOOP
    -- Map day_of_week to offset from Monday
    v_day_offset := CASE v_entry.day_of_week
      WHEN 'monday' THEN 0
      WHEN 'tuesday' THEN 1
      WHEN 'wednesday' THEN 2
      WHEN 'thursday' THEN 3
      WHEN 'friday' THEN 4
      WHEN 'saturday' THEN 5
      WHEN 'sunday' THEN 6
    END;

    v_shift_date := p_week_start + v_day_offset;

    INSERT INTO shifts (
      roster_id, participant_id, worker_id,
      registration_group, service_description,
      shift_date, start_time, end_time,
      status, created_by, notes
    ) VALUES (
      v_roster_id, v_entry.participant_id, v_entry.worker_id,
      v_entry.registration_group, v_entry.service_description,
      v_shift_date, v_entry.start_time, v_entry.end_time,
      CASE WHEN v_entry.worker_id IS NOT NULL THEN 'assigned'::shift_status ELSE 'draft'::shift_status END,
      p_created_by, v_entry.notes
    );
  END LOOP;

  RETURN v_roster_id;
END;
$$;

-- =============================================
-- 16. AUTO-ASSIGN OPEN SHIFTS (smart fill)
-- =============================================
CREATE OR REPLACE FUNCTION auto_assign_open_shifts(
  p_roster_id UUID
)
RETURNS TABLE (
  shift_id UUID,
  assigned_worker_id UUID,
  assigned_worker_name TEXT,
  match_score DECIMAL(5,2)
)
LANGUAGE plpgsql AS $$
DECLARE
  v_shift RECORD;
  v_best_worker RECORD;
BEGIN
  -- Process each unassigned shift in the roster
  FOR v_shift IN
    SELECT s.*
    FROM shifts s
    WHERE s.roster_id = p_roster_id
      AND s.worker_id IS NULL
      AND s.status NOT IN ('cancelled')
    ORDER BY s.shift_date, s.start_time
  LOOP
    -- Find best available worker
    SELECT fm.worker_id AS wid, fm.worker_name AS wname, fm.match_score AS mscore
    INTO v_best_worker
    FROM find_matching_workers(
      v_shift.participant_id,
      v_shift.shift_date,
      v_shift.start_time,
      v_shift.end_time,
      v_shift.registration_group,
      1
    ) fm
    WHERE fm.is_available = true
      AND fm.match_score >= 30 -- minimum threshold
    ORDER BY fm.match_score DESC
    LIMIT 1;

    IF v_best_worker IS NOT NULL AND v_best_worker.wid IS NOT NULL THEN
      -- Assign the worker
      UPDATE shifts
      SET worker_id = v_best_worker.wid,
          status = 'assigned',
          match_score = v_best_worker.mscore,
          updated_at = NOW()
      WHERE id = v_shift.id;

      shift_id := v_shift.id;
      assigned_worker_id := v_best_worker.wid;
      assigned_worker_name := v_best_worker.wname;
      match_score := v_best_worker.mscore;
      RETURN NEXT;
    END IF;
  END LOOP;

  RETURN;
END;
$$;

-- =============================================
-- 17. WEEKLY HOURS SUMMARY VIEW
-- =============================================
CREATE OR REPLACE VIEW worker_weekly_hours AS
SELECT
  w.id AS worker_id,
  w.first_name || ' ' || w.last_name AS worker_name,
  DATE_TRUNC('week', s.shift_date)::DATE AS week_start,
  COUNT(s.id) AS shift_count,
  SUM(
    EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600
    - COALESCE(s.break_minutes, 0) / 60.0
  ) AS total_hours,
  w.max_hours_per_week,
  SUM(
    EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600
    - COALESCE(s.break_minutes, 0) / 60.0
  ) > COALESCE(w.max_hours_per_week, 38) AS over_hours
FROM workers w
JOIN shifts s ON s.worker_id = w.id
WHERE s.status NOT IN ('cancelled', 'draft')
GROUP BY w.id, w.first_name, w.last_name, w.max_hours_per_week, DATE_TRUNC('week', s.shift_date);

-- =============================================
-- 18. ROSTER COVERAGE SUMMARY VIEW
-- =============================================
CREATE OR REPLACE VIEW roster_coverage_summary AS
SELECT
  r.id AS roster_id,
  r.name AS roster_name,
  r.week_start,
  r.status,
  COUNT(s.id) AS total_shifts,
  COUNT(s.id) FILTER (WHERE s.worker_id IS NOT NULL) AS assigned_shifts,
  COUNT(s.id) FILTER (WHERE s.worker_id IS NULL) AS open_shifts,
  ROUND(
    COUNT(s.id) FILTER (WHERE s.worker_id IS NOT NULL)::DECIMAL
    / NULLIF(COUNT(s.id), 0) * 100, 1
  ) AS coverage_pct,
  COUNT(DISTINCT s.participant_id) AS participants_covered,
  COUNT(DISTINCT s.worker_id) AS workers_rostered,
  AVG(s.match_score) FILTER (WHERE s.match_score IS NOT NULL) AS avg_match_score
FROM rosters r
LEFT JOIN shifts s ON s.roster_id = r.id AND s.status != 'cancelled'
GROUP BY r.id, r.name, r.week_start, r.status;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE worker_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_blackout_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_support_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE roster_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE roster_template_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE rosters ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_swap_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_handover_notes ENABLE ROW LEVEL SECURITY;

-- Staff can manage all rostering tables
DO $$ BEGIN
  CREATE POLICY "Staff manage worker skills" ON worker_skills FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff manage worker availability" ON worker_availability FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff manage worker blackout dates" ON worker_blackout_dates FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff manage participant support preferences" ON participant_support_preferences FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff manage roster templates" ON roster_templates FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff manage roster template entries" ON roster_template_entries FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff manage rosters" ON rosters FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff manage shifts" ON shifts FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff manage swap requests" ON shift_swap_requests FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff manage handover notes" ON shift_handover_notes FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Portal users can view their own shifts/roster
DO $$ BEGIN
  CREATE POLICY "Portal users view own shifts" ON shifts FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM participants pt
        JOIN profiles pr ON pr.id = auth.uid()
        WHERE pr.role = 'participant_portal'
          AND pt.id = shifts.participant_id
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Grant view access
GRANT SELECT ON open_shifts TO authenticated;
GRANT SELECT ON worker_weekly_hours TO authenticated;
GRANT SELECT ON roster_coverage_summary TO authenticated;

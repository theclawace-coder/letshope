-- v2 Phase 10: Medication Management
-- Structured medication records, schedules, administration logging,
-- PRN tracking, medication reviews, and NDIS compliance
-- Fully idempotent: safe to re-run

-- =============================================
-- ENUMS
-- =============================================

DO $$ BEGIN
  CREATE TYPE medication_status AS ENUM (
    'active', 'on_hold', 'discontinued', 'completed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE medication_route AS ENUM (
    'oral', 'topical', 'sublingual', 'inhalation', 'injection',
    'rectal', 'nasal', 'ophthalmic', 'otic', 'transdermal',
    'subcutaneous', 'intramuscular', 'peg', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE medication_frequency AS ENUM (
    'once_daily', 'twice_daily', 'three_times_daily', 'four_times_daily',
    'every_morning', 'every_night', 'every_4_hours', 'every_6_hours',
    'every_8_hours', 'every_12_hours',
    'weekly', 'fortnightly', 'monthly',
    'as_needed', 'stat', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE administration_outcome AS ENUM (
    'given', 'refused', 'withheld', 'not_available', 'self_administered',
    'vomited', 'spat_out', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE medication_form AS ENUM (
    'tablet', 'capsule', 'liquid', 'cream', 'ointment', 'gel',
    'patch', 'inhaler', 'injection', 'drops', 'spray',
    'powder', 'suppository', 'lozenge', 'wafer', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE medication_review_type AS ENUM (
    'initial', 'routine', 'change', 'incident_triggered', 'annual', 'discharge'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE medication_support_level AS ENUM (
    'independent',           -- participant manages own meds
    'prompt_and_remind',     -- verbal/visual prompting only
    'assist_with_packaging', -- help open packaging, blister packs
    'administer',            -- worker physically administers
    'complex_health'         -- requires nurse/trained staff
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- 1. PRESCRIBERS (doctors, specialists)
-- =============================================
CREATE TABLE IF NOT EXISTS prescribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider_number TEXT,          -- Medicare provider number
  practice_name TEXT,
  specialty TEXT,
  phone TEXT,
  fax TEXT,
  email TEXT,
  address JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prescribers_name ON prescribers(name);

-- =============================================
-- 2. PHARMACIES
-- =============================================
CREATE TABLE IF NOT EXISTS pharmacies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  fax TEXT,
  email TEXT,
  address JSONB,
  delivers BOOLEAN NOT NULL DEFAULT false,
  webster_packs BOOLEAN NOT NULL DEFAULT false, -- dose administration aids
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pharmacies_name ON pharmacies(name);

-- =============================================
-- 3. PARTICIPANT MEDICATION PROFILES
-- Overall medication context per participant
-- =============================================
CREATE TABLE IF NOT EXISTS participant_medication_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  support_level medication_support_level NOT NULL DEFAULT 'prompt_and_remind',
  primary_prescriber_id UUID REFERENCES prescribers(id),
  primary_pharmacy_id UUID REFERENCES pharmacies(id),
  uses_webster_pack BOOLEAN NOT NULL DEFAULT false,
  webster_pack_day TEXT CHECK (webster_pack_day IN (
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  )),
  storage_instructions TEXT,        -- e.g. "Fridge for insulin, locked cupboard for S8"
  allergies_medications TEXT[] DEFAULT '{}',
  adverse_reactions TEXT,
  consent_obtained BOOLEAN NOT NULL DEFAULT false,
  consent_date DATE,
  consent_reference UUID,           -- links to consent_records from phase 5
  medication_plan_document_id UUID, -- links to documents table
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(participant_id)
);

-- =============================================
-- 4. MEDICATIONS (individual medication records)
-- =============================================
CREATE TABLE IF NOT EXISTS medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  generic_name TEXT,
  brand_name TEXT,
  strength TEXT,                     -- e.g. "500mg", "10mg/5ml"
  form medication_form NOT NULL DEFAULT 'tablet',
  route medication_route NOT NULL DEFAULT 'oral',
  frequency medication_frequency NOT NULL DEFAULT 'once_daily',
  frequency_detail TEXT,             -- free text for 'other' frequency
  dose_amount TEXT NOT NULL,         -- e.g. "1 tablet", "5ml", "2 puffs"
  instructions TEXT,                 -- e.g. "Take with food", "Dissolve under tongue"
  indication TEXT,                   -- why prescribed (e.g. "Blood pressure")
  is_prn BOOLEAN NOT NULL DEFAULT false,  -- as-needed medication
  prn_max_dose TEXT,                 -- e.g. "Max 4 doses in 24 hours"
  prn_reason TEXT,                   -- when to give PRN (e.g. "For pain > 5/10")
  is_schedule_8 BOOLEAN NOT NULL DEFAULT false,  -- controlled substance (Aus S8)
  is_high_risk BOOLEAN NOT NULL DEFAULT false,    -- APINCH medications
  prescriber_id UUID REFERENCES prescribers(id),
  pharmacy_id UUID REFERENCES pharmacies(id),
  status medication_status NOT NULL DEFAULT 'active',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,                     -- NULL = ongoing
  discontinued_reason TEXT,
  discontinued_by UUID REFERENCES profiles(id),
  discontinued_at TIMESTAMPTZ,
  last_dispensed DATE,
  next_review_date DATE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medications_participant ON medications(participant_id);
CREATE INDEX IF NOT EXISTS idx_medications_status ON medications(status);
CREATE INDEX IF NOT EXISTS idx_medications_prn ON medications(is_prn) WHERE is_prn = true;
CREATE INDEX IF NOT EXISTS idx_medications_s8 ON medications(is_schedule_8) WHERE is_schedule_8 = true;
CREATE INDEX IF NOT EXISTS idx_medications_review ON medications(next_review_date) WHERE status = 'active';

-- =============================================
-- 5. MEDICATION SCHEDULE TIMES
-- Specific times a medication should be given
-- =============================================
CREATE TABLE IF NOT EXISTS medication_schedule_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  scheduled_time TIME NOT NULL,
  label TEXT,                        -- e.g. "Morning", "With lunch", "Bedtime"
  day_of_week day_of_week,           -- NULL = every day, set = specific day only
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_med_schedule_medication ON medication_schedule_times(medication_id);
CREATE INDEX IF NOT EXISTS idx_med_schedule_time ON medication_schedule_times(scheduled_time);

-- =============================================
-- 6. MEDICATION ADMINISTRATION LOG
-- Every dose given/missed/refused
-- =============================================
CREATE TABLE IF NOT EXISTS medication_administration_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id),
  schedule_time_id UUID REFERENCES medication_schedule_times(id),
  shift_id UUID REFERENCES shifts(id),          -- links to rostering
  administered_by UUID NOT NULL REFERENCES profiles(id),
  witnessed_by UUID REFERENCES profiles(id),    -- required for S8 medications
  scheduled_at TIMESTAMPTZ NOT NULL,             -- when it was supposed to be given
  administered_at TIMESTAMPTZ,                   -- when actually given (NULL if not given)
  outcome administration_outcome NOT NULL,
  dose_given TEXT,                               -- actual dose (may differ from prescribed)
  is_prn_dose BOOLEAN NOT NULL DEFAULT false,
  prn_trigger TEXT,                              -- what prompted PRN administration
  prn_effectiveness TEXT,                        -- follow-up: did it help?
  prn_effectiveness_time TIMESTAMPTZ,            -- when effectiveness was assessed
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_med_admin_medication ON medication_administration_log(medication_id);
CREATE INDEX IF NOT EXISTS idx_med_admin_participant ON medication_administration_log(participant_id);
CREATE INDEX IF NOT EXISTS idx_med_admin_administered_by ON medication_administration_log(administered_by);
CREATE INDEX IF NOT EXISTS idx_med_admin_scheduled ON medication_administration_log(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_med_admin_shift ON medication_administration_log(shift_id);
CREATE INDEX IF NOT EXISTS idx_med_admin_outcome ON medication_administration_log(outcome)
  WHERE outcome NOT IN ('given', 'self_administered');

-- =============================================
-- 7. SCHEDULE 8 (CONTROLLED SUBSTANCE) REGISTER
-- Australian S8 drug register requirements
-- =============================================
CREATE TABLE IF NOT EXISTS schedule_8_register (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id),
  entry_type TEXT NOT NULL CHECK (entry_type IN ('received', 'administered', 'disposed', 'audit')),
  quantity_before DECIMAL(8,2),      -- balance before
  quantity_change DECIMAL(8,2) NOT NULL, -- positive = received, negative = administered/disposed
  quantity_after DECIMAL(8,2),       -- balance after
  administration_log_id UUID REFERENCES medication_administration_log(id),
  performed_by UUID NOT NULL REFERENCES profiles(id),
  witnessed_by UUID NOT NULL REFERENCES profiles(id), -- always required for S8
  batch_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_s8_register_medication ON schedule_8_register(medication_id);
CREATE INDEX IF NOT EXISTS idx_s8_register_participant ON schedule_8_register(participant_id);
CREATE INDEX IF NOT EXISTS idx_s8_register_type ON schedule_8_register(entry_type);

-- =============================================
-- 8. MEDICATION CHANGES LOG
-- Tracks all changes (dose adjustments, new scripts, etc.)
-- =============================================
CREATE TABLE IF NOT EXISTS medication_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL CHECK (change_type IN (
    'started', 'dose_changed', 'frequency_changed', 'form_changed',
    'route_changed', 'suspended', 'resumed', 'discontinued', 'substituted'
  )),
  previous_value TEXT,
  new_value TEXT,
  reason TEXT,
  prescriber_id UUID REFERENCES prescribers(id),
  changed_by UUID NOT NULL REFERENCES profiles(id),
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_med_changes_medication ON medication_changes(medication_id);
CREATE INDEX IF NOT EXISTS idx_med_changes_date ON medication_changes(effective_date);

-- =============================================
-- 9. MEDICATION REVIEWS
-- Periodic reviews for compliance & effectiveness
-- =============================================
CREATE TABLE IF NOT EXISTS medication_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  review_type medication_review_type NOT NULL DEFAULT 'routine',
  review_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reviewer_name TEXT NOT NULL,       -- could be GP, pharmacist, specialist
  reviewer_role TEXT,
  prescriber_id UUID REFERENCES prescribers(id),
  medications_reviewed UUID[] DEFAULT '{}', -- medication IDs reviewed
  changes_made JSONB DEFAULT '[]',          -- summary of changes
  compliance_rating INTEGER CHECK (compliance_rating BETWEEN 1 AND 5),
  side_effects_noted TEXT,
  outcome_summary TEXT NOT NULL,
  next_review_date DATE,
  document_id UUID,                  -- linked uploaded review document
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_med_reviews_participant ON medication_reviews(participant_id);
CREATE INDEX IF NOT EXISTS idx_med_reviews_date ON medication_reviews(review_date);
CREATE INDEX IF NOT EXISTS idx_med_reviews_next ON medication_reviews(next_review_date)
  WHERE next_review_date IS NOT NULL;

-- =============================================
-- 10. MEDICATION ERRORS / NEAR MISSES
-- Links to incident system but with med-specific detail
-- =============================================
CREATE TABLE IF NOT EXISTS medication_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id),
  medication_id UUID REFERENCES medications(id),
  incident_id UUID,                  -- links to incidents table from phase 4
  incident_type TEXT NOT NULL CHECK (incident_type IN (
    'wrong_medication', 'wrong_dose', 'wrong_time', 'wrong_route',
    'wrong_participant', 'omitted_dose', 'double_dose',
    'expired_medication', 'adverse_reaction', 'near_miss', 'other'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  immediate_actions TEXT,
  prescriber_notified BOOLEAN NOT NULL DEFAULT false,
  prescriber_notified_at TIMESTAMPTZ,
  reported_by UUID NOT NULL REFERENCES profiles(id),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  review_outcome TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_med_incidents_participant ON medication_incidents(participant_id);
CREATE INDEX IF NOT EXISTS idx_med_incidents_medication ON medication_incidents(medication_id);
CREATE INDEX IF NOT EXISTS idx_med_incidents_severity ON medication_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_med_incidents_type ON medication_incidents(incident_type);

-- =============================================
-- UPDATE TRIGGERS
-- =============================================
CREATE OR REPLACE FUNCTION update_medication_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS participant_med_profile_updated_at ON participant_medication_profiles;
CREATE TRIGGER participant_med_profile_updated_at
  BEFORE UPDATE ON participant_medication_profiles
  FOR EACH ROW EXECUTE FUNCTION update_medication_updated_at();

DROP TRIGGER IF EXISTS medications_updated_at ON medications;
CREATE TRIGGER medications_updated_at
  BEFORE UPDATE ON medications
  FOR EACH ROW EXECUTE FUNCTION update_medication_updated_at();

DROP TRIGGER IF EXISTS prescribers_updated_at ON prescribers;
CREATE TRIGGER prescribers_updated_at
  BEFORE UPDATE ON prescribers
  FOR EACH ROW EXECUTE FUNCTION update_medication_updated_at();

DROP TRIGGER IF EXISTS pharmacies_updated_at ON pharmacies;
CREATE TRIGGER pharmacies_updated_at
  BEFORE UPDATE ON pharmacies
  FOR EACH ROW EXECUTE FUNCTION update_medication_updated_at();

DROP TRIGGER IF EXISTS medication_reviews_updated_at ON medication_reviews;
CREATE TRIGGER medication_reviews_updated_at
  BEFORE UPDATE ON medication_reviews
  FOR EACH ROW EXECUTE FUNCTION update_medication_updated_at();

DROP TRIGGER IF EXISTS medication_incidents_updated_at ON medication_incidents;
CREATE TRIGGER medication_incidents_updated_at
  BEFORE UPDATE ON medication_incidents
  FOR EACH ROW EXECUTE FUNCTION update_medication_updated_at();

-- =============================================
-- 11. S8 WITNESS VALIDATION
-- Ensures S8 medications always have a witness
-- =============================================
CREATE OR REPLACE FUNCTION validate_s8_witness()
RETURNS TRIGGER AS $$
DECLARE
  v_is_s8 BOOLEAN;
BEGIN
  SELECT is_schedule_8 INTO v_is_s8
  FROM medications
  WHERE id = NEW.medication_id;

  IF v_is_s8 AND NEW.outcome = 'given' AND NEW.witnessed_by IS NULL THEN
    RAISE EXCEPTION 'Schedule 8 medication administration requires a witness';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS med_admin_s8_witness_check ON medication_administration_log;
CREATE TRIGGER med_admin_s8_witness_check
  BEFORE INSERT OR UPDATE ON medication_administration_log
  FOR EACH ROW EXECUTE FUNCTION validate_s8_witness();

-- =============================================
-- 12. AUTO-LOG MEDICATION CHANGES
-- Captures dose/frequency changes automatically
-- =============================================
CREATE OR REPLACE FUNCTION log_medication_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Dose change
  IF OLD.dose_amount IS DISTINCT FROM NEW.dose_amount THEN
    INSERT INTO medication_changes (medication_id, change_type, previous_value, new_value, changed_by)
    VALUES (NEW.id, 'dose_changed', OLD.dose_amount, NEW.dose_amount,
            COALESCE(NEW.discontinued_by, (SELECT auth.uid())));
  END IF;

  -- Frequency change
  IF OLD.frequency IS DISTINCT FROM NEW.frequency THEN
    INSERT INTO medication_changes (medication_id, change_type, previous_value, new_value, changed_by)
    VALUES (NEW.id, 'frequency_changed', OLD.frequency::TEXT, NEW.frequency::TEXT,
            COALESCE(NEW.discontinued_by, (SELECT auth.uid())));
  END IF;

  -- Status change
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'discontinued' THEN
      INSERT INTO medication_changes (medication_id, change_type, previous_value, new_value, reason, changed_by)
      VALUES (NEW.id, 'discontinued', OLD.status::TEXT, 'discontinued', NEW.discontinued_reason,
              COALESCE(NEW.discontinued_by, (SELECT auth.uid())));
    ELSIF NEW.status = 'on_hold' THEN
      INSERT INTO medication_changes (medication_id, change_type, previous_value, new_value, changed_by)
      VALUES (NEW.id, 'suspended', OLD.status::TEXT, 'on_hold',
              COALESCE(NEW.discontinued_by, (SELECT auth.uid())));
    ELSIF OLD.status = 'on_hold' AND NEW.status = 'active' THEN
      INSERT INTO medication_changes (medication_id, change_type, previous_value, new_value, changed_by)
      VALUES (NEW.id, 'resumed', 'on_hold', 'active',
              COALESCE(NEW.discontinued_by, (SELECT auth.uid())));
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS medications_change_log ON medications;
CREATE TRIGGER medications_change_log
  AFTER UPDATE ON medications
  FOR EACH ROW EXECUTE FUNCTION log_medication_change();

-- =============================================
-- 13. MEDICATION DASHBOARD VIEWS
-- =============================================

-- Active medications per participant with next dose info
CREATE OR REPLACE VIEW participant_active_medications AS
SELECT
  m.id AS medication_id,
  m.participant_id,
  p.first_name || ' ' || p.last_name AS participant_name,
  m.medication_name,
  m.brand_name,
  m.strength,
  m.form,
  m.route,
  m.dose_amount,
  m.frequency,
  m.instructions,
  m.indication,
  m.is_prn,
  m.is_schedule_8,
  m.is_high_risk,
  m.start_date,
  m.next_review_date,
  pr.name AS prescriber_name,
  ph.name AS pharmacy_name,
  mp.support_level,
  (
    SELECT MAX(mal.administered_at)
    FROM medication_administration_log mal
    WHERE mal.medication_id = m.id AND mal.outcome = 'given'
  ) AS last_administered_at
FROM medications m
JOIN participants p ON p.id = m.participant_id
LEFT JOIN prescribers pr ON pr.id = m.prescriber_id
LEFT JOIN pharmacies ph ON ph.id = m.pharmacy_id
LEFT JOIN participant_medication_profiles mp ON mp.participant_id = m.participant_id
WHERE m.status = 'active'
ORDER BY p.last_name, m.medication_name;

-- Medication due today (for shift workers)
CREATE OR REPLACE VIEW medications_due_today AS
SELECT
  m.id AS medication_id,
  m.participant_id,
  p.first_name || ' ' || p.last_name AS participant_name,
  m.medication_name,
  m.strength,
  m.dose_amount,
  m.form,
  m.route,
  m.instructions,
  m.is_schedule_8,
  m.is_high_risk,
  mst.scheduled_time,
  mst.label AS time_label,
  mp.support_level,
  EXISTS (
    SELECT 1 FROM medication_administration_log mal
    WHERE mal.medication_id = m.id
      AND mal.schedule_time_id = mst.id
      AND mal.scheduled_at::DATE = CURRENT_DATE
  ) AS already_administered
FROM medications m
JOIN participants p ON p.id = m.participant_id
JOIN medication_schedule_times mst ON mst.medication_id = m.id AND mst.is_active = true
LEFT JOIN participant_medication_profiles mp ON mp.participant_id = m.participant_id
WHERE m.status = 'active'
  AND m.is_prn = false
  AND (mst.day_of_week IS NULL OR mst.day_of_week = LOWER(TO_CHAR(CURRENT_DATE, 'fmday'))::day_of_week)
ORDER BY mst.scheduled_time, p.last_name;

-- Missed doses (administered_at IS NULL and scheduled time has passed)
CREATE OR REPLACE VIEW missed_medication_doses AS
SELECT
  mal.id AS log_id,
  mal.medication_id,
  mal.participant_id,
  p.first_name || ' ' || p.last_name AS participant_name,
  m.medication_name,
  m.strength,
  m.dose_amount,
  mal.scheduled_at,
  mal.outcome,
  mal.notes,
  prof.full_name AS recorded_by
FROM medication_administration_log mal
JOIN medications m ON m.id = mal.medication_id
JOIN participants p ON p.id = mal.participant_id
JOIN profiles prof ON prof.id = mal.administered_by
WHERE mal.outcome NOT IN ('given', 'self_administered')
ORDER BY mal.scheduled_at DESC;

-- Upcoming medication reviews
CREATE OR REPLACE VIEW upcoming_medication_reviews AS
SELECT
  m.id AS medication_id,
  m.participant_id,
  p.first_name || ' ' || p.last_name AS participant_name,
  m.medication_name,
  m.strength,
  m.next_review_date,
  m.next_review_date - CURRENT_DATE AS days_until_review,
  pr.name AS prescriber_name,
  pr.phone AS prescriber_phone
FROM medications m
JOIN participants p ON p.id = m.participant_id
LEFT JOIN prescribers pr ON pr.id = m.prescriber_id
WHERE m.status = 'active'
  AND m.next_review_date IS NOT NULL
  AND m.next_review_date <= CURRENT_DATE + INTERVAL '30 days'
ORDER BY m.next_review_date;

-- S8 register balance summary
CREATE OR REPLACE VIEW schedule_8_balances AS
SELECT DISTINCT ON (s8.medication_id)
  s8.medication_id,
  s8.participant_id,
  p.first_name || ' ' || p.last_name AS participant_name,
  m.medication_name,
  m.strength,
  s8.quantity_after AS current_balance,
  s8.created_at AS last_entry_at
FROM schedule_8_register s8
JOIN medications m ON m.id = s8.medication_id
JOIN participants p ON p.id = s8.participant_id
WHERE m.status = 'active'
ORDER BY s8.medication_id, s8.created_at DESC;

-- =============================================
-- 14. COMPLIANCE REPORT FUNCTION
-- Medication adherence rate per participant
-- =============================================
CREATE OR REPLACE FUNCTION medication_compliance_report(
  p_participant_id UUID,
  p_from_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_to_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  medication_id UUID,
  medication_name TEXT,
  total_scheduled INTEGER,
  total_given INTEGER,
  total_refused INTEGER,
  total_withheld INTEGER,
  total_missed INTEGER,
  adherence_pct DECIMAL(5,2)
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    mal.medication_id,
    m.medication_name,
    COUNT(*)::INTEGER AS total_scheduled,
    COUNT(*) FILTER (WHERE mal.outcome IN ('given', 'self_administered'))::INTEGER AS total_given,
    COUNT(*) FILTER (WHERE mal.outcome = 'refused')::INTEGER AS total_refused,
    COUNT(*) FILTER (WHERE mal.outcome = 'withheld')::INTEGER AS total_withheld,
    COUNT(*) FILTER (WHERE mal.outcome NOT IN ('given', 'self_administered', 'refused', 'withheld'))::INTEGER AS total_missed,
    ROUND(
      COUNT(*) FILTER (WHERE mal.outcome IN ('given', 'self_administered'))::DECIMAL
      / NULLIF(COUNT(*), 0) * 100, 1
    ) AS adherence_pct
  FROM medication_administration_log mal
  JOIN medications m ON m.id = mal.medication_id
  WHERE mal.participant_id = p_participant_id
    AND mal.scheduled_at::DATE BETWEEN p_from_date AND p_to_date
  GROUP BY mal.medication_id, m.medication_name
  ORDER BY m.medication_name;
END;
$$;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE prescribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_medication_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_schedule_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_administration_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_8_register ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_incidents ENABLE ROW LEVEL SECURITY;

-- Staff can manage all medication tables
DO $$ BEGIN
  CREATE POLICY "Staff manage prescribers" ON prescribers FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff manage pharmacies" ON pharmacies FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff manage medication profiles" ON participant_medication_profiles FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff manage medications" ON medications FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff manage medication schedules" ON medication_schedule_times FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff manage administration log" ON medication_administration_log FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff manage S8 register" ON schedule_8_register FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff manage medication changes" ON medication_changes FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff manage medication reviews" ON medication_reviews FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff manage medication incidents" ON medication_incidents FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Portal users can view their own medication info (read only)
DO $$ BEGIN
  CREATE POLICY "Portal users view own medications" ON medications FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM participants pt
        JOIN profiles pr ON pr.id = auth.uid()
        WHERE pr.role = 'participant_portal'
          AND pt.id = medications.participant_id
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Portal users view own medication profile" ON participant_medication_profiles FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM participants pt
        JOIN profiles pr ON pr.id = auth.uid()
        WHERE pr.role = 'participant_portal'
          AND pt.id = participant_medication_profiles.participant_id
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Portal users view own administration log" ON medication_administration_log FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM participants pt
        JOIN profiles pr ON pr.id = auth.uid()
        WHERE pr.role = 'participant_portal'
          AND pt.id = medication_administration_log.participant_id
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Grant view access
GRANT SELECT ON participant_active_medications TO authenticated;
GRANT SELECT ON medications_due_today TO authenticated;
GRANT SELECT ON missed_medication_doses TO authenticated;
GRANT SELECT ON upcoming_medication_reviews TO authenticated;
GRANT SELECT ON schedule_8_balances TO authenticated;

-- v2 Phase 11: Accessibility & Inclusion
-- Structured accessibility profiles, communication preferences,
-- sensory/mobility/cognitive needs, cultural inclusion, assistive technology,
-- accommodation tracking, and worker accessibility skill matching
-- Fully idempotent: safe to re-run

-- =============================================
-- ENUMS
-- =============================================

DO $$ BEGIN
  CREATE TYPE communication_format AS ENUM (
    'verbal',              -- spoken communication
    'written',             -- written text (standard)
    'easy_read',           -- simplified language with images
    'large_print',         -- enlarged text
    'braille',             -- braille format
    'auslan',              -- Australian Sign Language
    'key_word_sign',       -- Key Word Sign (Makaton-based)
    'picture_exchange',    -- PECS or similar picture-based
    'aac_device',          -- augmentative & alternative communication device
    'social_stories',      -- social story format
    'visual_schedule',     -- visual supports/schedules
    'video',               -- video format
    'audio',               -- audio-only format
    'tactile',             -- tactile communication methods
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE sensory_need_category AS ENUM (
    'vision', 'hearing', 'touch', 'taste_smell',
    'vestibular', 'proprioception', 'interoception',
    'sensory_processing', 'multi_sensory'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE sensory_sensitivity AS ENUM (
    'hyper_sensitive',     -- over-responsive
    'hypo_sensitive',      -- under-responsive
    'sensory_seeking',     -- actively seeks input
    'sensory_avoiding',    -- actively avoids input
    'variable'             -- fluctuates
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE mobility_level AS ENUM (
    'independent',
    'independent_with_aid',   -- uses mobility aid independently
    'minimal_assistance',     -- needs occasional physical help
    'moderate_assistance',    -- needs regular physical help
    'full_assistance',        -- dependent on others for mobility
    'wheelchair_independent', -- self-propels wheelchair
    'wheelchair_assisted'     -- needs someone to push
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE assistive_tech_category AS ENUM (
    'mobility_aid',            -- wheelchair, walker, cane, etc.
    'communication_device',    -- AAC device, speech-generating device
    'hearing_aid',             -- hearing aid, cochlear implant
    'vision_aid',              -- magnifier, screen reader, cane
    'cognitive_aid',           -- reminder app, visual timer
    'sensory_aid',             -- noise-cancelling headphones, weighted blanket
    'environmental_control',   -- smart home, switch access
    'seating_positioning',     -- custom seating, pressure cushion
    'personal_care_aid',       -- shower chair, hoist, modified utensils
    'vehicle_modification',    -- wheelchair-accessible vehicle
    'software',                -- screen reader, text-to-speech
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE accommodation_status AS ENUM (
    'requested', 'in_progress', 'active', 'on_hold',
    'no_longer_needed', 'declined'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE accommodation_category AS ENUM (
    'communication',      -- communication adjustments
    'physical_access',    -- ramps, lifts, space modifications
    'sensory_environment',-- lighting, noise, temperature
    'cognitive_support',  -- simplified instructions, extra time
    'cultural_religious', -- cultural or religious accommodations
    'dietary',            -- food-related accommodations
    'scheduling',         -- time-of-day, duration, frequency adjustments
    'staffing',           -- gender preference, specific skills needed
    'transport',          -- accessible transport arrangements
    'technology',         -- assistive tech provisions
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE accessibility_review_status AS ENUM (
    'draft', 'in_progress', 'completed', 'requires_follow_up'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- 1. PARTICIPANT ACCESSIBILITY PROFILES
-- Central accessibility context per participant
-- =============================================
CREATE TABLE IF NOT EXISTS participant_accessibility_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,

  -- Communication
  primary_language TEXT NOT NULL DEFAULT 'English',
  interpreter_required BOOLEAN NOT NULL DEFAULT false,
  interpreter_language TEXT,            -- if interpreter needed
  preferred_communication_formats communication_format[] DEFAULT '{verbal}',
  communication_tips TEXT,              -- free text tips for workers
  literacy_level TEXT CHECK (literacy_level IN (
    'fluent', 'functional', 'basic', 'pre_literate', 'unknown'
  )),
  uses_aac BOOLEAN NOT NULL DEFAULT false,
  aac_system_details TEXT,             -- describe their AAC setup

  -- Sensory overview
  has_vision_impairment BOOLEAN NOT NULL DEFAULT false,
  vision_details TEXT,
  has_hearing_impairment BOOLEAN NOT NULL DEFAULT false,
  hearing_details TEXT,
  sensory_processing_notes TEXT,

  -- Mobility overview
  mobility_level mobility_level NOT NULL DEFAULT 'independent',
  mobility_notes TEXT,

  -- Cognitive
  decision_making_support TEXT CHECK (decision_making_support IN (
    'independent', 'supported', 'substitute', 'unknown'
  )) DEFAULT 'independent',
  cognitive_support_notes TEXT,
  best_time_of_day TEXT,              -- when participant is most engaged
  attention_span_notes TEXT,
  routine_importance TEXT CHECK (routine_importance IN (
    'flexible', 'prefers_routine', 'requires_strict_routine'
  )) DEFAULT 'flexible',

  -- Cultural & Identity
  cultural_background TEXT,
  religion TEXT,
  cultural_practices TEXT,             -- important practices to respect
  gender_identity TEXT,
  pronouns TEXT,
  staff_gender_preference TEXT CHECK (staff_gender_preference IN (
    'no_preference', 'male', 'female', 'non_binary', 'same_gender'
  )) DEFAULT 'no_preference',

  -- Dietary
  dietary_requirements TEXT[] DEFAULT '{}',
  dietary_notes TEXT,

  -- Environment
  environmental_sensitivities TEXT[] DEFAULT '{}', -- e.g. 'fluorescent_lights', 'strong_smells'
  preferred_environment_notes TEXT,

  -- Behavioural considerations
  known_triggers TEXT[] DEFAULT '{}',
  calming_strategies TEXT[] DEFAULT '{}',
  positive_behaviour_support_plan BOOLEAN NOT NULL DEFAULT false,
  pbs_plan_document_id UUID,          -- links to documents table

  -- Assessment tracking
  last_accessibility_review DATE,
  next_accessibility_review DATE,

  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(participant_id)
);

CREATE INDEX IF NOT EXISTS idx_access_profile_participant ON participant_accessibility_profiles(participant_id);
CREATE INDEX IF NOT EXISTS idx_access_profile_language ON participant_accessibility_profiles(primary_language)
  WHERE primary_language != 'English';
CREATE INDEX IF NOT EXISTS idx_access_profile_interpreter ON participant_accessibility_profiles(interpreter_required)
  WHERE interpreter_required = true;
CREATE INDEX IF NOT EXISTS idx_access_profile_review ON participant_accessibility_profiles(next_accessibility_review)
  WHERE next_accessibility_review IS NOT NULL;

-- =============================================
-- 2. SENSORY NEEDS (detailed per-sense records)
-- =============================================
CREATE TABLE IF NOT EXISTS participant_sensory_needs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  category sensory_need_category NOT NULL,
  sensitivity sensory_sensitivity,
  description TEXT NOT NULL,          -- what the need is
  triggers TEXT[] DEFAULT '{}',       -- what triggers discomfort
  supports TEXT[] DEFAULT '{}',       -- what helps
  environment_adjustments TEXT,       -- environmental changes needed
  is_current BOOLEAN NOT NULL DEFAULT true,
  assessed_date DATE,
  assessed_by TEXT,                   -- clinician/OT name
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sensory_needs_participant ON participant_sensory_needs(participant_id);
CREATE INDEX IF NOT EXISTS idx_sensory_needs_category ON participant_sensory_needs(category);
CREATE INDEX IF NOT EXISTS idx_sensory_needs_current ON participant_sensory_needs(is_current) WHERE is_current = true;

-- =============================================
-- 3. ASSISTIVE TECHNOLOGIES
-- Tracking devices, aids, and tech used
-- =============================================
CREATE TABLE IF NOT EXISTS participant_assistive_technologies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  category assistive_tech_category NOT NULL,
  device_name TEXT NOT NULL,           -- e.g. "Permobil M3 Corpus"
  brand_model TEXT,
  serial_number TEXT,
  description TEXT,                    -- what it does, how to use it
  funded_by TEXT CHECK (funded_by IN (
    'ndis', 'self_funded', 'state_government', 'charity', 'loan', 'trial', 'other'
  )),
  supplier TEXT,
  supplier_phone TEXT,
  maintenance_schedule TEXT,           -- e.g. "Annual service in March"
  last_serviced DATE,
  next_service_due DATE,
  is_current BOOLEAN NOT NULL DEFAULT true,
  worker_training_required BOOLEAN NOT NULL DEFAULT false,
  training_details TEXT,               -- what workers need to know
  troubleshooting_notes TEXT,          -- common issues and fixes
  storage_location TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assistive_tech_participant ON participant_assistive_technologies(participant_id);
CREATE INDEX IF NOT EXISTS idx_assistive_tech_category ON participant_assistive_technologies(category);
CREATE INDEX IF NOT EXISTS idx_assistive_tech_current ON participant_assistive_technologies(is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_assistive_tech_service ON participant_assistive_technologies(next_service_due)
  WHERE is_current = true AND next_service_due IS NOT NULL;

-- =============================================
-- 4. ACCOMMODATION ADJUSTMENTS
-- Specific accommodations in place or requested
-- =============================================
CREATE TABLE IF NOT EXISTS accommodation_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  category accommodation_category NOT NULL,
  title TEXT NOT NULL,                  -- short description
  description TEXT NOT NULL,            -- detailed explanation
  reason TEXT,                          -- why this accommodation is needed
  status accommodation_status NOT NULL DEFAULT 'requested',
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  requested_by UUID REFERENCES profiles(id),
  requested_date DATE NOT NULL DEFAULT CURRENT_DATE,
  approved_by UUID REFERENCES profiles(id),
  approved_date DATE,
  effective_from DATE,
  effective_until DATE,                 -- NULL = ongoing
  review_date DATE,
  implementation_notes TEXT,            -- how to implement
  cost_estimate DECIMAL(10,2),
  funding_source TEXT,
  document_id UUID,                     -- linked supporting document
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_accommodations_participant ON accommodation_adjustments(participant_id);
CREATE INDEX IF NOT EXISTS idx_accommodations_category ON accommodation_adjustments(category);
CREATE INDEX IF NOT EXISTS idx_accommodations_status ON accommodation_adjustments(status);
CREATE INDEX IF NOT EXISTS idx_accommodations_review ON accommodation_adjustments(review_date)
  WHERE status = 'active' AND review_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_accommodations_priority ON accommodation_adjustments(priority)
  WHERE status IN ('requested', 'in_progress');

-- =============================================
-- 5. CULTURAL & INCLUSION PLANS
-- Detailed cultural and identity support plans
-- =============================================
CREATE TABLE IF NOT EXISTS cultural_inclusion_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  cultural_background TEXT,
  country_of_origin TEXT,
  languages_spoken TEXT[] DEFAULT '{}',
  is_first_nations BOOLEAN NOT NULL DEFAULT false,
  first_nations_details TEXT,           -- community, mob, connection to country
  is_cald BOOLEAN NOT NULL DEFAULT false, -- culturally and linguistically diverse
  religion TEXT,
  religious_practices TEXT,             -- practices to be aware of/respect
  religious_dietary_requirements TEXT,
  cultural_celebrations TEXT[] DEFAULT '{}', -- important dates/events
  cultural_protocols TEXT,              -- specific protocols to follow
  gender_identity TEXT,
  pronouns TEXT,
  sexuality TEXT,
  lgbtqia_support_notes TEXT,
  family_structure_notes TEXT,          -- important family/kinship context
  community_connections TEXT,           -- community groups, clubs, etc.
  interpreter_details TEXT,             -- preferred interpreter service
  culturally_safe_practices TEXT,       -- what makes services culturally safe
  things_to_avoid TEXT,                 -- culturally inappropriate actions
  is_current BOOLEAN NOT NULL DEFAULT true,
  last_reviewed DATE,
  next_review DATE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(participant_id)
);

CREATE INDEX IF NOT EXISTS idx_cultural_plans_participant ON cultural_inclusion_plans(participant_id);
CREATE INDEX IF NOT EXISTS idx_cultural_plans_first_nations ON cultural_inclusion_plans(is_first_nations)
  WHERE is_first_nations = true;
CREATE INDEX IF NOT EXISTS idx_cultural_plans_cald ON cultural_inclusion_plans(is_cald)
  WHERE is_cald = true;
CREATE INDEX IF NOT EXISTS idx_cultural_plans_review ON cultural_inclusion_plans(next_review)
  WHERE is_current = true AND next_review IS NOT NULL;

-- =============================================
-- 6. ACCESSIBILITY ASSESSMENTS
-- Periodic reviews of accessibility needs
-- =============================================
CREATE TABLE IF NOT EXISTS accessibility_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN (
    'initial', 'routine', 'triggered', 'transition', 'annual'
  )),
  status accessibility_review_status NOT NULL DEFAULT 'draft',
  assessor_name TEXT NOT NULL,
  assessor_role TEXT,                   -- e.g. OT, speech pathologist, support coordinator

  -- Communication assessment
  communication_summary TEXT,
  communication_changes TEXT,
  communication_recommendations TEXT,

  -- Sensory assessment
  sensory_summary TEXT,
  sensory_changes TEXT,
  sensory_recommendations TEXT,

  -- Mobility assessment
  mobility_summary TEXT,
  mobility_changes TEXT,
  mobility_recommendations TEXT,

  -- Cognitive assessment
  cognitive_summary TEXT,
  cognitive_changes TEXT,
  cognitive_recommendations TEXT,

  -- Environmental assessment
  environment_summary TEXT,
  environment_changes TEXT,
  environment_recommendations TEXT,

  -- Cultural assessment
  cultural_summary TEXT,
  cultural_changes TEXT,
  cultural_recommendations TEXT,

  -- Overall
  overall_summary TEXT NOT NULL,
  key_actions JSONB DEFAULT '[]',       -- action items from assessment
  follow_up_required BOOLEAN NOT NULL DEFAULT false,
  follow_up_date DATE,
  follow_up_notes TEXT,
  next_assessment_date DATE,
  document_id UUID,                     -- uploaded full assessment document

  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_access_assess_participant ON accessibility_assessments(participant_id);
CREATE INDEX IF NOT EXISTS idx_access_assess_date ON accessibility_assessments(assessment_date);
CREATE INDEX IF NOT EXISTS idx_access_assess_status ON accessibility_assessments(status);
CREATE INDEX IF NOT EXISTS idx_access_assess_follow_up ON accessibility_assessments(follow_up_date)
  WHERE follow_up_required = true AND status != 'completed';

-- =============================================
-- 7. WORKER ACCESSIBILITY COMPETENCIES
-- Track worker skills/training for accessibility
-- =============================================
CREATE TABLE IF NOT EXISTS worker_accessibility_competencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  competency TEXT NOT NULL CHECK (competency IN (
    'auslan', 'key_word_sign', 'aac_device_support', 'easy_read_creation',
    'braille', 'manual_handling', 'hoist_operation', 'wheelchair_assistance',
    'peg_feeding', 'epilepsy_management', 'diabetes_management',
    'positive_behaviour_support', 'sensory_support', 'trauma_informed_care',
    'mental_health_first_aid', 'cultural_competency', 'first_nations_awareness',
    'lgbtqia_inclusive_practice', 'dementia_support', 'complex_communication',
    'dysphagia_awareness', 'medication_administration', 'other'
  )),
  competency_detail TEXT,              -- specifics if 'other' or extra context
  proficiency TEXT NOT NULL CHECK (proficiency IN (
    'basic', 'intermediate', 'advanced', 'specialist'
  )) DEFAULT 'basic',
  certification TEXT,                  -- formal qualification/cert name
  certified_date DATE,
  expiry_date DATE,
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(worker_id, competency)
);

CREATE INDEX IF NOT EXISTS idx_worker_competency_worker ON worker_accessibility_competencies(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_competency_type ON worker_accessibility_competencies(competency);
CREATE INDEX IF NOT EXISTS idx_worker_competency_expiry ON worker_accessibility_competencies(expiry_date)
  WHERE expiry_date IS NOT NULL;

-- =============================================
-- 8. PARTICIPANT-WORKER ACCESSIBILITY REQUIREMENTS
-- Links participant needs to required worker competencies
-- =============================================
CREATE TABLE IF NOT EXISTS participant_accessibility_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  required_competency TEXT NOT NULL,    -- matches worker_accessibility_competencies.competency values
  minimum_proficiency TEXT NOT NULL CHECK (minimum_proficiency IN (
    'basic', 'intermediate', 'advanced', 'specialist'
  )) DEFAULT 'basic',
  is_mandatory BOOLEAN NOT NULL DEFAULT true,  -- must-have vs nice-to-have
  reason TEXT,                          -- why this is needed
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(participant_id, required_competency)
);

CREATE INDEX IF NOT EXISTS idx_access_req_participant ON participant_accessibility_requirements(participant_id);
CREATE INDEX IF NOT EXISTS idx_access_req_competency ON participant_accessibility_requirements(required_competency);

-- =============================================
-- UPDATE TRIGGERS
-- =============================================
CREATE OR REPLACE FUNCTION update_accessibility_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS access_profile_updated_at ON participant_accessibility_profiles;
CREATE TRIGGER access_profile_updated_at
  BEFORE UPDATE ON participant_accessibility_profiles
  FOR EACH ROW EXECUTE FUNCTION update_accessibility_updated_at();

DROP TRIGGER IF EXISTS sensory_needs_updated_at ON participant_sensory_needs;
CREATE TRIGGER sensory_needs_updated_at
  BEFORE UPDATE ON participant_sensory_needs
  FOR EACH ROW EXECUTE FUNCTION update_accessibility_updated_at();

DROP TRIGGER IF EXISTS assistive_tech_updated_at ON participant_assistive_technologies;
CREATE TRIGGER assistive_tech_updated_at
  BEFORE UPDATE ON participant_assistive_technologies
  FOR EACH ROW EXECUTE FUNCTION update_accessibility_updated_at();

DROP TRIGGER IF EXISTS accommodations_updated_at ON accommodation_adjustments;
CREATE TRIGGER accommodations_updated_at
  BEFORE UPDATE ON accommodation_adjustments
  FOR EACH ROW EXECUTE FUNCTION update_accessibility_updated_at();

DROP TRIGGER IF EXISTS cultural_plans_updated_at ON cultural_inclusion_plans;
CREATE TRIGGER cultural_plans_updated_at
  BEFORE UPDATE ON cultural_inclusion_plans
  FOR EACH ROW EXECUTE FUNCTION update_accessibility_updated_at();

DROP TRIGGER IF EXISTS access_assessments_updated_at ON accessibility_assessments;
CREATE TRIGGER access_assessments_updated_at
  BEFORE UPDATE ON accessibility_assessments
  FOR EACH ROW EXECUTE FUNCTION update_accessibility_updated_at();

DROP TRIGGER IF EXISTS worker_competency_updated_at ON worker_accessibility_competencies;
CREATE TRIGGER worker_competency_updated_at
  BEFORE UPDATE ON worker_accessibility_competencies
  FOR EACH ROW EXECUTE FUNCTION update_accessibility_updated_at();

DROP TRIGGER IF EXISTS access_requirements_updated_at ON participant_accessibility_requirements;
CREATE TRIGGER access_requirements_updated_at
  BEFORE UPDATE ON participant_accessibility_requirements
  FOR EACH ROW EXECUTE FUNCTION update_accessibility_updated_at();

-- =============================================
-- 9. WORKER-PARTICIPANT ACCESSIBILITY MATCHING
-- Function to find compatible workers for a participant
-- =============================================
CREATE OR REPLACE FUNCTION find_accessible_workers(
  p_participant_id UUID
)
RETURNS TABLE (
  worker_id UUID,
  worker_name TEXT,
  mandatory_met INTEGER,
  mandatory_total INTEGER,
  optional_met INTEGER,
  optional_total INTEGER,
  all_mandatory_met BOOLEAN,
  match_score DECIMAL(5,2)
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  WITH requirements AS (
    SELECT
      par.required_competency,
      par.minimum_proficiency,
      par.is_mandatory
    FROM participant_accessibility_requirements par
    WHERE par.participant_id = p_participant_id
  ),
  proficiency_rank AS (
    SELECT unnest(ARRAY['basic', 'intermediate', 'advanced', 'specialist']) AS level,
           generate_series(1, 4) AS rank
  ),
  worker_matches AS (
    SELECT
      pr.id AS w_id,
      pr.full_name AS w_name,
      r.required_competency,
      r.is_mandatory,
      CASE
        WHEN wac.id IS NOT NULL
          AND (SELECT rank FROM proficiency_rank WHERE level = wac.proficiency)
              >= (SELECT rank FROM proficiency_rank WHERE level = r.minimum_proficiency)
        THEN true
        ELSE false
      END AS meets_requirement
    FROM requirements r
    CROSS JOIN profiles pr
    LEFT JOIN worker_accessibility_competencies wac
      ON wac.worker_id = pr.id
      AND wac.competency = r.required_competency
    WHERE pr.role = 'worker' AND pr.is_active = true
  )
  SELECT
    wm.w_id,
    wm.w_name,
    COUNT(*) FILTER (WHERE wm.is_mandatory AND wm.meets_requirement)::INTEGER AS mandatory_met,
    COUNT(*) FILTER (WHERE wm.is_mandatory)::INTEGER AS mandatory_total,
    COUNT(*) FILTER (WHERE NOT wm.is_mandatory AND wm.meets_requirement)::INTEGER AS optional_met,
    COUNT(*) FILTER (WHERE NOT wm.is_mandatory)::INTEGER AS optional_total,
    COUNT(*) FILTER (WHERE wm.is_mandatory AND NOT wm.meets_requirement) = 0 AS all_mandatory_met,
    ROUND(
      COUNT(*) FILTER (WHERE wm.meets_requirement)::DECIMAL
      / NULLIF(COUNT(*), 0) * 100, 1
    ) AS match_score
  FROM worker_matches wm
  GROUP BY wm.w_id, wm.w_name
  HAVING COUNT(*) FILTER (WHERE wm.is_mandatory AND NOT wm.meets_requirement) = 0
  ORDER BY match_score DESC, wm.w_name;
END;
$$;

-- =============================================
-- 10. DASHBOARD VIEWS
-- =============================================

-- Participant accessibility summary for quick reference
CREATE OR REPLACE VIEW participant_accessibility_summary AS
SELECT
  ap.participant_id,
  p.first_name || ' ' || p.last_name AS participant_name,
  ap.primary_language,
  ap.interpreter_required,
  ap.preferred_communication_formats,
  ap.mobility_level,
  ap.has_vision_impairment,
  ap.has_hearing_impairment,
  ap.decision_making_support,
  ap.routine_importance,
  ap.staff_gender_preference,
  ap.positive_behaviour_support_plan,
  ap.last_accessibility_review,
  ap.next_accessibility_review,
  CASE
    WHEN ap.next_accessibility_review IS NULL THEN 'not_scheduled'
    WHEN ap.next_accessibility_review < CURRENT_DATE THEN 'overdue'
    WHEN ap.next_accessibility_review <= CURRENT_DATE + INTERVAL '30 days' THEN 'due_soon'
    ELSE 'on_track'
  END AS review_status,
  (SELECT COUNT(*) FROM participant_sensory_needs sn
   WHERE sn.participant_id = ap.participant_id AND sn.is_current = true) AS active_sensory_needs,
  (SELECT COUNT(*) FROM participant_assistive_technologies at2
   WHERE at2.participant_id = ap.participant_id AND at2.is_current = true) AS active_assistive_tech,
  (SELECT COUNT(*) FROM accommodation_adjustments aa
   WHERE aa.participant_id = ap.participant_id AND aa.status = 'active') AS active_accommodations
FROM participant_accessibility_profiles ap
JOIN participants p ON p.id = ap.participant_id
ORDER BY p.last_name, p.first_name;

-- Workers with expiring competencies
CREATE OR REPLACE VIEW expiring_worker_competencies AS
SELECT
  wac.worker_id,
  pr.full_name AS worker_name,
  wac.competency,
  wac.competency_detail,
  wac.proficiency,
  wac.certification,
  wac.expiry_date,
  wac.expiry_date - CURRENT_DATE AS days_until_expiry
FROM worker_accessibility_competencies wac
JOIN profiles pr ON pr.id = wac.worker_id
WHERE wac.expiry_date IS NOT NULL
  AND wac.expiry_date <= CURRENT_DATE + INTERVAL '60 days'
  AND pr.is_active = true
ORDER BY wac.expiry_date;

-- Accommodation adjustments needing review
CREATE OR REPLACE VIEW accommodations_needing_review AS
SELECT
  aa.id AS accommodation_id,
  aa.participant_id,
  p.first_name || ' ' || p.last_name AS participant_name,
  aa.category,
  aa.title,
  aa.status,
  aa.priority,
  aa.review_date,
  aa.review_date - CURRENT_DATE AS days_until_review,
  aa.effective_from,
  aa.effective_until
FROM accommodation_adjustments aa
JOIN participants p ON p.id = aa.participant_id
WHERE aa.status = 'active'
  AND aa.review_date IS NOT NULL
  AND aa.review_date <= CURRENT_DATE + INTERVAL '30 days'
ORDER BY aa.review_date;

-- Assistive tech needing service
CREATE OR REPLACE VIEW assistive_tech_service_due AS
SELECT
  at2.id AS tech_id,
  at2.participant_id,
  p.first_name || ' ' || p.last_name AS participant_name,
  at2.category,
  at2.device_name,
  at2.brand_model,
  at2.supplier,
  at2.supplier_phone,
  at2.next_service_due,
  at2.next_service_due - CURRENT_DATE AS days_until_service,
  at2.last_serviced
FROM participant_assistive_technologies at2
JOIN participants p ON p.id = at2.participant_id
WHERE at2.is_current = true
  AND at2.next_service_due IS NOT NULL
  AND at2.next_service_due <= CURRENT_DATE + INTERVAL '30 days'
ORDER BY at2.next_service_due;

-- Participants requiring interpreters
CREATE OR REPLACE VIEW participants_requiring_interpreters AS
SELECT
  ap.participant_id,
  p.first_name || ' ' || p.last_name AS participant_name,
  ap.primary_language,
  ap.interpreter_language,
  cip.interpreter_details,
  ap.preferred_communication_formats,
  ap.literacy_level
FROM participant_accessibility_profiles ap
JOIN participants p ON p.id = ap.participant_id
LEFT JOIN cultural_inclusion_plans cip ON cip.participant_id = ap.participant_id
WHERE ap.interpreter_required = true
ORDER BY p.last_name;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE participant_accessibility_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_sensory_needs ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_assistive_technologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE accommodation_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultural_inclusion_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE accessibility_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_accessibility_competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_accessibility_requirements ENABLE ROW LEVEL SECURITY;

-- Staff can manage all accessibility tables
DO $$ BEGIN
  CREATE POLICY "Staff manage accessibility profiles" ON participant_accessibility_profiles FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff manage sensory needs" ON participant_sensory_needs FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff manage assistive technologies" ON participant_assistive_technologies FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff manage accommodations" ON accommodation_adjustments FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff manage cultural plans" ON cultural_inclusion_plans FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff manage accessibility assessments" ON accessibility_assessments FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff manage worker competencies" ON worker_accessibility_competencies FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff manage accessibility requirements" ON participant_accessibility_requirements FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Portal users can view their own accessibility info (read only)
DO $$ BEGIN
  CREATE POLICY "Portal users view own accessibility profile" ON participant_accessibility_profiles FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM participants pt
        JOIN profiles pr ON pr.id = auth.uid()
        WHERE pr.role = 'participant_portal'
          AND pt.id = participant_accessibility_profiles.participant_id
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Portal users view own sensory needs" ON participant_sensory_needs FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM participants pt
        JOIN profiles pr ON pr.id = auth.uid()
        WHERE pr.role = 'participant_portal'
          AND pt.id = participant_sensory_needs.participant_id
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Portal users view own assistive tech" ON participant_assistive_technologies FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM participants pt
        JOIN profiles pr ON pr.id = auth.uid()
        WHERE pr.role = 'participant_portal'
          AND pt.id = participant_assistive_technologies.participant_id
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Portal users view own accommodations" ON accommodation_adjustments FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM participants pt
        JOIN profiles pr ON pr.id = auth.uid()
        WHERE pr.role = 'participant_portal'
          AND pt.id = accommodation_adjustments.participant_id
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Portal users view own cultural plan" ON cultural_inclusion_plans FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM participants pt
        JOIN profiles pr ON pr.id = auth.uid()
        WHERE pr.role = 'participant_portal'
          AND pt.id = cultural_inclusion_plans.participant_id
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Portal users view own accessibility assessments" ON accessibility_assessments FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM participants pt
        JOIN profiles pr ON pr.id = auth.uid()
        WHERE pr.role = 'participant_portal'
          AND pt.id = accessibility_assessments.participant_id
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Grant view access
GRANT SELECT ON participant_accessibility_summary TO authenticated;
GRANT SELECT ON expiring_worker_competencies TO authenticated;
GRANT SELECT ON accommodations_needing_review TO authenticated;
GRANT SELECT ON assistive_tech_service_due TO authenticated;
GRANT SELECT ON participants_requiring_interpreters TO authenticated;

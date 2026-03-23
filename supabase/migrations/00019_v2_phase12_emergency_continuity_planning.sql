-- v2 Phase 12: Emergency & Continuity Planning
-- Personal emergency plans, business continuity, escalation protocols,
-- emergency drills, service continuity arrangements, and NDIS compliance
-- Fully idempotent: safe to re-run

-- =============================================
-- ENUMS
-- =============================================

DO $$ BEGIN
  CREATE TYPE emergency_plan_status AS ENUM (
    'draft', 'active', 'under_review', 'expired', 'archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE emergency_plan_type AS ENUM (
    'personal',              -- participant-specific emergency plan
    'household',             -- shared accommodation / SIL house
    'site',                  -- office / day program venue
    'organisational'         -- whole-of-organisation BCP
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE emergency_scenario AS ENUM (
    'fire', 'flood', 'storm', 'earthquake', 'power_outage',
    'medical_emergency', 'missing_person', 'aggressive_behaviour',
    'pandemic', 'evacuation', 'lockdown', 'infrastructure_failure',
    'cyber_incident', 'staff_shortage', 'supply_disruption', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE emergency_contact_type AS ENUM (
    'family', 'guardian', 'nominee', 'support_coordinator',
    'plan_manager', 'gp', 'specialist', 'hospital',
    'emergency_services', 'allied_health', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE drill_status AS ENUM (
    'scheduled', 'in_progress', 'completed', 'cancelled', 'overdue'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE drill_type AS ENUM (
    'fire_evacuation', 'lockdown', 'medical_emergency',
    'missing_person', 'natural_disaster', 'tabletop_exercise',
    'full_simulation', 'communication_test', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE escalation_level AS ENUM (
    'level_1_frontline',     -- support worker handles
    'level_2_coordinator',   -- team leader / coordinator
    'level_3_management',    -- senior management
    'level_4_executive',     -- director / CEO
    'level_5_external'       -- external authorities (police, ambulance, NDIS Commission)
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE continuity_priority AS ENUM (
    'critical',              -- must restore within hours
    'high',                  -- must restore within 24 hours
    'medium',                -- restore within 72 hours
    'low'                    -- restore within 1 week
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE continuity_arrangement_status AS ENUM (
    'active', 'pending', 'suspended', 'expired', 'terminated'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- 1. EMERGENCY PLANS
-- Personal, household, site, and org-level plans
-- =============================================
CREATE TABLE IF NOT EXISTS emergency_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_type emergency_plan_type NOT NULL,
  title TEXT NOT NULL,
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,  -- for personal plans
  site_name TEXT,                     -- for site/household plans
  site_address JSONB,
  status emergency_plan_status NOT NULL DEFAULT 'draft',
  version INTEGER NOT NULL DEFAULT 1,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  review_date DATE,                   -- next review due
  last_reviewed_date DATE,
  last_reviewed_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,

  -- Personal plan specifics
  mobility_considerations TEXT,       -- e.g. "Uses wheelchair, needs ramp access"
  communication_needs TEXT,           -- e.g. "Non-verbal, uses AAC device"
  medical_considerations TEXT,        -- e.g. "Epilepsy – follow seizure plan"
  behavioural_considerations TEXT,    -- e.g. "May become distressed during alarms"
  sensory_considerations TEXT,        -- e.g. "Hearing impaired, needs visual alert"
  evacuation_requirements TEXT,       -- specific evacuation needs
  safe_place TEXT,                    -- designated safe meeting point
  essential_items TEXT[],             -- must-take items (meds, AAC, etc.)

  -- General plan content
  purpose TEXT,
  scope TEXT,
  assumptions TEXT,
  plan_document_id UUID,             -- linked document upload
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emergency_plans_type ON emergency_plans(plan_type);
CREATE INDEX IF NOT EXISTS idx_emergency_plans_participant ON emergency_plans(participant_id);
CREATE INDEX IF NOT EXISTS idx_emergency_plans_status ON emergency_plans(status);
CREATE INDEX IF NOT EXISTS idx_emergency_plans_review ON emergency_plans(review_date)
  WHERE status = 'active';

-- =============================================
-- 2. EMERGENCY PLAN SCENARIOS
-- Specific scenario procedures within a plan
-- =============================================
CREATE TABLE IF NOT EXISTS emergency_plan_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emergency_plan_id UUID NOT NULL REFERENCES emergency_plans(id) ON DELETE CASCADE,
  scenario emergency_scenario NOT NULL,
  scenario_detail TEXT,               -- free text for 'other' or extra context
  immediate_actions TEXT NOT NULL,     -- step-by-step immediate response
  secondary_actions TEXT,             -- follow-up actions after immediate response
  who_to_contact TEXT[],              -- ordered list of contacts
  assembly_point TEXT,
  special_instructions TEXT,          -- scenario-specific participant needs
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plan_scenarios_plan ON emergency_plan_scenarios(emergency_plan_id);

-- =============================================
-- 3. EMERGENCY CONTACTS (enhanced)
-- Centralised emergency contacts per participant
-- =============================================
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  contact_type emergency_contact_type NOT NULL,
  name TEXT NOT NULL,
  relationship TEXT,                  -- e.g. "Mother", "GP", "Support Coordinator"
  phone_primary TEXT NOT NULL,
  phone_secondary TEXT,
  email TEXT,
  address JSONB,
  is_primary BOOLEAN NOT NULL DEFAULT false,  -- primary emergency contact
  is_decision_maker BOOLEAN NOT NULL DEFAULT false,  -- can make decisions
  availability_notes TEXT,            -- e.g. "Available Mon-Fri 9am-5pm"
  special_instructions TEXT,          -- e.g. "Call before texting"
  contact_order INTEGER NOT NULL DEFAULT 0,  -- order to call
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emergency_contacts_participant ON emergency_contacts(participant_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_primary ON emergency_contacts(is_primary)
  WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_type ON emergency_contacts(contact_type);

-- =============================================
-- 4. ESCALATION PROTOCOLS
-- Defines escalation pathways for different scenarios
-- =============================================
CREATE TABLE IF NOT EXISTS escalation_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  scenario emergency_scenario NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,  -- default protocol for this scenario
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_escalation_protocols_scenario ON escalation_protocols(scenario);
CREATE INDEX IF NOT EXISTS idx_escalation_protocols_active ON escalation_protocols(is_active)
  WHERE is_active = true;

-- =============================================
-- 5. ESCALATION PROTOCOL STEPS
-- Ordered steps within an escalation protocol
-- =============================================
CREATE TABLE IF NOT EXISTS escalation_protocol_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id UUID NOT NULL REFERENCES escalation_protocols(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  escalation_level escalation_level NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,          -- what to do at this step
  responsible_role TEXT,              -- e.g. "Support Worker", "Team Leader"
  responsible_person_id UUID REFERENCES profiles(id),  -- specific person if assigned
  time_trigger_minutes INTEGER,       -- auto-escalate after N minutes if unresolved
  notification_method TEXT CHECK (notification_method IN (
    'phone', 'sms', 'email', 'in_app', 'all'
  )),
  external_contacts TEXT[],           -- external numbers/agencies to contact
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_escalation_steps_protocol ON escalation_protocol_steps(protocol_id);

-- =============================================
-- 6. EMERGENCY ACTIVATIONS
-- Records when an emergency plan was actually activated
-- =============================================
CREATE TABLE IF NOT EXISTS emergency_activations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emergency_plan_id UUID REFERENCES emergency_plans(id),
  scenario emergency_scenario NOT NULL,
  scenario_detail TEXT,
  participant_id UUID REFERENCES participants(id),
  site_name TEXT,
  activated_by UUID NOT NULL REFERENCES profiles(id),
  activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id),

  -- What happened
  description TEXT NOT NULL,
  immediate_actions_taken TEXT NOT NULL,
  escalation_level_reached escalation_level,
  services_contacted TEXT[],          -- e.g. ['000', 'Ambulance', 'Police']
  injuries_reported BOOLEAN NOT NULL DEFAULT false,
  property_damage BOOLEAN NOT NULL DEFAULT false,

  -- Linked records
  incident_id UUID,                   -- link to incidents table
  risk_id UUID,                       -- link to risks table

  -- Post-event
  debrief_completed BOOLEAN NOT NULL DEFAULT false,
  debrief_date DATE,
  debrief_notes TEXT,
  lessons_learned TEXT,
  plan_update_required BOOLEAN NOT NULL DEFAULT false,
  corrective_action_id UUID,          -- link to corrective_action_requests

  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activations_plan ON emergency_activations(emergency_plan_id);
CREATE INDEX IF NOT EXISTS idx_activations_participant ON emergency_activations(participant_id);
CREATE INDEX IF NOT EXISTS idx_activations_scenario ON emergency_activations(scenario);
CREATE INDEX IF NOT EXISTS idx_activations_date ON emergency_activations(activated_at);
CREATE INDEX IF NOT EXISTS idx_activations_unresolved ON emergency_activations(resolved_at)
  WHERE resolved_at IS NULL;

-- =============================================
-- 7. EMERGENCY DRILLS
-- Scheduled and completed emergency drills/exercises
-- =============================================
CREATE TABLE IF NOT EXISTS emergency_drills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emergency_plan_id UUID REFERENCES emergency_plans(id),
  drill_type drill_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  site_name TEXT,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  status drill_status NOT NULL DEFAULT 'scheduled',
  completed_at TIMESTAMPTZ,

  -- Drill results
  duration_minutes INTEGER,
  participants_involved INTEGER,      -- count of people involved
  evacuation_time_seconds INTEGER,    -- for evacuation drills
  objectives_met BOOLEAN,
  issues_identified TEXT,
  corrective_actions TEXT,
  overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
  outcome_summary TEXT,

  -- Follow-up
  next_drill_date DATE,
  document_id UUID,                   -- linked report/evidence
  conducted_by UUID REFERENCES profiles(id),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drills_plan ON emergency_drills(emergency_plan_id);
CREATE INDEX IF NOT EXISTS idx_drills_status ON emergency_drills(status);
CREATE INDEX IF NOT EXISTS idx_drills_scheduled ON emergency_drills(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_drills_overdue ON emergency_drills(scheduled_date)
  WHERE status = 'scheduled';

-- =============================================
-- 8. DRILL PARTICIPANTS
-- Who was involved in each drill
-- =============================================
CREATE TABLE IF NOT EXISTS drill_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drill_id UUID NOT NULL REFERENCES emergency_drills(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id),         -- staff member
  participant_id UUID REFERENCES participants(id),  -- NDIS participant
  role_in_drill TEXT,                 -- e.g. "Observer", "Evacuee", "Fire Warden"
  attended BOOLEAN NOT NULL DEFAULT true,
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drill_participants_drill ON drill_participants(drill_id);

-- =============================================
-- 9. BUSINESS CONTINUITY PLANS
-- Organisation-level continuity planning
-- =============================================
CREATE TABLE IF NOT EXISTS business_continuity_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  status emergency_plan_status NOT NULL DEFAULT 'draft',
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  review_date DATE,
  last_reviewed_date DATE,
  last_reviewed_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,

  -- BCP content
  purpose TEXT,
  scope TEXT,
  critical_functions JSONB DEFAULT '[]',   -- list of critical business functions
  recovery_time_objectives JSONB DEFAULT '{}',  -- RTO per function
  recovery_point_objectives JSONB DEFAULT '{}', -- RPO per function
  activation_criteria TEXT,            -- when to activate
  activation_authority TEXT,           -- who can activate
  communication_plan TEXT,             -- how to notify stakeholders
  it_recovery_plan TEXT,
  alternate_work_locations JSONB DEFAULT '[]',
  key_suppliers JSONB DEFAULT '[]',
  insurance_details JSONB DEFAULT '{}',

  plan_document_id UUID,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bcp_status ON business_continuity_plans(status);
CREATE INDEX IF NOT EXISTS idx_bcp_review ON business_continuity_plans(review_date)
  WHERE status = 'active';

-- =============================================
-- 10. SERVICE CONTINUITY ARRANGEMENTS
-- Backup arrangements for participant service delivery
-- =============================================
CREATE TABLE IF NOT EXISTS service_continuity_arrangements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority continuity_priority NOT NULL DEFAULT 'medium',
  status continuity_arrangement_status NOT NULL DEFAULT 'active',

  -- What service
  service_type TEXT NOT NULL,          -- e.g. "Personal Care", "Transport", "Day Program"
  normal_provider TEXT,                -- who usually provides this
  normal_schedule TEXT,                -- usual schedule

  -- Backup arrangements
  backup_provider TEXT,                -- alternative provider
  backup_contact_name TEXT,
  backup_contact_phone TEXT,
  backup_contact_email TEXT,
  backup_arrangement_details TEXT,     -- how the backup works
  activation_trigger TEXT,             -- when to activate backup

  -- Participant-specific
  critical_supports TEXT[],            -- supports that cannot be missed
  maximum_gap_hours INTEGER,           -- max acceptable gap in service
  family_backup_available BOOLEAN NOT NULL DEFAULT false,
  family_backup_details TEXT,

  -- Admin
  agreement_document_id UUID,
  review_date DATE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_continuity_participant ON service_continuity_arrangements(participant_id);
CREATE INDEX IF NOT EXISTS idx_continuity_priority ON service_continuity_arrangements(priority);
CREATE INDEX IF NOT EXISTS idx_continuity_status ON service_continuity_arrangements(status);
CREATE INDEX IF NOT EXISTS idx_continuity_review ON service_continuity_arrangements(review_date)
  WHERE status = 'active';

-- =============================================
-- 11. EMERGENCY EQUIPMENT / RESOURCES
-- Track safety equipment and their maintenance
-- =============================================
CREATE TABLE IF NOT EXISTS emergency_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  equipment_type TEXT NOT NULL CHECK (equipment_type IN (
    'fire_extinguisher', 'first_aid_kit', 'defibrillator', 'smoke_detector',
    'fire_blanket', 'emergency_lighting', 'exit_signage', 'spill_kit',
    'emergency_generator', 'communication_device', 'evacuation_chair', 'other'
  )),
  location TEXT NOT NULL,             -- where it's located
  site_name TEXT,
  serial_number TEXT,
  install_date DATE,
  last_inspection_date DATE,
  next_inspection_date DATE,
  inspection_frequency_months INTEGER NOT NULL DEFAULT 12,
  is_compliant BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emergency_equip_type ON emergency_equipment(equipment_type);
CREATE INDEX IF NOT EXISTS idx_emergency_equip_inspection ON emergency_equipment(next_inspection_date);
CREATE INDEX IF NOT EXISTS idx_emergency_equip_compliant ON emergency_equipment(is_compliant)
  WHERE is_compliant = false;

-- =============================================
-- 12. EQUIPMENT INSPECTIONS LOG
-- =============================================
CREATE TABLE IF NOT EXISTS equipment_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES emergency_equipment(id) ON DELETE CASCADE,
  inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
  inspected_by UUID NOT NULL REFERENCES profiles(id),
  is_pass BOOLEAN NOT NULL,
  issues_found TEXT,
  actions_taken TEXT,
  next_inspection_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_equip_inspections_equipment ON equipment_inspections(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equip_inspections_date ON equipment_inspections(inspection_date);

-- =============================================
-- UPDATE TRIGGERS
-- =============================================
CREATE OR REPLACE FUNCTION update_emergency_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS emergency_plans_updated_at ON emergency_plans;
CREATE TRIGGER emergency_plans_updated_at
  BEFORE UPDATE ON emergency_plans
  FOR EACH ROW EXECUTE FUNCTION update_emergency_updated_at();

DROP TRIGGER IF EXISTS emergency_plan_scenarios_updated_at ON emergency_plan_scenarios;
CREATE TRIGGER emergency_plan_scenarios_updated_at
  BEFORE UPDATE ON emergency_plan_scenarios
  FOR EACH ROW EXECUTE FUNCTION update_emergency_updated_at();

DROP TRIGGER IF EXISTS emergency_contacts_updated_at ON emergency_contacts;
CREATE TRIGGER emergency_contacts_updated_at
  BEFORE UPDATE ON emergency_contacts
  FOR EACH ROW EXECUTE FUNCTION update_emergency_updated_at();

DROP TRIGGER IF EXISTS escalation_protocols_updated_at ON escalation_protocols;
CREATE TRIGGER escalation_protocols_updated_at
  BEFORE UPDATE ON escalation_protocols
  FOR EACH ROW EXECUTE FUNCTION update_emergency_updated_at();

DROP TRIGGER IF EXISTS emergency_activations_updated_at ON emergency_activations;
CREATE TRIGGER emergency_activations_updated_at
  BEFORE UPDATE ON emergency_activations
  FOR EACH ROW EXECUTE FUNCTION update_emergency_updated_at();

DROP TRIGGER IF EXISTS emergency_drills_updated_at ON emergency_drills;
CREATE TRIGGER emergency_drills_updated_at
  BEFORE UPDATE ON emergency_drills
  FOR EACH ROW EXECUTE FUNCTION update_emergency_updated_at();

DROP TRIGGER IF EXISTS bcp_updated_at ON business_continuity_plans;
CREATE TRIGGER bcp_updated_at
  BEFORE UPDATE ON business_continuity_plans
  FOR EACH ROW EXECUTE FUNCTION update_emergency_updated_at();

DROP TRIGGER IF EXISTS continuity_arrangements_updated_at ON service_continuity_arrangements;
CREATE TRIGGER continuity_arrangements_updated_at
  BEFORE UPDATE ON service_continuity_arrangements
  FOR EACH ROW EXECUTE FUNCTION update_emergency_updated_at();

DROP TRIGGER IF EXISTS emergency_equipment_updated_at ON emergency_equipment;
CREATE TRIGGER emergency_equipment_updated_at
  BEFORE UPDATE ON emergency_equipment
  FOR EACH ROW EXECUTE FUNCTION update_emergency_updated_at();

-- =============================================
-- 13. AUTO-UPDATE EQUIPMENT COMPLIANCE
-- After inspection, sync compliance and next date
-- =============================================
CREATE OR REPLACE FUNCTION sync_equipment_after_inspection()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE emergency_equipment
  SET
    last_inspection_date = NEW.inspection_date,
    next_inspection_date = COALESCE(
      NEW.next_inspection_date,
      NEW.inspection_date + (emergency_equipment.inspection_frequency_months || ' months')::INTERVAL
    ),
    is_compliant = NEW.is_pass
  WHERE id = NEW.equipment_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS equipment_inspection_sync ON equipment_inspections;
CREATE TRIGGER equipment_inspection_sync
  AFTER INSERT ON equipment_inspections
  FOR EACH ROW EXECUTE FUNCTION sync_equipment_after_inspection();

-- =============================================
-- 14. AUTO-MARK OVERDUE DRILLS (callable function)
-- =============================================
CREATE OR REPLACE FUNCTION mark_overdue_drills()
RETURNS INTEGER
LANGUAGE plpgsql AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE emergency_drills
  SET status = 'overdue'
  WHERE status = 'scheduled'
    AND scheduled_date < CURRENT_DATE;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- =============================================
-- 15. DASHBOARD VIEWS
-- =============================================

-- Plans due for review
CREATE OR REPLACE VIEW emergency_plans_due_review AS
SELECT
  ep.id,
  ep.plan_type,
  ep.title,
  ep.participant_id,
  CASE
    WHEN ep.participant_id IS NOT NULL
    THEN (SELECT first_name || ' ' || last_name FROM participants WHERE id = ep.participant_id)
    ELSE ep.site_name
  END AS plan_for,
  ep.status,
  ep.review_date,
  ep.review_date - CURRENT_DATE AS days_until_review,
  ep.last_reviewed_date,
  ep.version
FROM emergency_plans ep
WHERE ep.status = 'active'
  AND ep.review_date IS NOT NULL
  AND ep.review_date <= CURRENT_DATE + INTERVAL '30 days'
ORDER BY ep.review_date;

-- Active emergency activations (unresolved)
CREATE OR REPLACE VIEW active_emergency_activations AS
SELECT
  ea.id,
  ea.scenario,
  ea.scenario_detail,
  ea.description,
  ea.participant_id,
  CASE
    WHEN ea.participant_id IS NOT NULL
    THEN (SELECT first_name || ' ' || last_name FROM participants WHERE id = ea.participant_id)
    ELSE ea.site_name
  END AS affected,
  ea.activated_at,
  ea.escalation_level_reached,
  ea.injuries_reported,
  prof.full_name AS activated_by_name
FROM emergency_activations ea
JOIN profiles prof ON prof.id = ea.activated_by
WHERE ea.resolved_at IS NULL
ORDER BY ea.activated_at DESC;

-- Upcoming and overdue drills
CREATE OR REPLACE VIEW drill_schedule AS
SELECT
  ed.id,
  ed.drill_type,
  ed.title,
  ed.site_name,
  ed.scheduled_date,
  ed.scheduled_time,
  ed.status,
  ed.completed_at,
  ed.overall_rating,
  CASE
    WHEN ed.status = 'completed' THEN 'Completed'
    WHEN ed.scheduled_date < CURRENT_DATE AND ed.status = 'scheduled' THEN 'Overdue'
    WHEN ed.scheduled_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'Due Soon'
    ELSE 'Upcoming'
  END AS urgency,
  prof.full_name AS conducted_by_name
FROM emergency_drills ed
LEFT JOIN profiles prof ON prof.id = ed.conducted_by
WHERE ed.status NOT IN ('cancelled')
ORDER BY ed.scheduled_date;

-- Equipment inspection status
CREATE OR REPLACE VIEW equipment_inspection_status AS
SELECT
  ee.id,
  ee.name,
  ee.equipment_type,
  ee.location,
  ee.site_name,
  ee.is_compliant,
  ee.last_inspection_date,
  ee.next_inspection_date,
  CASE
    WHEN ee.next_inspection_date IS NULL THEN 'No inspection scheduled'
    WHEN ee.next_inspection_date < CURRENT_DATE THEN 'Overdue'
    WHEN ee.next_inspection_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'Due Soon'
    ELSE 'OK'
  END AS inspection_urgency,
  ee.next_inspection_date - CURRENT_DATE AS days_until_inspection
FROM emergency_equipment ee
ORDER BY ee.next_inspection_date NULLS FIRST;

-- Participants without emergency plans
CREATE OR REPLACE VIEW participants_without_emergency_plans AS
SELECT
  p.id AS participant_id,
  p.first_name || ' ' || p.last_name AS participant_name,
  p.ndis_number,
  p.status
FROM participants p
WHERE p.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM emergency_plans ep
    WHERE ep.participant_id = p.id
      AND ep.status = 'active'
      AND ep.plan_type = 'personal'
  )
ORDER BY p.last_name, p.first_name;

-- Service continuity gaps (critical supports without backup)
CREATE OR REPLACE VIEW continuity_gaps AS
SELECT
  p.id AS participant_id,
  p.first_name || ' ' || p.last_name AS participant_name,
  sca.title,
  sca.service_type,
  sca.priority,
  sca.maximum_gap_hours,
  sca.backup_provider,
  sca.review_date,
  CASE
    WHEN sca.backup_provider IS NULL OR sca.backup_provider = '' THEN 'No backup provider'
    WHEN sca.review_date < CURRENT_DATE THEN 'Review overdue'
    ELSE 'OK'
  END AS gap_status
FROM service_continuity_arrangements sca
JOIN participants p ON p.id = sca.participant_id
WHERE sca.status = 'active'
  AND sca.priority IN ('critical', 'high')
  AND (
    sca.backup_provider IS NULL
    OR sca.backup_provider = ''
    OR sca.review_date < CURRENT_DATE
  )
ORDER BY sca.priority, p.last_name;

-- =============================================
-- 16. EMERGENCY READINESS SUMMARY FUNCTION
-- Overall readiness score per participant
-- =============================================
CREATE OR REPLACE FUNCTION participant_emergency_readiness(p_participant_id UUID)
RETURNS TABLE (
  has_personal_plan BOOLEAN,
  plan_status TEXT,
  plan_review_overdue BOOLEAN,
  emergency_contacts_count INTEGER,
  has_primary_contact BOOLEAN,
  continuity_arrangements_count INTEGER,
  critical_gaps INTEGER,
  last_drill_date DATE,
  readiness_score INTEGER           -- 0-100
)
LANGUAGE plpgsql AS $$
DECLARE
  v_has_plan BOOLEAN;
  v_plan_status TEXT;
  v_review_overdue BOOLEAN;
  v_contacts INTEGER;
  v_primary BOOLEAN;
  v_arrangements INTEGER;
  v_gaps INTEGER;
  v_last_drill DATE;
  v_score INTEGER := 0;
BEGIN
  -- Check for active personal emergency plan
  SELECT EXISTS (
    SELECT 1 FROM emergency_plans
    WHERE participant_id = p_participant_id AND status = 'active' AND plan_type = 'personal'
  ) INTO v_has_plan;

  SELECT ep.status::TEXT, (ep.review_date < CURRENT_DATE)
  INTO v_plan_status, v_review_overdue
  FROM emergency_plans ep
  WHERE ep.participant_id = p_participant_id AND ep.plan_type = 'personal'
  ORDER BY ep.effective_date DESC LIMIT 1;

  -- Emergency contacts
  SELECT COUNT(*) INTO v_contacts
  FROM emergency_contacts
  WHERE participant_id = p_participant_id AND is_active = true;

  SELECT EXISTS (
    SELECT 1 FROM emergency_contacts
    WHERE participant_id = p_participant_id AND is_primary = true AND is_active = true
  ) INTO v_primary;

  -- Continuity arrangements
  SELECT COUNT(*) INTO v_arrangements
  FROM service_continuity_arrangements
  WHERE participant_id = p_participant_id AND status = 'active';

  SELECT COUNT(*) INTO v_gaps
  FROM service_continuity_arrangements
  WHERE participant_id = p_participant_id
    AND status = 'active'
    AND priority IN ('critical', 'high')
    AND (backup_provider IS NULL OR backup_provider = '');

  -- Last drill involving this participant
  SELECT MAX(ed.scheduled_date) INTO v_last_drill
  FROM emergency_drills ed
  JOIN drill_participants dp ON dp.drill_id = ed.id
  WHERE dp.participant_id = p_participant_id AND ed.status = 'completed';

  -- Calculate score
  IF v_has_plan THEN v_score := v_score + 30; END IF;
  IF v_has_plan AND NOT COALESCE(v_review_overdue, true) THEN v_score := v_score + 10; END IF;
  IF v_contacts >= 2 THEN v_score := v_score + 15;
  ELSIF v_contacts >= 1 THEN v_score := v_score + 8;
  END IF;
  IF v_primary THEN v_score := v_score + 10; END IF;
  IF v_arrangements >= 1 THEN v_score := v_score + 15; END IF;
  IF COALESCE(v_gaps, 0) = 0 THEN v_score := v_score + 10; END IF;
  IF v_last_drill IS NOT NULL AND v_last_drill >= CURRENT_DATE - INTERVAL '6 months' THEN
    v_score := v_score + 10;
  END IF;

  RETURN QUERY SELECT
    COALESCE(v_has_plan, false),
    COALESCE(v_plan_status, 'none'),
    COALESCE(v_review_overdue, false),
    COALESCE(v_contacts, 0),
    COALESCE(v_primary, false),
    COALESCE(v_arrangements, 0),
    COALESCE(v_gaps, 0),
    v_last_drill,
    v_score;
END;
$$;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE emergency_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_plan_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_protocol_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_drills ENABLE ROW LEVEL SECURITY;
ALTER TABLE drill_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_continuity_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_continuity_arrangements ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_inspections ENABLE ROW LEVEL SECURITY;

-- Staff can manage all emergency & continuity tables
DO $$ BEGIN
  CREATE POLICY "Staff manage emergency plans" ON emergency_plans FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff manage plan scenarios" ON emergency_plan_scenarios FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff manage emergency contacts" ON emergency_contacts FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff manage escalation protocols" ON escalation_protocols FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff manage escalation steps" ON escalation_protocol_steps FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff manage emergency activations" ON emergency_activations FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff manage emergency drills" ON emergency_drills FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff manage drill participants" ON drill_participants FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff manage BCP" ON business_continuity_plans FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff manage continuity arrangements" ON service_continuity_arrangements FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff manage emergency equipment" ON emergency_equipment FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff manage equipment inspections" ON equipment_inspections FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Portal users can view their own emergency info (read only)
DO $$ BEGIN
  CREATE POLICY "Portal users view own emergency plans" ON emergency_plans FOR SELECT TO authenticated
    USING (
      participant_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM participants pt
        JOIN profiles pr ON pr.id = auth.uid()
        WHERE pr.role = 'participant_portal'
          AND pt.id = emergency_plans.participant_id
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Portal users view own emergency contacts" ON emergency_contacts FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM participants pt
        JOIN profiles pr ON pr.id = auth.uid()
        WHERE pr.role = 'participant_portal'
          AND pt.id = emergency_contacts.participant_id
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Portal users view own continuity arrangements" ON service_continuity_arrangements FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM participants pt
        JOIN profiles pr ON pr.id = auth.uid()
        WHERE pr.role = 'participant_portal'
          AND pt.id = service_continuity_arrangements.participant_id
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Grant view access
GRANT SELECT ON emergency_plans_due_review TO authenticated;
GRANT SELECT ON active_emergency_activations TO authenticated;
GRANT SELECT ON drill_schedule TO authenticated;
GRANT SELECT ON equipment_inspection_status TO authenticated;
GRANT SELECT ON participants_without_emergency_plans TO authenticated;
GRANT SELECT ON continuity_gaps TO authenticated;

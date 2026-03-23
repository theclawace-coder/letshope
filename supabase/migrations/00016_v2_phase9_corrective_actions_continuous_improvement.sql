-- v2 Phase 9: Corrective Actions & Continuous Improvement
-- Corrective action requests (CARs), root cause analysis, internal audits,
-- improvement register, quality indicators, lessons learned, feedback collection
-- Aligned with NDIS Practice Standards (Governance & Quality Management)
-- Fully idempotent: safe to re-run

-- =============================================
-- ENUMS
-- =============================================

DO $$ BEGIN
  CREATE TYPE car_source AS ENUM (
    'incident', 'complaint', 'audit', 'risk_event',
    'feedback', 'self_identified', 'regulatory', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE car_priority AS ENUM (
    'low', 'medium', 'high', 'critical'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE car_status AS ENUM (
    'open', 'investigating', 'action_planned', 'in_progress',
    'pending_verification', 'verified_effective', 'closed', 'reopened'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE rca_method AS ENUM (
    'five_whys', 'fishbone', 'fault_tree', 'timeline_analysis',
    'barrier_analysis', 'simple_investigation', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE audit_status AS ENUM (
    'scheduled', 'in_progress', 'completed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE audit_finding_severity AS ENUM (
    'observation', 'minor_nc', 'major_nc', 'critical_nc', 'opportunity'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE improvement_status AS ENUM (
    'proposed', 'approved', 'in_progress', 'completed',
    'deferred', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE feedback_source AS ENUM (
    'participant', 'family_carer', 'worker', 'external_stakeholder',
    'plan_manager', 'support_coordinator', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE feedback_sentiment AS ENUM (
    'very_positive', 'positive', 'neutral', 'negative', 'very_negative'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- 1. CORRECTIVE ACTION REQUESTS (CARs)
-- Central table linking incidents/complaints/audits to actions
-- =============================================
CREATE TABLE IF NOT EXISTS corrective_action_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_number TEXT NOT NULL UNIQUE, -- human-readable ID e.g. CAR-2026-001
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  source car_source NOT NULL,
  priority car_priority NOT NULL DEFAULT 'medium',
  status car_status NOT NULL DEFAULT 'open',

  -- Linked source records (polymorphic links)
  linked_incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
  linked_complaint_id UUID REFERENCES complaints(id) ON DELETE SET NULL,
  linked_risk_id UUID REFERENCES risks(id) ON DELETE SET NULL,
  linked_audit_finding_id UUID, -- FK added after audit_findings table created

  -- Assignment
  assigned_to UUID REFERENCES profiles(id),
  responsible_manager UUID REFERENCES profiles(id),

  -- Dates
  identified_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_completion_date DATE,
  actual_completion_date DATE,
  verification_date DATE,
  verified_by UUID REFERENCES profiles(id),

  -- Outcome
  root_cause_summary TEXT,
  containment_actions TEXT,  -- immediate actions to contain the issue
  corrective_actions TEXT,   -- actions to fix the root cause
  preventive_actions TEXT,   -- actions to prevent recurrence
  effectiveness_criteria TEXT, -- how we'll measure success
  effectiveness_verified BOOLEAN NOT NULL DEFAULT false,
  effectiveness_notes TEXT,

  -- NDIS compliance
  practice_standard_ref TEXT, -- e.g. "Standard 6 - Governance"
  regulatory_notification_required BOOLEAN NOT NULL DEFAULT false,
  regulatory_notification_sent BOOLEAN NOT NULL DEFAULT false,

  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_car_status ON corrective_action_requests(status);
CREATE INDEX IF NOT EXISTS idx_car_priority ON corrective_action_requests(priority);
CREATE INDEX IF NOT EXISTS idx_car_source ON corrective_action_requests(source);
CREATE INDEX IF NOT EXISTS idx_car_assigned ON corrective_action_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_car_incident ON corrective_action_requests(linked_incident_id);
CREATE INDEX IF NOT EXISTS idx_car_complaint ON corrective_action_requests(linked_complaint_id);
CREATE INDEX IF NOT EXISTS idx_car_risk ON corrective_action_requests(linked_risk_id);
CREATE INDEX IF NOT EXISTS idx_car_target_date ON corrective_action_requests(target_completion_date);
CREATE INDEX IF NOT EXISTS idx_car_open ON corrective_action_requests(status)
  WHERE status NOT IN ('closed', 'verified_effective');

-- =============================================
-- 2. CAR ACTION ITEMS (individual tasks within a CAR)
-- =============================================
CREATE TABLE IF NOT EXISTS car_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID NOT NULL REFERENCES corrective_action_requests(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('containment', 'corrective', 'preventive')),
  description TEXT NOT NULL,
  assigned_to UUID REFERENCES profiles(id),
  target_date DATE,
  completed_date DATE,
  status mitigation_status NOT NULL DEFAULT 'planned', -- reuse existing enum
  evidence_notes TEXT,
  evidence_documents JSONB DEFAULT '[]', -- [{document_id, name}]
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_car_actions_car ON car_action_items(car_id);
CREATE INDEX IF NOT EXISTS idx_car_actions_assigned ON car_action_items(assigned_to);
CREATE INDEX IF NOT EXISTS idx_car_actions_status ON car_action_items(status);
CREATE INDEX IF NOT EXISTS idx_car_actions_overdue ON car_action_items(target_date)
  WHERE status NOT IN ('completed', 'cancelled');

-- =============================================
-- 3. ROOT CAUSE ANALYSIS
-- =============================================
CREATE TABLE IF NOT EXISTS root_cause_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID NOT NULL REFERENCES corrective_action_requests(id) ON DELETE CASCADE,
  method rca_method NOT NULL DEFAULT 'five_whys',
  conducted_by UUID REFERENCES profiles(id),
  conducted_date DATE NOT NULL DEFAULT CURRENT_DATE,
  participants_involved TEXT[], -- names of people in the RCA session

  -- Five Whys structure
  why_1 TEXT,
  why_2 TEXT,
  why_3 TEXT,
  why_4 TEXT,
  why_5 TEXT,

  -- Fishbone / general categories
  people_factors TEXT,
  process_factors TEXT,
  environment_factors TEXT,
  equipment_factors TEXT,
  policy_factors TEXT,
  communication_factors TEXT,

  -- Outcome
  root_cause TEXT NOT NULL,
  contributing_factors TEXT,
  systemic_issues TEXT, -- broader org-level issues identified
  recommendations TEXT NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rca_car ON root_cause_analyses(car_id);
CREATE INDEX IF NOT EXISTS idx_rca_date ON root_cause_analyses(conducted_date);

-- =============================================
-- 4. INTERNAL AUDITS
-- =============================================
CREATE TABLE IF NOT EXISTS internal_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_number TEXT NOT NULL UNIQUE, -- e.g. AUD-2026-Q1-001
  title TEXT NOT NULL,
  description TEXT,
  audit_type TEXT NOT NULL CHECK (audit_type IN (
    'scheduled', 'follow_up', 'spot_check', 'compliance', 'process', 'system'
  )),
  scope TEXT NOT NULL, -- what's being audited
  practice_standards TEXT[] DEFAULT '{}', -- NDIS standards being checked
  status audit_status NOT NULL DEFAULT 'scheduled',

  -- People
  lead_auditor UUID REFERENCES profiles(id),
  audit_team UUID[] DEFAULT '{}', -- profile IDs of team members

  -- Dates
  scheduled_date DATE NOT NULL,
  start_date DATE,
  completion_date DATE,
  report_date DATE,

  -- Results
  summary TEXT,
  strengths TEXT,
  overall_compliance_rating TEXT CHECK (overall_compliance_rating IN (
    'compliant', 'substantially_compliant', 'partially_compliant', 'non_compliant'
  )),

  -- Follow-up
  follow_up_required BOOLEAN NOT NULL DEFAULT false,
  follow_up_date DATE,
  follow_up_audit_id UUID REFERENCES internal_audits(id),

  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audits_status ON internal_audits(status);
CREATE INDEX IF NOT EXISTS idx_audits_scheduled ON internal_audits(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_audits_lead ON internal_audits(lead_auditor);

-- =============================================
-- 5. AUDIT FINDINGS
-- =============================================
CREATE TABLE IF NOT EXISTS audit_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES internal_audits(id) ON DELETE CASCADE,
  finding_number TEXT NOT NULL, -- e.g. AUD-2026-Q1-001-F01
  severity audit_finding_severity NOT NULL,
  practice_standard TEXT, -- specific standard reference
  clause_reference TEXT,  -- specific clause within the standard
  description TEXT NOT NULL,
  evidence TEXT,
  recommendation TEXT NOT NULL,
  response TEXT,          -- management response
  response_date DATE,
  response_by UUID REFERENCES profiles(id),

  -- Link to CAR for non-conformances
  car_id UUID REFERENCES corrective_action_requests(id) ON DELETE SET NULL,

  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'responded', 'actioned', 'closed', 'accepted_risk')),
  closed_date DATE,
  closed_by UUID REFERENCES profiles(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_findings_audit ON audit_findings(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_findings_severity ON audit_findings(severity);
CREATE INDEX IF NOT EXISTS idx_audit_findings_status ON audit_findings(status);
CREATE INDEX IF NOT EXISTS idx_audit_findings_car ON audit_findings(car_id);

-- Now add the FK from CARs to audit_findings
DO $$ BEGIN
  ALTER TABLE corrective_action_requests
    ADD CONSTRAINT fk_car_audit_finding
    FOREIGN KEY (linked_audit_finding_id) REFERENCES audit_findings(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- 6. IMPROVEMENT REGISTER
-- Tracks continuous improvement initiatives
-- =============================================
CREATE TABLE IF NOT EXISTS improvement_initiatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_number TEXT NOT NULL UNIQUE, -- e.g. IMP-2026-001
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'service_delivery', 'workforce', 'governance', 'safety',
    'compliance', 'participant_outcomes', 'operational_efficiency',
    'communication', 'technology', 'other'
  )),
  status improvement_status NOT NULL DEFAULT 'proposed',
  priority car_priority NOT NULL DEFAULT 'medium', -- reuse enum

  -- Source / trigger
  source TEXT CHECK (source IN (
    'car', 'audit', 'feedback', 'staff_suggestion', 'benchmarking',
    'regulatory_change', 'strategic_plan', 'other'
  )),
  linked_car_id UUID REFERENCES corrective_action_requests(id) ON DELETE SET NULL,
  linked_audit_id UUID REFERENCES internal_audits(id) ON DELETE SET NULL,

  -- Ownership
  proposed_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  approved_date DATE,
  owner UUID REFERENCES profiles(id),

  -- Planning
  expected_benefits TEXT,
  success_measures TEXT,      -- how we'll measure improvement
  resources_required TEXT,
  estimated_effort TEXT,      -- e.g. "2 weeks", "ongoing"
  target_start_date DATE,
  target_end_date DATE,
  actual_start_date DATE,
  actual_end_date DATE,

  -- Outcome
  outcome_summary TEXT,
  lessons_learned TEXT,
  measured_results TEXT,      -- actual results vs success_measures

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_improvements_status ON improvement_initiatives(status);
CREATE INDEX IF NOT EXISTS idx_improvements_category ON improvement_initiatives(category);
CREATE INDEX IF NOT EXISTS idx_improvements_owner ON improvement_initiatives(owner);
CREATE INDEX IF NOT EXISTS idx_improvements_car ON improvement_initiatives(linked_car_id);

-- =============================================
-- 7. QUALITY INDICATORS / KPIs
-- Track measurable quality metrics over time
-- =============================================
CREATE TABLE IF NOT EXISTS quality_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'safety', 'service_quality', 'compliance', 'participant_satisfaction',
    'workforce', 'operational', 'financial', 'outcomes'
  )),
  unit TEXT NOT NULL, -- e.g. '%', 'count', 'days', 'score'
  target_value DECIMAL(10,2),
  threshold_warning DECIMAL(10,2), -- amber threshold
  threshold_critical DECIMAL(10,2), -- red threshold
  higher_is_better BOOLEAN NOT NULL DEFAULT true, -- direction of improvement
  measurement_frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (measurement_frequency IN (
    'daily', 'weekly', 'fortnightly', 'monthly', 'quarterly', 'annually'
  )),
  data_source TEXT, -- where the measurement comes from
  practice_standard TEXT, -- NDIS standard reference
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quality_indicator_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indicator_id UUID NOT NULL REFERENCES quality_indicators(id) ON DELETE CASCADE,
  measurement_date DATE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  previous_value DECIMAL(10,2),
  notes TEXT,
  measured_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(indicator_id, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_qi_measurements_indicator ON quality_indicator_measurements(indicator_id);
CREATE INDEX IF NOT EXISTS idx_qi_measurements_date ON quality_indicator_measurements(measurement_date);
CREATE INDEX IF NOT EXISTS idx_qi_measurements_period ON quality_indicator_measurements(period_start, period_end);

-- =============================================
-- 8. LESSONS LEARNED
-- Knowledge capture from incidents, complaints, CARs, audits
-- =============================================
CREATE TABLE IF NOT EXISTS lessons_learned (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  context TEXT NOT NULL, -- what happened
  lesson TEXT NOT NULL,  -- what we learned
  recommendations TEXT,  -- what to do differently

  -- Source links
  source_type car_source NOT NULL,
  linked_car_id UUID REFERENCES corrective_action_requests(id) ON DELETE SET NULL,
  linked_incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
  linked_complaint_id UUID REFERENCES complaints(id) ON DELETE SET NULL,
  linked_audit_id UUID REFERENCES internal_audits(id) ON DELETE SET NULL,

  -- Classification
  category TEXT NOT NULL CHECK (category IN (
    'service_delivery', 'safety', 'communication', 'process',
    'compliance', 'workforce', 'technology', 'other'
  )),
  applies_to TEXT[] DEFAULT '{}', -- e.g. ['all_staff', 'coordinators', 'support_workers']
  is_published BOOLEAN NOT NULL DEFAULT false, -- visible to staff

  captured_by UUID REFERENCES profiles(id),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_date DATE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lessons_source ON lessons_learned(source_type);
CREATE INDEX IF NOT EXISTS idx_lessons_category ON lessons_learned(category);
CREATE INDEX IF NOT EXISTS idx_lessons_published ON lessons_learned(is_published) WHERE is_published = true;

-- =============================================
-- 9. SERVICE FEEDBACK
-- Participant/stakeholder feedback collection
-- =============================================
CREATE TABLE IF NOT EXISTS service_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_source feedback_source NOT NULL,
  sentiment feedback_sentiment,

  -- Who provided feedback
  participant_id UUID REFERENCES participants(id) ON DELETE SET NULL,
  worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
  respondent_name TEXT, -- for external stakeholders
  respondent_relationship TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,

  -- Feedback content
  feedback_date DATE NOT NULL DEFAULT CURRENT_DATE,
  service_area TEXT CHECK (service_area IN (
    'personal_care', 'community_access', 'transport', 'plan_management',
    'support_coordination', 'domestic', 'overall_experience', 'communication',
    'rostering', 'invoicing', 'other'
  )),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  what_went_well TEXT,
  what_could_improve TEXT,
  suggestions TEXT,
  additional_comments TEXT,

  -- Survey context (if from structured survey)
  survey_responses JSONB DEFAULT '{}',

  -- Follow-up
  requires_action BOOLEAN NOT NULL DEFAULT false,
  action_taken TEXT,
  actioned_by UUID REFERENCES profiles(id),
  actioned_date DATE,
  linked_improvement_id UUID REFERENCES improvement_initiatives(id) ON DELETE SET NULL,

  collected_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_participant ON service_feedback(participant_id);
CREATE INDEX IF NOT EXISTS idx_feedback_source ON service_feedback(feedback_source);
CREATE INDEX IF NOT EXISTS idx_feedback_sentiment ON service_feedback(sentiment);
CREATE INDEX IF NOT EXISTS idx_feedback_date ON service_feedback(feedback_date);
CREATE INDEX IF NOT EXISTS idx_feedback_requires_action ON service_feedback(requires_action)
  WHERE requires_action = true;
CREATE INDEX IF NOT EXISTS idx_feedback_service_area ON service_feedback(service_area);

-- =============================================
-- 10. CAR NUMBER SEQUENCE HELPER
-- Auto-generates CAR-YYYY-NNN format
-- =============================================
CREATE OR REPLACE FUNCTION generate_car_number()
RETURNS TRIGGER AS $$
DECLARE
  v_year TEXT;
  v_seq INTEGER;
BEGIN
  IF NEW.car_number IS NOT NULL AND NEW.car_number != '' THEN
    RETURN NEW;
  END IF;

  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(car_number FROM 'CAR-' || v_year || '-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO v_seq
  FROM corrective_action_requests
  WHERE car_number LIKE 'CAR-' || v_year || '-%';

  NEW.car_number := 'CAR-' || v_year || '-' || LPAD(v_seq::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS car_auto_number ON corrective_action_requests;
CREATE TRIGGER car_auto_number
  BEFORE INSERT ON corrective_action_requests
  FOR EACH ROW
  EXECUTE FUNCTION generate_car_number();

-- Similar for audit numbers
CREATE OR REPLACE FUNCTION generate_audit_number()
RETURNS TRIGGER AS $$
DECLARE
  v_year TEXT;
  v_quarter TEXT;
  v_seq INTEGER;
BEGIN
  IF NEW.audit_number IS NOT NULL AND NEW.audit_number != '' THEN
    RETURN NEW;
  END IF;

  v_year := TO_CHAR(NEW.scheduled_date, 'YYYY');
  v_quarter := 'Q' || TO_CHAR(NEW.scheduled_date, 'Q');

  SELECT COALESCE(MAX(
    CAST(SUBSTRING(audit_number FROM 'AUD-' || v_year || '-' || v_quarter || '-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO v_seq
  FROM internal_audits
  WHERE audit_number LIKE 'AUD-' || v_year || '-' || v_quarter || '-%';

  NEW.audit_number := 'AUD-' || v_year || '-' || v_quarter || '-' || LPAD(v_seq::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_auto_number ON internal_audits;
CREATE TRIGGER audit_auto_number
  BEFORE INSERT ON internal_audits
  FOR EACH ROW
  EXECUTE FUNCTION generate_audit_number();

-- Improvement initiative numbers
CREATE OR REPLACE FUNCTION generate_improvement_number()
RETURNS TRIGGER AS $$
DECLARE
  v_year TEXT;
  v_seq INTEGER;
BEGIN
  IF NEW.initiative_number IS NOT NULL AND NEW.initiative_number != '' THEN
    RETURN NEW;
  END IF;

  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(initiative_number FROM 'IMP-' || v_year || '-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO v_seq
  FROM improvement_initiatives
  WHERE initiative_number LIKE 'IMP-' || v_year || '-%';

  NEW.initiative_number := 'IMP-' || v_year || '-' || LPAD(v_seq::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS improvement_auto_number ON improvement_initiatives;
CREATE TRIGGER improvement_auto_number
  BEFORE INSERT ON improvement_initiatives
  FOR EACH ROW
  EXECUTE FUNCTION generate_improvement_number();

-- =============================================
-- 11. UPDATE TRIGGERS
-- =============================================
CREATE OR REPLACE FUNCTION update_ci_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS car_updated_at ON corrective_action_requests;
CREATE TRIGGER car_updated_at
  BEFORE UPDATE ON corrective_action_requests
  FOR EACH ROW EXECUTE FUNCTION update_ci_updated_at();

DROP TRIGGER IF EXISTS car_actions_updated_at ON car_action_items;
CREATE TRIGGER car_actions_updated_at
  BEFORE UPDATE ON car_action_items
  FOR EACH ROW EXECUTE FUNCTION update_ci_updated_at();

DROP TRIGGER IF EXISTS rca_updated_at ON root_cause_analyses;
CREATE TRIGGER rca_updated_at
  BEFORE UPDATE ON root_cause_analyses
  FOR EACH ROW EXECUTE FUNCTION update_ci_updated_at();

DROP TRIGGER IF EXISTS audits_updated_at ON internal_audits;
CREATE TRIGGER audits_updated_at
  BEFORE UPDATE ON internal_audits
  FOR EACH ROW EXECUTE FUNCTION update_ci_updated_at();

DROP TRIGGER IF EXISTS audit_findings_updated_at ON audit_findings;
CREATE TRIGGER audit_findings_updated_at
  BEFORE UPDATE ON audit_findings
  FOR EACH ROW EXECUTE FUNCTION update_ci_updated_at();

DROP TRIGGER IF EXISTS improvements_updated_at ON improvement_initiatives;
CREATE TRIGGER improvements_updated_at
  BEFORE UPDATE ON improvement_initiatives
  FOR EACH ROW EXECUTE FUNCTION update_ci_updated_at();

DROP TRIGGER IF EXISTS lessons_updated_at ON lessons_learned;
CREATE TRIGGER lessons_updated_at
  BEFORE UPDATE ON lessons_learned
  FOR EACH ROW EXECUTE FUNCTION update_ci_updated_at();

DROP TRIGGER IF EXISTS feedback_updated_at ON service_feedback;
CREATE TRIGGER feedback_updated_at
  BEFORE UPDATE ON service_feedback
  FOR EACH ROW EXECUTE FUNCTION update_ci_updated_at();

DROP TRIGGER IF EXISTS qi_updated_at ON quality_indicators;
CREATE TRIGGER qi_updated_at
  BEFORE UPDATE ON quality_indicators
  FOR EACH ROW EXECUTE FUNCTION update_ci_updated_at();

-- =============================================
-- 12. AUTO-CREATE CAR FROM CRITICAL INCIDENTS
-- When an incident with severity 'critical' is closed,
-- auto-generate a corrective action request if none exists
-- =============================================
CREATE OR REPLACE FUNCTION auto_car_from_critical_incident()
RETURNS TRIGGER AS $$
DECLARE
  v_existing INTEGER;
BEGIN
  -- Only trigger on critical/major incidents being resolved
  IF NEW.severity NOT IN ('critical', 'major') THEN
    RETURN NEW;
  END IF;

  IF NEW.status NOT IN ('resolved', 'closed') THEN
    RETURN NEW;
  END IF;

  -- Check if a CAR already exists for this incident
  SELECT COUNT(*) INTO v_existing
  FROM corrective_action_requests
  WHERE linked_incident_id = NEW.id;

  IF v_existing = 0 THEN
    INSERT INTO corrective_action_requests (
      car_number, title, description, source, priority, status,
      linked_incident_id, identified_date, created_by
    ) VALUES (
      '', -- auto-generated by trigger
      'CAR for Incident: ' || COALESCE(NEW.description, '')::TEXT,
      'Auto-generated corrective action request for ' || NEW.severity || ' incident on ' || NEW.incident_date,
      'incident',
      CASE NEW.severity WHEN 'critical' THEN 'critical'::car_priority ELSE 'high'::car_priority END,
      'open',
      NEW.id,
      NEW.incident_date,
      NEW.logged_by
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS incident_auto_car ON incidents;
CREATE TRIGGER incident_auto_car
  AFTER UPDATE ON incidents
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION auto_car_from_critical_incident();

-- =============================================
-- 13. VIEWS
-- =============================================

-- Open CARs with overdue actions
CREATE OR REPLACE VIEW cars_overdue_actions AS
SELECT
  car.id AS car_id,
  car.car_number,
  car.title,
  car.priority,
  car.status,
  car.target_completion_date,
  pr_assigned.full_name AS assigned_to_name,
  pr_manager.full_name AS manager_name,
  COUNT(ai.id) FILTER (WHERE ai.status NOT IN ('completed', 'cancelled')) AS pending_actions,
  COUNT(ai.id) FILTER (
    WHERE ai.status NOT IN ('completed', 'cancelled')
    AND ai.target_date < CURRENT_DATE
  ) AS overdue_actions,
  MIN(ai.target_date) FILTER (
    WHERE ai.status NOT IN ('completed', 'cancelled')
  ) AS earliest_pending_date,
  car.created_at
FROM corrective_action_requests car
LEFT JOIN car_action_items ai ON ai.car_id = car.id
LEFT JOIN profiles pr_assigned ON pr_assigned.id = car.assigned_to
LEFT JOIN profiles pr_manager ON pr_manager.id = car.responsible_manager
WHERE car.status NOT IN ('closed', 'verified_effective')
GROUP BY car.id, car.car_number, car.title, car.priority, car.status,
         car.target_completion_date, pr_assigned.full_name, pr_manager.full_name, car.created_at
HAVING COUNT(ai.id) FILTER (
  WHERE ai.status NOT IN ('completed', 'cancelled')
  AND ai.target_date < CURRENT_DATE
) > 0
ORDER BY car.priority DESC, earliest_pending_date ASC;

-- CAR summary dashboard
CREATE OR REPLACE VIEW car_summary_dashboard AS
SELECT
  COUNT(*) AS total_cars,
  COUNT(*) FILTER (WHERE status = 'open') AS open_count,
  COUNT(*) FILTER (WHERE status = 'investigating') AS investigating_count,
  COUNT(*) FILTER (WHERE status IN ('action_planned', 'in_progress')) AS in_progress_count,
  COUNT(*) FILTER (WHERE status = 'pending_verification') AS pending_verification_count,
  COUNT(*) FILTER (WHERE status IN ('closed', 'verified_effective')
    AND actual_completion_date >= DATE_TRUNC('month', CURRENT_DATE)) AS closed_this_month,
  COUNT(*) FILTER (WHERE priority = 'critical' AND status NOT IN ('closed', 'verified_effective')) AS critical_open,
  COUNT(*) FILTER (WHERE target_completion_date < CURRENT_DATE
    AND status NOT IN ('closed', 'verified_effective')) AS overdue_count,
  AVG(actual_completion_date - identified_date) FILTER (
    WHERE actual_completion_date IS NOT NULL
  ) AS avg_days_to_close,
  COUNT(*) FILTER (WHERE effectiveness_verified = true
    AND actual_completion_date >= CURRENT_DATE - INTERVAL '90 days') AS verified_effective_last_90d
FROM corrective_action_requests;

-- Audit compliance overview
CREATE OR REPLACE VIEW audit_compliance_overview AS
SELECT
  ia.id AS audit_id,
  ia.audit_number,
  ia.title,
  ia.status,
  ia.scheduled_date,
  ia.completion_date,
  ia.overall_compliance_rating,
  pr.full_name AS lead_auditor_name,
  COUNT(af.id) AS total_findings,
  COUNT(af.id) FILTER (WHERE af.severity IN ('major_nc', 'critical_nc')) AS major_findings,
  COUNT(af.id) FILTER (WHERE af.severity = 'observation') AS observations,
  COUNT(af.id) FILTER (WHERE af.severity = 'opportunity') AS opportunities,
  COUNT(af.id) FILTER (WHERE af.status = 'open') AS open_findings,
  COUNT(af.id) FILTER (WHERE af.car_id IS NOT NULL) AS findings_with_car
FROM internal_audits ia
LEFT JOIN audit_findings af ON af.audit_id = ia.id
LEFT JOIN profiles pr ON pr.id = ia.lead_auditor
GROUP BY ia.id, ia.audit_number, ia.title, ia.status, ia.scheduled_date,
         ia.completion_date, ia.overall_compliance_rating, pr.full_name
ORDER BY ia.scheduled_date DESC;

-- Quality indicators with status
CREATE OR REPLACE VIEW quality_indicators_status AS
SELECT
  qi.id,
  qi.name,
  qi.description,
  qi.category,
  qi.unit,
  qi.target_value,
  qi.threshold_warning,
  qi.threshold_critical,
  qi.higher_is_better,
  qi.measurement_frequency,
  qm.value AS latest_value,
  qm.previous_value,
  qm.measurement_date AS latest_measurement_date,
  qm.period_start,
  qm.period_end,
  CASE
    WHEN qm.value IS NULL THEN 'no_data'
    WHEN qi.higher_is_better AND qm.value >= qi.target_value THEN 'on_target'
    WHEN NOT qi.higher_is_better AND qm.value <= qi.target_value THEN 'on_target'
    WHEN qi.higher_is_better AND qi.threshold_warning IS NOT NULL AND qm.value < qi.threshold_warning THEN 'critical'
    WHEN NOT qi.higher_is_better AND qi.threshold_warning IS NOT NULL AND qm.value > qi.threshold_warning THEN 'critical'
    WHEN qi.higher_is_better AND qi.threshold_critical IS NOT NULL AND qm.value < qi.threshold_critical THEN 'critical'
    WHEN NOT qi.higher_is_better AND qi.threshold_critical IS NOT NULL AND qm.value > qi.threshold_critical THEN 'critical'
    ELSE 'warning'
  END AS status,
  CASE
    WHEN qm.previous_value IS NOT NULL AND qm.previous_value != 0 THEN
      ROUND(((qm.value - qm.previous_value) / ABS(qm.previous_value)) * 100, 1)
    ELSE NULL
  END AS pct_change
FROM quality_indicators qi
LEFT JOIN LATERAL (
  SELECT * FROM quality_indicator_measurements
  WHERE indicator_id = qi.id
  ORDER BY measurement_date DESC
  LIMIT 1
) qm ON true
WHERE qi.is_active = true
ORDER BY qi.category, qi.name;

-- Feedback summary
CREATE OR REPLACE VIEW feedback_summary AS
SELECT
  COUNT(*) AS total_feedback,
  COUNT(*) FILTER (WHERE feedback_date >= DATE_TRUNC('month', CURRENT_DATE)) AS this_month,
  ROUND(AVG(rating)::NUMERIC, 1) AS avg_rating,
  ROUND(AVG(rating) FILTER (WHERE feedback_date >= DATE_TRUNC('month', CURRENT_DATE))::NUMERIC, 1) AS avg_rating_this_month,
  COUNT(*) FILTER (WHERE sentiment IN ('positive', 'very_positive')) AS positive_count,
  COUNT(*) FILTER (WHERE sentiment IN ('negative', 'very_negative')) AS negative_count,
  COUNT(*) FILTER (WHERE sentiment = 'neutral') AS neutral_count,
  COUNT(*) FILTER (WHERE requires_action = true AND actioned_date IS NULL) AS pending_action_count,
  ROUND(
    COUNT(*) FILTER (WHERE rating >= 4)::DECIMAL
    / NULLIF(COUNT(*) FILTER (WHERE rating IS NOT NULL), 0) * 100, 1
  ) AS satisfaction_pct
FROM service_feedback;

-- Continuous improvement pipeline
CREATE OR REPLACE VIEW improvement_pipeline AS
SELECT
  ii.id,
  ii.initiative_number,
  ii.title,
  ii.category,
  ii.status,
  ii.priority,
  ii.source,
  pr_owner.full_name AS owner_name,
  ii.target_start_date,
  ii.target_end_date,
  ii.expected_benefits,
  ii.success_measures,
  CASE
    WHEN ii.status = 'completed' THEN ii.measured_results
    WHEN ii.target_end_date < CURRENT_DATE AND ii.status IN ('proposed', 'approved', 'in_progress') THEN 'OVERDUE'
    ELSE NULL
  END AS alert,
  ii.created_at
FROM improvement_initiatives ii
LEFT JOIN profiles pr_owner ON pr_owner.id = ii.owner
WHERE ii.status NOT IN ('cancelled')
ORDER BY
  CASE ii.priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END,
  ii.target_start_date ASC NULLS LAST;

-- =============================================
-- 14. ROW LEVEL SECURITY
-- =============================================
ALTER TABLE corrective_action_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE root_cause_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE improvement_initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_indicator_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons_learned ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_feedback ENABLE ROW LEVEL SECURITY;

-- Staff can manage all CI tables (non-portal users)
DO $$ BEGIN
  CREATE POLICY "Staff manage CARs" ON corrective_action_requests FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff manage CAR actions" ON car_action_items FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff manage RCAs" ON root_cause_analyses FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff manage audits" ON internal_audits FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff manage audit findings" ON audit_findings FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff manage improvements" ON improvement_initiatives FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff manage quality indicators" ON quality_indicators FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff manage QI measurements" ON quality_indicator_measurements FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff manage lessons learned" ON lessons_learned FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Staff manage feedback" ON service_feedback FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Portal users can submit feedback
DO $$ BEGIN
  CREATE POLICY "Portal users can submit feedback" ON service_feedback FOR INSERT TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'participant_portal'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Portal users can view published lessons learned
DO $$ BEGIN
  CREATE POLICY "Portal users view published lessons" ON lessons_learned FOR SELECT TO authenticated
    USING (is_published = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- 15. GRANT VIEW ACCESS
-- =============================================
GRANT SELECT ON cars_overdue_actions TO authenticated;
GRANT SELECT ON car_summary_dashboard TO authenticated;
GRANT SELECT ON audit_compliance_overview TO authenticated;
GRANT SELECT ON quality_indicators_status TO authenticated;
GRANT SELECT ON feedback_summary TO authenticated;
GRANT SELECT ON improvement_pipeline TO authenticated;

-- =============================================
-- 16. SEED QUALITY INDICATORS (common NDIS KPIs)
-- =============================================
INSERT INTO quality_indicators (name, description, category, unit, target_value, threshold_warning, threshold_critical, higher_is_better, measurement_frequency, practice_standard)
VALUES
  ('Incident Closure Rate', 'Percentage of incidents resolved within 30 days', 'safety', '%', 90.00, 80.00, 70.00, true, 'monthly', 'Standard 4 - Provision of Supports'),
  ('Complaint Acknowledgement Timeliness', 'Percentage of complaints acknowledged within deadline', 'service_quality', '%', 100.00, 95.00, 90.00, true, 'monthly', 'Standard 6 - Governance'),
  ('Complaint Resolution Rate', 'Percentage of complaints resolved within deadline', 'service_quality', '%', 95.00, 85.00, 75.00, true, 'monthly', 'Standard 6 - Governance'),
  ('Participant Satisfaction Score', 'Average satisfaction rating from feedback (out of 5)', 'participant_satisfaction', 'score', 4.00, 3.50, 3.00, true, 'quarterly', 'Standard 1 - Rights'),
  ('Reportable Incident Notification Rate', 'Percentage of reportable incidents notified to NDIS Commission on time', 'compliance', '%', 100.00, 95.00, 90.00, true, 'monthly', 'Standard 4 - Provision of Supports'),
  ('CAR Closure Rate', 'Percentage of corrective actions closed within target date', 'compliance', '%', 85.00, 75.00, 65.00, true, 'monthly', 'Standard 6 - Governance'),
  ('Worker Certification Currency', 'Percentage of workers with all certifications current', 'workforce', '%', 100.00, 95.00, 90.00, true, 'monthly', 'Standard 6 - Governance'),
  ('Shift Fill Rate', 'Percentage of rostered shifts filled (not open)', 'operational', '%', 95.00, 90.00, 85.00, true, 'weekly', 'Standard 4 - Provision of Supports'),
  ('Average Match Score', 'Average worker-participant match quality score', 'service_quality', 'score', 70.00, 55.00, 40.00, true, 'monthly', 'Standard 4 - Provision of Supports'),
  ('Open Risk Count', 'Number of active high/critical risks', 'safety', 'count', 5.00, 10.00, 15.00, false, 'monthly', 'Standard 4 - Provision of Supports')
ON CONFLICT (name) DO NOTHING;

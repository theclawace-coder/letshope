-- v2 Phase 6: Risk Management
-- Comprehensive risk register with assessments, mitigation plans, and review logs
-- Fully idempotent: safe to re-run if a previous attempt partially succeeded

-- =============================================
-- ENUM Types
-- =============================================
DO $$ BEGIN
  CREATE TYPE risk_category AS ENUM (
    'environmental',
    'health',
    'behavioral',
    'financial',
    'social',
    'safeguarding'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE risk_likelihood AS ENUM (
    'rare',
    'unlikely',
    'possible',
    'likely',
    'almost_certain'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE risk_consequence AS ENUM (
    'insignificant',
    'minor',
    'moderate',
    'major',
    'catastrophic'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE risk_level AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE risk_status AS ENUM (
    'active',
    'monitoring',
    'mitigated',
    'escalated',
    'resolved'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE mitigation_status AS ENUM (
    'planned',
    'in_progress',
    'completed',
    'overdue',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- Risks (main risk register)
-- =============================================
CREATE TABLE IF NOT EXISTS risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category risk_category NOT NULL,
  likelihood risk_likelihood NOT NULL DEFAULT 'possible',
  consequence risk_consequence NOT NULL DEFAULT 'moderate',
  risk_level risk_level NOT NULL DEFAULT 'medium',
  status risk_status NOT NULL DEFAULT 'active',
  identified_date DATE NOT NULL DEFAULT CURRENT_DATE,
  next_review_date DATE,
  identified_by UUID REFERENCES profiles(id),
  source TEXT, -- e.g. 'onboarding_assessment', 'progress_note', 'incident', 'manual'
  linked_incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
  linked_concern_id UUID REFERENCES concerns(id) ON DELETE SET NULL,
  environment_notes TEXT,
  triggers TEXT,
  existing_controls TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_risks_participant ON risks(participant_id);
CREATE INDEX IF NOT EXISTS idx_risks_status ON risks(status);
CREATE INDEX IF NOT EXISTS idx_risks_category ON risks(category);
CREATE INDEX IF NOT EXISTS idx_risks_level ON risks(risk_level);
CREATE INDEX IF NOT EXISTS idx_risks_review_date ON risks(next_review_date);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_risks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS risks_updated_at ON risks;
CREATE TRIGGER risks_updated_at
  BEFORE UPDATE ON risks
  FOR EACH ROW
  EXECUTE FUNCTION update_risks_updated_at();

-- =============================================
-- Risk Assessments (longitudinal assessment records)
-- =============================================
CREATE TABLE IF NOT EXISTS risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_id UUID NOT NULL REFERENCES risks(id) ON DELETE CASCADE,
  assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  assessed_by UUID REFERENCES profiles(id),
  likelihood risk_likelihood NOT NULL,
  consequence risk_consequence NOT NULL,
  calculated_level risk_level NOT NULL,
  environmental_score INTEGER CHECK (environmental_score BETWEEN 0 AND 10),
  health_score INTEGER CHECK (health_score BETWEEN 0 AND 10),
  behavioral_score INTEGER CHECK (behavioral_score BETWEEN 0 AND 10),
  overall_score INTEGER CHECK (overall_score BETWEEN 0 AND 30),
  findings TEXT NOT NULL,
  recommendations TEXT,
  assessment_data JSONB DEFAULT '{}', -- structured question responses
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_risk_assessments_risk ON risk_assessments(risk_id);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_date ON risk_assessments(assessment_date);

-- =============================================
-- Risk Mitigation Plans (action items to reduce risk)
-- =============================================
CREATE TABLE IF NOT EXISTS risk_mitigation_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_id UUID NOT NULL REFERENCES risks(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  responsible_person UUID REFERENCES profiles(id),
  target_date DATE,
  status mitigation_status NOT NULL DEFAULT 'planned',
  completion_date DATE,
  completion_notes TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_risk_mitigation_risk ON risk_mitigation_plans(risk_id);
CREATE INDEX IF NOT EXISTS idx_risk_mitigation_status ON risk_mitigation_plans(status);

DROP TRIGGER IF EXISTS risk_mitigation_updated_at ON risk_mitigation_plans;
CREATE TRIGGER risk_mitigation_updated_at
  BEFORE UPDATE ON risk_mitigation_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_risks_updated_at();

-- =============================================
-- Risk Review Log (audit trail of periodic reviews)
-- =============================================
CREATE TABLE IF NOT EXISTS risk_review_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_id UUID NOT NULL REFERENCES risks(id) ON DELETE CASCADE,
  review_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reviewed_by UUID REFERENCES profiles(id),
  previous_level risk_level,
  new_level risk_level NOT NULL,
  findings TEXT NOT NULL,
  actions_taken TEXT,
  next_review_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_risk_review_risk ON risk_review_log(risk_id);
CREATE INDEX IF NOT EXISTS idx_risk_review_date ON risk_review_log(review_date);

-- =============================================
-- Trigger: Sync risk level after new assessment
-- =============================================
CREATE OR REPLACE FUNCTION sync_risk_level_from_assessment()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE risks
  SET risk_level = NEW.calculated_level,
      likelihood = NEW.likelihood,
      consequence = NEW.consequence,
      updated_at = NOW()
  WHERE id = NEW.risk_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS risk_assessment_sync ON risk_assessments;
CREATE TRIGGER risk_assessment_sync
  AFTER INSERT ON risk_assessments
  FOR EACH ROW
  EXECUTE FUNCTION sync_risk_level_from_assessment();

-- =============================================
-- Trigger: Sync next_review_date from review log
-- =============================================
CREATE OR REPLACE FUNCTION sync_risk_next_review()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.next_review_date IS NOT NULL THEN
    UPDATE risks
    SET next_review_date = NEW.next_review_date,
        risk_level = NEW.new_level,
        updated_at = NOW()
    WHERE id = NEW.risk_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS risk_review_sync ON risk_review_log;
CREATE TRIGGER risk_review_sync
  AFTER INSERT ON risk_review_log
  FOR EACH ROW
  EXECUTE FUNCTION sync_risk_next_review();

-- =============================================
-- View: Active high/critical risks needing review
-- =============================================
CREATE OR REPLACE VIEW risks_needing_review AS
SELECT
  r.id,
  r.title,
  r.category,
  r.risk_level,
  r.status,
  r.next_review_date,
  r.participant_id,
  p.first_name,
  p.last_name,
  r.next_review_date - CURRENT_DATE AS days_until_review,
  (SELECT MAX(ra.assessment_date) FROM risk_assessments ra WHERE ra.risk_id = r.id) AS last_assessment_date
FROM risks r
JOIN participants p ON p.id = r.participant_id
WHERE r.status IN ('active', 'monitoring', 'escalated')
  AND (
    r.next_review_date IS NULL
    OR r.next_review_date <= CURRENT_DATE + INTERVAL '14 days'
  )
ORDER BY
  CASE r.risk_level
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END,
  r.next_review_date ASC NULLS FIRST;

GRANT SELECT ON risks_needing_review TO authenticated;

-- =============================================
-- View: Risk summary per participant
-- =============================================
CREATE OR REPLACE VIEW participant_risk_summary AS
SELECT
  r.participant_id,
  COUNT(*) FILTER (WHERE r.status IN ('active', 'monitoring', 'escalated')) AS active_risks,
  COUNT(*) FILTER (WHERE r.risk_level = 'critical' AND r.status != 'resolved') AS critical_count,
  COUNT(*) FILTER (WHERE r.risk_level = 'high' AND r.status != 'resolved') AS high_count,
  MAX(r.risk_level) FILTER (WHERE r.status != 'resolved') AS highest_risk_level,
  MIN(r.next_review_date) FILTER (WHERE r.status IN ('active', 'monitoring', 'escalated')) AS next_review_due
FROM risks r
GROUP BY r.participant_id;

GRANT SELECT ON participant_risk_summary TO authenticated;

-- =============================================
-- RLS Policies
-- =============================================
ALTER TABLE risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_mitigation_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_review_log ENABLE ROW LEVEL SECURITY;

-- Risks
DO $$ BEGIN
  CREATE POLICY "Authenticated users can read risks"
    ON risks FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can insert risks"
    ON risks FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can update risks"
    ON risks FOR UPDATE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Risk Assessments
DO $$ BEGIN
  CREATE POLICY "Authenticated users can read risk assessments"
    ON risk_assessments FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can insert risk assessments"
    ON risk_assessments FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Risk Mitigation Plans
DO $$ BEGIN
  CREATE POLICY "Authenticated users can read mitigation plans"
    ON risk_mitigation_plans FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can insert mitigation plans"
    ON risk_mitigation_plans FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can update mitigation plans"
    ON risk_mitigation_plans FOR UPDATE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Risk Review Log
DO $$ BEGIN
  CREATE POLICY "Authenticated users can read risk reviews"
    ON risk_review_log FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can insert risk reviews"
    ON risk_review_log FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

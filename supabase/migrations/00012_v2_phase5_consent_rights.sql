-- v2 Phase 5: Consent & Rights Management
-- NDIS-compliant consent tracking, rights acknowledgments, decision-making
-- capacity records, and authorised representative management
-- Fully idempotent: safe to re-run if a previous attempt partially succeeded

-- =============================================
-- Enums
-- =============================================
DO $$ BEGIN
  CREATE TYPE consent_type AS ENUM (
    'service_agreement',
    'data_collection',
    'information_sharing',
    'photography_media',
    'restrictive_practice',
    'medication_administration',
    'transport',
    'community_access',
    'emergency_medical',
    'research_participation',
    'third_party_disclosure',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE consent_status AS ENUM (
    'active',
    'withdrawn',
    'expired',
    'pending_review',
    'declined'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE consent_method AS ENUM (
    'written',
    'verbal',
    'electronic',
    'witnessed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE capacity_level AS ENUM (
    'full',
    'supported',
    'substitute'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE rep_authority_type AS ENUM (
    'guardian',
    'power_of_attorney',
    'nominee',
    'informal_support',
    'plan_nominee',
    'correspondence_nominee'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- Consent Records
-- =============================================
CREATE TABLE IF NOT EXISTS consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  consent_type consent_type NOT NULL,
  consent_status consent_status NOT NULL DEFAULT 'active',
  consent_method consent_method NOT NULL DEFAULT 'written',
  title TEXT NOT NULL,
  description TEXT,
  -- Scope: what specifically is consented to
  scope TEXT NOT NULL, -- detailed description of consent scope
  conditions TEXT, -- any conditions or limitations on consent
  -- Dates
  given_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE, -- NULL = no expiry
  review_date DATE, -- when this consent should be reviewed
  withdrawn_date DATE,
  -- Signatories
  given_by_name TEXT NOT NULL, -- person who provided consent
  given_by_relationship TEXT, -- relationship to participant (self, guardian, etc.)
  witnessed_by UUID REFERENCES profiles(id),
  witnessed_by_name TEXT,
  -- Withdrawal details
  withdrawn_reason TEXT,
  withdrawn_by_name TEXT,
  -- Document link
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  -- Metadata
  notes TEXT,
  recorded_by UUID REFERENCES profiles(id),
  organisation_id UUID REFERENCES organisation(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consent_records_participant ON consent_records(participant_id);
CREATE INDEX IF NOT EXISTS idx_consent_records_type ON consent_records(consent_type);
CREATE INDEX IF NOT EXISTS idx_consent_records_status ON consent_records(consent_status);
CREATE INDEX IF NOT EXISTS idx_consent_records_expiry ON consent_records(expiry_date);
CREATE INDEX IF NOT EXISTS idx_consent_records_review ON consent_records(review_date);
CREATE INDEX IF NOT EXISTS idx_consent_records_recorded_by ON consent_records(recorded_by);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_consent_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS consent_records_updated_at ON consent_records;
CREATE TRIGGER consent_records_updated_at
  BEFORE UPDATE ON consent_records
  FOR EACH ROW
  EXECUTE FUNCTION update_consent_records_updated_at();

-- =============================================
-- Consent Audit Log (tracks all changes)
-- =============================================
CREATE TABLE IF NOT EXISTS consent_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consent_id UUID NOT NULL REFERENCES consent_records(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'created', 'updated', 'withdrawn', 'renewed', 'reviewed'
  old_status consent_status,
  new_status consent_status,
  changed_by UUID REFERENCES profiles(id),
  change_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consent_audit_consent ON consent_audit_log(consent_id);
CREATE INDEX IF NOT EXISTS idx_consent_audit_action ON consent_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_consent_audit_created ON consent_audit_log(created_at);

-- Auto-log consent status changes
CREATE OR REPLACE FUNCTION log_consent_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.consent_status IS DISTINCT FROM NEW.consent_status THEN
    INSERT INTO consent_audit_log (consent_id, action, old_status, new_status, changed_by, change_reason)
    VALUES (
      NEW.id,
      CASE
        WHEN NEW.consent_status = 'withdrawn' THEN 'withdrawn'
        WHEN NEW.consent_status = 'expired' THEN 'expired'
        WHEN NEW.consent_status = 'active' AND OLD.consent_status = 'expired' THEN 'renewed'
        ELSE 'updated'
      END,
      OLD.consent_status,
      NEW.consent_status,
      NEW.recorded_by,
      NEW.withdrawn_reason
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS consent_status_change_log ON consent_records;
CREATE TRIGGER consent_status_change_log
  AFTER UPDATE ON consent_records
  FOR EACH ROW
  EXECUTE FUNCTION log_consent_status_change();

-- Auto-log new consent creation
CREATE OR REPLACE FUNCTION log_consent_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO consent_audit_log (consent_id, action, new_status, changed_by)
  VALUES (NEW.id, 'created', NEW.consent_status, NEW.recorded_by);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS consent_creation_log ON consent_records;
CREATE TRIGGER consent_creation_log
  AFTER INSERT ON consent_records
  FOR EACH ROW
  EXECUTE FUNCTION log_consent_creation();

-- =============================================
-- Rights Acknowledgments
-- =============================================
CREATE TABLE IF NOT EXISTS rights_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  rights_version TEXT NOT NULL DEFAULT '1.0', -- version of the rights document
  acknowledged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  next_review_date DATE, -- when to re-present rights
  -- What was acknowledged
  rights_explained BOOLEAN NOT NULL DEFAULT false, -- rights were explained in accessible format
  rights_understood BOOLEAN NOT NULL DEFAULT false, -- participant confirmed understanding
  easy_read_provided BOOLEAN NOT NULL DEFAULT false, -- easy-read version provided
  interpreter_used BOOLEAN NOT NULL DEFAULT false, -- interpreter or communication support used
  interpreter_details TEXT, -- language / interpreter name
  -- How acknowledged
  acknowledged_method consent_method NOT NULL DEFAULT 'written',
  acknowledged_by_name TEXT NOT NULL,
  acknowledged_by_relationship TEXT, -- 'self', 'guardian', 'nominee'
  witnessed_by UUID REFERENCES profiles(id),
  witnessed_by_name TEXT,
  -- Specific rights covered
  rights_covered JSONB NOT NULL DEFAULT '[]', -- array of right codes/descriptions
  -- Document link
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  notes TEXT,
  recorded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rights_ack_participant ON rights_acknowledgments(participant_id);
CREATE INDEX IF NOT EXISTS idx_rights_ack_date ON rights_acknowledgments(acknowledged_date);
CREATE INDEX IF NOT EXISTS idx_rights_ack_review ON rights_acknowledgments(next_review_date);

DROP TRIGGER IF EXISTS rights_ack_updated_at ON rights_acknowledgments;
CREATE TRIGGER rights_ack_updated_at
  BEFORE UPDATE ON rights_acknowledgments
  FOR EACH ROW
  EXECUTE FUNCTION update_consent_records_updated_at();

-- =============================================
-- Decision-Making Capacity Records
-- =============================================
CREATE TABLE IF NOT EXISTS capacity_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  capacity_level capacity_level NOT NULL DEFAULT 'full',
  assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  next_review_date DATE,
  -- Assessment details
  assessed_by_name TEXT NOT NULL,
  assessed_by_role TEXT, -- e.g. 'psychologist', 'social worker'
  assessment_summary TEXT NOT NULL,
  -- Specific domains assessed
  domains_assessed JSONB NOT NULL DEFAULT '[]', -- e.g. ["financial", "health", "accommodation"]
  supported_decision_areas JSONB DEFAULT '[]', -- areas where support is needed
  substitute_decision_areas JSONB DEFAULT '[]', -- areas requiring substitute decision-maker
  -- Communication needs
  communication_needs TEXT,
  preferred_communication TEXT, -- e.g. 'visual aids', 'plain language', 'Auslan'
  -- Document link
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  notes TEXT,
  recorded_by UUID REFERENCES profiles(id),
  is_current BOOLEAN NOT NULL DEFAULT true, -- only one current assessment per participant
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_capacity_participant ON capacity_assessments(participant_id);
CREATE INDEX IF NOT EXISTS idx_capacity_current ON capacity_assessments(is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_capacity_review ON capacity_assessments(next_review_date);

DROP TRIGGER IF EXISTS capacity_assessments_updated_at ON capacity_assessments;
CREATE TRIGGER capacity_assessments_updated_at
  BEFORE UPDATE ON capacity_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_consent_records_updated_at();

-- When a new current assessment is inserted, mark previous ones as not current
CREATE OR REPLACE FUNCTION deactivate_previous_capacity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_current = true THEN
    UPDATE capacity_assessments
    SET is_current = false, updated_at = NOW()
    WHERE participant_id = NEW.participant_id
      AND id != NEW.id
      AND is_current = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS capacity_deactivate_previous ON capacity_assessments;
CREATE TRIGGER capacity_deactivate_previous
  AFTER INSERT ON capacity_assessments
  FOR EACH ROW
  EXECUTE FUNCTION deactivate_previous_capacity();

-- =============================================
-- Authorised Representatives
-- =============================================
CREATE TABLE IF NOT EXISTS authorised_representatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  -- Representative details
  full_name TEXT NOT NULL,
  relationship TEXT NOT NULL, -- e.g. 'parent', 'spouse', 'sibling', 'friend'
  authority_type rep_authority_type NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  -- Authority scope
  authority_scope TEXT[], -- e.g. ['financial', 'health', 'accommodation', 'service_agreements']
  authority_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  authority_end_date DATE, -- NULL = ongoing
  -- Legal documentation
  legal_order_reference TEXT, -- guardianship order number, POA reference, etc.
  legal_order_date DATE,
  legal_order_expiry DATE,
  issuing_body TEXT, -- e.g. 'VCAT', 'NCAT', 'SAT'
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  deactivated_reason TEXT,
  -- Document link
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  notes TEXT,
  recorded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_reps_participant ON authorised_representatives(participant_id);
CREATE INDEX IF NOT EXISTS idx_auth_reps_active ON authorised_representatives(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_auth_reps_type ON authorised_representatives(authority_type);
CREATE INDEX IF NOT EXISTS idx_auth_reps_expiry ON authorised_representatives(legal_order_expiry);

DROP TRIGGER IF EXISTS auth_reps_updated_at ON authorised_representatives;
CREATE TRIGGER auth_reps_updated_at
  BEFORE UPDATE ON authorised_representatives
  FOR EACH ROW
  EXECUTE FUNCTION update_consent_records_updated_at();

-- =============================================
-- Views
-- =============================================

-- Consents expiring within 30 days or overdue for review
CREATE OR REPLACE VIEW consents_requiring_attention AS
SELECT
  cr.id,
  cr.participant_id,
  cr.consent_type,
  cr.title,
  cr.consent_status,
  cr.expiry_date,
  cr.review_date,
  cr.given_by_name,
  p.first_name || ' ' || p.last_name AS participant_name,
  CASE
    WHEN cr.expiry_date IS NOT NULL AND cr.expiry_date <= CURRENT_DATE THEN 'expired'
    WHEN cr.expiry_date IS NOT NULL AND cr.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
    WHEN cr.review_date IS NOT NULL AND cr.review_date <= CURRENT_DATE THEN 'review_overdue'
    WHEN cr.review_date IS NOT NULL AND cr.review_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'review_due_soon'
  END AS attention_reason,
  COALESCE(cr.expiry_date, cr.review_date) - CURRENT_DATE AS days_remaining
FROM consent_records cr
JOIN participants p ON p.id = cr.participant_id
WHERE cr.consent_status = 'active'
  AND (
    (cr.expiry_date IS NOT NULL AND cr.expiry_date <= CURRENT_DATE + INTERVAL '30 days')
    OR (cr.review_date IS NOT NULL AND cr.review_date <= CURRENT_DATE + INTERVAL '30 days')
  )
ORDER BY COALESCE(cr.expiry_date, cr.review_date) ASC;

GRANT SELECT ON consents_requiring_attention TO authenticated;

-- Consent compliance summary per participant
CREATE OR REPLACE VIEW participant_consent_summary AS
SELECT
  p.id AS participant_id,
  p.first_name || ' ' || p.last_name AS participant_name,
  COUNT(cr.id) FILTER (WHERE cr.consent_status = 'active') AS active_consents,
  COUNT(cr.id) FILTER (WHERE cr.consent_status = 'withdrawn') AS withdrawn_consents,
  COUNT(cr.id) FILTER (WHERE cr.consent_status = 'expired') AS expired_consents,
  COUNT(cr.id) FILTER (WHERE cr.consent_status = 'pending_review') AS pending_review,
  COUNT(cr.id) FILTER (
    WHERE cr.consent_status = 'active'
    AND cr.expiry_date IS NOT NULL
    AND cr.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
  ) AS expiring_soon,
  (SELECT ra.acknowledged_date FROM rights_acknowledgments ra
   WHERE ra.participant_id = p.id ORDER BY ra.acknowledged_date DESC LIMIT 1
  ) AS last_rights_acknowledgment,
  (SELECT ca.capacity_level FROM capacity_assessments ca
   WHERE ca.participant_id = p.id AND ca.is_current = true LIMIT 1
  ) AS current_capacity_level,
  (SELECT COUNT(*) FROM authorised_representatives ar
   WHERE ar.participant_id = p.id AND ar.is_active = true
  ) AS active_representatives
FROM participants p
LEFT JOIN consent_records cr ON cr.participant_id = p.id
GROUP BY p.id, p.first_name, p.last_name;

GRANT SELECT ON participant_consent_summary TO authenticated;

-- Auto-expire consents past their expiry date
CREATE OR REPLACE FUNCTION auto_expire_consents()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.consent_status = 'active'
    AND NEW.expiry_date IS NOT NULL
    AND NEW.expiry_date < CURRENT_DATE THEN
    NEW.consent_status = 'expired';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS consent_auto_expire ON consent_records;
CREATE TRIGGER consent_auto_expire
  BEFORE INSERT OR UPDATE ON consent_records
  FOR EACH ROW
  EXECUTE FUNCTION auto_expire_consents();

-- =============================================
-- RLS Policies
-- =============================================
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE rights_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE capacity_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE authorised_representatives ENABLE ROW LEVEL SECURITY;

-- Consent records
DO $$ BEGIN
  CREATE POLICY "Authenticated users can read consent records"
    ON consent_records FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can insert consent records"
    ON consent_records FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can update consent records"
    ON consent_records FOR UPDATE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Consent audit log (read-only for most, insert via triggers)
DO $$ BEGIN
  CREATE POLICY "Authenticated users can read consent audit log"
    ON consent_audit_log FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can insert consent audit log"
    ON consent_audit_log FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Rights acknowledgments
DO $$ BEGIN
  CREATE POLICY "Authenticated users can read rights acknowledgments"
    ON rights_acknowledgments FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can insert rights acknowledgments"
    ON rights_acknowledgments FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can update rights acknowledgments"
    ON rights_acknowledgments FOR UPDATE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Capacity assessments
DO $$ BEGIN
  CREATE POLICY "Authenticated users can read capacity assessments"
    ON capacity_assessments FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can insert capacity assessments"
    ON capacity_assessments FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can update capacity assessments"
    ON capacity_assessments FOR UPDATE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Authorised representatives
DO $$ BEGIN
  CREATE POLICY "Authenticated users can read authorised representatives"
    ON authorised_representatives FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can insert authorised representatives"
    ON authorised_representatives FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can update authorised representatives"
    ON authorised_representatives FOR UPDATE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- Seed: Default NDIS participant rights
-- =============================================
-- These are stored as reference data in a simple table
CREATE TABLE IF NOT EXISTS ndis_participant_rights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- 'fundamental', 'service_delivery', 'complaints_feedback'
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE ndis_participant_rights ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can read ndis rights"
    ON ndis_participant_rights FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

INSERT INTO ndis_participant_rights (code, title, description, category, sort_order)
SELECT * FROM (VALUES
  ('RIGHT_001', 'Respect and Dignity', 'The right to be treated with respect and dignity at all times.', 'fundamental', 1),
  ('RIGHT_002', 'Privacy and Confidentiality', 'The right to have personal information kept private and confidential.', 'fundamental', 2),
  ('RIGHT_003', 'Choice and Control', 'The right to exercise choice and control in all aspects of service delivery.', 'fundamental', 3),
  ('RIGHT_004', 'Freedom from Abuse', 'The right to be free from abuse, neglect, exploitation, and violence.', 'fundamental', 4),
  ('RIGHT_005', 'Safe and Quality Services', 'The right to receive safe, quality supports and services.', 'fundamental', 5),
  ('RIGHT_006', 'Access Information', 'The right to access information about services, supports, and rights in an accessible format.', 'service_delivery', 6),
  ('RIGHT_007', 'Informed Consent', 'The right to give or withdraw informed consent for services and supports.', 'service_delivery', 7),
  ('RIGHT_008', 'Participate in Decisions', 'The right to participate in decisions about supports and services.', 'service_delivery', 8),
  ('RIGHT_009', 'Cultural Safety', 'The right to receive services that are culturally safe and responsive.', 'service_delivery', 9),
  ('RIGHT_010', 'Communication Support', 'The right to receive communication support to participate fully.', 'service_delivery', 10),
  ('RIGHT_011', 'Complain Without Fear', 'The right to make a complaint without fear of retribution.', 'complaints_feedback', 11),
  ('RIGHT_012', 'Advocate Access', 'The right to access an advocate of their choice.', 'complaints_feedback', 12),
  ('RIGHT_013', 'Independent Feedback', 'The right to provide feedback about services and have it acted upon.', 'complaints_feedback', 13)
) AS v(code, title, description, category, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM ndis_participant_rights LIMIT 1);

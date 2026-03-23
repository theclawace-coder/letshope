-- v2 Phase 4: Enhanced Document Management
-- Adds versioning, folders, status tracking, retention policies, and access audit log
-- Fully idempotent: safe to re-run if a previous attempt partially succeeded

-- =============================================
-- Document Status (extends existing documents table)
-- =============================================
DO $$ BEGIN
  CREATE TYPE document_status AS ENUM (
    'draft',
    'pending_review',
    'approved',
    'archived',
    'expired'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE documents ADD COLUMN IF NOT EXISTS status document_status NOT NULL DEFAULT 'approved';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE documents ADD COLUMN IF NOT EXISTS folder_id UUID;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS latest_version_id UUID; -- self-ref to track version chain
ALTER TABLE documents ADD COLUMN IF NOT EXISTS original_document_id UUID; -- points to the first version
ALTER TABLE documents ADD COLUMN IF NOT EXISTS retention_date DATE; -- when this document should be reviewed/purged
ALTER TABLE documents ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES profiles(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Update trigger for documents.updated_at
CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS documents_updated_at ON documents;
CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_documents_updated_at();

-- =============================================
-- Document Folders (hierarchical organisation)
-- =============================================
CREATE TABLE IF NOT EXISTS document_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES document_folders(id) ON DELETE CASCADE,
  color TEXT DEFAULT '#6366f1', -- folder accent color
  icon TEXT DEFAULT 'folder', -- lucide icon name
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
  is_system BOOLEAN NOT NULL DEFAULT false, -- system folders can't be deleted
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add FK constraint for documents.folder_id now that the table exists
DO $$ BEGIN
  ALTER TABLE documents ADD CONSTRAINT fk_documents_folder
    FOREIGN KEY (folder_id) REFERENCES document_folders(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_document_folders_parent ON document_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_document_folders_participant ON document_folders(participant_id);
CREATE INDEX IF NOT EXISTS idx_document_folders_worker ON document_folders(worker_id);

DROP TRIGGER IF EXISTS document_folders_updated_at ON document_folders;
CREATE TRIGGER document_folders_updated_at
  BEFORE UPDATE ON document_folders
  FOR EACH ROW
  EXECUTE FUNCTION update_documents_updated_at();

-- =============================================
-- Document Versions (track full version history)
-- =============================================
CREATE TABLE IF NOT EXISTS document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  change_summary TEXT, -- what changed in this version
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(document_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_document_versions_document ON document_versions(document_id);

-- =============================================
-- Document Access Log (audit trail)
-- =============================================
DO $$ BEGIN
  CREATE TYPE document_access_action AS ENUM (
    'viewed',
    'downloaded',
    'printed',
    'shared',
    'emailed',
    'version_created',
    'status_changed',
    'moved',
    'archived',
    'restored'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS document_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  action document_access_action NOT NULL,
  performed_by UUID REFERENCES profiles(id),
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}', -- e.g. { "old_status": "draft", "new_status": "approved" }
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_access_log_document ON document_access_log(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_access_log_action ON document_access_log(action);
CREATE INDEX IF NOT EXISTS idx_doc_access_log_performed_by ON document_access_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_doc_access_log_created ON document_access_log(created_at);

-- =============================================
-- Retention Policies (NDIS compliance)
-- =============================================
CREATE TABLE IF NOT EXISTS document_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- matches document category
  retention_years INTEGER NOT NULL DEFAULT 7, -- NDIS default: 7 years
  action_on_expiry TEXT NOT NULL DEFAULT 'flag_for_review' CHECK (action_on_expiry IN ('flag_for_review', 'archive', 'delete')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS retention_policies_updated_at ON document_retention_policies;
CREATE TRIGGER retention_policies_updated_at
  BEFORE UPDATE ON document_retention_policies
  FOR EACH ROW
  EXECUTE FUNCTION update_documents_updated_at();

-- Seed default NDIS retention policies (skip if already seeded)
INSERT INTO document_retention_policies (name, description, category, retention_years, action_on_expiry)
SELECT * FROM (VALUES
  ('Participant Records', 'All participant-related documents per NDIS Practice Standards', 'service_agreement', 7, 'flag_for_review'),
  ('Consent Forms', 'Consent documentation retention', 'consent_form', 7, 'flag_for_review'),
  ('Intake & Referral', 'Intake and referral documentation', 'intake_form', 7, 'flag_for_review'),
  ('Support Plans', 'Support plan documentation', 'support_plan', 7, 'flag_for_review'),
  ('Risk Assessments', 'Risk assessment records', 'risk_assessment', 7, 'flag_for_review'),
  ('Progress Notes', 'Service delivery records', 'progress_note', 7, 'flag_for_review'),
  ('Incident Reports', 'Incident and reportable incident records', 'incident_report', 7, 'flag_for_review'),
  ('Complaints', 'Complaints and feedback records', 'complaint', 7, 'flag_for_review'),
  ('Worker Screening', 'NDIS Worker Screening Check records', 'screening', 7, 'flag_for_review'),
  ('ID Documents', 'Identity verification documents', 'id_document', 7, 'archive'),
  ('Qualifications', 'Staff qualifications and certifications', 'qualification', 7, 'archive')
) AS v(name, description, category, retention_years, action_on_expiry)
WHERE NOT EXISTS (SELECT 1 FROM document_retention_policies LIMIT 1);

-- =============================================
-- Auto-apply retention date on document insert
-- =============================================
CREATE OR REPLACE FUNCTION apply_retention_date()
RETURNS TRIGGER AS $$
DECLARE
  policy_years INTEGER;
BEGIN
  SELECT retention_years INTO policy_years
  FROM document_retention_policies
  WHERE category = NEW.category AND is_active = true
  LIMIT 1;

  IF policy_years IS NOT NULL AND NEW.retention_date IS NULL THEN
    NEW.retention_date = CURRENT_DATE + (policy_years * INTERVAL '1 year');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS documents_apply_retention ON documents;
CREATE TRIGGER documents_apply_retention
  BEFORE INSERT ON documents
  FOR EACH ROW
  EXECUTE FUNCTION apply_retention_date();

-- =============================================
-- Indexes on new columns for documents table
-- =============================================
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_folder ON documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_documents_original_doc ON documents(original_document_id);
CREATE INDEX IF NOT EXISTS idx_documents_retention ON documents(retention_date);
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN(tags);

-- =============================================
-- Seed system folders (skip if already seeded)
-- =============================================
INSERT INTO document_folders (name, description, icon, is_system, sort_order)
SELECT * FROM (VALUES
  ('Service Agreements', 'All service agreements', 'file-signature', true, 1),
  ('Consent Forms', 'Consent and authorisation forms', 'shield-check', true, 2),
  ('Support Plans', 'Individual support plans', 'clipboard-check', true, 3),
  ('Intake & Referrals', 'Intake forms and referral documents', 'clipboard-list', true, 4),
  ('Risk Assessments', 'Risk assessment documents', 'alert-triangle', true, 5),
  ('Progress Notes', 'Progress note exports and attachments', 'file-text', true, 6),
  ('Incidents & Complaints', 'Incident reports and complaint records', 'alert-circle', true, 7),
  ('Worker Documents', 'Staff screening, qualifications, ID', 'users', true, 8),
  ('Governance', 'Audit reports, policies, compliance docs', 'building', true, 9),
  ('General', 'Uncategorised documents', 'folder', true, 10)
) AS v(name, description, icon, is_system, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM document_folders WHERE is_system = true LIMIT 1);

-- =============================================
-- View: Documents approaching retention date
-- =============================================
CREATE OR REPLACE VIEW documents_nearing_retention AS
SELECT
  d.id,
  d.name,
  d.category,
  d.status,
  d.retention_date,
  d.participant_id,
  d.worker_id,
  d.created_at,
  rp.action_on_expiry,
  rp.name AS policy_name,
  d.retention_date - CURRENT_DATE AS days_until_retention
FROM documents d
LEFT JOIN document_retention_policies rp ON rp.category = d.category AND rp.is_active = true
WHERE d.retention_date IS NOT NULL
  AND d.retention_date <= CURRENT_DATE + INTERVAL '90 days'
  AND d.status != 'archived'
ORDER BY d.retention_date ASC;

GRANT SELECT ON documents_nearing_retention TO authenticated;

-- =============================================
-- RLS Policies
-- =============================================
ALTER TABLE document_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_retention_policies ENABLE ROW LEVEL SECURITY;

-- Document folders
DO $$ BEGIN
  CREATE POLICY "Authenticated users can read document folders"
    ON document_folders FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can insert document folders"
    ON document_folders FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can update document folders"
    ON document_folders FOR UPDATE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can delete non-system folders"
    ON document_folders FOR DELETE TO authenticated USING (is_system = false);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Document versions
DO $$ BEGIN
  CREATE POLICY "Authenticated users can read document versions"
    ON document_versions FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can insert document versions"
    ON document_versions FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Document access log
DO $$ BEGIN
  CREATE POLICY "Authenticated users can read document access log"
    ON document_access_log FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can insert document access log"
    ON document_access_log FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Retention policies
DO $$ BEGIN
  CREATE POLICY "Authenticated users can read retention policies"
    ON document_retention_policies FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can manage retention policies"
    ON document_retention_policies FOR ALL TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

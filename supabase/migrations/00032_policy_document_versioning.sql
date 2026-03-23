-- Policy Document Versioning — version history, supersede flow
-- Adds a master/version layer on top of chunked policy_documents

-- =============================================================
-- 1. POLICY DOCUMENT MASTERS (one row per logical document)
-- =============================================================

CREATE TABLE IF NOT EXISTS policy_document_masters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,                -- human-readable document name
  source TEXT NOT NULL UNIQUE,        -- matches policy_documents.source
  category TEXT NOT NULL,
  description TEXT,                   -- brief summary of what this policy covers
  owner_id UUID REFERENCES profiles(id),  -- policy owner / responsible person
  review_cycle_months INTEGER DEFAULT 12, -- how often this policy should be reviewed
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_policy_masters_source ON policy_document_masters(source);
CREATE INDEX IF NOT EXISTS idx_policy_masters_category ON policy_document_masters(category);

-- =============================================================
-- 2. POLICY DOCUMENT VERSIONS (version history per master)
-- =============================================================

CREATE TABLE IF NOT EXISTS policy_document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id UUID NOT NULL REFERENCES policy_document_masters(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'current' CHECK (status IN ('draft', 'current', 'superseded')),
  effective_date DATE,                -- when this version took effect
  review_date DATE,                   -- when this version is due for review
  change_summary TEXT,                -- what changed from previous version
  superseded_by UUID REFERENCES policy_document_versions(id),
  superseded_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE (master_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_policy_versions_master ON policy_document_versions(master_id);
CREATE INDEX IF NOT EXISTS idx_policy_versions_status ON policy_document_versions(status);

-- =============================================================
-- 3. LINK CHUNKS TO VERSIONS
-- =============================================================

ALTER TABLE policy_documents ADD COLUMN IF NOT EXISTS version_id UUID REFERENCES policy_document_versions(id);
CREATE INDEX IF NOT EXISTS idx_policy_docs_version ON policy_documents(version_id);

-- =============================================================
-- 4. BOOTSTRAP: Create masters + v1 for each existing source
-- =============================================================

-- Create a master for every distinct source in policy_documents
INSERT INTO policy_document_masters (title, source, category)
SELECT DISTINCT
  source AS title,
  source,
  MIN(category)  -- pick one category per source
FROM policy_documents
WHERE is_active = true
GROUP BY source
ON CONFLICT (source) DO NOTHING;

-- Create version 1 (current) for each master (skip if already has a version)
INSERT INTO policy_document_versions (master_id, version_number, status, effective_date)
SELECT
  m.id,
  1,
  'current',
  CURRENT_DATE
FROM policy_document_masters m
WHERE NOT EXISTS (
  SELECT 1 FROM policy_document_versions v WHERE v.master_id = m.id AND v.version_number = 1
);

-- Link existing chunks to their version 1
UPDATE policy_documents pd
SET version_id = v.id
FROM policy_document_masters m
JOIN policy_document_versions v ON v.master_id = m.id AND v.version_number = 1
WHERE pd.source = m.source AND pd.is_active = true;

-- =============================================================
-- 5. SUPERSEDE FUNCTION
-- =============================================================
-- Atomically: mark old version as superseded, set new version as current

CREATE OR REPLACE FUNCTION supersede_policy_version(
  p_master_id UUID,
  p_change_summary TEXT DEFAULT NULL,
  p_effective_date DATE DEFAULT CURRENT_DATE,
  p_review_date DATE DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS UUID  -- returns new version ID
LANGUAGE plpgsql
AS $$
DECLARE
  v_old_version_id UUID;
  v_old_version_number INTEGER;
  v_new_version_id UUID;
BEGIN
  -- Find current version
  SELECT id, version_number INTO v_old_version_id, v_old_version_number
  FROM policy_document_versions
  WHERE master_id = p_master_id AND status = 'current'
  ORDER BY version_number DESC
  LIMIT 1;

  IF v_old_version_id IS NULL THEN
    RAISE EXCEPTION 'No current version found for master %', p_master_id;
  END IF;

  -- Create new version
  INSERT INTO policy_document_versions (
    master_id, version_number, status, effective_date,
    review_date, change_summary, created_by
  ) VALUES (
    p_master_id, v_old_version_number + 1, 'current', p_effective_date,
    p_review_date, p_change_summary, p_created_by
  )
  RETURNING id INTO v_new_version_id;

  -- Supersede old version
  UPDATE policy_document_versions
  SET status = 'superseded',
      superseded_by = v_new_version_id,
      superseded_at = now()
  WHERE id = v_old_version_id;

  -- Deactivate old version's chunks from AI search
  UPDATE policy_documents
  SET is_active = false, updated_at = now()
  WHERE version_id = v_old_version_id;

  -- Update master timestamp
  UPDATE policy_document_masters
  SET updated_at = now()
  WHERE id = p_master_id;

  RETURN v_new_version_id;
END;
$$;

-- =============================================================
-- 6. PUBLISH DRAFT FUNCTION
-- =============================================================
-- Promotes a draft version to current, superseding the existing current

CREATE OR REPLACE FUNCTION publish_policy_draft(
  p_version_id UUID,
  p_approved_by UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_master_id UUID;
  v_old_current_id UUID;
BEGIN
  -- Get master and verify draft
  SELECT master_id INTO v_master_id
  FROM policy_document_versions
  WHERE id = p_version_id AND status = 'draft';

  IF v_master_id IS NULL THEN
    RAISE EXCEPTION 'Version % is not a draft', p_version_id;
  END IF;

  -- Find existing current version
  SELECT id INTO v_old_current_id
  FROM policy_document_versions
  WHERE master_id = v_master_id AND status = 'current';

  -- Supersede old current if exists
  IF v_old_current_id IS NOT NULL THEN
    UPDATE policy_document_versions
    SET status = 'superseded',
        superseded_by = p_version_id,
        superseded_at = now()
    WHERE id = v_old_current_id;

    UPDATE policy_documents
    SET is_active = false, updated_at = now()
    WHERE version_id = v_old_current_id;
  END IF;

  -- Promote draft to current
  UPDATE policy_document_versions
  SET status = 'current',
      approved_by = p_approved_by,
      approved_at = now()
  WHERE id = p_version_id;

  -- Activate new version's chunks
  UPDATE policy_documents
  SET is_active = true, updated_at = now()
  WHERE version_id = p_version_id;

  UPDATE policy_document_masters
  SET updated_at = now()
  WHERE id = v_master_id;
END;
$$;

-- =============================================================
-- 7. ROW LEVEL SECURITY
-- =============================================================

ALTER TABLE policy_document_masters ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_document_versions ENABLE ROW LEVEL SECURITY;

-- Masters: staff can read, admin/director can manage
DO $$ BEGIN
  CREATE POLICY "Staff can read policy masters" ON policy_document_masters
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admin can manage policy masters" ON policy_document_masters
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('director', 'admin')));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Versions: staff can read, admin/director can manage
DO $$ BEGIN
  CREATE POLICY "Staff can read policy versions" ON policy_document_versions
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'participant_portal'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admin can manage policy versions" ON policy_document_versions
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('director', 'admin')));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================
-- 8. AUDIT TRIGGERS
-- =============================================================

DROP TRIGGER IF EXISTS audit_policy_masters ON policy_document_masters;
CREATE TRIGGER audit_policy_masters
  AFTER INSERT OR UPDATE OR DELETE ON policy_document_masters
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_policy_versions ON policy_document_versions;
CREATE TRIGGER audit_policy_versions
  AFTER INSERT OR UPDATE OR DELETE ON policy_document_versions
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

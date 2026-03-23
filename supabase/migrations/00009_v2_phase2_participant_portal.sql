-- v2 Phase 2: Participant & Family Portal
-- Secure read-only portal for participants, guardians, and support coordinators

-- =============================================
-- Portal Access Tokens
-- Invite-based access: admin generates a token for a participant/family member
-- =============================================
CREATE TABLE portal_access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('participant', 'guardian', 'support_coordinator')),
  name TEXT NOT NULL,
  relationship TEXT, -- e.g. 'Mother', 'Father', 'SC from Provider X'
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_accessed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- NULL = never expires
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_portal_tokens_participant ON portal_access_tokens(participant_id);
CREATE INDEX idx_portal_tokens_email ON portal_access_tokens(email);
CREATE INDEX idx_portal_tokens_token ON portal_access_tokens(token);

-- Update trigger
CREATE OR REPLACE FUNCTION update_portal_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER portal_tokens_updated_at
  BEFORE UPDATE ON portal_access_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_portal_tokens_updated_at();

-- =============================================
-- Portal Activity Log (track portal views for audit)
-- =============================================
CREATE TABLE portal_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_token_id UUID NOT NULL REFERENCES portal_access_tokens(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'login', 'view_dashboard', 'view_budget', 'view_notes', 'download_document', 'lodge_complaint'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_portal_activity_token ON portal_activity_log(portal_token_id);
CREATE INDEX idx_portal_activity_participant ON portal_activity_log(participant_id);
CREATE INDEX idx_portal_activity_created ON portal_activity_log(created_at);

-- =============================================
-- Portal Complaints (submitted via portal by participants/families)
-- These feed into the main complaints table but are tagged as portal-submitted
-- =============================================
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS submitted_via_portal BOOLEAN DEFAULT false;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS portal_submitter_name TEXT;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS portal_submitter_email TEXT;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS portal_submitter_relationship TEXT;

-- =============================================
-- RLS Policies
-- =============================================
ALTER TABLE portal_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_activity_log ENABLE ROW LEVEL SECURITY;

-- Staff can manage portal tokens
CREATE POLICY "Staff can read portal tokens"
  ON portal_access_tokens FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Staff can insert portal tokens"
  ON portal_access_tokens FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Staff can update portal tokens"
  ON portal_access_tokens FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Staff can delete portal tokens"
  ON portal_access_tokens FOR DELETE TO authenticated
  USING (true);

-- Activity log readable by staff
CREATE POLICY "Staff can read portal activity"
  ON portal_activity_log FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert portal activity"
  ON portal_activity_log FOR INSERT TO authenticated
  WITH CHECK (true);

-- =============================================
-- Function to validate a portal token and return participant data
-- =============================================
CREATE OR REPLACE FUNCTION validate_portal_token(p_token TEXT)
RETURNS TABLE (
  token_id UUID,
  participant_id UUID,
  email TEXT,
  role TEXT,
  name TEXT,
  relationship TEXT,
  participant_first_name TEXT,
  participant_last_name TEXT,
  participant_preferred_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id AS token_id,
    t.participant_id,
    t.email,
    t.role,
    t.name,
    t.relationship,
    p.first_name AS participant_first_name,
    p.last_name AS participant_last_name,
    p.preferred_name AS participant_preferred_name
  FROM portal_access_tokens t
  JOIN participants p ON p.id = t.participant_id
  WHERE t.token = p_token
    AND t.is_active = true
    AND (t.expires_at IS NULL OR t.expires_at > NOW());

  -- Update last_accessed_at
  UPDATE portal_access_tokens
  SET last_accessed_at = NOW()
  WHERE token = p_token AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- View: Portal dashboard data
-- Budget usage is calculated by joining invoice_line_items to
-- ndis_price_guide to determine category (core/capacity_building/capital)
-- =============================================
CREATE OR REPLACE VIEW portal_participant_summary AS
SELECT
  p.id AS participant_id,
  p.first_name,
  p.last_name,
  p.preferred_name,
  p.ndis_number,
  p.funding_type,
  p.plan_start_date,
  p.plan_end_date,
  p.budget_core,
  p.budget_capacity_building,
  p.budget_capital,
  p.avatar_url,
  -- Budget used: join line items → price guide to determine category
  COALESCE(core_used.total, 0) AS used_core,
  COALESCE(cb_used.total, 0) AS used_capacity_building,
  COALESCE(cap_used.total, 0) AS used_capital,
  -- Counts
  (SELECT COUNT(*) FROM goals g WHERE g.participant_id = p.id AND g.status = 'in_progress') AS active_goals,
  (SELECT COUNT(*) FROM goals g WHERE g.participant_id = p.id AND g.status = 'achieved') AS achieved_goals,
  (SELECT COUNT(*) FROM progress_notes pn WHERE pn.participant_id = p.id) AS total_notes,
  (SELECT COUNT(*) FROM bookings b WHERE b.participant_id = p.id AND b.booking_date >= CURRENT_DATE AND b.status IN ('scheduled', 'checked_in')) AS upcoming_bookings
FROM participants p
LEFT JOIN LATERAL (
  SELECT COALESCE(SUM(li.total), 0) AS total
  FROM invoice_line_items li
  JOIN invoices i ON i.id = li.invoice_id
  LEFT JOIN ndis_price_guide pg ON pg.registration_group = li.registration_group AND pg.is_active = true
  WHERE i.participant_id = p.id
    AND i.status IN ('approved', 'submitted', 'paid')
    AND (pg.category = 'core' OR (pg.id IS NULL AND li.registration_group IS NOT NULL))
) core_used ON true
LEFT JOIN LATERAL (
  SELECT COALESCE(SUM(li.total), 0) AS total
  FROM invoice_line_items li
  JOIN invoices i ON i.id = li.invoice_id
  JOIN ndis_price_guide pg ON pg.registration_group = li.registration_group AND pg.is_active = true
  WHERE i.participant_id = p.id
    AND i.status IN ('approved', 'submitted', 'paid')
    AND pg.category = 'capacity_building'
) cb_used ON true
LEFT JOIN LATERAL (
  SELECT COALESCE(SUM(li.total), 0) AS total
  FROM invoice_line_items li
  JOIN invoices i ON i.id = li.invoice_id
  JOIN ndis_price_guide pg ON pg.registration_group = li.registration_group AND pg.is_active = true
  WHERE i.participant_id = p.id
    AND i.status IN ('approved', 'submitted', 'paid')
    AND pg.category = 'capital'
) cap_used ON true;

-- Grant access to the view
GRANT SELECT ON portal_participant_summary TO authenticated;

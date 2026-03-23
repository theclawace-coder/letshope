-- Phase 7: Audit Logs & Email Digest Preferences
-- Run in Supabase SQL Editor after previous migrations.

-- ============================================================
-- 1. AUDIT LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL CHECK (action IN ('insert','update','delete')),
  entity_type text NOT NULL,  -- e.g. 'participant', 'incident', 'invoice', etc.
  entity_id uuid NOT NULL,
  changes jsonb DEFAULT '{}',  -- { field: { old: ..., new: ... } }
  metadata jsonb DEFAULT '{}', -- extra context (IP, user-agent, etc.)
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON audit_logs (user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs (created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs (action);

-- RLS: directors & admins can read all audit logs; workers can only see their own
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Directors and admins can read all audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('director', 'admin')
    )
  );

CREATE POLICY "Workers can read own audit logs"
  ON audit_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- 2. AUDIT TRIGGER FUNCTION
-- ============================================================
-- Generic trigger function that auto-logs INSERT/UPDATE/DELETE on any table.
-- Attach to tables you want audited.

CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS trigger AS $$
DECLARE
  changes_json jsonb := '{}';
  col text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, changes)
    VALUES (auth.uid(), 'insert', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Build a diff of changed columns
    FOR col IN SELECT column_name FROM information_schema.columns
      WHERE table_schema = TG_TABLE_SCHEMA AND table_name = TG_TABLE_NAME
    LOOP
      IF to_jsonb(NEW) -> col IS DISTINCT FROM to_jsonb(OLD) -> col THEN
        changes_json := changes_json || jsonb_build_object(
          col, jsonb_build_object('old', to_jsonb(OLD) -> col, 'new', to_jsonb(NEW) -> col)
        );
      END IF;
    END LOOP;

    -- Only log if something actually changed
    IF changes_json != '{}' THEN
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, changes)
      VALUES (auth.uid(), 'update', TG_TABLE_NAME, NEW.id, changes_json);
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, changes)
    VALUES (auth.uid(), 'delete', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 3. ATTACH AUDIT TRIGGERS TO KEY TABLES
-- ============================================================
CREATE TRIGGER audit_participants
  AFTER INSERT OR UPDATE OR DELETE ON participants
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_workers
  AFTER INSERT OR UPDATE OR DELETE ON workers
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_incidents
  AFTER INSERT OR UPDATE OR DELETE ON incidents
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_complaints
  AFTER INSERT OR UPDATE OR DELETE ON complaints
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_concerns
  AFTER INSERT OR UPDATE OR DELETE ON concerns
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_invoices
  AFTER INSERT OR UPDATE OR DELETE ON invoices
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_bookings
  AFTER INSERT OR UPDATE OR DELETE ON bookings
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_service_agreements
  AFTER INSERT OR UPDATE OR DELETE ON service_agreements
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_progress_notes
  AFTER INSERT OR UPDATE OR DELETE ON progress_notes
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ============================================================
-- 4. EMAIL DIGEST PREFERENCES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS email_digest_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) UNIQUE NOT NULL,
  digest_enabled boolean DEFAULT true,
  frequency text DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'off')),
  include_incidents boolean DEFAULT true,
  include_complaints boolean DEFAULT true,
  include_compliance boolean DEFAULT true,
  include_invoices boolean DEFAULT true,
  include_overdue boolean DEFAULT true,
  preferred_time time DEFAULT '07:00',
  preferred_day integer DEFAULT 1 CHECK (preferred_day BETWEEN 0 AND 6), -- 0=Sun, 1=Mon
  last_sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE email_digest_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own digest preferences"
  ON email_digest_preferences FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 5. HELPFUL VIEW: DAILY DIGEST DATA
-- ============================================================
CREATE OR REPLACE VIEW daily_digest_summary AS
SELECT
  (SELECT count(*) FROM incidents WHERE status IN ('open', 'investigating')) AS open_incidents,
  (SELECT count(*) FROM incidents WHERE is_reportable = true AND reported_to_commission = false AND status != 'closed') AS unreported_incidents,
  (SELECT count(*) FROM complaints WHERE status IN ('received', 'acknowledged', 'investigating')) AS open_complaints,
  (SELECT count(*) FROM complaints WHERE acknowledged = false AND acknowledge_deadline < now()) AS overdue_acknowledgments,
  (SELECT count(*) FROM complaints WHERE resolution_date IS NULL AND resolution_deadline < now() AND status != 'closed') AS overdue_resolutions,
  (SELECT count(*) FROM invoices WHERE status = 'draft') AS draft_invoices,
  (SELECT count(*) FROM invoices WHERE status = 'rejected') AS rejected_invoices,
  (SELECT count(*) FROM workers WHERE wwcc_expiry < now() + interval '30 days' AND status = 'active') AS expiring_wwcc,
  (SELECT count(*) FROM workers WHERE police_check_expiry < now() + interval '30 days' AND status = 'active') AS expiring_police_checks,
  (SELECT count(*) FROM concerns WHERE status = 'open' AND severity IN ('high', 'critical')) AS critical_concerns;

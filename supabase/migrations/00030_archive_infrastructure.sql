-- ============================================================
-- ARCHIVE INFRASTRUCTURE
-- ============================================================
-- Adds soft-delete (archive) columns to key tables.
-- NDIS audit obligations require full historical records — never hard delete.
--
-- Tables that get archive support:
--   participants, workers, bookings, service_agreements,
--   concerns, communications, worker_participant_assignments
--
-- Tables explicitly EXCLUDED (immutable / append-only):
--   incidents      — NDIS requires append-only incident records
--   complaints     — must remain visible for resolution tracking
--   invoices       — immutable financial records (use credit notes)
--   progress_notes — append corrections/addendums, never edit/archive
--   audit_logs     — the audit trail itself is never archived

-- ============================================================
-- 1. ADD ARCHIVE COLUMNS TO KEY TABLES
-- ============================================================

-- Participants
ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS archive_reason TEXT;

-- Workers
ALTER TABLE workers
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS archive_reason TEXT;

-- Bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS archive_reason TEXT;

-- Service Agreements
ALTER TABLE service_agreements
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS archive_reason TEXT;

-- Concerns
ALTER TABLE concerns
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS archive_reason TEXT;

-- Communications
ALTER TABLE communications
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS archive_reason TEXT;

-- Worker-Participant Assignments
ALTER TABLE worker_participant_assignments
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS archive_reason TEXT;

-- ============================================================
-- 2. INDEXES FOR ARCHIVE FILTERING
-- ============================================================
-- Partial indexes: only index non-null archived_at (archived records are the minority)
-- Plus a standard index for WHERE archived_at IS NULL (the common query)

CREATE INDEX IF NOT EXISTS idx_participants_archived ON participants (archived_at) WHERE archived_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_participants_active ON participants (status) WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_workers_archived ON workers (archived_at) WHERE archived_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workers_active ON workers (status) WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_archived ON bookings (archived_at) WHERE archived_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_active ON bookings (booking_date) WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_service_agreements_archived ON service_agreements (archived_at) WHERE archived_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_concerns_archived ON concerns (archived_at) WHERE archived_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_communications_archived ON communications (archived_at) WHERE archived_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_assignments_archived ON worker_participant_assignments (archived_at) WHERE archived_at IS NOT NULL;

-- ============================================================
-- 3. ARCHIVE & RESTORE HELPER FUNCTIONS
-- ============================================================

-- Generic archive function: archives a record and logs it
-- Usage: SELECT archive_record('participants', <uuid>, 'Participant exited services');
CREATE OR REPLACE FUNCTION archive_record(
  p_table_name TEXT,
  p_record_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Validate table is archivable (prevent archiving immutable tables)
  IF p_table_name NOT IN (
    'participants', 'workers', 'bookings', 'service_agreements',
    'concerns', 'communications', 'worker_participant_assignments'
  ) THEN
    RAISE EXCEPTION 'Table "%" does not support archiving', p_table_name;
  END IF;

  -- Set archive columns
  EXECUTE format(
    'UPDATE %I SET archived_at = now(), archived_by = %L, archive_reason = %L, updated_at = now() WHERE id = %L AND archived_at IS NULL',
    p_table_name, auth.uid(), p_reason, p_record_id
  );

  -- Log the archive action in audit_logs
  INSERT INTO audit_logs (user_id, action, entity_type, entity_id, changes, metadata)
  VALUES (
    auth.uid(),
    'archive',
    p_table_name,
    p_record_id,
    jsonb_build_object('archive_reason', p_reason),
    jsonb_build_object('action_type', 'archive')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generic restore function: un-archives a record and logs it
-- Usage: SELECT restore_record('participants', <uuid>);
CREATE OR REPLACE FUNCTION restore_record(
  p_table_name TEXT,
  p_record_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_old_reason TEXT;
BEGIN
  -- Validate table is archivable
  IF p_table_name NOT IN (
    'participants', 'workers', 'bookings', 'service_agreements',
    'concerns', 'communications', 'worker_participant_assignments'
  ) THEN
    RAISE EXCEPTION 'Table "%" does not support archiving', p_table_name;
  END IF;

  -- Capture the old archive reason for audit log
  EXECUTE format(
    'SELECT archive_reason FROM %I WHERE id = %L',
    p_table_name, p_record_id
  ) INTO v_old_reason;

  -- Clear archive columns
  EXECUTE format(
    'UPDATE %I SET archived_at = NULL, archived_by = NULL, archive_reason = NULL, updated_at = now() WHERE id = %L AND archived_at IS NOT NULL',
    p_table_name, p_record_id
  );

  -- Log the restore action
  INSERT INTO audit_logs (user_id, action, entity_type, entity_id, changes, metadata)
  VALUES (
    auth.uid(),
    'restore',
    p_table_name,
    p_record_id,
    jsonb_build_object('previous_archive_reason', v_old_reason),
    jsonb_build_object('action_type', 'restore')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cascade archive: when archiving a participant, also archive their related records
CREATE OR REPLACE FUNCTION archive_participant_cascade(
  p_participant_id UUID,
  p_reason TEXT DEFAULT 'Participant archived'
)
RETURNS VOID AS $$
BEGIN
  -- Archive the participant
  PERFORM archive_record('participants', p_participant_id, p_reason);

  -- Archive their active assignments
  UPDATE worker_participant_assignments
  SET archived_at = now(), archived_by = auth.uid(), archive_reason = 'Parent participant archived'
  WHERE participant_id = p_participant_id AND archived_at IS NULL;

  -- Archive future bookings (past bookings stay as historical record)
  UPDATE bookings
  SET archived_at = now(), archived_by = auth.uid(), archive_reason = 'Parent participant archived'
  WHERE participant_id = p_participant_id
    AND archived_at IS NULL
    AND booking_date > CURRENT_DATE;

  -- Archive draft service agreements (signed ones stay for compliance)
  UPDATE service_agreements
  SET archived_at = now(), archived_by = auth.uid(), archive_reason = 'Parent participant archived'
  WHERE participant_id = p_participant_id
    AND archived_at IS NULL
    AND status = 'draft';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cascade archive for workers
CREATE OR REPLACE FUNCTION archive_worker_cascade(
  p_worker_id UUID,
  p_reason TEXT DEFAULT 'Worker archived'
)
RETURNS VOID AS $$
BEGIN
  -- Archive the worker
  PERFORM archive_record('workers', p_worker_id, p_reason);

  -- Archive their active assignments
  UPDATE worker_participant_assignments
  SET archived_at = now(), archived_by = auth.uid(), archive_reason = 'Parent worker archived'
  WHERE worker_id = p_worker_id AND archived_at IS NULL;

  -- Archive future bookings
  UPDATE bookings
  SET archived_at = now(), archived_by = auth.uid(), archive_reason = 'Parent worker archived'
  WHERE worker_id = p_worker_id
    AND archived_at IS NULL
    AND booking_date > CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 4. EXPAND AUDIT LOG ACTION CONSTRAINT
-- ============================================================
-- Add 'archive' and 'restore' as valid audit log actions

ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_action_check;
ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_action_check
  CHECK (action IN ('insert', 'update', 'delete', 'archive', 'restore'));

-- ============================================================
-- 5. ACTIVE-ONLY VIEWS
-- ============================================================
-- These views filter out archived records for common queries.
-- The app should use these views by default and only query the
-- base tables when explicitly showing archived records.

CREATE OR REPLACE VIEW active_participants AS
SELECT * FROM participants WHERE archived_at IS NULL;

CREATE OR REPLACE VIEW active_workers AS
SELECT * FROM workers WHERE archived_at IS NULL;

CREATE OR REPLACE VIEW active_bookings AS
SELECT * FROM bookings WHERE archived_at IS NULL;

CREATE OR REPLACE VIEW active_service_agreements AS
SELECT * FROM service_agreements WHERE archived_at IS NULL;

CREATE OR REPLACE VIEW active_concerns AS
SELECT * FROM concerns WHERE archived_at IS NULL;

CREATE OR REPLACE VIEW active_communications AS
SELECT * FROM communications WHERE archived_at IS NULL;

CREATE OR REPLACE VIEW active_assignments AS
SELECT * FROM worker_participant_assignments WHERE archived_at IS NULL;

-- ============================================================
-- 6. ARCHIVED-ONLY VIEW (for archive browser UI)
-- ============================================================

CREATE OR REPLACE VIEW archived_records AS
SELECT
  'participants' AS entity_type,
  id AS entity_id,
  first_name || ' ' || last_name AS display_name,
  archived_at,
  archived_by,
  archive_reason
FROM participants WHERE archived_at IS NOT NULL
UNION ALL
SELECT
  'workers',
  id,
  first_name || ' ' || last_name,
  archived_at,
  archived_by,
  archive_reason
FROM workers WHERE archived_at IS NOT NULL
UNION ALL
SELECT
  'bookings',
  id,
  'Booking on ' || booking_date::text,
  archived_at,
  archived_by,
  archive_reason
FROM bookings WHERE archived_at IS NOT NULL
UNION ALL
SELECT
  'service_agreements',
  id,
  'Agreement #' || id::text,
  archived_at,
  archived_by,
  archive_reason
FROM service_agreements WHERE archived_at IS NOT NULL
UNION ALL
SELECT
  'concerns',
  id,
  'Concern #' || id::text,
  archived_at,
  archived_by,
  archive_reason
FROM concerns WHERE archived_at IS NOT NULL
ORDER BY archived_at DESC;

-- ============================================================
-- 7. UPDATE DAILY DIGEST TO EXCLUDE ARCHIVED
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
  (SELECT count(*) FROM workers WHERE wwcc_expiry < now() + interval '30 days' AND status = 'active' AND archived_at IS NULL) AS expiring_wwcc,
  (SELECT count(*) FROM workers WHERE police_check_expiry < now() + interval '30 days' AND status = 'active' AND archived_at IS NULL) AS expiring_police_checks,
  (SELECT count(*) FROM concerns WHERE status = 'open' AND severity IN ('high', 'critical') AND archived_at IS NULL) AS critical_concerns;

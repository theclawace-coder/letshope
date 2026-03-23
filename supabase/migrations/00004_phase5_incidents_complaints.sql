-- Phase 5: Incidents & Complaints Management
-- Migration: 00004_phase5_incidents_complaints.sql
-- Tables already exist in 00001, this adds indexes, views, and enhancements

-- =============================================================
-- 1. INDEXES FOR INCIDENTS
-- =============================================================

CREATE INDEX idx_incidents_participant ON incidents(participant_id);
CREATE INDEX idx_incidents_worker ON incidents(worker_id);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_date ON incidents(incident_date);
CREATE INDEX idx_incidents_reportable ON incidents(is_reportable) WHERE is_reportable = true;

-- =============================================================
-- 2. INDEXES FOR COMPLAINTS
-- =============================================================

CREATE INDEX idx_complaints_participant ON complaints(participant_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_date ON complaints(complaint_date);
CREATE INDEX idx_complaints_acknowledge ON complaints(acknowledged) WHERE acknowledged = false;

-- =============================================================
-- 3. ADD CATEGORY COLUMN TO COMPLAINTS (enum constraint)
-- =============================================================

ALTER TABLE complaints
  ADD CONSTRAINT complaints_category_check
  CHECK (category IS NULL OR category IN (
    'service_delivery', 'staff_conduct', 'communication',
    'safety', 'financial', 'privacy', 'access', 'other'
  ));

-- =============================================================
-- 4. ADD INCIDENT CATEGORY/TYPE COLUMN
-- =============================================================

ALTER TABLE incidents ADD COLUMN IF NOT EXISTS incident_type TEXT
  CHECK (incident_type IN (
    'injury', 'medication_error', 'abuse_neglect', 'restrictive_practice',
    'property_damage', 'missing_person', 'death', 'sexual_misconduct', 'other'
  ));

-- =============================================================
-- 5. NDIS REPORTABLE INCIDENTS VIEW
-- =============================================================

CREATE OR REPLACE VIEW reportable_incidents_overview AS
SELECT
  i.id,
  i.incident_date,
  i.incident_time,
  i.incident_type,
  i.severity,
  i.description,
  i.is_reportable,
  i.reported_to_commission,
  i.report_deadline,
  i.status,
  p.first_name AS participant_first_name,
  p.last_name AS participant_last_name,
  p.ndis_number,
  w.first_name AS worker_first_name,
  w.last_name AS worker_last_name,
  pr.full_name AS logged_by_name,
  i.created_at
FROM incidents i
LEFT JOIN participants p ON p.id = i.participant_id
LEFT JOIN workers w ON w.id = i.worker_id
LEFT JOIN profiles pr ON pr.id = i.logged_by
WHERE i.is_reportable = true
ORDER BY i.incident_date DESC;

-- =============================================================
-- 6. COMPLAINTS DEADLINES VIEW
-- =============================================================

CREATE OR REPLACE VIEW complaints_deadlines AS
SELECT
  c.id,
  c.complaint_date,
  c.complainant_name,
  c.category,
  c.description,
  c.status,
  c.acknowledged,
  c.acknowledge_deadline,
  c.resolution_deadline,
  c.acknowledged_date,
  c.resolution_date,
  p.first_name AS participant_first_name,
  p.last_name AS participant_last_name,
  pr.full_name AS logged_by_name,
  CASE
    WHEN c.acknowledged = false AND c.acknowledge_deadline < NOW() THEN true
    ELSE false
  END AS acknowledge_overdue,
  CASE
    WHEN c.status NOT IN ('resolved', 'closed') AND c.resolution_deadline < NOW() THEN true
    ELSE false
  END AS resolution_overdue,
  c.created_at
FROM complaints c
LEFT JOIN participants p ON p.id = c.participant_id
LEFT JOIN profiles pr ON pr.id = c.logged_by
ORDER BY c.complaint_date DESC;

-- =============================================================
-- 7. COMPLIANCE SUMMARY VIEW
-- =============================================================

CREATE OR REPLACE VIEW quality_compliance_summary AS
SELECT
  'incidents' AS category,
  COUNT(*) FILTER (WHERE status = 'open') AS open_count,
  COUNT(*) FILTER (WHERE status = 'investigating') AS investigating_count,
  COUNT(*) FILTER (WHERE status IN ('resolved', 'closed')) AS resolved_count,
  COUNT(*) FILTER (WHERE severity IN ('major', 'critical')) AS high_severity_count,
  COUNT(*) FILTER (WHERE is_reportable = true AND reported_to_commission = false AND status != 'closed') AS pending_report_count
FROM incidents
UNION ALL
SELECT
  'complaints' AS category,
  COUNT(*) FILTER (WHERE status IN ('received', 'acknowledged')) AS open_count,
  COUNT(*) FILTER (WHERE status = 'investigating') AS investigating_count,
  COUNT(*) FILTER (WHERE status IN ('resolved', 'closed')) AS resolved_count,
  0 AS high_severity_count,
  COUNT(*) FILTER (WHERE acknowledged = false AND acknowledge_deadline < NOW()) AS pending_report_count
FROM complaints;
